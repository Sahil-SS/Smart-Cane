const BACKEND_URL = "http://localhost:4000";

export async function sendImageToBackend(file, mode) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${BACKEND_URL}/${mode}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Backend request failed");
  }

  return response.json();
}
