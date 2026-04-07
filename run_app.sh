#!/bin/bash
# Run Emotion Detection App

# Start backend (keep running)
echo "Starting backend server..."
cd /home/anshu/EmotionDetection-from-voice
source venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 8000 &

# Wait for backend to start
sleep 3

echo ""
echo "=== Backend running at http://localhost:8000 ==="
echo "=== Starting Expo (press 'a' for Android, 'i' for iOS) ==="
cd /home/anshu/EmotionDetection-from-voice/Frontend
npx expo start