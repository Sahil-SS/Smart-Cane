import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

export default function ResultPanel({
  response,
  isProcessing,
  history,
  onReplay,
}: {
  response: any;
  isProcessing: boolean;
  history: any[];
  onReplay: () => void;
}) {
  // 🚨 LOADING ANIMATION
  if (isProcessing) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#34d399" />
        <Text style={[styles.emptyText, { marginTop: 15, color: "#34d399" }]}>
          ANALYZING ENVIRONMENT...
        </Text>
      </View>
    );
  }

  if (!response || !response.data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>◎</Text>
        <Text style={styles.emptyText}>AWAITING PERCEPTION DATA</Text>
      </View>
    );
  }

  const { mode, data } = response;
  const detections = data.detections || [];

  return (
    <ScrollView style={styles.container} nestedScrollEnabled>
      <View style={styles.header}>
        <Text style={styles.title}>AI PERCEPTION OUTPUT</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{mode.toUpperCase()}</Text>
        </View>
      </View>

      {/* DETECT MODE */}
      {mode === "detect" && (
        <View>
          {detections.length > 0 ? (
            detections.map((d: any, i: number) => {
              const pct = (d.confidence * 100).toFixed(1);
              return (
                <View key={i} style={styles.card}>
                  <View style={styles.cardRow}>
                    <Text style={styles.classText}>{d.class}</Text>
                    <Text style={styles.confText}>{pct}%</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${parseFloat(pct)}%` as any },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noData}>No objects detected.</Text>
          )}

          {/* SENSOR DATA */}
          {(data.distance || data.dir) && (
            <View style={styles.sensorBox}>
              <View style={[styles.sensorHalf, styles.sensorHalfGreen]}>
                <Text style={styles.sensorValGreen}>{data.distance}</Text>
                <Text style={styles.sensorLabel}>CM AWAY</Text>
              </View>
              <View style={[styles.sensorHalf, styles.sensorHalfBlue]}>
                <Text style={styles.sensorValBlue}>{data.dir || "FWD"}</Text>
                <Text style={styles.sensorLabel}>DIRECTION</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* OCR MODE */}
      {mode === "ocr" && (
        <View>
          {data.ocr?.length > 0 ? (
            data.ocr.map((t: any, i: number) => (
              <View key={i} style={styles.card}>
                <Text style={styles.ocrText}>&quot;{t.text}&quot;</Text>
                <Text style={styles.ocrConf}>
                  CONFIDENCE: {(t.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noData}>No text detected.</Text>
          )}
        </View>
      )}

      {/* HISTORY LOG */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>PERCEPTION HISTORY</Text>
            <TouchableOpacity onPress={onReplay} style={styles.replayBtn}>
              <Text style={styles.replayText}>🔊 REPLAY</Text>
            </TouchableOpacity>
          </View>
          {history.map((entry: any) => (
            <View key={entry.id} style={styles.historyItem}>
              <Text style={styles.historyTime}>{entry.time}</Text>
              <Text style={styles.historyText}>{entry.text}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.8,
    minHeight: 200,
  },
  emptyIcon: { fontSize: 40, color: "#fff", marginBottom: 10 },
  emptyText: {
    color: "#fff",
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "monospace",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  badge: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  badgeText: {
    color: "#34d399",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: "monospace",
  },

  card: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  classText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "monospace",
  },
  confText: { color: "#34d399", fontSize: 12, fontFamily: "monospace" },
  barBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
  },
  barFill: { height: "100%", backgroundColor: "#34d399", borderRadius: 2 },

  sensorBox: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingTop: 15,
  },
  sensorHalf: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  sensorHalfGreen: {
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    borderColor: "rgba(52, 211, 153, 0.2)",
  },
  sensorHalfBlue: {
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderColor: "rgba(34, 211, 238, 0.2)",
  },
  sensorValGreen: {
    color: "#34d399",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  sensorValBlue: {
    color: "#22d3ee",
    fontSize: 24,
    fontWeight: "bold",
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
  sensorLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 4,
    fontFamily: "monospace",
  },

  ocrText: {
    color: "#fff",
    fontStyle: "italic",
    fontSize: 14,
    marginBottom: 6,
  },
  ocrConf: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  noData: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontStyle: "italic",
    fontFamily: "monospace",
  },

  historySection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  replayBtn: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  replayText: {
    color: "#34d399",
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  historyItem: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#22d3ee",
  },
  historyTime: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  historyText: { color: "#fff", fontSize: 12, fontFamily: "monospace" },
});
