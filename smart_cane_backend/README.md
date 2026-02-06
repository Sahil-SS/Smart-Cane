# Smart Assistive Cane - AI Model & Backend Setup

This guide will help you build and deploy the AI model and Flask backend for your Smart Assistive Cane project.

## 📋 Overview

**What this does:**
1. **Object Detection**: YOLOv8 detects obstacles (person, chair, door, stairs, vehicle, etc.)
2. **OCR**: EasyOCR reads text (signboards, room numbers, warnings)
3. **Flask Backend**: REST API that processes images and returns results
4. **MQTT Integration**: Communicates with ESP32 and React dashboard

**Architecture:**
```
ESP32-CAM → MQTT → React Dashboard → Flask Backend (localhost:4000) → AI Models
                                                   ↓
                                            [YOLOv8 + OCR]
                                                   ↓
                                            Results back to ESP32
```

---

## 🚀 Quick Start Guide

### Step 1: Train AI Model in Google Colab

1. **Open Google Colab**: Go to [colab.research.google.com](https://colab.research.google.com)

2. **Upload the notebook**:
   - File → Upload notebook
   - Choose `smart_cane_ai_training.ipynb`

3. **Enable GPU**:
   - Runtime → Change runtime type → GPU (T4)

4. **Run all cells** (Ctrl+F9):
   - Installs YOLOv8, EasyOCR
   - Loads pretrained COCO model (80 object classes)
   - Sets up OCR for English + Hindi
   - Exports model files to Google Drive

5. **Download these files** from Google Drive:
   ```
   smart_cane_models/
   ├── yolov8n_smart_cane.pt    (AI model)
   ├── model_info.json          (metadata)
   ├── app.py                   (Flask code)
   └── requirements.txt         (dependencies)
   ```

---

### Step 2: Setup Flask Backend in VS Code

#### 2.1 Create Project Structure

```bash
smart_cane_backend/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── models/
│   ├── yolov8n_smart_cane.pt  # YOLO model
│   └── model_info.json        # Model metadata
└── README.md                  # This file
```

#### 2.2 Install Python Dependencies

```bash
# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**requirements.txt contents:**
```
flask==3.0.0
flask-cors==4.0.0
ultralytics==8.1.0
easyocr==1.7.1
opencv-python==4.9.0.80
pillow==10.2.0
numpy==1.26.3
torch==2.1.2
torchvision==0.16.2
paho-mqtt==1.6.1
```

#### 2.3 Configure MQTT Broker

In `app.py`, update MQTT settings:

```python
MQTT_BROKER = "broker.hivemq.com"  # Or your broker
MQTT_PORT = 1883
MQTT_TOPIC_ESP32_DATA = "smart_cane/esp32/data"
MQTT_TOPIC_RESULTS = "smart_cane/results"
```

**Free MQTT Brokers:**
- `broker.hivemq.com` (public)
- `test.mosquitto.org` (public)
- Or run local broker: `mosquitto -v`

#### 2.4 Run Flask Server

```bash
python app.py
```

Expected output:
```
🤖 Loading AI models...
✓ YOLO model loaded: models/yolov8n_smart_cane.pt
✓ EasyOCR loaded (English + Hindi)
✅ All models loaded successfully!

🚀 Starting Smart Assistive Cane Backend
Server: http://localhost:4000
MQTT: broker.hivemq.com:1883
```

---

## 🧪 Testing the Backend

### Test 1: Health Check

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "online",
  "timestamp": "2026-01-29T10:30:00",
  "mqtt_connected": true,
  "model_loaded": true,
  "ocr_loaded": true
}
```

### Test 2: Process Image

```python
import requests
import base64

# Read image and encode to base64
with open('test_image.jpg', 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Send to backend
response = requests.post('http://localhost:4000/process', json={
    'image': image_base64,
    'distance': 150  # Distance in cm
})

print(response.json())
```

Expected response:
```json
{
  "timestamp": "2026-01-29T10:35:00",
  "distance": 150,
  "objects": [
    {
      "object": "person",
      "confidence": 92.5,
      "distance": 150,
      "bbox": [120, 50, 450, 600]
    },
    {
      "object": "chair",
      "confidence": 87.3,
      "distance": 150,
      "bbox": [500, 200, 700, 550]
    }
  ],
  "ocr": [
    {
      "text": "EXIT",
      "confidence": 95.2,
      "bbox": [[100, 50], [200, 50], [200, 100], [100, 100]]
    }
  ],
  "summary": {
    "total_objects": 2,
    "total_text": 1,
    "primary_object": "person"
  },
  "status": "success"
}
```

### Test 3: Get Detection History

```bash
curl http://localhost:4000/history
```

### Test 4: Get Statistics

```bash
curl http://localhost:4000/stats
```

---

## 🔧 Integration with React Dashboard

### React Component Example

```javascript
import { useEffect, useState } from 'react';
import mqtt from 'mqtt';

function SmartCaneDashboard() {
  const [latestDetection, setLatestDetection] = useState(null);
  
  useEffect(() => {
    // Connect to MQTT broker
    const client = mqtt.connect('ws://broker.hivemq.com:8000/mqtt');
    
    client.on('connect', () => {
      console.log('Connected to MQTT');
      
      // Subscribe to ESP32 data
      client.subscribe('smart_cane/esp32/data');
      
      // Subscribe to AI results
      client.subscribe('smart_cane/results');
    });
    
    client.on('message', async (topic, message) => {
      const data = JSON.parse(message.toString());
      
      if (topic === 'smart_cane/esp32/data') {
        // Received data from ESP32
        console.log('ESP32 Data:', data);
        
        // Send to Flask backend
        const response = await fetch('http://localhost:4000/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        setLatestDetection(result);
        
        // Send result back to ESP32
        client.publish('smart_cane/results', JSON.stringify(result));
      }
      
      if (topic === 'smart_cane/results') {
        // Display results on dashboard
        console.log('AI Results:', data);
      }
    });
    
    return () => client.end();
  }, []);
  
  return (
    <div>
      <h1>Smart Cane Dashboard</h1>
      {latestDetection && (
        <div>
          <h2>Latest Detection</h2>
          <p>Distance: {latestDetection.distance} cm</p>
          <h3>Objects:</h3>
          <ul>
            {latestDetection.objects.map((obj, i) => (
              <li key={i}>
                {obj.object} ({obj.confidence}%)
              </li>
            ))}
          </ul>
          <h3>Text Detected:</h3>
          <ul>
            {latestDetection.ocr.map((text, i) => (
              <li key={i}>{text.text} ({text.confidence}%)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API documentation |
| `/health` | GET | Server health check |
| `/process` | POST | Process image (main endpoint) |
| `/history` | GET | Get all detections |
| `/latest` | GET | Get latest detection |
| `/stats` | GET | Get statistics |
| `/clear` | POST | Clear history |

---

## 🔍 Detected Object Classes (COCO)

YOLOv8 can detect 80 objects including:

**Common obstacles:**
- person, chair, couch, bed, dining table, door, refrigerator

**Vehicles:**
- bicycle, car, motorcycle, bus, truck, train

**Traffic:**
- traffic light, fire hydrant, stop sign, parking meter

**Animals:**
- dog, cat, bird, horse, cow

**Electronics:**
- laptop, mouse, keyboard, cell phone, tv

[Full list: 80 COCO classes]

---

## 📊 Model Performance

**YOLOv8 Nano:**
- Speed: ~2ms per image (GPU) | ~20ms (CPU)
- Accuracy: 80-95% for common objects
- Model size: ~6 MB
- Perfect for embedded systems

**EasyOCR:**
- Speed: ~100-500ms per image
- Languages: English + Hindi
- Accuracy: 85-95% for clear text

---

## 🐛 Troubleshooting

### Model not loading
```python
# In app.py, add debug:
import sys
print("Python:", sys.version)
print("PyTorch:", torch.__version__)
print("Model path exists:", os.path.exists(MODEL_PATH))
```

### MQTT not connecting
- Check broker URL is correct
- Ensure no firewall blocking port 1883
- Try public broker: `broker.hivemq.com`

### Low accuracy
- Increase confidence threshold in app.py
- Use better lighting for ESP32-CAM
- Fine-tune model with custom dataset

### Memory errors
- Reduce image size before sending
- Use YOLOv8n (not larger models)
- Close other applications

---

## 📈 Next Steps

1. **Collect custom data**: Use ESP32-CAM to capture images in your environment
2. **Fine-tune model**: Upload to Roboflow, label, retrain in Colab
3. **Add database**: Replace list with MongoDB/PostgreSQL
4. **Deploy to cloud**: Use Heroku, AWS, or Google Cloud
5. **Add authentication**: Secure API with JWT tokens
6. **Real-time alerts**: Send notifications for dangerous obstacles

---

## 📝 Custom Training (Optional)

If you want to train on your own data:

1. **Collect images** (500-1000 images)
2. **Upload to Roboflow**: https://roboflow.com
3. **Label objects** (draw bounding boxes)
4. **Export in YOLOv8 format**
5. **In Colab notebook**, uncomment training section:

```python
results = model.train(
    data='path/to/data.yaml',
    epochs=50,
    imgsz=640,
    batch=16
)
```

6. **Export trained model**
7. **Replace** `yolov8n_smart_cane.pt` with new model

---

## 🤝 Support

**Common issues:**
- Model accuracy low → Improve lighting, retrain with custom data
- MQTT not working → Check broker, firewall settings
- Flask errors → Check Python version (3.8+), dependencies

**Contact:**
For project help, check documentation or ask in comments!

---

## 📄 License

MIT License - Free to use for research and education

---

**Built with ❤️ for assistive technology**
