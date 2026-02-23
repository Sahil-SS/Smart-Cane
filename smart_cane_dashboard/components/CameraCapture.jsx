"use client";

import { useRef, useEffect } from "react";

export default function CameraCapture({ onCapture, setCapturing }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    if (streamRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
  };

  const capture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      setCapturing(false);
    });
  };

  useEffect(() => {
    const handler = async () => {
      setCapturing(true);
      await startCamera();
      setTimeout(capture, 300);
    };

    document.addEventListener("smart-cane-capture", handler);
    return () => document.removeEventListener("smart-cane-capture", handler);
  }, []);

  return (
    <div className="card">
      <video ref={videoRef} autoPlay width="100%" />
      <canvas ref={canvasRef} hidden />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
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