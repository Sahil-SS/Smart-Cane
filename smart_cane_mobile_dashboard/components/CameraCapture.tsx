/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

interface CameraCaptureProps {
  onImageReady: (uri: string) => void;
  capturing: boolean;
  autoTrigger: number;
  /** Optional label shown in the overlay to indicate which camera source is active */
  cameraSource?: "ip" | "local" | "idle";
}

export default function CameraCapture({
  onImageReady,
  capturing,
  autoTrigger,
  cameraSource = "idle",
}: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const cameraRef = useRef<any>(null);

  // ─── LAST CAPTURED PREVIEW ───
  const [lastCapturedUri, setLastCapturedUri] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewOpacity = useRef(new Animated.Value(0)).current;

  const flashPreview = (uri: string) => {
    setLastCapturedUri(uri);
    setShowPreview(true);
    previewOpacity.setValue(1);
    // Fade out after 2.5 s
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(previewOpacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(() => setShowPreview(false));
  };

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

  const handleCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        flashPreview(photo.uri);
        onImageReady(photo.uri);
      } catch (err) {
        console.error("Local capture failed:", err);
      }
    }
  };

  // Only fire local capture when autoTrigger increments (IP cam fallback path)
  useEffect(() => {
    if (autoTrigger > 0 && cameraSource === "local") {
      handleCapture();
    }
  }, [autoTrigger, cameraSource]);

  if (!permission) return <View style={styles.container} />;

  if (cameraSource === "local" && !permission?.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.text}>Camera access needed.</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={async () => {
            const res = await requestPermission();

            if (!res.granted) {
              alert("Go to settings and enable camera permission manually");
            }
          }}
        >
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      flashPreview(uri);
      onImageReady(uri);
    }
  };

  const toggleCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // ─── Source badge config ───
  const sourceBadge = {
    ip: { label: "📡 IP CAM", color: "#22d3ee" },
    local: { label: "📷 LOCAL CAM", color: "#f59e0b" },
    idle: { label: "◉ STANDBY", color: "rgba(255,255,255,0.3)" },
  }[cameraSource];

  return (
    <View style={styles.container}>
      {cameraSource === "local" ? (
        <CameraView style={styles.camera} ref={cameraRef} facing={facing} />
      ) : (
        <View style={[styles.camera, styles.center]}>
          <Text style={{ color: "white", fontFamily: "monospace" }}>
            {cameraSource === "ip" ? "📡 Using IP Camera" : "◉ Standby"}
          </Text>
        </View>
      )}

      {/* ─── TERMINATOR OVERLAY (reticle + scan line) ─── */}
      <View style={styles.reticleContainer}>
        <View style={styles.reticleTopLeft} />
        <View style={styles.reticleTopRight} />
        <View style={styles.reticleBottomLeft} />
        <View style={styles.reticleBottomRight} />
        <Animated.View
          style={[styles.scanLine, { transform: [{ translateY: scanAnim }] }]}
        />
      </View>

      {/* ─── LAST CAPTURED PREVIEW (bottom-right thumbnail) ─── */}
      {showPreview && lastCapturedUri && (
        <Animated.View style={[styles.previewThumb, { opacity: previewOpacity }]}>
          <Image source={{ uri: lastCapturedUri }} style={styles.previewImage} />
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>✓ CAPTURED</Text>
          </View>
        </Animated.View>
      )}

      {/* ─── PROCESSING OVERLAY ─── */}
      {capturing && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>⟳ PROCESSING...</Text>
        </View>
      )}

      {/* ─── CAMERA SOURCE BADGE (top-left, replaces blank area) ─── */}
      <View style={[styles.sourceBadge, { borderColor: sourceBadge.color }]}>
        <Text style={[styles.sourceBadgeText, { color: sourceBadge.color }]}>
          {sourceBadge.label}
        </Text>
      </View>

      {/* ─── FLIP BUTTON ─── */}
      <TouchableOpacity style={styles.flipBtn} onPress={toggleCamera}>
        <Text style={styles.flipText}>🔄 FLIP</Text>
      </TouchableOpacity>

      {/* ─── CAPTURE / UPLOAD CONTROLS ─── */}
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

  // ─── RETICLE ───
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

  // ─── OVERLAYS ───
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

  // ─── SOURCE BADGE (new) ───
  sourceBadge: {
    position: "absolute",
    top: 40,
    left: 10,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.5,
    fontFamily: "monospace",
  },

  // ─── BUTTONS ───
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

  // ─── LAST CAPTURED PREVIEW ───
  previewThumb: {
    position: "absolute",
    bottom: 60,
    right: 10,
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#34d399",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(52, 211, 153, 0.85)",
    paddingVertical: 2,
    alignItems: "center",
  },
  previewBadgeText: {
    color: "#000",
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
});