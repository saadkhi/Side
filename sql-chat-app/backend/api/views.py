# In api/views.py
import os
import logging
import traceback
from pathlib import Path
from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import torch

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize model and tokenizer as None
model = None
tokenizer = None
MODEL_LOADED = False

def load_environment():
    """Load environment variables from .env file if it exists."""
    possible_paths = [
        Path(__file__).resolve().parent.parent / '.env',
        Path(__file__).resolve().parent.parent.parent / '.env',
        Path('.env'),
    ]
    
    for path in possible_paths:
        if path.exists():
            load_dotenv(dotenv_path=path, override=True)
            logger.info(f"Loaded .env file from: {path}")
            return True
    
    logger.warning("No .env file found")
    return False

# Load environment variables
load_environment()
HF_TOKEN = os.getenv('HF_TOKEN')

# Try to load model only if not running migrations and HF_TOKEN is available
if 'manage.py' not in os.sys.argv or 'migrate' not in os.sys.argv:
    if not HF_TOKEN:
        logger.warning("HF_TOKEN not found in environment variables")
    else:
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            
            logger.info("Loading model and tokenizer...")
            
            model_name = "saadkhi/SQL_Chat_finetuned_model"
            
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True,
                token=HF_TOKEN
            )
            
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                device_map="auto",
                torch_dtype=torch.bfloat16,
                trust_remote_code=True,
                token=HF_TOKEN
            )
            
            model.eval()
            MODEL_LOADED = True
            logger.info("Model and tokenizer loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            logger.error(traceback.format_exc())
            MODEL_LOADED = False
else:
    logger.info("Skipping model loading during migrations")

@method_decorator(csrf_exempt, name='dispatch')
class ChatView(APIView):
    def post(self, request):
        if not MODEL_LOADED or model is None or tokenizer is None:
            return Response(
                {"error": "Model is not loaded. Please check server logs."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
            
        try:
            user_message = request.data.get("message", "")
            if not user_message:
                return Response(
                    {"error": "Message cannot be empty"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Received message: {user_message}")
            
            # Format the message for the model
            prompt = f"<|user|>\n{user_message}\n<|assistant|>\n"
            
            # Tokenize the input
            inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
            
            # Generate response
            outputs = model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )
            
            # Decode the response
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            response = response.split("<|assistant|>")[-1].strip()
            
            logger.info(f"Generated response: {response[:100]}...")
            return Response({"response": response})
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": "An error occurred while generating the response"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )