export default function ResultPanel({ response }) {
  if (!response || !response.data) {
    return <p style={{ opacity: 0.6 }}>No results yet</p>;
  }

  const { mode, data } = response;

  return (
    <div>
      <h3>Results</h3>

      {mode === "detect" && Array.isArray(data.detections) && (
        data.detections.length > 0
          ? data.detections.map((d, i) => (
              <p key={i}>
                {d.class} — {(d.confidence * 100).toFixed(1)}%
              </p>
            ))
          : <p>No objects detected</p>
      )}

      {mode === "ocr" && Array.isArray(data.ocr) && (
        data.ocr.length > 0
          ? data.ocr.map((t, i) => (
              <p key={i}>
                &quot;{t.text}&quot; — {(t.confidence * 100).toFixed(1)}%
              </p>
            ))
          : <p>No text detected</p>
      )}
    </div>
  );
}
