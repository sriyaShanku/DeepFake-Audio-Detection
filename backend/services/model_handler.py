import os
import joblib
import numpy as np
from dotenv import load_dotenv

load_dotenv()

# Resolve paths relative to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BACKEND_DIR, "..", "model", "deepfake_model.pkl"))
SCALER_PATH = os.getenv("SCALER_PATH", os.path.join(BACKEND_DIR, "..", "model", "scaler.pkl"))

# Initialize globals
model = None
scaler = None

def load_ml_model():
    global model, scaler
    try:
        # Resolve to absolute paths
        model_path = os.path.abspath(MODEL_PATH)
        scaler_path = os.path.abspath(SCALER_PATH)
        
        print(f"Looking for model at: {model_path}")
        print(f"Looking for scaler at: {scaler_path}")
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            print(f"✅ Model loaded successfully from {model_path}")
            
            # Validate the model has the expected methods
            if not hasattr(model, 'predict'):
                print("⚠️ WARNING: Loaded model doesn't have predict method!")
                model = None
                scaler = None
                return False
            
            return True
        else:
            if not os.path.exists(model_path):
                print(f"❌ Model file not found: {model_path}")
            if not os.path.exists(scaler_path):
                print(f"❌ Scaler file not found: {scaler_path}")
            print("Prediction won't work until model is trained. Run: cd model && python train_model.py")
            return False
    except Exception as e:
        print(f"❌ Error loading ML model: {e}")
        model = None
        scaler = None
        return False

# Attempt to load right away
model_loaded = load_ml_model()

def is_model_loaded():
    return model is not None and scaler is not None

def predict_audio(features_array):
    global model, scaler
    if not is_model_loaded():
        # Try loading one more time in case files were added after startup
        if not load_ml_model():
            raise RuntimeError("ML Model is not loaded. Please train the model first: cd model && python train_model.py")
        
    features_scaled = scaler.transform([features_array])
    
    # Predict using probability threshold
    # The training data is very small (14 files). High threshold (0.82) blocked 
    # false positives for Real voices, but also blocked actual AI voices like ChatGPT.
    # Lowering it to 0.65 to strike a better balance.
    FAKE_THRESHOLD = 0.65  
    
    if hasattr(model, "predict_proba"):
        probability = model.predict_proba(features_scaled)[0]
        prob_real = probability[0]
        prob_fake = probability[1]
        
        if prob_fake >= FAKE_THRESHOLD:
            prediction = 1 # Fake
            confidence = prob_fake * 100
        else:
            prediction = 0 # Real
            # Recalculate confidence for Real so it ranges nicely between 50-100%
            # If prob_fake was 0.74, prob_real is 0.26. But since we predicted Real, 
            # we scale it so confidence makes sense to the user.
            # Normalizing it: (FAKE_THRESHOLD - prob_fake) / FAKE_THRESHOLD * 50 + 50
            confidence = ((FAKE_THRESHOLD - prob_fake) / FAKE_THRESHOLD) * 50 + 50
            if confidence < 50: confidence = 50.1
    else:
        prediction = model.predict(features_scaled)[0]
        confidence = 100.0
        
    result_text = "Deepfake Audio" if prediction == 1 else "Real Audio"
    
    # Calculate risk level
    if prediction == 1:
        if confidence > 85:
            risk_level = "HIGH"
        elif confidence > 60:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
    else:
        risk_level = "LOW"
            
    return result_text, round(confidence, 2), risk_level
