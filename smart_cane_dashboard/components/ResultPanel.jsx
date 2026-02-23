export default function ResultPanel({ response }) {
  if (!response || !response.data) {
    return <p style={{ opacity: 0.6 }}>No results yet</p>;
  }

  const { mode, data } = response;

  return (
    <div>
      <h3 style={{ marginBottom: "12px" }}>AI Perception Results</h3>

      {/* Object detection Mode */}
      {mode === "detect" && Array.isArray(data.detections) && (
        <>
          <div style={{ marginBottom: "15px" }}>
            {data.detections.length > 0 ? (
              data.detections.map((d, i) => (
                <div
                  key={i}
                  className="result-item"
                  style={{ padding: "4px 0" }}
                >
                  <span style={{ fontWeight: "bold", color: "#22c55e" }}>
                    ● {d.class}
                  </span>
                  <span style={{ opacity: 0.8, marginLeft: "8px" }}>
                    — {(d.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <p>No objects identified in frame</p>
            )}
          </div>

          <hr style={{ borderColor: "#334155", margin: "10px 0" }} />

          {/* ⭐ Direction and Distance Display */}
          {(data.distance || data.dir) && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px",
                background: "#1e293b",
                borderRadius: "8px",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7 }}>
                SENSOR DATA
              </p>
              <p
                style={{
                  marginTop: "5px",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                }}
              >
                {data.distance} cm
                <span
                  style={{
                    marginLeft: "10px",
                    padding: "2px 8px",
                    background: "#3b82f6",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                  }}
                >
                  Direction: {data.dir || "Center"}
                </span>
              </p>
            </div>
          )}
        </>
      )}

      {/* OCR Mode */}
      {mode === "ocr" && Array.isArray(data.ocr) && (
        <div style={{ marginTop: "10px" }}>
          {data.ocr.length > 0 ? (
            data.ocr.map((t, i) => (
              <p key={i} style={{ fontStyle: "italic" }}>
                &quot;{t.text}&quot; — {(t.confidence * 100).toFixed(1)}%
              </p>
            ))
          ) : (
            <p>No text detected</p>
          )}
        </div>
      )}
    </div>
  );
}
