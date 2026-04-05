"""
Speech Emotion Recognition — FastAPI backend
Run with:  uvicorn api.main:app --reload
Swagger UI: http://localhost:8000/docs
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.predict import router as predict_router
from api.routes.models import router as models_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)

app = FastAPI(
    title="Speech Emotion Recognition API",
    description=(
        "Multi-model Speech Emotion Recognition (SER) API.\n\n"
        "Supports 8 pre-trained models trained on RAVDESS, CREMA-D, and SAVEE datasets.\n\n"
        "**Usage:**\n"
        "- Upload an audio file to `POST /predict-emotion`\n"
        "- Or omit the file to let the API pick a random dataset sample\n"
        "- Use the `model` field to select which model to run\n\n"
        "**Available models:** anshu_cnn_lstm_attention (default), anshu_cnn_lstm, "
        "anshu_cnn, anshu_random_forest, arpit_cnn_lstm, durgesh_svm, keshav_rnn, shantam_ensemble"
    ),
    version="1.0.0",
    contact={
        "name": "SER Project Team",
    },
    license_info={"name": "MIT"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(models_router)


@app.get("/", tags=["Health"], summary="Health check")
def root():
    return {"status": "ok", "message": "Speech Emotion Recognition API is running."}


@app.get("/health", tags=["Health"], summary="Health check")
def health():
    return {"status": "ok"}
