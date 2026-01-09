import torch
import time
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
CACHE_DIR = "E:/models/qwen/qwen2.5-3b-instruct"

def run_qwen_fast():
    print("⏳ [1/2] Memuat Qwen 3B ke RAM (CPU Mode)...")
    start_load = time.time()
    
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, cache_dir=CACHE_DIR)
    
    # Memuat model 3B jauh lebih cepat dan irit RAM
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype="auto", 
        low_cpu_mem_usage=True,
        device_map="cpu", # Paksa ke CPU karena tidak ada GPU NVIDIA
        cache_dir=CACHE_DIR
    )
    
    end_load = time.time()
    print(f"✅ Model dimuat dalam: {end_load - start_load:.2f} detik")

    # Siapkan Prompt
    prompt = "Halo Luna, siapa penciptamu? Jawab dalam satu kalimat pendek saja."
    
    # Format chat khusus Qwen
    messages = [
        {"role": "system", "content": "Kamu adalah Luna, AI Vtuber yang lucu dan sangat responsif."},
        {"role": "user", "content": prompt}
    ]

    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    model_inputs = tokenizer([text], return_tensors="pt").to("cpu")

    print(f"\n🚀 [2/2] Luna sedang berpikir...")
    start_gen = time.time()
    
    generated_ids = model.generate(
        **model_inputs,
        max_new_tokens=50, 
        do_sample=True,
        temperature=0.7,
        pad_token_id=tokenizer.eos_token_id
    )
    
    response_ids = [
        output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]
    response = tokenizer.batch_decode(response_ids, skip_special_tokens=True)[0]
    
    end_gen = time.time()
    
    duration = end_gen - start_gen
    tps = len(response.split()) / duration

    print("\n" + "="*40)
    print(f"Luna: {response}")
    print("="*40)
    print(f"⏱️ Waktu Respon: {duration:.2f} detik")
    print(f"⚡ Estimasi Kecepatan: {tps:.2f} kata/detik")
    print("="*40)

if __name__ == "__main__":
    run_qwen_fast()
