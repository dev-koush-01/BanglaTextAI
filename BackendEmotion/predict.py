from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import os
from googletrans import Translator
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",  # Allow all origins for testing
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"]
    }
})

# Add a test route to verify server is running
@app.route('/')
def home():
    return jsonify({"message": "Flask server is running"})

# Add camera initialization function
def init_camera():
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("Error: Could not open webcam")
        return None
    return camera

video_capture = init_camera()

@app.before_request
def check_camera():
    global video_capture
    if video_capture is None or not video_capture.isOpened():
        video_capture = init_camera()

# Load emotion detection model
model_path = "model_inference/best_model.h5"
if os.path.exists(model_path):
    emotion_model = load_model(model_path)
else:
    emotion_model = load_model("model_inference/my_model.h5")

# Emotion labels
emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

# Preprocess face function
def preprocess_face(face):
    face = cv2.resize(face, (48, 48))
    face = cv2.equalizeHist(face)
    face = face.astype('float32') / 255.0
    return face.reshape(1, 48, 48, 1)

# Function to generate frames for live detection
def generate_frames():
    while True:
        success, frame = video_capture.read()
        if not success:
            break

        # Face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        # Process each face
        for (x, y, w, h) in faces:
            # Draw face rectangle
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            # Extract and preprocess face
            face_roi = gray_frame[y:y+h, x:x+w]
            preprocessed_face = preprocess_face(face_roi)
            
            # Predict emotion
            prediction = emotion_model.predict(preprocessed_face)[0]
            emotion_label = emotions[np.argmax(prediction)]
            
            # Display emotion text
            cv2.putText(frame, emotion_label, (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, 
                       (0, 255, 0), 2)

        # Encode frame
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# Route for live video feed
@app.route('/video_feed')
def video_feed():
    if video_capture is None or not video_capture.isOpened():
        return jsonify({"error": "Camera not available"}), 500
    return Response(generate_frames(), 
                   mimetype='multipart/x-mixed-replace; boundary=frame')

# Route for detection results (JSON response)
@app.route('/detection_results', methods=['GET'])
def detection_results():
    success, frame = video_capture.read()
    if not success:
        return jsonify({"error": "Unable to access video feed"})

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    results = []
    for (x, y, w, h) in faces:
        face_roi = gray_frame[y:y+h, x:x+w]
        preprocessed_face = preprocess_face(face_roi)
        prediction = emotion_model.predict(preprocessed_face)[0]
        emotion_label = emotions[np.argmax(prediction)]
        
        results.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "emotion": emotion_label
        })

    return jsonify({"detections": results})

# Initialize the translator
translator = Translator()

# Add translation endpoint
@app.route('/translate', methods=['POST'])
def translate_text_endpoint():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Missing text in request'
            }), 400
            
        text = data.get('text', '').strip()
        direction = data.get('direction', 'en2bn')
        
        if not text:
            return jsonify({
                'status': 'error',
                'message': 'Empty text provided'
            }), 400
            
        if direction not in ['en2bn', 'bn2en']:
            return jsonify({
                'status': 'error',
                'message': f'Invalid direction: {direction}'
            }), 400
            
        result = translate_text(text, direction)
        
        if result['status'] == 'error':
            return jsonify(result), 500
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Translation endpoint error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Translation service temporarily unavailable'
        }), 500

# Initialize the translator with multiple fallback URLs
TRANSLATE_URLS = [
    'translate.google.com',
    'translate.googleapis.com',
    'clients5.google.com',
    'translate.google.co.in'
]

def translate_text(text: str, direction: str) -> dict:
    for service_url in TRANSLATE_URLS:
        try:
            # Initialize translator with current service URL
            translator = Translator(service_urls=[service_url])
            cleaned_text = text.strip()
            
            try:
                if direction == 'en2bn':
                    result = translator.translate(cleaned_text, src='en', dest='bn')
                else:  # bn2en
                    result = translator.translate(cleaned_text, src='bn', dest='en')
                
                if result and result.text:
                    translated_text = result.text.strip()
                    logger.debug(f"Translation successful using {service_url}")
                    logger.debug(f"Original: {cleaned_text}")
                    logger.debug(f"Translated: {translated_text}")
                    
                    return {
                        'status': 'success',
                        'original': cleaned_text,
                        'translated': translated_text,
                        'direction': direction,
                        'service': service_url
                    }
            except Exception as translation_error:
                logger.error(f"Error with {service_url}: {str(translation_error)}")
                continue
                
        except Exception as service_error:
            logger.error(f"Service error with {service_url}: {str(service_error)}")
            continue
            
    # If all URLs fail, raise error
    return {
        'status': 'error',
        'message': 'All translation services failed',
        'original': text
    }

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)  # Changed port to 5001