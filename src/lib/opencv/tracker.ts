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

    this.templates.forEach((template, idx) => {
      const lastPosition = this.lastPositions[idx];
      const baseRadius = Math.max(template.width, template.height);
      const searchRadius = Math.min(
        Math.max(40, Math.round(baseRadius * 1.5)),
        Math.max(gray.cols, gray.rows)
      );

      const predictedTopLeftX = lastPosition.x - template.width / 2 - template.offsetX;
      const predictedTopLeftY = lastPosition.y - template.height / 2 - template.offsetY;

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
        return;
      }

      const rect = new this.cv.Rect(searchX, searchY, searchW, searchH);
      const roi = gray.roi(rect);
      const resultCols = searchW - template.width + 1;
      const resultRows = searchH - template.height + 1;

      if (resultCols <= 0 || resultRows <= 0) {
        roi.delete();
        return;
      }

      const result = new this.cv.Mat();
      this.cv.matchTemplate(roi, template.mat, result, this.cv.TM_CCOEFF_NORMED);
      const minMax = this.cv.minMaxLoc(result);

      if (minMax.maxVal > 0.5) {
        const matchTopLeftX = searchX + minMax.maxLoc.x;
        const matchTopLeftY = searchY + minMax.maxLoc.y;
        const matchedX = matchTopLeftX + template.width / 2 + template.offsetX;
        const matchedY = matchTopLeftY + template.height / 2 + template.offsetY;

        this.lastPositions[idx] = { x: matchedX, y: matchedY };
        srcPoints.push(this.referencePoints[idx].x, this.referencePoints[idx].y);
        dstPoints.push(matchedX, matchedY);
        matchedPoints += 1;
        stabilitySum += minMax.maxVal;
      }

      roi.delete();
      result.delete();
    });

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
    this.initialized = false;
  }
}
