import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image, UnidentifiedImageError
import requests
from io import BytesIO
import easyocr
import numpy as np

app = Flask(__name__)
CORS(app)

print("Loading AI Models...")
# Load YOLO model
model = YOLO("yolov8n.pt", task="detect")

# Load OCR model 
# TIP: If your computer has an NVIDIA GPU, change gpu=False to gpu=True for a massive speed boost.
ocr_reader = easyocr.Reader(['en'], gpu=False)

# ─── MODEL WARM-UP ───
# Run a dummy inference to prevent lag on the very first real detection
print("Warming up models...")
dummy_img = Image.new('RGB', (640, 640), color='white')
model(dummy_img, verbose=False)
ocr_reader.readtext(np.array(dummy_img))
print("Models ready and listening!")

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
    try:
        # ─── CASE 1: IP CAMERA (JSON with URL) ───
        if request.is_json:
            image_url = request.json.get("image_url")

            if not image_url:
                return jsonify({"error": "No image_url provided"}), 400

            try:
                response = requests.get(image_url, timeout=3)
                img = Image.open(BytesIO(response.content)).convert("RGB")
            except Exception as e:
                return jsonify({"error": f"Failed to fetch image: {str(e)}"}), 400

        # ─── CASE 2: LOCAL CAMERA (file upload) ───
        elif "image" in request.files:
            image_file = request.files["image"]
            img = Image.open(image_file.stream).convert("RGB")

        else:
            return jsonify({"error": "No image provided"}), 400

    except UnidentifiedImageError:
        return jsonify({"error": "Invalid image file received"}), 400

    # ─── YOLO DETECTION ───
    results = model(img, conf=0.25, verbose=False)

    detections = []
    for r in results:
        for box in r.boxes:
            detections.append({
                "class": r.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist()
            })

    return jsonify({
        "mode": "detect",
        "timestamp": time.time(),
        "data": {
            "detections": detections
        }
    })

@app.route("/ocr", methods=["POST"])
def ocr():
    try:
        # ─── CASE 1: IP CAMERA ───
        if request.is_json:
            image_url = request.json.get("image_url")

            if not image_url:
                return jsonify({"error": "No image_url provided"}), 400

            try:
                response = requests.get(image_url, timeout=3)
                img = Image.open(BytesIO(response.content)).convert("RGB")
            except Exception as e:
                return jsonify({"error": f"Failed to fetch image: {str(e)}"}), 400

        # ─── CASE 2: LOCAL FILE ───
        elif "image" in request.files:
            image_file = request.files["image"]
            img = Image.open(image_file.stream).convert("RGB")

        else:
            return jsonify({"error": "No image provided"}), 400

    except UnidentifiedImageError:
        return jsonify({"error": "Invalid image file received"}), 400

    text_results = run_ocr(img)

    return jsonify({
        "mode": "ocr",
        "timestamp": time.time(),
        "data": { "ocr": text_results }
    })

if __name__ == "__main__":
    # debug=False is better for performance when testing
    app.run(host="0.0.0.0", port=4000, debug=False)