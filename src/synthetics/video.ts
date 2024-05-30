interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

export function syntheticVideo({
  width = 1920,
  height = 1080,
} = {}): MediaStreamTrack {
  const canvas = Object.assign(document.createElement("canvas"), {
    width,
    height,
  }) as CanvasElement;

  let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let stopped = false;
  requestAnimationFrame(function animate() {
    if (!stopped) {
      const r = Math.round(Math.random() * 255);
      const g = Math.round(Math.random() * 255);
      const b = Math.round(Math.random() * 255);
      const a = Math.round(Math.random() * 255);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillRect(Math.random() * width, Math.random() * height, 50, 50);
      requestAnimationFrame(animate);
    }
  });
  const stream = canvas.captureStream(30);
  const track = stream.getTracks()[0];
  const originalStop = track.stop;
  track.stop = () => {
    stopped = true;
    originalStop.call(track);
  };

  return track;
}
