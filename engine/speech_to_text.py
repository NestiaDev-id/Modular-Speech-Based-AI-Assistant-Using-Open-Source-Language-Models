import speech_recognition as sr


def listen_voice(language="id-ID"):
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("🎧 Mendengarkan...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)

        try:
            audio = recognizer.listen(source, timeout=5)
        except sr.WaitTimeoutError:
            print("⏳ Tidak ada suara.")
            return None

    try:
        text = recognizer.recognize_google(audio, language=language)
        return text

    except sr.UnknownValueError:
        print("❌ Suara tidak dikenali.")
        return None

    except sr.RequestError as e:
        print(f"❌ Error STT service: {e}")
        return None
