import type { PoseLandmarks } from "./fitting-types";

const TASK_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";

export async function createPoseTracker() {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
  const landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: TASK_MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: true,
  });

  let lastTimestamp = 0;
  let smoothed: PoseLandmarks | null = null;

  return {
    detect(video: HTMLVideoElement): PoseLandmarks | null {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) return null;
      const timestamp = Math.max(performance.now(), lastTimestamp + 1);
      lastTimestamp = timestamp;
      const result = landmarker.detectForVideo(video, timestamp);
      const raw = result.landmarks[0];
      if (!raw) return null;

      const next = raw.map((point) => ({
        x: point.x,
        y: point.y,
        visibility: point.visibility ?? 1,
      }));
      smoothed = smoothed?.length === next.length
        ? next.map((point, index) => {
            const previous = smoothed?.[index];
            if (!previous) return point;
            const alpha = point.visibility < 0.35 ? 0.78 : 0.35;
            return {
              x: previous.x + (point.x - previous.x) * alpha,
              y: previous.y + (point.y - previous.y) * alpha,
              visibility: point.visibility,
            };
          })
        : next;
      return smoothed;
    },
    close() {
      landmarker.close();
      smoothed = null;
    },
  };
}