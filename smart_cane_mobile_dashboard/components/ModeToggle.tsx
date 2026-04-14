import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ModeToggle({
  mode,
  setMode,
}: {
  mode: string;
  setMode: (m: string) => void;
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, mode === "detect" && styles.activeBtnDetect]}
        onPress={() => setMode("detect")}
      >
        <Text
          style={[
            styles.text,
            mode === "detect" ? styles.activeTextDetect : styles.inactiveText,
          ]}
        >
          ⬡ DETECT
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, mode === "ocr" && styles.activeBtnOcr]}
        onPress={() => setMode("ocr")}
      >
        <Text
          style={[
            styles.text,
            mode === "ocr" ? styles.activeTextOcr : styles.inactiveText,
          ]}
        >
          ⟁ OCR / TEXT
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 15,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBtnDetect: { backgroundColor: "rgba(52, 211, 153, 0.15)" },
  activeBtnOcr: { backgroundColor: "rgba(34, 211, 238, 0.15)" },
  text: { fontSize: 11, fontWeight: "bold", letterSpacing: 1 },
  activeTextDetect: { color: "#34d399" },
  activeTextOcr: { color: "#22d3ee" },
  inactiveText: { color: "rgba(255,255,255,0.4)" },
});
