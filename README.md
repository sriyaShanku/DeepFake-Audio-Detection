# Deepfake Audio Detection System

A full-stack web application that uses Machine Learning to analyze audio files (.wav / .mp3) and determine whether they contain real human speech or AI-generated synthetic (deepfake) audio.

## Project Structure
- `frontend/`: Web interface (HTML, Tailwind CSS, JS)
- `backend/`: FastAPI backend server and API endpoints
- `model/`: Machine learning model training scripts
- `dataset/`: Training audio samples
- `database/`: SQLite database storage

## Setup Instructions
1. Create a Python virtual environment: `python -m venv venv`
2. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
3. Install dependencies: `pip install -r requirements.txt`
4. Setup `.env` file from the provided layout.
5. Setup database: `cd backend` then `python -c "from database.db import Base, engine; from database.tables import *; Base.metadata.create_all(engine); print('DB created')"`
6. Start backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
7. Open frontend: Open `frontend/index.html` in your browser.
