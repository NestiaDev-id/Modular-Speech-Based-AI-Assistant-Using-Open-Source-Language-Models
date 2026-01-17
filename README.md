# Voice Assistant - Luna AI

Asisten suara modular berbasis Qwen LLM dengan fitur voice cloning.

## Arsitektur

```
┌───────────────┐
│     USER      │
│  Voice / Text │
└───────┬───────┘
        │
        ▼
┌────────────────────┐
│  Input Interface   │  ← src/input_interface/
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   Input Handler    │  ← src/input_handler/
└───────┬───────┬────┘
        │       │
        ▼       ▼
┌────────────────┐  ┌──────────────────┐
│ STT Engine     │  │  Text Normalizer │  ← src/stt/, src/text_processor/
└───────┬────────┘  └────────┬─────────┘
        │                    │
        └──────────┬─────────┘
                   ▼
        ┌──────────────────────┐
        │       LLM Core       │  ← src/llm_core/
        │  - Qwen 2.5 1.5B     │
        └─────────┬────────────┘
                  │
          ┌───────┴─────────────┐
          │ Output Decision     │  ← src/output_decision/
          └───────┬─────────────┘
                  │
        ┌─────────┴─────────┐
        │ TTS + Voice Clone │  ← src/tts/
        └─────────┬─────────┘
                  │
                  ▼
┌──────────────────────────┐
│     Output Interface     │  ← src/output_interface/
└──────────────────────────┘
```

## Struktur Folder

```
teks_to_speach/
├── src/
│   ├── input_interface/     # Mic & Text input
│   ├── input_handler/       # Mode detection, validation
│   ├── stt/                 # Speech-to-Text
│   ├── text_processor/      # Text normalization
│   ├── llm_core/            # LLM dengan Qwen
│   ├── output_decision/     # Voice/Text routing
│   ├── tts/                 # TTS + Voice Cloning
│   └── output_interface/    # Speaker, display
├── config/
│   ├── settings.py          # Konfigurasi
│   └── prompts/             # System prompts
├── data/
│   ├── 8000/                # Voice samples 8kHz
│   ├── 16000/               # Voice samples 16kHz
│   ├── 44100/               # Voice samples 44.1kHz
│   └── 48000/               # Voice samples 48kHz
├── storage/
│   ├── audio_outputs/       # Output audio
│   └── logs/                # Session logs
└── main.py                  # Entry point
```

## Instalasi

```bash
# Install dependencies
pip install -r requirements.txt
```

## Penggunaan

### Mode Suara (Default)
```bash
python main.py
```

### Mode Text (Keyboard)
```bash
python main.py text
```

### Mode Voice Cloning
```bash
python main.py voice-clone
```

## Konfigurasi

Edit `config/settings.py` atau gunakan environment variables:

```env
LLM_MODEL_PATH=E:/models/qwen/qwen2.5-1.5b-instruct
LLM_DEVICE=cpu
STT_LANGUAGE=id-ID
TTS_RATE=170
TTS_VOLUME=1.0
```

## Voice Cloning

Simpan sample audio ke folder `data/`:
- `data/16000/` - Sample rate 16kHz (recommended)
- `data/44100/` - Sample rate 44.1kHz
- Format: WAV, MP3, FLAC

## Commands

- `stop`, `exit`, `keluar`, `berhenti` - Keluar dari program
- Bicara natural dalam Bahasa Indonesia
