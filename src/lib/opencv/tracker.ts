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

export class OpenCVTracker {
  private cv: any;
  private referenceDescriptors: any = null;
  private referenceKeypoints: any = null;
  private detector: any = null;

  constructor() {
    this.cv = (window as any).cv;
    if (!this.cv) {
      throw new Error("OpenCV.js not loaded");
    }
  }

  initializeReferencePoints(imageData: ImageData, points: TrackingPoint[]) {
    const src = this.cv.matFromImageData(imageData);
    const gray = new this.cv.Mat();
    this.cv.cvtColor(src, gray, this.cv.COLOR_RGBA2GRAY);

    // Create ORB detector
    this.detector = new this.cv.ORB(500);
    this.referenceKeypoints = new this.cv.KeyPointVector();
    this.referenceDescriptors = new this.cv.Mat();

    // Detect and compute
    this.detector.detectAndCompute(gray, new this.cv.Mat(), this.referenceKeypoints, this.referenceDescriptors);

    src.delete();
    gray.delete();

    console.log(`Initialized ${this.referenceKeypoints.size()} reference keypoints`);
  }

  trackFrame(frameData: ImageData): TrackingResult {
    if (!this.referenceDescriptors || !this.detector) {
      return { isTracking: false, homography: null, matchedPoints: 0, stability: 0 };
    }

    const frame = this.cv.matFromImageData(frameData);
    const gray = new this.cv.Mat();
    this.cv.cvtColor(frame, gray, this.cv.COLOR_RGBA2GRAY);

    // Detect current frame keypoints
    const currentKeypoints = new this.cv.KeyPointVector();
    const currentDescriptors = new this.cv.Mat();
    this.detector.detectAndCompute(gray, new this.cv.Mat(), currentKeypoints, currentDescriptors);

    // Match features
    const matches = new this.cv.DMatchVector();
    const matcher = new this.cv.BFMatcher(this.cv.NORM_HAMMING, true);
    matcher.match(this.referenceDescriptors, currentDescriptors, matches);

    // Filter good matches (distance < 50)
    const goodMatches: any[] = [];
    for (let i = 0; i < matches.size(); i++) {
      const match = matches.get(i);
      if (match.distance < 50) {
        goodMatches.push(match);
      }
    }

    let homography = null;
    let stability = 0;

    // Need at least 4 matches for homography
    if (goodMatches.length >= 4) {
      const srcPoints: number[] = [];
      const dstPoints: number[] = [];

      for (const match of goodMatches) {
        const refKp = this.referenceKeypoints.get(match.queryIdx);
        const currKp = currentKeypoints.get(match.trainIdx);
        srcPoints.push(refKp.pt.x, refKp.pt.y);
        dstPoints.push(currKp.pt.x, currKp.pt.y);
      }

      const srcMat = this.cv.matFromArray(goodMatches.length, 1, this.cv.CV_32FC2, srcPoints);
      const dstMat = this.cv.matFromArray(goodMatches.length, 1, this.cv.CV_32FC2, dstPoints);

      try {
        const H = this.cv.findHomography(srcMat, dstMat, this.cv.RANSAC, 5.0);
        if (!H.empty()) {
          homography = [];
          for (let i = 0; i < 9; i++) {
            homography.push(H.doubleAt(Math.floor(i / 3), i % 3));
          }
          stability = Math.min(100, (goodMatches.length / 50) * 100);
        }
        H.delete();
      } catch (e) {
        console.error("Homography computation failed:", e);
      }

      srcMat.delete();
      dstMat.delete();
    }

    // Cleanup
    frame.delete();
    gray.delete();
    currentKeypoints.delete();
    currentDescriptors.delete();
    matches.delete();
    matcher.delete();

    return {
      isTracking: homography !== null,
      homography,
      matchedPoints: goodMatches.length,
      stability
    };
  }

  dispose() {
    if (this.referenceDescriptors) this.referenceDescriptors.delete();
    if (this.referenceKeypoints) this.referenceKeypoints.delete();
    if (this.detector) this.detector.delete();
  }
}
