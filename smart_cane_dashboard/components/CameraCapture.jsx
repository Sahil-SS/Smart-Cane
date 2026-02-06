import { useRef } from "react";

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const capture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
    });
  };

  return (
    <div className="card">
      <video ref={videoRef} autoPlay width="100%" />
      <canvas ref={canvasRef} hidden />

      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <button style={{ background: "#2563eb" }} onClick={startCamera}>
          Start Camera
        </button>
        <button style={{ background: "#dc2626" }} onClick={capture}>
          Capture
        </button>
      </div>
    </div>
  );
}
