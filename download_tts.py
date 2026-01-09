from TTS.api import TTS
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

tts.tts_to_file(
    text="Halo John! Aku Luna, asisten AI kamu. Senang bertemu denganmu.",
    speaker_wav="neuro.wav",  
    language="id",             
    file_path="output.wav"
)

print("✅ Suara berhasil digenerasi ke output.wav")
