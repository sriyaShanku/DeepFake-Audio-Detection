# Deepfake Audio Detection Using Machine Learning

A full-stack machine learning-based deepfake audio detection system developed to identify whether an audio sample is real or AI-generated (deepfake), addressing the growing rise of frauds, scam calls, voice impersonation, and other cyber threats caused by deepfake technology, using MFCC feature extraction, Random Forest classification, and real-time audio monitoring through WebSockets.

## 🌐 Live Demo

Try the application here:

🔗 https://realtime-deepfake-audio-detector.onrender.com

>For better experience, open the demo on a laptop or desktop browser.

## Features

- Detects real vs deepfake audio
- Supports audio file upload
- Real-time voice monitoring using WebSocket
- Confidence score for predictions
- Call Alert feature for suspicious audio
- Scan history storage and analytics dashboard
- Works in noisy and real-world environments

## Project Structure

- `frontend/`: Web interface (HTML, Tailwind CSS, JS)
- `backend/`: FastAPI backend server and API endpoints
- `model/`: Machine learning model training scripts
- `dataset/`: Training audio samples
- `database/`: SQLite database storage

## Technologies Used

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)
![Librosa](https://img.shields.io/badge/Librosa-Audio%20Processing-blueviolet?style=for-the-badge)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Random Forest](https://img.shields.io/badge/Random%20Forest-ML-green?style=for-the-badge)
![MFCC](https://img.shields.io/badge/MFCC-Feature%20Extraction-orange?style=for-the-badge)

## Machine Learning Model

The system uses a Random Forest Classifier trained on:
- MFCC Features
- Spectral Contrast
- Chroma Features
- Zero Crossing Rate

The model classifies audio as:
- Real Audio
- Deepfake Audio

## Audio Preprocessing

The following preprocessing steps are applied:
- Audio loading
- Silence trimming
- Audio normalization
- Noise handling
- Feature extraction


## System Workflow

1. User uploads audio or uses live microphone input
2. Audio is preprocessed
3. MFCC and spectral features are extracted
4. Features are passed to Random Forest model
5. System predicts Real or Deepfake
6. Confidence score and alert are displayed


## Applications

- Fraud detection
- Secure voice communication
- Fake call detection
- Telecom security
- Banking verification systems

## Conclusion

An efficient deepfake audio detection system that uses machine learning, MFCC feature extraction, and Random Forest classification to accurately identify real and AI-generated voices in both uploaded and real-time audio environments.
