// export default function ResultPanel({ response }) {
//   if (!response || !response.data) {
//     return <p style={{ opacity: 0.6 }}>No results yet</p>;
//   }

//   const { mode, data } = response;

//   return (
//     <div>
//       <h3 style={{ marginBottom: "12px" }}>AI Perception Results</h3>

//       {/* Object detection Mode */}
//       {mode === "detect" && Array.isArray(data.detections) && (
//         <>
//           <div style={{ marginBottom: "15px" }}>
//             {data.detections.length > 0 ? (
//               data.detections.map((d, i) => (
//                 <div
//                   key={i}
//                   className="result-item"
//                   style={{ padding: "4px 0" }}
//                 >
//                   <span style={{ fontWeight: "bold", color: "#22c55e" }}>
//                     ● {d.class}
//                   </span>
//                   <span style={{ opacity: 0.8, marginLeft: "8px" }}>
//                     — {(d.confidence * 100).toFixed(1)}%
//                   </span>
//                 </div>
//               ))
//             ) : (
//               <p>No objects identified in frame</p>
//             )}
//           </div>

//           <hr style={{ borderColor: "#334155", margin: "10px 0" }} />

//           {/* ⭐ Direction and Distance Display */}
//           {(data.distance || data.dir) && (
//             <div
//               style={{
//                 marginTop: "12px",
//                 padding: "10px",
//                 background: "#1e293b",
//                 borderRadius: "8px",
//               }}
//             >
//               <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7 }}>
//                 SENSOR DATA
//               </p>
//               <p
//                 style={{
//                   marginTop: "5px",
//                   fontSize: "1.1rem",
//                   fontWeight: "bold",
//                 }}
//               >
//                 {data.distance} cm
//                 <span
//                   style={{
//                     marginLeft: "10px",
//                     padding: "2px 8px",
//                     background: "#3b82f6",
//                     borderRadius: "4px",
//                     fontSize: "0.8rem",
//                     textTransform: "uppercase",
//                   }}
//                 >
//                   Direction: {data.dir || "Center"}
//                 </span>
//               </p>
//             </div>
//           )}
//         </>
//       )}

//       {/* OCR Mode */}
//       {mode === "ocr" && Array.isArray(data.ocr) && (
//         <div style={{ marginTop: "10px" }}>
//           {data.ocr.length > 0 ? (
//             data.ocr.map((t, i) => (
//               <p key={i} style={{ fontStyle: "italic" }}>
//                 &quot;{t.text}&quot; — {(t.confidence * 100).toFixed(1)}%
//               </p>
//             ))
//           ) : (
//             <p>No text detected</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }


export default function ResultPanel({ response }) {
  if (!response || !response.data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16 opacity-30">
        <span className="text-5xl">◎</span>
        <p className="font-mono text-xs tracking-widest text-white/50">
          AWAITING PERCEPTION DATA
        </p>
      </div>
    );
  }

  const { mode, data } = response;
  const detections = data.detections || [];

  return (
    <div className="flex flex-col gap-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.62rem] tracking-widest text-white/35 uppercase">
          AI Perception Output
        </span>
        <span className={`px-3 py-1 rounded-full font-mono text-[0.6rem] font-bold tracking-widest border
          ${mode === "detect"
            ? "bg-emerald-400/15 text-emerald-400 border-emerald-400/25"
            : "bg-cyan-400/15 text-cyan-400 border-cyan-400/25"
          }`}>
          {mode === "detect" ? "OBJECT DETECT" : "OCR"}
        </span>
      </div>

      {/* ── Object Detection ── */}
      {mode === "detect" && (
        <>
          {detections.length > 0 ? (
            <div className="flex flex-col gap-2">
              {detections.map((d, i) => {
                const pct = (d.confidence * 100).toFixed(1);
                return (
                  <div
                    key={i}
                    className="bg-black/30 rounded-xl px-4 py-3 border border-white/[0.06]"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono font-bold text-sm text-white">
                        {d.class}
                      </span>
                      <span className="font-mono text-xs text-emerald-400">
                        {pct}%
                      </span>
                    </div>
                    {/* Confidence bar */}
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="font-mono text-xs text-white/35 tracking-wide">
              No objects detected in frame
            </p>
          )}

          {/* Sensor data */}
          {(data.distance || data.dir) && (
            <div className="border-t border-white/[0.06] pt-4">
              <p className="font-mono text-[0.58rem] tracking-widest text-white/30 uppercase mb-3">
                Ultrasonic Sensor
              </p>
              <div className="flex gap-3">
                <div className="flex-1 bg-emerald-400/[0.08] border border-emerald-400/20 rounded-xl p-3 text-center">
                  <p className="font-mono text-2xl font-bold text-emerald-400">
                    {data.distance}
                  </p>
                  <p className="font-mono text-[0.58rem] tracking-widest text-white/30 mt-1">
                    CM AWAY
                  </p>
                </div>
                <div className="flex-1 bg-cyan-400/[0.08] border border-cyan-400/20 rounded-xl p-3 text-center">
                  <p className="font-mono text-2xl font-bold text-cyan-400 uppercase">
                    {data.dir || "FWD"}
                  </p>
                  <p className="font-mono text-[0.58rem] tracking-widest text-white/30 mt-1">
                    DIRECTION
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── OCR Mode ── */}
      {mode === "ocr" && Array.isArray(data.ocr) && (
        <div className="flex flex-col gap-2">
          {data.ocr.length > 0 ? (
            data.ocr.map((t, i) => (
              <div
                key={i}
                className="bg-black/30 rounded-xl px-4 py-3 border border-white/[0.06]"
              >
                <p className="italic text-white text-base mb-2 font-serif">
                  &quot;{t.text}&quot;
                </p>
                <p className="font-mono text-[0.6rem] tracking-widest text-white/35">
                  CONFIDENCE: {(t.confidence * 100).toFixed(1)}%
                </p>
              </div>
            ))
          ) : (
            <p className="font-mono text-xs text-white/35">
              No text detected
            </p>
          )}
        </div>
      )}
    </div>
  );
}