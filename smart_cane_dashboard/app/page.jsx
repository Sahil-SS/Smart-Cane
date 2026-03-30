// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import ModeToggle from "../components/ModeToggle";
// import UploadImage from "../components/UploadImage";
// import CameraCapture from "../components/CameraCapture";
// import ResultPanel from "../components/ResultPanel";
// import { sendImageToBackend } from "../lib/api";
// import { speak } from "../lib/tts";

// export default function Dashboard() {
//   const [mode, setMode] = useState("detect");
//   const [response, setResponse] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [capturing, setCapturing] = useState(false);
//   const [isEmergency, setIsEmergency] = useState(false);

//   // --- REFS ---
//   const modeRef = useRef(mode);
//   const pendingSensorDataRef = useRef({ distance: null, dir: "" });
//   const buzzerRef = useRef(null); // 👈 Controls the alarm sound instance

//   useEffect(() => {
//     modeRef.current = mode;
//   }, [mode]);

//   // --- EMERGENCY LOGIC ---
//   const triggerEmergency = useCallback(async () => {
//     setIsEmergency(true);

//     // 1. Audio/Voice Feedback
//     speak("Emergency detected. Sending S O S email to your emergency contacts.");

//     // 2. Play Looping Alarm
//     const audio = new Audio('/alarm.mp3');
//     audio.loop = true; // Keep ringing until dismissed
//     audio.play().catch(e => console.log("Audio blocked by browser: ", e));
//     buzzerRef.current = audio; // Save to ref so we can stop it later

//     // 3. Trigger Nodemailer Backend API
//     try {
//       await fetch('/api/send-sos', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' }
//       });
//       console.log("✅ Telegram Alert Sent");
//       console.log("✅ Emergency Email Sent");
//     } catch (err) {
//       console.error("❌ SOS API Error", err);
//     }
//   }, []);

//   const dismissEmergency = () => {
//     // 1. Stop the sound immediately
//     if (buzzerRef.current) {
//       buzzerRef.current.pause();
//       buzzerRef.current.currentTime = 0;
//       buzzerRef.current = null;
//     }
//     // 2. Reset UI
//     setIsEmergency(false);
//     speak("Emergency dismissed.");
//   };

//   // --- DATA PROCESSING LOGIC ---
//   const handleEvent = useCallback((event) => {
//     // Merge Ultrasonic data into the AI response
//     if (pendingSensorDataRef.current.distance && event.mode === "detect") {
//       event.data.distance = pendingSensorDataRef.current.distance;
//       event.data.dir = pendingSensorDataRef.current.dir;
//     }

//     setResponse(event);

//     let speech = "";
//     if (event.mode === "detect") {
//       const detections = event.data?.detections || [];
//       const distance = event.data?.distance;
//       const direction = event.data?.dir || "ahead";

//       if (detections.length > 0) {
//         const objNames = detections.map((d) => d.class).join(", ");
//         speech = `${objNames}, ${distance} centimeters to your ${direction}`;
//       } else if (distance) {
//         speech = `Unidentified obstacle, ${distance} centimeters to your ${direction}`;
//       }
//     } else if (event.mode === "ocr") {
//       speech = event.data?.ocr?.map((t) => t.text).join(", ");
//     }

//     speak(speech || "No result detected");
//     pendingSensorDataRef.current = { distance: null, dir: "" };
//   }, []);

//   // --- WEBSOCKET CONNECTION ---
//   useEffect(() => {
//     const ws = new WebSocket("ws://localhost:1880/cane-alert");

//     ws.onopen = () => console.log("✅ WS CONNECTED");

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);

//         // 🚨 SOS Signal Priority
//         if (data.emergency) {
//           triggerEmergency();
//           return;
//         }

