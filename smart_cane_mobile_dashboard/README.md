# 🦯 Smart Cane Mobile Dashboard

A powerful, accessible React Native (Expo) companion app designed for an IoT Smart Cane. This app bridges the gap between physical hardware sensors, mobile hardware, and advanced AI perception. 

It receives ultrasonic sensor triggers via WebSockets, autonomously captures images using a custom "Terminator-style" camera UI, processes the environment through a local Flask AI backend (YOLOv8 + EasyOCR), and provides real-time auditory feedback to the user.

## ✨ Key Features
* **🔌 Real-Time IoT Bridge:** Maintains an auto-reconnecting WebSocket link to Node-RED.
* **📸 Auto-Triggered Perception:** Automatically captures photos when the cane's ultrasonic sensor detects an obstacle.
* **🧠 AI Computer Vision:** Seamlessly routes images to a Flask backend for Object Detection and Optical Character Recognition (OCR).
* **🔊 Auditory & Tactile Feedback:** Uses native Text-to-Speech (TTS) to read results and the iOS/Android Haptic Engine for physical interface feedback.
* **🚨 Emergency SOS System:** Features a full-screen flashing lock screen, a relentless looping audio alarm, and automated Telegram alerts to emergency contacts.
* **📜 Perception Log:** Maintains a rolling history of detected objects with a one-tap audio replay feature.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed and running:
* [Node.js](https://nodejs.org/) (v18 or newer recommended)
* [Expo Go App](https://expo.dev/client) installed on your physical iOS or Android device.
* The **Smart Cane Flask Backend** running locally (Port 4000).
* **Node-RED** running locally with the MQTT-to-WebSocket flow active (Port 1880).

> **⚠️ CRITICAL:** Your physical smartphone and the computer running the Flask/Node-RED servers **MUST** be connected to the exact same Wi-Fi network.

---

## 🚀 Installation & Setup

**1. Clone the repository**
```bash
git clone [https://github.com/yourusername/smart-cane-app.git](https://github.com/yourusername/smart-cane-app.git)
cd smart-cane-app
```
**2. Install dependencies**
```bash
npm install
```
**3. Configure your Local IP Address**

Because the app runs on a physical phone, it cannot use localhost. You must point the app to your computer's local Wi-Fi IP address.

* Open constants/network.ts.
* Replace LOCAL_IP with your computer's actual IPv4 address (e.g., 192.168.1.15).

**4. Configure Environment Variables**

Create a .env file in the root directory (next to package.json) and add your Telegram bot credentials for the SOS feature:
```JS
EXPO_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token_here
EXPO_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id_here
```
**5. Start the Development Server**
```bash
npx expo start
```
Scan the QR code that appears in your terminal using your phone's camera (iOS) or the Expo Go app (Android).

## 📂 Folder Structure

```
Smart_cane_mobile_dashboard
├── 📁 app
│   ├── 📄 _layout.tsx
│   └── 📄 index.tsx
├── 📁 assets
│   └── 🎵 alarm.mp3
├── 📁 components
│   ├── 📄 CameraCapture.tsx
│   ├── 📄 ModeToggle.tsx
│   ├── 📄 Navbar.tsx
│   └── 📄 ResultPanel.tsx
├── 📁 constants
│   └── 📄 network.ts
├── 📁 lib
│   ├── 📄 api.ts
│   └── 📄 tts.ts
├── ⚙️ .gitignore
├── 📝 README.md
├── ⚙️ app.json
├── 📄 eslint.config.js
├── ⚙️ package-lock.json
├── ⚙️ package.json
└── ⚙️ tsconfig.json
```
## 🧰 Troubleshooting
* "Network Request Failed" / Cannot connect to Backend: Double-check that your computer's IPv4 address hasn't changed. Routers often reassign local IPs. Update constants/network.ts if it has.

* Camera isn't auto-firing: Ensure you clicked "Grant Permission" on the phone screen. The camera component must be mounted and active to accept Node-RED triggers.

* I don't feel any vibrations: Haptics do not work in computer emulators. You must test the app on a physical device. Ensure "System Haptics" are enabled in your phone's OS settings and battery saver is off.

* Alarms are stacking/looping infinitely: Make sure you are using the updated stopAlarm() cleanup logic inside index.tsx so old audio instances are purged.