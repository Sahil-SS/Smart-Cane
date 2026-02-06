# Smart Cane Backend

A Flask-based REST API backend for the Smart Cane project that provides object detection and OCR (Optical Character Recognition) capabilities using YOLOv8 and EasyOCR.

## Features

- **Object Detection**: Detect objects in images using YOLOv8
- **OCR (Text Recognition)**: Extract text from images using EasyOCR
- **RESTful API**: Simple HTTP endpoints for easy integration
- **CORS Enabled**: Cross-Origin Resource Sharing support for frontend integration

## Tech Stack

- **Flask**: Web framework
- **YOLOv8 (Ultralytics)**: Object detection model
- **EasyOCR**: Optical character recognition
- **PIL (Pillow)**: Image processing
- **NumPy**: Numerical operations

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Sahil-SS/Smart-Cane.git
cd Smart-Cane/smart_cane_backend
```

### 2. Create Virtual Environment

Create a virtual environment named `venv`:

**On Windows:**
```bash
python -m venv venv
```

**On macOS/Linux:**
```bash
python3 -m venv venv
```

### 3. Activate Virtual Environment

**On Windows:**
```bash
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
source venv/bin/activate
```

You should see `(venv)` prefix in your terminal, indicating the virtual environment is active.

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the Application

```bash
python app.py
```

The server will start on `http://0.0.0.0:4000`

## API Endpoints

### 1. Health Check
**Endpoint:** `GET /`

**Description:** Check if the server is running

**Response:**
```json
{
  "message": "Welcome to the Smart Cane Backend API"
}
```

### 2. Object Detection
**Endpoint:** `POST /detect`

**Description:** Detect objects in an uploaded image

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `image` (file)

**Response:**
```json
{
  "mode": "detect",
  "timestamp": 1234567890.123,
  "data": {
    "detections": [
      {
        "class": "person",
        "confidence": 0.95,
        "bbox": [[x1, y1, x2, y2]]
      }
    ]
  }
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:4000/detect \
  -F "image=@path/to/your/image.jpg"
```

### 3. OCR (Text Recognition)
**Endpoint:** `POST /ocr`

**Description:** Extract text from an uploaded image

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `image` (file)

**Response:**
```json
{
  "mode": "ocr",
  "timestamp": 1234567890.123,
  "data": {
    "ocr": [
      {
        "text": "Hello World",
        "confidence": 0.98
      }
    ]
  }
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:4000/ocr \
  -F "image=@path/to/your/image.jpg"
```

## Model Configuration

### YOLO Model
- Currently using: `yolov8n.pt` (YOLOv8 Nano - pretrained)
- Confidence threshold: 0.4
- To use a custom fine-tuned model, replace `yolov8n.pt` with your `best.pt` model in the code

### OCR Model
- Language: English (`'en'`)
- GPU: Disabled (set to `False`)
- To enable GPU, change `gpu=False` to `gpu=True` in the code

## Deactivating Virtual Environment

When you're done working, deactivate the virtual environment:

```bash
deactivate
```

## Project Structure

```
smart_cane_backend/
│
├── app.py              # Main Flask application
├── venv/               # Virtual environment (created after setup)
├── requirements.txt    # Python dependencies (if available)
└── README.md          # This file
```

## Troubleshooting

### Port Already in Use
If port 4000 is already in use, change it in `app.py`:
```python
app.run(host="0.0.0.0", port=5000, debug=True)  # Change 4000 to 5000
```

### GPU Issues with EasyOCR
If you encounter GPU-related errors, ensure `gpu=False` in the code:
```python
ocr_reader = easyocr.Reader(['en'], gpu=False)
```

### Missing Dependencies
Install individual packages if needed:
```bash
pip install flask
pip install flask-cors
pip install ultralytics
pip install pillow
pip install easyocr
pip install numpy
```

## Testing the Endpoints

### Method 1: Using Postman (Recommended for Beginners)

#### Step 1: Download and Install Postman
- Download from: https://www.postman.com/downloads/
- Install and create a free account (optional but recommended)

#### Step 2: Test Health Check Endpoint

1. Open Postman
2. Click "New" → "HTTP Request"
3. Set method to: `GET`
4. Enter URL: `http://localhost:4000/`
5. Click "Send"

**Expected Response:**
```json
{
  "message": "Welcome to the Smart Cane Backend API"
}
```

#### Step 3: Test Object Detection Endpoint

1. Create a new request
2. Set method to: `POST`
3. Enter URL: `http://localhost:4000/detect`
4. Go to "Body" tab
5. Select "form-data"
6. In the KEY column, enter: `image`
7. Hover over the KEY and change type from "Text" to "File" (click the dropdown)
8. In the VALUE column, click "Select Files" and choose an image file
9. Click "Send"

**Expected Response:**
```json
{
  "mode": "detect",
  "timestamp": 1234567890.123,
  "data": {
    "detections": [
      {
        "class": "person",
        "confidence": 0.95,
        "bbox": [[x1, y1, x2, y2]]
      }
    ]
  }
}
```

#### Step 4: Test OCR Endpoint

1. Create a new request
2. Set method to: `POST`
3. Enter URL: `http://localhost:4000/ocr`
4. Go to "Body" tab
5. Select "form-data"
6. In the KEY column, enter: `image`
7. Change type to "File"
8. In the VALUE column, select an image containing text
9. Click "Send"

**Expected Response:**
```json
{
  "mode": "ocr",
  "timestamp": 1234567890.123,
  "data": {
    "ocr": [
      {
        "text": "Hello World",
        "confidence": 0.98
      }
    ]
  }
}
```

**Tips for Postman:**
- Save your requests in a Collection for easy reuse
- Use the "Save" button to organize your API tests
- Check the "Status" code (should be 200 OK for successful requests)


**Note:** Make sure to keep your virtual environment activated while working on the project. Always use `venv` as the name for your virtual environment to maintain consistency across the team.