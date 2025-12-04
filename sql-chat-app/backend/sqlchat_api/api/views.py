# backend/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os

# Load model ONCE when Django starts
def load_model():
    print("Loading SQL Chat model (this runs only once)...")
    base_model_name = "unsloth/Phi-3-mini-4k-instruct-bnb-4bit"
    
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        device_map="auto",
        torch_dtype=torch.bfloat16,
        load_in_4bit=True,
        trust_remote_code=True,
    )
    
    # Path to your LoRA files
    lora_path = os.path.join(settings.BASE_DIR, "model")
    model = PeftModel.from_pretrained(base_model, lora_path)
    
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    
    model.eval()
    return model, tokenizer

# Global variables (loaded once)
print("Starting model load...")
MODEL, TOKENIZER = load_model()
print("Model loaded successfully!")

class ChatView(APIView):
    def post(self, request):
        user_message = request.data.get("message", "").strip()
        if not user_message:
            return Response({"error": "Message required"}, status=400)

        messages = [{"role": "user", "content": user_message}]
        
        inputs = TOKENIZER.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt"
        ).to(MODEL.device)

        outputs = MODEL.generate(
            inputs,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            repetition_penalty=1.1,
        )

        response = TOKENIZER.decode(outputs[0], skip_special_tokens=False)
        clean_response = response.split("<|assistant|>")[-1].split("<|end|>")[0].strip()

        return Response({"response": clean_response})