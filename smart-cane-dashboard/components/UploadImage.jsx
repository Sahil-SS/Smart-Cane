import { useRef } from "react";

export default function UploadImage({ onImage, preview, setPreview }) {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onImage(file);
  };

  return (
    <div
      className="card"
      style={{
        border: "2px dashed #334155",
        textAlign: "center",
      }}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <p style={{ opacity: 0.7 }}>Click to upload image</p>

      {preview && (
        <img src={preview} alt="preview" className="preview-img" />
      )}
    </div>
  );
}
