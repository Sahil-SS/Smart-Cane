import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
import easyocr
import numpy as np

app = Flask(__name__)
CORS(app)

# Load YOLO model
model = YOLO("yolov8n.pt", task="detect")

# Load OCR model
ocr_reader = easyocr.Reader(['en'], gpu=False)

def run_ocr(pil_image):
    img_np = np.array(pil_image)
    results = ocr_reader.readtext(img_np)
    texts = []
    for (bbox, text, conf) in results:
        texts.append({
            "text": text,
            "confidence": float(conf)
        })
    return texts

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Smart Cane Backend Active"})

@app.route("/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]
    img = Image.open(image_file.stream)

    # LOWERED CONFIDENCE: From 0.4 to 0.25 to catch objects at side angles
    results = model(img, conf=0.25)

    detections = []
    for r in results:
        for box in r.boxes:
            det = {
                "class": r.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist()
            }
            detections.append(det)
            print(f"Detected: {det['class']} ({det['confidence']:.2f})")

    return jsonify({
        "mode": "detect",
        "timestamp": time.time(),
        "data": {
            "detections": detections
        }
    })

@app.route("/ocr", methods=["POST"])
def ocr():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]
    img = Image.open(image_file.stream)
    text_results = run_ocr(img)

    return jsonify({
        "mode": "ocr",
        "timestamp": time.time(),
        "data": { "ocr": text_results }
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000, debug=True)