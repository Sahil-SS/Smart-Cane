/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";

import Navbar from "../components/Navbar";
import ModeToggle from "../components/ModeToggle";
import CameraCapture from "../components/CameraCapture";
import ResultPanel from "../components/ResultPanel";
import { sendImageToBackend } from "../lib/api";
import { tryFetchIPCamera } from "../lib/ipCamera";
import { speak } from "../lib/tts";
import { NODE_RED_WS_URL } from "../constants/network";

// ─── TYPES ────────────────────────────────────────────────────
type CameraSource = "ip" | "local" | "idle";

// ─── CUSTOM UI WRAPPERS ───────────────────────────────────────
function StatCard({ icon, label, value, colorClass, valueColor, sub }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statBorderTop, { backgroundColor: colorClass }]} />
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>
        {value ?? "—"}
      </Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function Panel({ title, children }: any) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelAccent} />
        <Text style={styles.panelTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────
export default function Dashboard() {
  // ── Application State ──
  const [mode, setMode] = useState("detect");
  const [response, setResponse] = useState<any>(null);
  const [capturing, setCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // ── Hardware & Network State ──
  const [isEmergency, setIsEmergency] = useState(false);
  const [autoTrigger, setAutoTrigger] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  // ── NEW: Camera source tracking ──
  const [cameraSource, setCameraSource] = useState<CameraSource>("idle");
  const [ipCamAvailable, setIpCamAvailable] = useState<boolean | null>(null);

  // ── Dashboard Counters ──
  const [eventCount, setEventCount] = useState(0);
  const [sosCount, setSosCount] = useState(0);

  // ── Mutable References ──
  const modeRef = useRef(mode);
  const pendingSensorDataRef = useRef({ distance: null as any, dir: "" });
  const wsRef = useRef<WebSocket | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const emergencyRef = useRef(false);
  // Prevent ghost reconnects
  const reconnectTimeoutRef = useRef<number | null>(null);

  // ── Animation Engine ──
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Keep mode ref updated
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ─── FLASHING RED ANIMATION ───
  useEffect(() => {
    let loop: Animated.CompositeAnimation;
    if (isEmergency) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ]),
      );
      loop.start();
    } else {
      flashAnim.stopAnimation();
      flashAnim.setValue(0);
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [isEmergency]);

  const flashColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(239, 68, 68, 0.4)", "rgba(239, 68, 68, 0.95)"],
  });

  // ─── WEBSOCKET CONNECTION ───
  useEffect(() => {
    const connectWS = () => {
      wsRef.current = new WebSocket(NODE_RED_WS_URL);

      wsRef.current.onopen = () => setWsConnected(true);

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.emergency) {
            triggerEmergency();
            return;
          }

          if (data.trigger) {
            console.log("🎯 Node-RED trigger received");
            pendingSensorDataRef.current = {
              distance: data.distance,
              dir: data.dir,
            };
            // go through the IP cam → local fallback pipeline
            handleAutoTrigger();
          }
        } catch (err) {
          console.error("WS Parse Error:", err);
        }
      };

      wsRef.current.onclose = () => {
        setWsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWS, 4000); // Auto-reconnect stored in ref
      };
      wsRef.current.onerror = () => setWsConnected(false);
    };

    connectWS();

    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // ─── AUDIO ENGINE ───
  const stopAlarm = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        }
        soundRef.current = null;
      }
    } catch (err) {
      console.log("Audio cleanup caught an error:", err);
      soundRef.current = null;
    }
  };

  // ─── EMERGENCY LOGIC ───
  const triggerEmergency = useCallback(async () => {
    if (emergencyRef.current) return;

    emergencyRef.current = true;
    setIsEmergency(true);
    setSosCount((c) => c + 1);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    speak("Emergency detected. Sounding alarm and notifying contacts.");

    try {
      await stopAlarm();

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/alarm.mp3"),
        { isLooping: true },
      );
      soundRef.current = sound;
      await sound.playAsync();

      const botToken = process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN;
      const chatId = process.env.EXPO_PUBLIC_TELEGRAM_CHAT_ID;
      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🚨 *EMERGENCY ALERT* 🚨\nSmart Cane SOS pressed at ${new Date().toLocaleString()}`,
            parse_mode: "Markdown",
          }),
        });
      }
    } catch (err) {
      console.error("Emergency sequence failed:", err);
    }
  }, []);

  const dismissEmergency = async () => {
    setIsEmergency(false);
    emergencyRef.current = false;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    speak("Emergency dismissed.");

    await stopAlarm();
  };

  // ─── AI DATA PIPELINE ───
  const handleEvent = useCallback((eventData: any) => {
    // 1. Deep Clone payload so we don't mutate the original network response safely
    const enrichedData = {
      ...eventData,
      data: { ...eventData.data },
    };

    if (
      pendingSensorDataRef.current.distance &&
      enrichedData.mode === "detect"
    ) {
      enrichedData.data.distance = pendingSensorDataRef.current.distance;
      enrichedData.data.dir = pendingSensorDataRef.current.dir;
    }

    setResponse(enrichedData);
    setEventCount((c) => c + 1);

    // 2. Build speech string
    let speech = "";
    if (enrichedData.mode === "detect") {
      const detections = enrichedData.data?.detections || [];
      const dist = enrichedData.data?.distance;
      const dir = enrichedData.data?.dir || "ahead";
      if (detections.length > 0) {
        const objNames = detections.map((d: any) => d.class).join(", ");
        speech = `${objNames}, ${dist} centimeters to your ${dir}`;
      } else if (dist) {
        speech = `Unidentified obstacle, ${dist} centimeters to your ${dir}`;
      }
    } else if (enrichedData.mode === "ocr") {
      speech = enrichedData.data?.ocr?.map((t: any) => t.text).join(", ");
    }

    // 3. Output audio & save to log
    if (speech) {
      speak(speech);
      const newEntry = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        text: speech,
      };
      setHistory((prev) => [newEntry, ...prev].slice(0, 10));
    }

    // 4. Reset sensor ref
    pendingSensorDataRef.current = { distance: null, dir: "" };
  }, []);

  // ─── IP CAM → LOCAL FALLBACK PIPELINE ───
  const handleAutoTrigger = useCallback(async () => {
    setIsProcessing(true);
    setCameraSource("idle");

    try {
      const result = await tryFetchIPCamera();

      if (result.success) {
        // ── IP Camera path ──
        console.log("📡 IP camera reachable — sending URL to backend");
        setCameraSource("ip");
        setIpCamAvailable(true);

        const res = await sendImageToBackend(
          result.url,
          modeRef.current,
          true, // isRemoteUrl = true → backend downloads it
        );
        if (res) handleEvent(res);

        setCameraSource("idle");
        setIsProcessing(false);
      } else {
        // ── Local camera fallback ──
        console.warn(
          `⚠️ IP camera unavailable (${result.reason}) — falling back to local camera`,
        );
        setCameraSource("local");
        setIpCamAvailable(false);

        setCapturing(true);
        setAutoTrigger((c) => c + 1);
        setTimeout(() => setCapturing(false), 2000);
      }
    } catch (err) {
      console.error("handleAutoTrigger failed:", err);
      speak("Capture pipeline failed.");
      setCameraSource("idle");
      setIsProcessing(false);
    }
  }, [handleEvent]);

  const handleImageReady = async (uri: string) => {
    setIsProcessing(true);
    try {
      const res = await sendImageToBackend(uri, modeRef.current, false);
      if (res) handleEvent(res);
    } catch (error) {
      console.error(error);
      speak("Backend connection failed.");
    } finally {
      setIsProcessing(false);
      setCameraSource("idle");
    }
  };

  // ─── UI INTERACTIONS ───
  const handleModeChange = (newMode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(newMode);
  };

  const replayAudio = () => {
    if (history.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      speak(history[0].text);
    }
  };

  // ─── RENDER ───
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <Navbar connected={wsConnected} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}>
            <StatCard
              icon="◉"
              label="EVENTS RECEIVED"
              value={eventCount}
              colorClass="#22d3ee"
              valueColor="#22d3ee"
              sub="Total perception events"
            />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard
              icon="🚨"
              label="SOS ALERTS"
              value={sosCount}
              colorClass={sosCount > 0 ? "#ef4444" : "rgba(255,255,255,0.1)"}
              valueColor={sosCount > 0 ? "#ef4444" : "rgba(255,255,255,0.3)"}
              sub="Emergency triggers"
            />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard
              icon="📡"
              label="IP CAMERA"
              value={
                ipCamAvailable === null
                  ? "—"
                  : ipCamAvailable
                    ? "ONLINE"
                    : "OFFLINE"
              }
              colorClass={
                ipCamAvailable === null
                  ? "rgba(255,255,255,0.1)"
                  : ipCamAvailable
                    ? "#34d399"
                    : "#f59e0b"
              }
              valueColor={
                ipCamAvailable === null
                  ? "rgba(255,255,255,0.3)"
                  : ipCamAvailable
                    ? "#34d399"
                    : "#f59e0b"
              }
              sub={
                ipCamAvailable === false ? "Using local cam" : "External feed"
              }
            />
          </View>
        </View>

        {/* ── MAIN GRID ── */}
        <View style={styles.grid}>
          <View style={styles.column}>
            <Panel title="ANALYSIS MODE">
              <ModeToggle mode={mode} setMode={handleModeChange} />
            </Panel>
            <Panel title="LIVE CAMERA FEED">
              <CameraCapture
                onImageReady={handleImageReady}
                capturing={capturing}
                autoTrigger={autoTrigger}
                cameraSource={cameraSource}
              />
            </Panel>
          </View>

          <View style={styles.column}>
            <Panel title="PERCEPTION LOG">
              <View style={styles.resultWrapper}>
                <ResultPanel
                  response={response}
                  isProcessing={isProcessing}
                  history={history}
                  onReplay={replayAudio}
                />
              </View>
            </Panel>
          </View>
        </View>
      </ScrollView>

      {/* ── SOS FULL-SCREEN OVERLAY ── */}
      {isEmergency && (
        <Animated.View
          style={[styles.sosOverlay, { backgroundColor: flashColor }]}
        >
          <View style={styles.sosOverlayContent}>
            <Text style={styles.sosIcon}>🚨</Text>
            <Text style={styles.sosHugeTitle}>SOS ACTIVE</Text>
            <Text style={styles.sosSubTitle}>EMERGENCY CONTACTS NOTIFIED</Text>
            <TouchableOpacity
              style={styles.hugeDismissBtn}
              onPress={dismissEmergency}
            >
              <Text style={styles.hugeDismissText}>STOP ALARM & DISMISS</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080c10",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: { padding: 15, paddingBottom: 40, flexGrow: 1 },

  grid: { flexDirection: Platform.OS === "web" ? "row" : "column", gap: 15 },
  column: { flex: 1, gap: 15 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 15,
    overflow: "hidden",
  },
  statBorderTop: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  statIcon: { fontSize: 18, marginBottom: 4, color: "#fff" },
  statLabel: {
    fontFamily: "monospace",
    fontSize: 9,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  statValue: {
    fontFamily: "monospace",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 2,
  },
  statSub: {
    fontFamily: "monospace",
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    marginTop: 4,
  },

  panel: {
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 15,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },
  panelAccent: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#34d399",
  },
  panelTitle: {
    fontFamily: "monospace",
    fontSize: 10,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
  },
  resultWrapper: { minHeight: 250 },

  // ── SOS OVERLAY ──
  sosOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sosOverlayContent: {
    alignItems: "center",
    backgroundColor: "#000",
    padding: 40,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#ef4444",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  sosIcon: { fontSize: 70, marginBottom: 10 },
  sosHugeTitle: {
    color: "#ef4444",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 4,
    fontFamily: "monospace",
    marginBottom: 10,
    textAlign: "center",
  },
  sosSubTitle: {
    color: "#ffb3b3",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: "monospace",
    marginBottom: 40,
    textAlign: "center",
  },
  hugeDismissBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 50,
    width: "100%",
    alignItems: "center",
  },
  hugeDismissText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: "monospace",
  },
});
