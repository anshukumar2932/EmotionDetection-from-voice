#!/bin/bash
# Run both backend and frontend

echo "=== Starting Backend Server ==="
cd /home/anshu/EmotionDetection-from-voice
source venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 8000