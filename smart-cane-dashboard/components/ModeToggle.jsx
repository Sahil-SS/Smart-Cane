export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex center">
      <button
        onClick={() => setMode("detect")}
        style={{
          background: mode === "detect" ? "#22c55e" : "#334155",
        }}
      >
        Object Detection
      </button>

      <button
        onClick={() => setMode("ocr")}
        style={{
          background: mode === "ocr" ? "#22c55e" : "#334155",
        }}
      >
        OCR
      </button>
    </div>
  );
}
