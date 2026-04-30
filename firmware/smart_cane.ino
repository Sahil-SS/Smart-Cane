#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h> 

// ---------------- WIFI + MQTT ----------------
const char* ssid = "moto g62 5G_1312"; 
const char* password = "sahil1234";
const char* mqtt_server = "10.77.21.250"; 

WiFiClient espClient;
PubSubClient client(espClient);
Servo myservo; 

// ---------------- PINS ----------------
#define TRIG_L 5  
#define ECHO_L 18
#define TRIG_C 17
#define ECHO_C 16
#define TRIG_R 4  
#define ECHO_R 19
#define SERVO_PIN 13 

#define SOS_BUTTON_PIN 14  
#define RED_LED_PIN 22     

// 🆕 NEW LEDS
#define WIFI_LED_PIN 25       // Green LED → lights up when WiFi connected
#define DETECT_LED_PIN 26     // Blue LED → lights up when system is ready to detect

// ---------------- CONFIG ----------------
const int DIST_THRESHOLD = 20; 
const unsigned long RESET_TIMEOUT = 7000;   

// ---------------- STATE ----------------
int lockedSensor = 0;
unsigned long cooldownStart = 0;
bool isCoolingDown = false;
bool isSOSActive = false;   // 🆕 NEW STATE

// ---------------- FUNCTION: DISTANCE ----------------
float getDistance(int trig, int echo) {
  digitalWrite(trig, LOW); delayMicroseconds(2);
  digitalWrite(trig, HIGH); delayMicroseconds(10);
  digitalWrite(trig, LOW);

  long duration = pulseIn(echo, HIGH, 30000);
  float d = duration * 0.034 / 2;

  return (d <= 0 || d > 400) ? 400.0 : d;
}

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);

  pinMode(TRIG_L, OUTPUT); pinMode(ECHO_L, INPUT);
  pinMode(TRIG_C, OUTPUT); pinMode(ECHO_C, INPUT);
  pinMode(TRIG_R, OUTPUT); pinMode(ECHO_R, INPUT);

  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(RED_LED_PIN, OUTPUT);

  // 🆕 NEW LED PINS INIT
  pinMode(WIFI_LED_PIN, OUTPUT);
  pinMode(DETECT_LED_PIN, OUTPUT);
  digitalWrite(WIFI_LED_PIN, LOW);    // Off until WiFi connects
  digitalWrite(DETECT_LED_PIN, LOW);  // Off until system is ready

  ESP32PWM::allocateTimer(0);
  myservo.setPeriodHertz(50);
  myservo.attach(SERVO_PIN, 500, 2400);
  myservo.write(90); 

  Serial.println("\n[BOOT] Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[BOOT] WiFi Connected ✅");
  Serial.print("[BOOT] IP Address: ");
  Serial.println(WiFi.localIP());

  // 🆕 WiFi connected → turn on WiFi LED
  digitalWrite(WIFI_LED_PIN, HIGH);

  client.setServer(mqtt_server, 1883);

  Serial.println("[BOOT] System Ready 🚀");

  // 🆕 System ready to detect → turn on Detection LED
  digitalWrite(DETECT_LED_PIN, HIGH);
}

// ---------------- MQTT RECONNECT ----------------
void reconnect() {
  while (!client.connected()) {
    Serial.print("[MQTT] Connecting to broker...");
    
    if (client.connect("ESP32_SmartCane_Sahil")) {
      Serial.println("Connected ✅ (Node-RED Ready)");
    } else {
      Serial.print("Failed ❌, rc=");
      Serial.print(client.state());
      Serial.println(" → Retrying in 5 sec");
      delay(5000);
    }
  }
}

// ---------------- MAIN LOOP ----------------
void loop() {

  if (!client.connected()) reconnect();
  client.loop();

  // =========================
  // 🚨 SOS CHECK (HIGH PRIORITY)
  // =========================
  if (digitalRead(SOS_BUTTON_PIN) == LOW) {

    if (!isSOSActive) {   // Trigger only once
      isSOSActive = true;

      Serial.println("\n🚨 [SOS MODE ACTIVATED]");

      // Stop everything
      isCoolingDown = false;
      lockedSensor = 0;
      myservo.write(90);

      // 🆕 Turn off detection LED during SOS
      digitalWrite(DETECT_LED_PIN, LOW);

      // Blink LED
      for(int i=0; i<5; i++) {
        digitalWrite(RED_LED_PIN, HIGH); delay(100);
        digitalWrite(RED_LED_PIN, LOW); delay(100);
      }

      String sosPayload = "{\"event\":\"SOS\", \"status\":\"active\"}";
      
      if (client.publish("esp32/sensors", sosPayload.c_str())) {
        Serial.println("[MQTT] SOS sent successfully ✅");
      } else {
        Serial.println("[MQTT] SOS send failed ❌");
      }
    }
  }

  // =========================
  // 🛑 SOS MODE → STOP EVERYTHING
  // =========================
  if (isSOSActive) {
    Serial.println("[SOS MODE] Detection paused...");
    delay(1000);
    return;  // 🔥 HARD STOP
  }

  // =========================
  // ❄️ COOLDOWN MODE
  // =========================
  if (isCoolingDown) {
    Serial.println("[COOLDOWN] Waiting...");

    if (millis() - cooldownStart >= RESET_TIMEOUT) {
      Serial.println("[RESET] Cooldown complete → Back to scanning");

      isCoolingDown = false;
      lockedSensor = 0;
      myservo.write(90);

      // 🆕 Cooldown done → system ready again → turn detection LED back ON
      digitalWrite(DETECT_LED_PIN, HIGH);
    }

    delay(500);
    return;
  }

  // =========================
  // 🟢 SEARCH MODE
  // =========================
  float l = getDistance(TRIG_L, ECHO_L);
  float c = getDistance(TRIG_C, ECHO_C);
  float r = getDistance(TRIG_R, ECHO_R);

  Serial.printf("[SENSORS] L: %.2f cm | C: %.2f cm | R: %.2f cm\n", l, c, r);

  String dir = "";
  float dist = 0;

  if (l < DIST_THRESHOLD) {
    lockedSensor = 1;
    dir = "Left";
    dist = l;
    delay(80);
    myservo.write(120);
  } 
  else if (c < DIST_THRESHOLD) {
    lockedSensor = 2;
    dir = "Center";
    dist = c;
    delay(80);
    myservo.write(90);
  } 
  else if (r < DIST_THRESHOLD) {
    lockedSensor = 3;
    dir = "Right";
    dist = r;
    delay(80);
    myservo.write(60);
  }

  // =========================
  // 🎯 DETECT ONCE
  // =========================
  if (lockedSensor != 0) {

    Serial.println("\n🎯 [DETECTED] Object Found!");
    Serial.printf("Direction: %s | Distance: %.2f cm\n", dir.c_str(), dist);

    String payload = "{\"trigger\":true, \"distance\":" + String(dist) + ", \"dir\":\"" + dir + "\"}";

    if (client.publish("esp32/sensors", payload.c_str())) {
      Serial.println("[MQTT] Data sent successfully ✅");
    } else {
      Serial.println("[MQTT] Data send failed ❌");
    }

    // 🆕 Object detected → entering cooldown → turn detection LED OFF
    digitalWrite(DETECT_LED_PIN, LOW);

    isCoolingDown = true;
    cooldownStart = millis();

    Serial.println("[COOLDOWN] Started 7 sec pause...");
  }

  delay(300);
}