//         // 🟢 Sensor Trigger
//         if (data.trigger) {
//           pendingSensorDataRef.current = {
//             distance: data.distance,
//             dir: data.dir,
//           };
//           document.dispatchEvent(new Event("smart-cane-capture"));
//         }
//       } catch (err) {
//         console.error("WS Message Error", err);
//       }
//     };

//     return () => ws.close();
//   }, [triggerEmergency]);

//   // --- IMAGE HANDLERS ---
//   const handleImage = async (file) => {
//     try {
//       const res = await sendImageToBackend(file, modeRef.current);
//       handleEvent(res);
//     } catch {
//       console.error("Backend Error");
//     }
//   };

//   return (
//     <div className={isEmergency ? "emergency-mode" : ""}>
//       <main className="container">

//         {/* 🚨 Emergency Banner */}
//         {isEmergency && (
//           <div className="sos-banner">
//             <div className="sos-text">
//               🚨 SOS BUTTON PRESSED - EMERGENCY CONTACTS NOTIFIED 🚨
//             </div>
//             <button
//               className="sos-dismiss"
//               onClick={dismissEmergency}
//             >
//               DISMISS ALERT
//             </button>
//           </div>
//         )}

//         <h1 className="header">Smart Cane Dashboard</h1>

//         <div className="grid">
//           <div className="scroll">
//             <ModeToggle mode={mode} setMode={setMode} />

//             <UploadImage
//               onImage={handleImage}
//               preview={preview}
//               setPreview={setPreview}
//             />

//             <CameraCapture
//               onCapture={handleImage}
//               setCapturing={setCapturing}
//             />
//           </div>

//           <div className="card scroll">
//             <ResultPanel response={response} />
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../components/Navbar";
import ModeToggle from "../components/ModeToggle";
import UploadImage from "../components/UploadImage";
import CameraCapture from "../components/CameraCapture";
import ResultPanel from "../components/ResultPanel";
import { sendImageToBackend } from "../lib/api";
import { speak } from "../lib/tts";

