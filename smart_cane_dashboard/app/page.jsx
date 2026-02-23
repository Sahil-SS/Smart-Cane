"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [capturing, setCapturing] = useState(false);

  const modeRef = useRef(mode);
  const pendingSensorDataRef = useRef({ distance: null, dir: "" });

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const handleEvent = useCallback((event) => {
    // Merge Ultrasonic data into the AI response
    if (pendingSensorDataRef.current.distance && event.mode === "detect") {
      event.data.distance = pendingSensorDataRef.current.distance;
      event.data.dir = pendingSensorDataRef.current.dir;
    }

    setResponse(event);

    let speech = "";

    if (event.mode === "detect") {
      const detections = event.data?.detections || [];
      const distance = event.data?.distance;
      const direction = event.data?.dir || "ahead";

      if (detections.length > 0) {
        const objNames = detections.map((d) => d.class).join(", ");
        speech = `${objNames}, ${distance} centimeters to your ${direction}`;
      } else if (distance) {
        // FALLBACK: AI didn't see it, but sensor felt it.
        speech = `Unidentified obstacle, ${distance} centimeters to your ${direction}`;
      }
    } else if (event.mode === "ocr") {
      speech = event.data?.ocr?.map((t) => t.text).join(", ");
    }

    speak(speech || "No result detected");
    pendingSensorDataRef.current = { distance: null, dir: "" };
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:1880/cane-alert");

    ws.onopen = () => console.log("✅ WS CONNECTED");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.trigger) {
          pendingSensorDataRef.current = {
            distance: data.distance,
            dir: data.dir,
          };
          // Auto-trigger the camera
          document.dispatchEvent(new Event("smart-cane-capture"));
        }
      } catch (err) {
        console.error("WS Message Error", err);
      }
    };

    return () => ws.close();
  }, []);

  const handleImage = async (file) => {
    try {
      const res = await sendImageToBackend(file, modeRef.current);
      handleEvent(res);
    } catch {
      console.error("Backend Error");
    }
  };

  return (
    <main className="container">
      <h1 className="header">Smart Cane Dashboard</h1>
      <div className="grid">
        <div className="scroll">
          <ModeToggle mode={mode} setMode={setMode} />
          <UploadImage
            onImage={handleImage}
            preview={preview}
            setPreview={setPreview}
          />
          <CameraCapture onCapture={handleImage} setCapturing={setCapturing} />
        </div>
        <div className="card scroll">
          <ResultPanel response={response} />
        </div>
      </div>
    </main>
  );
}
