import "./globals.css";

export const metadata = {
  title: "Smart Cane Dashboard",
  description: "OCR and Object Detection Testing Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#0f172a",
          color: "#e5e7eb",
          fontFamily: "sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
