// // IMPORTANT: Change this to your computer/Raspberry Pi's actual local IPv4 address
// const LOCAL_IP = "10.77.21.250";

// export const FLASK_BACKEND_URL = `http://${LOCAL_IP}:4000`;
// export const NODE_RED_WS_URL = `ws://${LOCAL_IP}:1880/cane-alert`;

// ─── CURRENT LOCAL IP ─────────────────────────────────────────
// Change this to your computer's actual current IPv4 address if it has changed
const LOCAL_IP = "10.77.21.250";

// ─── WEBSOCKET ────────────────────────────────────────────────
// Restored your old path "/cane-alert" which matches your Node-RED setup
export const NODE_RED_WS_URL = `ws://${LOCAL_IP}:1880/cane-alert`;

// ─── BACKEND ──────────────────────────────────────────────────
export const BACKEND_URL = `http://${LOCAL_IP}:4000`;

// ─── IP WEBCAM (secondary phone running IP Webcam app) ────────
// Using the IP address you provided earlier for the phone
// export const IP_WEBCAM_BASE_URL = "http://10.77.21.72:8080";
export const IP_WEBCAM_BASE_URL = "http://10.77.21.223:8080";
export const IP_WEBCAM_SNAPSHOT_URL = `${IP_WEBCAM_BASE_URL}/shot.jpg`;
export const IP_CAM_TIMEOUT_MS = 3000;