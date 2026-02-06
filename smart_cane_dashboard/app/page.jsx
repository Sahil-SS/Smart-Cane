"use client";

import { useState } from "react";
import ModeToggle from "../components/ModeToggle";
import UploadImage from "../components/UploadImage";
import CameraCapture from "../components/CameraCapture";
import ResultPanel from "../components/ResultPanel";
import { sendImageToBackend } from "../lib/api";
import { speak } from "../lib/tts";

export default function Dashboard() {
  const [mode, setMode] = useState("detect");
  const [response, setResponse] = useState(null);
  const [preview, setPreview] = useState(null);

  // 🔑 SINGLE EVENT HANDLER (HTTP now, MQTT later)
  const handleEvent = (event) => {
    setResponse(event);

    let speech = "";
    if (event.mode === "detect") {
      speech = event.data.detections?.map(d => d.class).join(", ");
    } else if (event.mode === "ocr") {
      speech = event.data.ocr?.map(t => t.text).join(", ");
    }

    speak(speech || "No result detected");
  };

  const handleImage = async (file) => {
    try {
      const res = await sendImageToBackend(file, mode);
      handleEvent(res);
    } catch {
      alert("Backend error");
    }
  };

  return (
    <main className="container">
      <h1 className="header">Smart Cane Testing Dashboard</h1>

      <div className="grid">
        {/* LEFT */}
        <div className="scroll">
          <ModeToggle mode={mode} setMode={setMode} />

          <UploadImage
            onImage={handleImage}
            preview={preview}
            setPreview={setPreview}
          />

          <CameraCapture onCapture={handleImage} />
        </div>

        {/* RIGHT */}
        <div className="card scroll">
          <ResultPanel response={response} />
        </div>
      </div>
    </main>
  );
}
