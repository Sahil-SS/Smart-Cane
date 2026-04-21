import { IP_WEBCAM_SNAPSHOT_URL, IP_CAM_TIMEOUT_MS } from "../constants/network";

export type IPCameraResult =
  | { success: true; url: string }
  | { success: false; reason: string };

/**
 * Tries to reach the external IP Webcam snapshot endpoint.
 * Returns the snapshot URL on success (backend will download it directly),
 * or a failure object so the caller can fall back to the local camera.
 *
 * We intentionally do NOT buffer the image bytes here — the backend
 * downloads it in one hop, keeping app memory usage low.
 */
export async function tryFetchIPCamera(): Promise<IPCameraResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IP_CAM_TIMEOUT_MS);

  try {
    const res = await fetch(IP_WEBCAM_SNAPSHOT_URL, {
      method: "GET",
      signal: controller.signal,
    });

    if (!res.ok) {
      return { success: false, reason: `HTTP ${res.status}` };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return { success: false, reason: `Unexpected content-type: ${contentType}` };
    }

    return { success: true, url: IP_WEBCAM_SNAPSHOT_URL };
  } catch (err: any) {
    const reason = err?.name === "AbortError" ? "timeout" : String(err);
    return { success: false, reason };
  } finally {
    clearTimeout(timer);
  }
}