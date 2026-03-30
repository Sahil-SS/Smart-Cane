// export default function ModeToggle({ mode, setMode }) {
//   return (
//     <div className="flex center">
//       <button
//         onClick={() => setMode("detect")}
//         style={{
//           background: mode === "detect" ? "#22c55e" : "#334155",
//         }}
//       >
//         Object Detection
//       </button>

//       <button
//         onClick={() => setMode("ocr")}
//         style={{
//           background: mode === "ocr" ? "#22c55e" : "#334155",
//         }}
//       >
//         OCR
//       </button>
//     </div>
//   );
// }

export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Toggle buttons */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/30">
        {[
          { id: "detect", label: "⬡ Object Detection" },
          { id: "ocr",    label: "⟁ OCR / Text" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 py-2.5 px-5 text-xs font-bold tracking-widest uppercase transition-all duration-300 font-mono cursor-pointer border-none
              ${mode === id
                ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-black"
                : "bg-transparent text-white/40 hover:text-white/70"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Info cards */}
      <div className="flex gap-2">
        {[
          { id: "detect", title: "OBJECT DETECTION", engine: "YOLOv8 Model Active" },
          { id: "ocr",    title: "TEXT RECOGNITION",  engine: "Tesseract OCR Engine" },
        ].map(({ id, title, engine }) => (
          <div
            key={id}
            className={`flex-1 p-2.5 rounded-lg border transition-all duration-300
              ${mode === id
                ? "bg-emerald-400/5 border-emerald-400/20"
                : "bg-white/[0.02] border-white/5"
              }`}
          >
            <p className="font-mono text-[0.6rem] tracking-widest text-white/40 uppercase">
              {title}
            </p>
            <p className={`font-mono text-[0.68rem] mt-1 transition-colors duration-300
              ${mode === id ? "text-emerald-400" : "text-white/20"}`}>
              {engine}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}