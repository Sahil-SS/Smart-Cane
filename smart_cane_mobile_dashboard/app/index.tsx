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
import { speak } from "../lib/tts";
import { NODE_RED_WS_URL } from "../constants/network";

// ─── CUSTOM UI WRAPPERS ──────────────────────────────────────
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

// ─── MAIN DASHBOARD APP ────────────────────────────────────────────────────────
export default function Dashboard() {
  // Application State
  const [mode, setMode] = useState("detect");
  const [response, setResponse] = useState<any>(null);
  const [capturing, setCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Hardware & Network State
  const [isEmergency, setIsEmergency] = useState(false);
  const [autoTrigger, setAutoTrigger] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  // Dashboard Counters
  const [eventCount, setEventCount] = useState(0);
  const [sosCount, setSosCount] = useState(0);

  // Mutable References (Safe from re-renders)
  const modeRef = useRef(mode);
  const pendingSensorDataRef = useRef({ distance: null as any, dir: "" });
  const wsRef = useRef<WebSocket | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const emergencyRef = useRef(false);

  // Animation Engine
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Keep mode ref updated for API calls
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ─── FLASHING RED ANIMATION ───
  useEffect(() => {
    if (isEmergency) {
      Animated.loop(
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
      ).start();
    } else {
      flashAnim.stopAnimation();
      flashAnim.setValue(0);
    }
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
            console.log("🎯 Node-RED trigger received, firing camera!");
            pendingSensorDataRef.current = {
              distance: data.distance,
              dir: data.dir,
            };
            setCapturing(true);
            setAutoTrigger((c) => c + 1); // Triggers CameraCapture component
            setTimeout(() => setCapturing(false), 2000);
          }
        } catch (err) {
          console.error("WS Parse Error:", err);
        }
      };

      wsRef.current.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWS, 4000); // Auto-reconnect
      };
      wsRef.current.onerror = () => setWsConnected(false);
    };

    connectWS();
    return () => wsRef.current?.close();
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
    if (emergencyRef.current) return; // Prevent duplicate triggers

    emergencyRef.current = true;
    setIsEmergency(true);
    setSosCount((c) => c + 1);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    speak("Emergency detected. Sounding alarm and notifying contacts.");

    try {
      await stopAlarm(); // Ruthlessly kill zombie sounds first

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
    // 1. Merge ESP32 hardware data into AI software data
    if (pendingSensorDataRef.current.distance && eventData.mode === "detect") {
      eventData.data.distance = pendingSensorDataRef.current.distance;
      eventData.data.dir = pendingSensorDataRef.current.dir;
    }

    setResponse(eventData);
    setEventCount((c) => c + 1);

    // 2. Generate Speech String
    let speech = "";
    if (eventData.mode === "detect") {
      const detections = eventData.data?.detections || [];
      const dist = eventData.data?.distance;
      const dir = eventData.data?.dir || "ahead";
      if (detections.length > 0) {
        const objNames = detections.map((d: any) => d.class).join(", ");
        speech = `${objNames}, ${dist} centimeters to your ${dir}`;
      } else if (dist) {
        speech = `Unidentified obstacle, ${dist} centimeters to your ${dir}`;
      }
    } else if (eventData.mode === "ocr") {
      speech = eventData.data?.ocr?.map((t: any) => t.text).join(", ");
    }

    // 3. Output Audio & Save to Log
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
      setHistory((prev) => [newEntry, ...prev].slice(0, 10)); // Keep last 10 entries max
    }

    // 4. Reset Sensor Ref
    pendingSensorDataRef.current = { distance: null, dir: "" };
  }, []);

  const handleImageReady = async (uri: string) => {
    setIsProcessing(true);
    try {
      const res = await sendImageToBackend(uri, modeRef.current);
      if (res) handleEvent(res);
    } catch (error) {
      console.error(error);
      speak("Backend connection failed.");
    } finally {
      setIsProcessing(false);
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

      {/* Hides the white Navigation Header */}
      <Stack.Screen options={{ headerShown: false }} />

      <Navbar connected={wsConnected} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* STATS ROW */}
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
        </View>

        {/* MAIN GRID */}
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

      {/* 🚨 FULL SCREEN SOS OVERLAY */}
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

// ─── STYLES ──────────────────────────────────────────────────────────
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

  // 🚨 OVERLAY STYLES
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
