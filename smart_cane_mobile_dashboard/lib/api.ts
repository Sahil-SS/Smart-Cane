// import { FLASK_BACKEND_URL } from "../constants/network";

// export async function sendImageToBackend(imageUri: string, mode: string) {
//   const formData = new FormData();

//   formData.append("image", {
//     uri: imageUri,
//     name: "capture.jpg",
//     type: "image/jpeg",
//   } as any);

//   try {
//     // 👇 REMOVED the headers block entirely
//     const response = await fetch(`${FLASK_BACKEND_URL}/${mode}`, {
//       method: "POST",
//       body: formData,
//     });

//     if (!response.ok) {
//       throw new Error(`Backend request failed with status ${response.status}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("API Upload Error:", error);
//     throw error;
//   }
// }

// import { BACKEND_URL } from "../constants/network";

// /**
//  * Sends an image to the backend using FormData to match
//  * your Flask "request.files" requirement.
//  */
// export async function sendImageToBackend(
//   imageUri: string,
//   mode: string, // "detect" or "ocr"
//   isRemoteUrl = false
// ): Promise<any> {

//   const formData = new FormData();

//   if (isRemoteUrl) {
//     /**
//      * NOTE: Your current backend expects a FILE upload.
//      * If the image is a remote URL (IP Webcam), we must fetch it
//      * first to turn it into a blob/file so the backend can receive it.
//      */
//     const response = await fetch(imageUri);
//     const blob = await response.blob();
//     formData.append("image", blob, "capture.jpg");
//   } else {
//     // Local camera path
//     formData.append("image", {
//       uri: imageUri,
//       name: "capture.jpg",
//       type: "image/jpeg",
//     } as any);
//   }

//   try {
//     // Dynamic endpoint based on "mode" (detect or ocr)
//     const res = await fetch(`${BACKEND_URL}/${mode}`, {
//       method: "POST",
//       body: formData,
//       // IMPORTANT: Do NOT set Content-Type header manually when sending FormData.
//       // The browser/React Native will automatically set it with the boundary string.
//     });

//     if (!res.ok) {
//       throw new Error(`Backend responded with status ${res.status}`);
//     }

//     return await res.json();
//   } catch (error) {
//     console.error("API Upload Error:", error);
//     throw error;
//   }
// }

import { BACKEND_URL } from "../constants/network";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Sends an image to the backend using FormData to match
 * your Flask "request.files" requirement.
 */
export async function sendImageToBackend(
  imageUri: string,
  mode: string, // "detect" or "ocr"
  isRemoteUrl = false,
): Promise<any> {
  const formData = new FormData();

  if (isRemoteUrl) {
    const res = await fetch(`${BACKEND_URL}/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUri,
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend responded with status ${res.status}`);
    }

    return await res.json();
  } else {
    // ─── COMPRESS & RESIZE LOCAL CAMERA IMAGE ───
    // Resizes to 640px width (YOLO's preferred size) and compresses to 60% JPEG
    const optimizedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 640 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
    );

    formData.append("image", {
      uri: optimizedImage.uri,
      name: "capture.jpg",
      type: "image/jpeg",
    } as any);
  }

  try {
    // Dynamic endpoint based on "mode" (detect or ocr)
    const res = await fetch(`${BACKEND_URL}/${mode}`, {
      method: "POST",
      body: formData,
      // IMPORTANT: Do NOT set Content-Type header manually when sending FormData.
      // The browser/React Native will automatically set it with the boundary string.
    });

    if (!res.ok) {
      throw new Error(`Backend responded with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API Upload Error:", error);
    throw error;
  }
}
