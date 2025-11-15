// OpenCV.js wrapper for feature tracking

export interface TrackingPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export interface TrackingResult {
  isTracking: boolean;
  homography: number[] | null;
  matchedPoints: number;
  stability: number;
}

interface TemplateInfo {
  mat: any;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export class OpenCVTracker {
  private cv: any;
  private referencePoints: TrackingPoint[] = [];
  private templates: TemplateInfo[] = [];
  private lastPositions: { x: number; y: number }[] = [];
  private prevGray: any | null = null;
  private initialized = false;

  constructor() {
    this.cv = (window as any).cv;
    if (!this.cv) {
      throw new Error("OpenCV.js not loaded");
    }
  }

  initializeReferencePoints(imageData: ImageData, points: TrackingPoint[]) {
    this.dispose();

    if (points.length < 4) {
      throw new Error("At least 4 tracking points are required");
    }

    const src = this.cv.matFromImageData(imageData);
    const gray = new this.cv.Mat();
    this.cv.cvtColor(src, gray, this.cv.COLOR_RGBA2GRAY);

    this.referencePoints = points.map(point => ({ ...point }));
    this.templates = [];
    this.lastPositions = points.map(point => ({ x: point.x, y: point.y }));
    if (this.prevGray) {
      this.prevGray.delete();
      this.prevGray = null;
    }

    const minDim = Math.min(gray.cols, gray.rows);
    const baseTemplateSize = Math.max(24, Math.min(120, Math.round(minDim * 0.08)));

    for (const point of points) {
      const half = Math.floor(baseTemplateSize / 2);
      const startX = Math.max(0, Math.min(gray.cols - baseTemplateSize, Math.round(point.x) - half));
      const startY = Math.max(0, Math.min(gray.rows - baseTemplateSize, Math.round(point.y) - half));

      const rect = new this.cv.Rect(startX, startY, baseTemplateSize, baseTemplateSize);
      const roi = gray.roi(rect);
      const template = new this.cv.Mat();
      roi.copyTo(template);

      const centerX = startX + template.cols / 2;
      const centerY = startY + template.rows / 2;

      this.templates.push({
        mat: template,
        width: template.cols,
        height: template.rows,
        offsetX: point.x - centerX,
        offsetY: point.y - centerY
      });

      roi.delete();
    }

    src.delete();
    gray.delete();

    this.initialized = true;
  }

  private matchTemplateAtIndex(
    gray: any,
    idx: number,
    searchScale = 1
  ): { x: number; y: number; score: number } | null {
    const template = this.templates[idx];
    const lastPosition = this.lastPositions[idx];

    const baseRadius = Math.max(template.width, template.height);
    const searchRadius = Math.min(
      Math.max(32, Math.round(baseRadius * 1.2 * searchScale)),
      Math.max(gray.cols, gray.rows)
    );

    const predictedTopLeftX =
      lastPosition.x - template.width / 2 - template.offsetX;
    const predictedTopLeftY =
      lastPosition.y - template.height / 2 - template.offsetY;

    let searchX = Math.round(predictedTopLeftX - searchRadius);
    let searchY = Math.round(predictedTopLeftY - searchRadius);
    let searchW = template.width + searchRadius * 2;
    let searchH = template.height + searchRadius * 2;

    if (searchX < 0) {
      searchW += searchX;
      searchX = 0;
    }
    if (searchY < 0) {
      searchH += searchY;
      searchY = 0;
    }
    if (searchX + searchW > gray.cols) {
      searchW = gray.cols - searchX;
    }
    if (searchY + searchH > gray.rows) {
      searchH = gray.rows - searchY;
    }

    if (searchW < template.width || searchH < template.height) {
      return null;
    }

    const rect = new this.cv.Rect(searchX, searchY, searchW, searchH);
    const roi = gray.roi(rect);
    const resultCols = searchW - template.width + 1;
    const resultRows = searchH - template.height + 1;

    if (resultCols <= 0 || resultRows <= 0) {
      roi.delete();
      return null;
    }

    const result = new this.cv.Mat();
    this.cv.matchTemplate(roi, template.mat, result, this.cv.TM_CCOEFF_NORMED);
    const minMax = this.cv.minMaxLoc(result);
    result.delete();
    roi.delete();

    if (minMax.maxVal <= 0.5) {
      return null;
    }

    const matchTopLeftX = searchX + minMax.maxLoc.x;
    const matchTopLeftY = searchY + minMax.maxLoc.y;
    const matchedX =
      matchTopLeftX + template.width / 2 + template.offsetX;
    const matchedY =
      matchTopLeftY + template.height / 2 + template.offsetY;

    return { x: matchedX, y: matchedY, score: minMax.maxVal };
  }

  trackFrame(frameData: ImageData): TrackingResult {
    if (!this.initialized || this.templates.length === 0) {
      return { isTracking: false, homography: null, matchedPoints: 0, stability: 0 };
    }

    const frame = this.cv.matFromImageData(frameData);
    const gray = new this.cv.Mat();
    this.cv.cvtColor(frame, gray, this.cv.COLOR_RGBA2GRAY);

    const srcPoints: number[] = [];
    const dstPoints: number[] = [];
    let matchedPoints = 0;
    let stabilitySum = 0;
    const successfulIdx = new Set<number>();

    const prevGray = this.prevGray;
    if (prevGray) {
      const prevPts = new this.cv.Mat(this.lastPositions.length, 1, this.cv.CV_32FC2);
      const prevPtsData = prevPts.data32F;
      this.lastPositions.forEach((pos, idx) => {
        prevPtsData[idx * 2] = pos.x;
        prevPtsData[idx * 2 + 1] = pos.y;
      });

      const nextPts = new this.cv.Mat();
      const status = new this.cv.Mat();
      const err = new this.cv.Mat();

      const winSize = new this.cv.Size(31, 31);
      const maxLevel = 3;
      const criteria = new this.cv.TermCriteria(
        this.cv.TermCriteria_EPS | this.cv.TermCriteria_COUNT,
        30,
        0.01
      );

      this.cv.calcOpticalFlowPyrLK(
        prevGray,
        gray,
        prevPts,
        nextPts,
        status,
        err,
        winSize,
        maxLevel,
        criteria
      );

      const statusData = status.data;
      const nextData = nextPts.data32F;
      const errData = err.data32F;

      for (let idx = 0; idx < this.lastPositions.length; idx += 1) {
        if (statusData[idx] === 1) {
          const x = nextData[idx * 2];
          const y = nextData[idx * 2 + 1];
          if (Number.isFinite(x) && Number.isFinite(y)) {
            if (x >= 0 && y >= 0 && x < gray.cols && y < gray.rows) {
              this.lastPositions[idx] = { x, y };
              const stabilityScore = Math.max(
                0,
                Math.min(1, 1 - (errData[idx] || 0) / 50)
              );
              srcPoints.push(
                this.referencePoints[idx].x,
                this.referencePoints[idx].y
              );
              dstPoints.push(x, y);
              matchedPoints += 1;
              stabilitySum += stabilityScore;
              successfulIdx.add(idx);
            }
          }
        }
      }

      prevPts.delete();
      nextPts.delete();
      status.delete();
      err.delete();
      // TermCriteria and Size are lightweight JS objects in OpenCV.js (no delete)
    }

    // Fallback template matching for missing points or initial frame
    for (let idx = 0; idx < this.templates.length; idx += 1) {
      if (successfulIdx.has(idx)) {
        continue;
      }

      const match = this.matchTemplateAtIndex(gray, idx, prevGray ? 1 : 1.5);
      if (match) {
        this.lastPositions[idx] = { x: match.x, y: match.y };
        srcPoints.push(this.referencePoints[idx].x, this.referencePoints[idx].y);
        dstPoints.push(match.x, match.y);
        matchedPoints += 1;
        stabilitySum += match.score;
        successfulIdx.add(idx);
      }
    }

    if (matchedPoints < 4) {
      for (let idx = 0; idx < this.templates.length; idx += 1) {
        if (successfulIdx.has(idx)) {
          continue;
        }

        const match = this.matchTemplateAtIndex(gray, idx, 2.5);
        if (match) {
          this.lastPositions[idx] = { x: match.x, y: match.y };
          srcPoints.push(
            this.referencePoints[idx].x,
            this.referencePoints[idx].y
          );
          dstPoints.push(match.x, match.y);
          matchedPoints += 1;
          stabilitySum += match.score;
          successfulIdx.add(idx);
        }
      }
    }

    let homography: number[] | null = null;
    let stability = 0;

    if (matchedPoints >= 4) {
      const srcMat = this.cv.matFromArray(matchedPoints, 1, this.cv.CV_32FC2, srcPoints);
      const dstMat = this.cv.matFromArray(matchedPoints, 1, this.cv.CV_32FC2, dstPoints);

      try {
        const H = this.cv.findHomography(srcMat, dstMat, this.cv.RANSAC, 5.0);
        if (!H.empty()) {
          homography = [];
          for (let i = 0; i < 9; i++) {
            homography.push(H.doubleAt(Math.floor(i / 3), i % 3));
          }
          stability = Math.min(100, (stabilitySum / matchedPoints) * 100);
        }
        H.delete();
      } catch (error) {
        console.error("Homography computation failed:", error);
      }

      srcMat.delete();
      dstMat.delete();
    }

    if (this.prevGray) {
      this.prevGray.delete();
    }
    this.prevGray = gray.clone();

    frame.delete();
    gray.delete();

    return {
      isTracking: homography !== null,
      homography,
      matchedPoints,
      stability
    };
  }

  dispose() {
    this.templates.forEach(template => template.mat.delete());
    this.templates = [];
    this.referencePoints = [];
    this.lastPositions = [];
    if (this.prevGray) {
      this.prevGray.delete();
      this.prevGray = null;
    }
    this.initialized = false;
  }

  /**
   * Détecte automatiquement les marqueurs dans une image
   * Cherche des cercles ou des croix noires bien contrastées
   */
  static detectMarkers(imageData: ImageData): TrackingPoint[] {
    const cv = (window as any).cv;
    if (!cv) {
      throw new Error("OpenCV.js not loaded");
    }

    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Binarisation adaptative pour détecter les zones sombres
    const binary = new cv.Mat();
    cv.adaptiveThreshold(
      gray,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      11,
      2
    );

    // Morphologie pour nettoyer le bruit
    const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
    cv.morphologyEx(binary, binary, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel);

    // Détection de contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      binary,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    const markers: TrackingPoint[] = [];
    const minArea = (imageData.width * imageData.height) * 0.0001; // 0.01% de l'image
    const maxArea = (imageData.width * imageData.height) * 0.01;   // 1% de l'image

    // Chercher les contours qui ressemblent à des marqueurs
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      if (area >= minArea && area <= maxArea) {
        // Calculer le centre du contour
        const moments = cv.moments(contour);
        if (moments.m00 !== 0) {
          const cx = moments.m10 / moments.m00;
          const cy = moments.m01 / moments.m00;

          // Vérifier si le contour est suffisamment circulaire ou carré
          const perimeter = cv.arcLength(contour, true);
          const circularity = (4 * Math.PI * area) / (perimeter * perimeter);

          // Accepter les formes circulaires (0.7+) ou carrées (~0.6-0.8)
          if (circularity > 0.5) {
            markers.push({
              id: `marker_${i}_${Date.now()}`,
              x: Math.round(cx),
              y: Math.round(cy),
              label: `Marqueur ${markers.length + 1}`
            });
          }
        }
      }
    }

    // Nettoyer
    src.delete();
    gray.delete();
    binary.delete();
    kernel.delete();
    contours.delete();
    hierarchy.delete();

    // Trier les marqueurs par position (haut-gauche, haut-droite, bas-droite, bas-gauche)
    if (markers.length >= 4) {
      markers.sort((a, b) => {
        // Trier d'abord par Y (haut vs bas), puis par X (gauche vs droite)
        if (Math.abs(a.y - b.y) > imageData.height * 0.2) {
          return a.y - b.y;
        }
        return a.x - b.x;
      });

      // Réorganiser pour avoir: TL, TR, BR, BL
      const topTwo = markers.slice(0, 2).sort((a, b) => a.x - b.x);
      const bottomTwo = markers.slice(2, 4).sort((a, b) => b.x - a.x).reverse();
      
      const sorted = [...topTwo, ...bottomTwo];
      sorted.forEach((marker, idx) => {
        marker.label = `Point ${idx + 1}`;
      });

      return sorted.slice(0, 4);
    }

    return markers.slice(0, 4);
  }
}
