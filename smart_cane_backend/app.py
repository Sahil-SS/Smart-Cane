import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image, UnidentifiedImageError
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
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    try:
        image_file = request.files["image"]
        # Enforce RGB to prevent crashes from weird image formats/transparency
        img = Image.open(image_file.stream).convert("RGB")
    except UnidentifiedImageError:
        return jsonify({"error": "Invalid image file received"}), 400

    # LOWERED CONFIDENCE: From 0.4 to 0.25 to catch objects at side angles
    # verbose=False stops console spam and speeds up execution
    results = model(img, conf=0.25, verbose=False)

    detections = []
    for r in results:
        for box in r.boxes:
            det = {
                "class": r.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist()
            }
            detections.append(det)

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

    try:
        image_file = request.files["image"]
        img = Image.open(image_file.stream).convert("RGB")
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