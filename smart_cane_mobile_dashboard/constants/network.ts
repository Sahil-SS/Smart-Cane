// IMPORTANT: Change this to your computer/Raspberry Pi's actual local IPv4 address
const LOCAL_IP = "10.77.21.250";

export const FLASK_BACKEND_URL = `http://${LOCAL_IP}:4000`;
export const NODE_RED_WS_URL = `ws://${LOCAL_IP}:1880/cane-alert`;
