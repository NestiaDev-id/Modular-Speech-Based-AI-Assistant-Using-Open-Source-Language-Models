import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import time

MODEL_NAME = "meta-llama/Llama-3.1-8B" 
CACHE_DIR = "E:/models/llama/llama3.1-8b"
HF_TOKEN = ""

def run_llama_base():
    print("⏳ Memuat model ke CPU (RAM 16GB)...")
    
    start_load = time.time()
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, token=HF_TOKEN, cache_dir=CACHE_DIR)
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,
        low_cpu_mem_usage=True,
        device_map="cpu",          #
        token=HF_TOKEN,
        cache_dir=CACHE_DIR
    )

    prompt = """John: Halo Luna, apa kabar?\nLuna:"""

    inputs = tokenizer(prompt, return_tensors="pt").to("cpu")

    print("🤖 AI sedang berpikir (Ini akan lambat di CPU)...")
    outputs = model.generate(
        **inputs, 
        max_new_tokens=20, 
        do_sample=True, 
        temperature=0.7
    )
    
    print(tokenizer.decode(outputs[0], skip_special_tokens=True))

if __name__ == "__main__":
    run_llama_base()