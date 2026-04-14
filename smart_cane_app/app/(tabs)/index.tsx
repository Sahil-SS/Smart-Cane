import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState("object");

  return (
    <ScrollView style={styles.container}>
      
      {/* 🔷 HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SMART CANE</Text>
          <Text style={styles.subtitle}>Assistive Perception Dashboard</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusText}>🔴 DISCONNECTED</Text>
        </View>
      </View>

      {/* 🔷 STATS */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>EVENTS RECEIVED</Text>
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardSub}>Total perception events</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>SOS ALERTS</Text>
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardSub}>Emergency triggers</Text>
        </View>
      </View>

      {/* 🔷 ANALYSIS MODE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ANALYSIS MODE</Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === "object" && styles.activeBtn,
            ]}
            onPress={() => setMode("object")}
          >
            <Text style={styles.toggleText}>OBJECT DETECTION</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === "ocr" && styles.activeBtn,
            ]}
            onPress={() => setMode("ocr")}
          >
            <Text style={styles.toggleText}>OCR / TEXT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.smallCard}>
            <Text style={styles.cardLabel}>OBJECT DETECTION</Text>
            <Text style={styles.greenText}>YOLOv8 Active</Text>
          </View>

          <View style={styles.smallCard}>
            <Text style={styles.cardLabel}>TEXT RECOGNITION</Text>
            <Text style={styles.cardSub}>Tesseract OCR</Text>
          </View>
        </View>
      </View>

      {/* 🔷 IMAGE UPLOAD */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>IMAGE UPLOAD</Text>

        <View style={styles.uploadBox}>
          <Text style={styles.uploadText}>
            Drag & Drop or Click to Upload
          </Text>
        </View>
      </View>

      {/* 🔷 OUTPUT PANEL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PERCEPTION OUTPUT</Text>

        <View style={styles.outputBox}>
          <Text style={styles.outputText}>
            Awaiting perception data...
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}


//Style code :

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050A14",
    padding: 15,
  },

  /* 🔷 HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    color: "#00E0FF",
    fontSize: 20,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#888",
    fontSize: 12,
  },

  statusBox: {
    backgroundColor: "#1A0A0A",
    padding: 8,
    borderRadius: 10,
  },

  statusText: {
    color: "#FF4D4D",
    fontSize: 12,
  },

  /* 🔷 ROW */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  /* 🔷 CARDS */
  card: {
    flex: 1,
    backgroundColor: "#0D1626",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  smallCard: {
    flex: 1,
    backgroundColor: "#0D1626",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  cardLabel: {
    color: "#888",
    fontSize: 11,
    marginBottom: 5,
  },

  cardValue: {
    color: "#00E0FF",
    fontSize: 24,
    fontWeight: "bold",
  },

  cardSub: {
    color: "#666",
    fontSize: 10,
  },

  greenText: {
    color: "#00FF99",
    fontSize: 12,
  },

  /* 🔷 SECTION */
  section: {
    backgroundColor: "#0A1220",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },

  sectionTitle: {
    color: "#00E0FF",
    fontSize: 12,
    marginBottom: 10,
    letterSpacing: 1,
  },

  /* 🔷 TOGGLE */
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#050A14",
    borderRadius: 10,
    padding: 5,
  },

  toggleBtn: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderRadius: 8,
  },

  activeBtn: {
    backgroundColor: "#00E0FF",
  },

  toggleText: {
    color: "#fff",
    fontSize: 12,
  },

  /* 🔷 UPLOAD */
  uploadBox: {
    height: 120,
    borderWidth: 1,
    borderColor: "#1E2A47",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  uploadText: {
    color: "#666",
  },

  /* 🔷 OUTPUT */
  outputBox: {
    height: 200,
    backgroundColor: "#050A14",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  outputText: {
    color: "#444",
  },
});