import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export default function Navbar({ connected }: { connected: boolean }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (connected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [connected, pulseAnim]);

  return (
    <View style={styles.header}>
      <View style={styles.brandContainer}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🦯</Text>
        </View>
        <View>
          <Text style={styles.brandName}>SMART CANE</Text>
          <Text style={styles.subtext}>Mobile Dashboard</Text>
        </View>
      </View>

      <View
        style={[
          styles.statusBox,
          connected ? styles.statusConnected : styles.statusDisconnected,
        ]}
      >
        <Animated.View
          style={[
            styles.dot,
            connected ? styles.dotConnected : styles.dotDisconnected,
            { opacity: connected ? pulseAnim : 1 }, // 👈 The Heartbeat
          ]}
        />
        <Text
          style={[
            styles.statusText,
            connected ? styles.textConnected : styles.textDisconnected,
          ]}
        >
          {connected ? "CONNECTED" : "OFFLINE"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080c10",
  },
  brandContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#34d399",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 18 },
  brandName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  subtext: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    textTransform: "uppercase",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusConnected: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  statusDisconnected: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  dotConnected: { backgroundColor: "#34d399" },
  dotDisconnected: { backgroundColor: "#ef4444", shadowColor: "#ef4444" },
  statusText: { fontSize: 10, fontWeight: "bold", letterSpacing: 1 },
  textConnected: { color: "#34d399" },
  textDisconnected: { color: "#ef4444" },
});
