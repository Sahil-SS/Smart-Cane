import { FLASK_BACKEND_URL } from "../constants/network";

export async function sendImageToBackend(imageUri: string, mode: string) {
  const formData = new FormData();

  formData.append("image", {
    uri: imageUri,
    name: "capture.jpg",
    type: "image/jpeg",
  } as any);

  try {
    // 👇 REMOVED the headers block entirely
    const response = await fetch(`${FLASK_BACKEND_URL}/${mode}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Upload Error:", error);
    throw error;
  }
}
