export async function initializeCamera(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  } catch (err) {
    console.warn('Camera access denied or unavailable, using edge fallback mode', err);
    return null;
  }
}

export function stopCamera(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}
