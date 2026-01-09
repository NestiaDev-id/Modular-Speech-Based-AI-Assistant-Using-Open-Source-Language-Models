import os
from transformers import AutoTokenizer, AutoModelForCausalLM
from huggingface_hub import login
from dotenv import load_dotenv

load_dotenv()
MODEL_NAME = "meta-llama/Llama-3.1-8B"
CUSTOM_CACHE_DIR = "E:/models/llama/llama3.1-8b" 
HUGGING_FACE_API_KEY = os.getenv("HUGGING_FACE_API_KEY")

def check_and_download():
    if not os.path.exists(CUSTOM_CACHE_DIR):
        os.makedirs(CUSTOM_CACHE_DIR)
        print(f"📁 Folder baru dibuat di: {CUSTOM_CACHE_DIR}")
        
    if HUGGING_FACE_API_KEY is None:
        raise RuntimeError("❌ HUGGING_FACE_API_KEY belum diset")

    print("🔐 Login HuggingFace...")
    login(token=HUGGING_FACE_API_KEY)
    
  
    print("⬇️ Download tokenizer...")
    AutoTokenizer.from_pretrained(
        MODEL_NAME,
        cache_dir=CUSTOM_CACHE_DIR,
        token=HUGGING_FACE_API_KEY
    )

    print("⬇️ Download model (INI LAMA)...")
    AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
            cache_dir=CUSTOM_CACHE_DIR,
            torch_dtype="auto",
            device_map="auto",
            token=HUGGING_FACE_API_KEY
        )     
      
    print(f"✅ Selesai! Model tersimpan di {CUSTOM_CACHE_DIR}")
    
    # uji coba generate singkat
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, cache_dir=CUSTOM_CACHE_DIR)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, cache_dir=CUSTOM_CACHE_DIR, torch_dtype="auto", device_map="auto")
    prompt = "Halo Luna, ceritakan tentang dirimu!"
    messages = [{"role": "user", "content": prompt}]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)
    output = model.generate(**model_inputs, max_new_tokens=100)
    print(tokenizer.decode(output[0], skip_special_tokens=True))   

if __name__ == "__main__":
    check_and_download()
