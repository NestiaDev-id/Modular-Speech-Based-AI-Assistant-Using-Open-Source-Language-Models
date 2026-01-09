import pyttsx3
import os
from datetime import datetime


engine = pyttsx3.init()
engine.setProperty("rate", 170)
engine.setProperty("volume", 1.0)

AUDIO_DIR = "data/audio_output"
os.makedirs(AUDIO_DIR, exist_ok=True)


def speak_text(text: str, session_id: str = None, turn: int = None):
    if not text:
        return None

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"tts_{timestamp}.wav"

    if session_id is not None and turn is not None:
        filename = f"{session_id}_turn_{turn}.wav"

    filepath = os.path.join(AUDIO_DIR, filename)

    # Simpan audio
    engine.save_to_file(text, filepath)
    engine.runAndWait()

    # Play audio
    engine.say(text)
    engine.runAndWait()

    return filepath
