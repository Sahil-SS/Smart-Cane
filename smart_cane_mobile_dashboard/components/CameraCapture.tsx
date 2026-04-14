/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

export default function CameraCapture({
  onImageReady,
  capturing,
  autoTrigger,
}: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const cameraRef = useRef<any>(null);

  // ─── SCANNING ANIMATION ───
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 280,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (autoTrigger > 0) handleCapture();
  }, [autoTrigger]);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.text}>Camera access needed.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        onImageReady(photo.uri);
      } catch (err) {}
    }
  };

  const handleUpload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) onImageReady(result.assets[0].uri);
  };

  const toggleCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing={facing} />

      {/* 🚨 THE TERMINATOR OVERLAY */}
      <View style={styles.reticleContainer}>
        <View style={styles.reticleTopLeft} />
        <View style={styles.reticleTopRight} />
        <View style={styles.reticleBottomLeft} />
        <View style={styles.reticleBottomRight} />
        <Animated.View
          style={[styles.scanLine, { transform: [{ translateY: scanAnim }] }]}
        />
      </View>

      {capturing && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>⟳ PROCESSING...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.flipBtn} onPress={toggleCamera}>
        <Text style={styles.flipText}>🔄 FLIP</Text>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.uploadBtn]}
          onPress={handleUpload}
        >
          <Text style={styles.uploadText}>⬆ UPLOAD</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.captureBtn]}
          onPress={handleCapture}
        >
          <Text style={styles.captureText}>⦿ CAPTURE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  center: { justifyContent: "center", alignItems: "center" },
  text: {
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
    fontFamily: "monospace",
  },
  btn: { backgroundColor: "#34d399", padding: 10, borderRadius: 5 },
  btnText: { color: "#000", fontWeight: "bold", fontFamily: "monospace" },
  camera: { flex: 1 },

  // 🚨 UI Upgrades
  reticleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  reticleTopLeft: {
    position: "absolute",
    top: 40,
    left: 40,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.5)",
  },
  reticleTopRight: {
    position: "absolute",
    top: 40,
    right: 40,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.5)",
  },
  reticleBottomLeft: {
    position: "absolute",
    bottom: 80,
    left: 40,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.5)",
  },
  reticleBottomRight: {
    position: "absolute",
    bottom: 80,
    right: 40,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.5)",
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(52, 211, 153, 0.8)",
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },

  overlay: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(139, 92, 246, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  overlayText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  flipBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  flipText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  controls: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(10px)",
  },
  uploadBtn: { borderColor: "rgba(34, 211, 238, 0.3)" },
  uploadText: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  captureBtn: { borderColor: "rgba(239, 68, 68, 0.5)" },
  captureText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
});
