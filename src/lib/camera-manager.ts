import { preferredCameraFacing } from "./fitting-rules";

export class CameraManager {
  private stream: MediaStream | null = null;

  get currentStream() {
    return this.stream;
  }

  async listCameras() {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  }

  async start(deviceId?: string, isMobile = false) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser cannot access a camera. Try a current browser over HTTPS.");
    }

    const video: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
      ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: preferredCameraFacing(isMobile) } }),
    };
    const nextStream = await navigator.mediaDevices.getUserMedia({ audio: false, video });
    this.stopTracks(this.stream);
    this.stream = nextStream;
    return nextStream;
  }

  stop() {
    this.stopTracks(this.stream);
    this.stream = null;
  }

  private stopTracks(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop());
  }
}