// ─── Stat card ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, colorClass, valueClass, sub }) {
  return (
    <div className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-1.5 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${colorClass}`} />
      <span className="text-xl mb-1">{icon}</span>
      <p className="font-mono text-[0.6rem] tracking-widest text-white/40 uppercase">
        {label}
      </p>
      <p
        className={`font-mono text-2xl font-bold tracking-tight ${valueClass}`}
      >
        {value ?? "—"}
      </p>
      {sub && <p className="font-mono text-[0.6rem] text-white/30">{sub}</p>}
    </div>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────

function Panel({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-0.5 h-3 rounded-full bg-gradient-to-b from-emerald-400 to-cyan-400 shrink-0" />
        <span className="font-mono text-[0.6rem] tracking-[0.18em] text-white/30 uppercase">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────

export default function Dashboard() {
  const [mode, setMode] = useState("detect");
  const [response, setResponse] = useState(null);
  const [preview, setPreview] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  // WS & stats
  const [wsConnected, setWsConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [sosCount, setSosCount] = useState(0);
  const [captureCount, setCaptureCount] = useState(0);

  const modeRef = useRef(mode);
  const pendingSensorDataRef = useRef({ distance: null, dir: "" });
  const buzzerRef = useRef(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ── Emergency ────────────────────────────────────────────────────────────
  const triggerEmergency = useCallback(async () => {
    setIsEmergency(true);
    setSosCount((c) => c + 1);
    speak("Emergency detected. Sending SOS email to your emergency contacts.");

    const audio = new Audio("/alarm.mp3");
    audio.loop = true;
    audio.play().catch((e) => console.log("Audio blocked:", e));
    buzzerRef.current = audio;

    try {
      await fetch("/api/send-sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      console.log("✅ SOS Sent");
    } catch (err) {
      console.error("❌ SOS API Error", err);
    }
  }, []);

  const dismissEmergency = () => {
    if (buzzerRef.current) {
      buzzerRef.current.pause();
      buzzerRef.current.currentTime = 0;
      buzzerRef.current = null;
    }
    setIsEmergency(false);
    speak("Emergency dismissed.");
  };

  // ── Event / AI result handler ────────────────────────────────────────────
  const handleEvent = useCallback((event) => {
    if (pendingSensorDataRef.current.distance && event.mode === "detect") {
      event.data.distance = pendingSensorDataRef.current.distance;
      event.data.dir = pendingSensorDataRef.current.dir;
    }

    setResponse(event);
    setEventCount((c) => c + 1);

    let speech = "";

    if (event.mode === "detect") {
      const detections = event.data?.detections || [];
      const distance = event.data?.distance;
      const direction = event.data?.dir || "ahead";

      if (detections.length > 0) {
        const objNames = detections.map((d) => d.class).join(", ");
        speech = `${objNames}, ${distance} centimeters to your ${direction}`;
      } else if (distance) {
        speech = `Unidentified obstacle, ${distance} centimeters to your ${direction}`;
      }
    } else if (event.mode === "ocr") {
      speech = event.data?.ocr?.map((t) => t.text).join(", ");
    }

    if (speech) speak(speech);

    pendingSensorDataRef.current = { distance: null, dir: "" };
  }, []);

  // ── WebSocket (auto-reconnects every 4 s) ────────────────────────────────
  useEffect(() => {
    let ws;
    let retryTimeout;

    const connect = () => {
      ws = new WebSocket("ws://localhost:1880/cane-alert");

      ws.onopen = () => {
        setWsConnected(true);
        setLastSeen(new Date().toLocaleTimeString());
        console.log("✅ WS CONNECTED");
      };

      ws.onmessage = (event) => {
        setLastSeen(new Date().toLocaleTimeString());
        try {
          const data = JSON.parse(event.data);
          if (data.emergency) {
            triggerEmergency();
            return;
          }
          if (data.trigger) {
            pendingSensorDataRef.current = {
              distance: data.distance,
              dir: data.dir,
            };
            setCaptureCount((c) => c + 1);
            document.dispatchEvent(new Event("smart-cane-capture"));
          }
        } catch (err) {
          console.error("WS Message Error", err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        retryTimeout = setTimeout(connect, 4000);
      };

      ws.onerror = () => setWsConnected(false);
    };

    connect();
    return () => {
      ws?.close();
      clearTimeout(retryTimeout);
    };
  }, [triggerEmergency]);

  // ── Image handler ────────────────────────────────────────────────────────
  const handleImage = async (file) => {
    try {
      const res = await sendImageToBackend(file, modeRef.current);
      if (res) handleEvent(res);
    } catch {
      console.error("Backend Error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        body { font-family: 'IBM Plex Mono', monospace; background: #080c10; }
      `}</style>

      <div
        className={`min-h-screen text-white transition-colors duration-300
          [background-image:radial-gradient(ellipse_80%_60%_at_10%_0%,rgba(52,211,153,0.06)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_90%_100%,rgba(34,211,238,0.05)_0%,transparent_60%)]
          ${isEmergency ? "bg-red-950/10" : "bg-[#080c10]"}`}
      >
        {/* ── Navbar ── */}
        <Navbar connected={wsConnected} lastSeen={lastSeen} />

        <main className="max-w-screen-xl mx-auto px-6 py-7 flex flex-col gap-6">
          {/* ── Emergency Banner ── */}
          {isEmergency && (
            <div
              className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl
              bg-red-500/10 border border-red-500/40 animate-pulse"
            >
              <p className="font-mono text-sm font-bold tracking-widest text-red-400">
                🚨 SOS BUTTON PRESSED — EMERGENCY CONTACTS NOTIFIED
              </p>
              <button
                onClick={dismissEmergency}
                className="shrink-0 px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-widest
                  bg-red-500/15 border border-red-500/40 text-red-400
                  hover:bg-red-500/30 transition-all duration-200 cursor-pointer"
              >
                ✕ DISMISS
              </button>
            </div>
          )}

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon="⬡"
              label="WS Status"
              value={wsConnected ? "ONLINE" : "OFFLINE"}
              colorClass={
                wsConnected
                  ? "bg-gradient-to-r from-emerald-400/60 to-transparent"
                  : "bg-gradient-to-r from-red-500/60 to-transparent"
              }
              valueClass={wsConnected ? "text-emerald-400" : "text-red-400"}
              sub={lastSeen ? `Last ping: ${lastSeen}` : "Never connected"}
            />
            <StatCard
              icon="◉"
              label="Events Received"
              value={eventCount}
              colorClass="bg-gradient-to-r from-cyan-400/60 to-transparent"
              valueClass="text-cyan-400"
              sub="Total perception events"
            />
            <StatCard
              icon="⦿"
              label="Auto Captures"
              value={captureCount}
              colorClass="bg-gradient-to-r from-violet-400/60 to-transparent"
              valueClass="text-violet-400"
              sub="Triggered by sensor"
            />
            <StatCard
              icon="🚨"
              label="SOS Alerts"
              value={sosCount}
              colorClass={
                sosCount > 0
                  ? "bg-gradient-to-r from-red-500/60 to-transparent"
                  : "bg-gradient-to-r from-white/10 to-transparent"
              }
              valueClass={sosCount > 0 ? "text-red-400" : "text-white/30"}
              sub="Emergency triggers"
            />
          </div>

          {/* ── Main Two-Column Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: controls */}
            <div className="flex flex-col gap-4">
              <Panel title="Analysis Mode">
                <ModeToggle mode={mode} setMode={setMode} />
              </Panel>

              <Panel title="Image Upload">
                <UploadImage
                  onImage={handleImage}
                  preview={preview}
                  setPreview={setPreview}
                />
              </Panel>

              <Panel title="Live Camera Feed">
                <CameraCapture
                  onCapture={handleImage}
                  setCapturing={setCapturing}
                />
                {capturing && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                    bg-violet-400/10 border border-violet-400/20 text-violet-400
                    font-mono text-[0.65rem] tracking-widest"
                  >
                    ⟳ AUTO-CAPTURE IN PROGRESS…
                  </div>
                )}
              </Panel>
            </div>

            {/* Right: results + log */}
            <Panel
              title="Perception Output"
              className="min-h-80 justify-between"
            >
              <div className="flex-1">
                <ResultPanel response={response} />
              </div>

              {/* System log */}
              <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-2 mt-4">
                <p className="font-mono text-[0.58rem] tracking-widest text-white/25 uppercase mb-1">
                  System Log
                </p>
                <div className="flex items-start gap-2 font-mono text-[0.63rem] text-white/35">
                  <span
                    className={
                      wsConnected
                        ? "text-emerald-400 shrink-0"
                        : "text-red-400 shrink-0"
                    }
                  >
                    ●
                  </span>
                  <span>
                    WebSocket{" "}
                    {wsConnected ? "connected to" : "disconnected from"}{" "}
                    ws://localhost:1880/cane-alert
                    {!wsConnected && " — retrying in 4s"}
                  </span>
                </div>
                {response && (
                  <div className="flex items-start gap-2 font-mono text-[0.63rem] text-white/35">
                    <span className="text-cyan-400 shrink-0">●</span>
                    <span>
                      Last event:{" "}
                      {response.mode === "detect"
                        ? `${response.data?.detections?.length ?? 0} object(s) detected`
                        : "OCR scan complete"}
                    </span>
                  </div>
                )}
                {isEmergency && (
                  <div className="flex items-start gap-2 font-mono text-[0.63rem] text-red-400">
                    <span className="shrink-0">●</span>
                    <span>SOS ACTIVE — contacts alerted, alarm sounding</span>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </main>
      </div>
    </>
  );
}
