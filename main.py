import ollama
import json
import os
from datetime import datetime
from engine.speech_to_text import listen_voice
from engine.text_to_speech import speak_text

LOG_PATH = "logs/history.json"


def load_history():
    if not os.path.exists(LOG_PATH):
        return {"sessions": []}
    with open(LOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_history(data):
    with open(LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def run_ai_agent():
    print("🎤 AI siap. Bicara kapan saja. Katakan 'stop' untuk keluar.")

    history_data = load_history()

    session = {
        "session_id": datetime.now().strftime("%Y-%m-%d_%H-%M-%S"),
        "conversations": []
    }

    try:
        while True:
            user_input = listen_voice()

            if not user_input:
                continue

            if user_input.lower() in ["stop", "exit", "berhenti", "keluar"]:
                print("🛑 Percakapan dihentikan oleh user.")
                break

            print(f"User: {user_input}")

            # kirim history sebagai context
            messages = []
            for conv in session["conversations"]:
                messages.append({"role": "user", "content": conv["user"]})
                messages.append({"role": "assistant", "content": conv["ai"]})

            messages.append({"role": "user", "content": user_input})

            response = ollama.chat(
                model="llama3",
                messages=messages
            )

            answer = response["message"]["content"]
            print(f"AI: {answer}")

            speak_text(answer)

            session["conversations"].append({
                "user": user_input,
                "ai": answer,
                "timestamp": datetime.now().isoformat()
            })

    except KeyboardInterrupt:
        print("\n🧠 Program dihentikan (CTRL+C)")

    history_data["sessions"].append(session)
    save_history(history_data)

    print("✅ History tersimpan di logs/history.json")


if __name__ == "__main__":
    run_ai_agent()
