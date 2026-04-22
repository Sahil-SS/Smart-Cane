# Use a lightweight but stable Python image
FROM python:3.10-slim

# Step 1: Install system dependencies for OpenCV and EasyOCR
# We use libgl1 and libglib2.0-0 which are required for image processing
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Install Python dependencies
# We copy this first so Docker caches the installation (faster builds)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 4: Copy your application code
COPY . .

# Step 5: Expose the port your Flask app uses
EXPOSE 4000

# Step 6: Run the app using Gunicorn
# --timeout 120 gives the AI models time to process without timing out
CMD ["gunicorn", "--bind", "0.0.0.0:4000", "app:app", "--timeout", "120"]