/**
 * Video & Camera snapshot helpers for Posture & Framing Coach
 */

export async function startCamera(videoEl: HTMLVideoElement): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera API is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user",
    },
    audio: false,
  });

  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopCamera(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export function captureFrame(videoEl: HTMLVideoElement): string | null {
  if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  // Moderate resolution to ensure quick base64 encoding and lightweight API transmission
  canvas.width = Math.min(videoEl.videoWidth, 640);
  canvas.height = Math.min(videoEl.videoHeight, 480);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

  // Return raw base64 without prefix
  const parts = dataUrl.split(",");
  return parts.length > 1 ? parts[1] : null;
}
