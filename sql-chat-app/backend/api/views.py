from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch
import logging
import sys
import json

logger = logging.getLogger(__name__)

# Configure model loading with proper error handling
MODEL_LOADED = False
base_model = None
model = None
tokenizer = None

def load_model():
    """Load the model on startup"""
    global base_model, model, tokenizer, MODEL_LOADED
    
    try:
        print("=" * 60)
        print("Loading model... (this takes 20–40 seconds)")
        print("=" * 60)
        sys.stdout.flush()
        
        logger.info("Attempting to load base model from unsloth/Phi-3-mini-4k-instruct-bnb-4bit")
        base_model = AutoModelForCausalLM.from_pretrained(
            "unsloth/Phi-3-mini-4k-instruct-bnb-4bit",
            device_map="auto",
            torch_dtype=torch.bfloat16,
            trust_remote_code=True,
            load_in_4bit=True,
        )
        logger.info("✓ Base model loaded successfully")
        
        logger.info("Loading PEFT adapter from model_lora")
        model = PeftModel.from_pretrained(base_model, "model_lora")
        logger.info("✓ PEFT adapter loaded successfully")
        
        logger.info("Loading tokenizer")
        tokenizer = AutoTokenizer.from_pretrained(
            "unsloth/Phi-3-mini-4k-instruct-bnb-4bit",
            trust_remote_code=True
        )
        logger.info("✓ Tokenizer loaded successfully")
        
        # Set model to evaluation mode
        model.eval()
        logger.info("✓ Model set to evaluation mode")
        
        MODEL_LOADED = True
        print("=" * 60)
        print("✓ Model loaded successfully!")
        print("=" * 60)
        sys.stdout.flush()
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load model: {str(e)}", exc_info=True)
        print(f"❌ Failed to load model: {str(e)}")
        sys.stdout.flush()
        MODEL_LOADED = False
        return False


class ChatView(APIView):
    """
    Handle chat requests with the SQL generation model.
    """
    
    def options(self, request, *args, **kwargs):
        """Handle CORS preflight requests"""
        return Response(status=status.HTTP_200_OK)
    
    def post(self, request):
        """
        POST /api/chat/
        Body: {"message": "your sql question"}
        """
        try:
            # Check if model is loaded
            if not MODEL_LOADED or model is None or tokenizer is None:
                logger.error("Model not loaded - returning 503 Service Unavailable")
                return Response(
                    {
                        "error": "Model is still loading or failed to load. Please refresh the page and try again.",
                        "status": "model_not_ready"
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Get message from request
            user_message = request.data.get("message", "").strip()
            
            if not user_message:
                logger.warning("Empty message received")
                return Response(
                    {"error": "Message cannot be empty"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"[REQUEST START] Processing message: '{user_message[:100]}...'")
            
            try:
                # Prepare messages in chat format
                messages = [{"role": "user", "content": user_message}]
                
                logger.info("[TOKENIZING] Applying chat template and tokenizing...")
                inputs = tokenizer.apply_chat_template(
                    messages,
                    tokenize=True,
                    add_generation_prompt=True,
                    return_tensors="pt"
                ).to(model.device)
                logger.info(f"[TOKENIZED] Input shape: {inputs.shape}")

                logger.info("[GENERATING] Starting model generation...")
                with torch.no_grad():
                    outputs = model.generate(
                        inputs,
                        max_new_tokens=512,
                        temperature=0.7,
                        do_sample=True,
                        top_p=0.9,
                        repetition_penalty=1.1,
                        eos_token_id=tokenizer.eos_token_id,
                        pad_token_id=tokenizer.pad_token_id,
                    )
                logger.info(f"[GENERATED] Output shape: {outputs.shape}")

                logger.info("[DECODING] Decoding output tokens...")
                response = tokenizer.decode(outputs[0], skip_special_tokens=False)
                
                # Extract assistant response
                response = response.split("<|assistant|>")[-1].split("<|end|>")[0].strip()
                
                if not response:
                    logger.warning("Generated empty response")
                    response = "Unable to generate a response. Please try again with a different query."
                
                logger.info(f"[RESPONSE] Generated: '{response[:100]}...'")
                logger.info("[REQUEST END] Success")
                
                return Response(
                    {"response": response, "status": "success"},
                    status=status.HTTP_200_OK
                )
                
            except torch.cuda.OutOfMemoryError as e:
                logger.error(f"[ERROR] GPU out of memory: {str(e)}", exc_info=True)
                return Response(
                    {"error": "GPU ran out of memory. Try a simpler query or restart the server."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            except Exception as e:
                logger.error(f"[ERROR] Model generation failed: {str(e)}", exc_info=True)
                return Response(
                    {"error": f"Model error: {str(e)[:100]}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            logger.error(f"[CRITICAL] Unexpected error in ChatView.post: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Server error: {str(e)[:100]}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Load model when app starts
logger.info("Initializing API views - loading model...")
load_model()