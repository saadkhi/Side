import gradio as gr
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

# Load model ONCE at startup (your exact setup)
base_model_name = "unsloth/Phi-3-mini-4k-instruct-bnb-4bit"
base_model = AutoModelForCausalLM.from_pretrained(
    base_model_name,
    device_map="auto",
    torch_dtype=torch.bfloat16,
    trust_remote_code=True,
    load_in_4bit=True,
)
model = PeftModel.from_pretrained(base_model, "saadkhi/SQL_Chat_finetuned_model")
tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
model.eval()

def chat_fn(message, history):
    # Format as Phi-3 chat
    messages = [{"role": "user", "content": message}]
    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt"
    ).to(model.device)
    
    # Generate response
    outputs = model.generate(
        inputs,
        max_new_tokens=512,
        temperature=0.7,
        do_sample=True,
        top_p=0.9,
        repetition_penalty=1.1,
        eos_token_id=tokenizer.eos_token_id,
    )
    
    # Decode and clean
    response = tokenizer.decode(outputs[0], skip_special_tokens=False)
    response = response.split("<|assistant|>")[-1].split("<|end|>")[0].strip()
    
    # Update history
    history.append((message, response))
    return history, ""

# Gradio chat interface (single-page UI)
demo = gr.ChatInterface(
    chat_fn,
    title="SQL Chat Assistant",
    description="Ask SQL queries (e.g., 'delete duplicate entries from table')",
    examples=[
        ["delete duplicate entries in table from 2 different columns"],
        ["select top 5 users by age from users table"],
    ],
    cache_examples=False,  # Avoid caching for dynamic chats
    theme=gr.themes.Soft(),  # Clean look
)

if __name__ == "__main__":
    demo.launch(share=True)  # share=True for public link (expires in 72h)