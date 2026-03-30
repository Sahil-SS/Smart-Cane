// "use client";

// import { useRef, useEffect } from "react";

// export default function CameraCapture({ onCapture, setCapturing }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const streamRef = useRef(null);

//   const startCamera = async () => {
//     if (streamRef.current) return;

//     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     streamRef.current = stream;
//     videoRef.current.srcObject = stream;
//   };

//   const capture = () => {
//     const canvas = canvasRef.current;
//     const video = videoRef.current;

//     if (!video.videoWidth) return;

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     canvas.getContext("2d").drawImage(video, 0, 0);

//     canvas.toBlob((blob) => {
//       onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
//       setCapturing(false);
//     });
//   };

//   useEffect(() => {
//     const handler = async () => {
//       setCapturing(true);
//       await startCamera();
//       setTimeout(capture, 300);
//     };

//     document.addEventListener("smart-cane-capture", handler);
//     return () => document.removeEventListener("smart-cane-capture", handler);
//   }, []);

//   return (
//     <div className="card">
//       <video ref={videoRef} autoPlay width="100%" />
//       <canvas ref={canvasRef} hidden />

//       <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
//         <button style={{ background: "#2563eb" }} onClick={startCamera}>
//           Start Camera
//         </button>
//         <button style={{ background: "#dc2626" }} onClick={capture}>
//           Capture
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";

import { useRef, useEffect, useState } from "react";

export default function CameraCapture({ onCapture, setCapturing }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [active, setActive] = useState(false);
  const [flash, setFlash] = useState(false);

  // ───────────── START CAMERA ─────────────
  const startCamera = async () => {
    try {
      if (streamRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setActive(true);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  // ───────────── STOP CAMERA ─────────────
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setActive(false);
    }
  };

  // ───────────── CAPTURE IMAGE ─────────────
  const capture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    canvas.toBlob((blob) => {
      if (!blob) return;

      onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      setCapturing(false);
    }, "image/jpeg");
  };

  // ───────────── SMART CANE EVENT ─────────────
  useEffect(() => {
    const handler = async () => {
      setCapturing(true);
      await startCamera();

      // slight delay so camera stabilizes
      setTimeout(() => {
        capture();
      }, 300);
    };

    document.addEventListener("smart-cane-capture", handler);

    return () => {
      document.removeEventListener("smart-cane-capture", handler);
      stopCamera(); // ✅ cleanup when component unmounts
    };
  }, []);

  // ───────────── UI ─────────────
  return (
    <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/[0.07]">

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white/60 z-10 pointer-events-none" />
      )}

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full block min-h-36 object-cover"
      />

      <canvas ref={canvasRef} hidden />

      {/* Offline overlay */}
      {!active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
          <span className="text-3xl opacity-30">📷</span>
          <span className="font-mono text-[0.68rem] text-white/30 tracking-widest">
            CAMERA OFFLINE
          </span>
        </div>
      )}

      {/* Live badge */}
      {active && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-emerald-400/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="font-mono text-[0.6rem] text-emerald-400 tracking-widest font-bold">
            LIVE
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 p-2.5">
        {!active ? (
          <button
            onClick={startCamera}
            className="flex-1 py-2.5 rounded-lg font-mono text-[0.65rem] font-bold tracking-widest
              bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all"
          >
            ▶ START CAMERA
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex-1 py-2.5 rounded-lg font-mono text-[0.65rem] font-bold tracking-widest
              bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all"
          >
            ◉ STOP CAMERA
          </button>
        )}

        <button
          onClick={capture}
          disabled={!active}
          className={`flex-1 py-2.5 rounded-lg font-mono text-[0.65rem] font-bold tracking-widest border transition-all
            ${
              active
                ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25"
                : "bg-white/5 border-white/10 text-white/20 cursor-not-allowed"
            }`}
        >
          ⦿ CAPTURE
        </button>
      </div>
    </div>
  );
}