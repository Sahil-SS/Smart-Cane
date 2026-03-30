// import { useRef } from "react";

// export default function UploadImage({ onImage, preview, setPreview }) {
//   const inputRef = useRef(null);

//   const handleFile = (file) => {
//     if (!file) return;
//     setPreview(URL.createObjectURL(file));
//     onImage(file);
//   };

//   return (
//     <div
//       className="card"
//       style={{
//         border: "2px dashed #334155",
//         textAlign: "center",
//       }}
//       onClick={() => inputRef.current.click()}
//     >
//       <input
//         ref={inputRef}
//         type="file"
//         accept="image/*"
//         hidden
//         onChange={(e) => handleFile(e.target.files[0])}
//       />

//       <p style={{ opacity: 0.7 }}>Click to upload image</p>

//       {preview && (
//         <img src={preview} alt="preview" className="preview-img" />
//       )}
//     </div>
//   );
// }

import { useRef, useState } from "react";

export default function UploadImage({ onImage, preview, setPreview }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onImage(file);
  };

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      className={`relative rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 border-2 border-dashed
        ${dragging
          ? "border-emerald-400 bg-emerald-400/5"
          : "border-white/10 bg-black/20 hover:border-white/20"
        }
        ${preview ? "p-0" : "p-7 text-center"}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {preview ? (
        <>
          <img
            src={preview}
            alt="preview"
            className="w-full max-h-44 object-cover block"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <span className="font-mono text-xs text-white tracking-widest">
              CHANGE IMAGE
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="text-4xl mb-3 opacity-30">⬆</div>
          <p className="font-mono text-xs text-white/40 tracking-widest">
            DRAG &amp; DROP OR CLICK TO UPLOAD
          </p>
        </>
      )}
    </div>
  );
}