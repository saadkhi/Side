from rest_framework.views import APIView
from rest_framework.response import Response
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

# GLOBAL MODEL — LOADED ONCE WHEN SERVER STARTS
print("Loading model... (this takes 20–40 seconds)")
base_model = AutoModelForCausalLM.from_pretrained(
    "unsloth/Phi-3-mini-4k-instruct-bnb-4bit",
    device_map="auto",
    torch_dtype=torch.bfloat16,
    trust_remote_code=True,
    load_in_4bit=True,
)
model = PeftModel.from_pretrained(base_model, "model_lora")
tokenizer = AutoTokenizer.from_pretrained("unsloth/Phi-3-mini-4k-instruct-bnb-4bit", trust_remote_code=True)
model.eval()
print("Model loaded successfully!")

class ChatView(APIView):
    def post(self, request):
        user_message = request.data.get("message", "")
        
        messages = [{"role": "user", "content": user_message}]
        inputs = tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt"
        ).to(model.device)

        outputs = model.generate(
            inputs,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            repetition_penalty=1.1,
        )

        response = tokenizer.decode(outputs[0], skip_special_tokens=False)
        response = response.split("<|assistant|>")[-1].split("<|end|>")[0].strip()

        return Response({"response": response})