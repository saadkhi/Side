# In api/views.py
import os
import logging
import traceback
from pathlib import Path

from dotenv import load_dotenv
from gradio_client import Client
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
HF_TOKEN = os.getenv("HF_TOKEN")
GRADIO_SPACE = os.getenv("GRADIO_SPACE", "saadkhi/SQL_chatbot_API")


def get_gradio_client() -> Client:
    """
    Lazily create and cache a Gradio Client for the SQL chatbot Space.
    Uses HF_TOKEN if provided (for private Spaces).
    """
    # Use a function attribute as a simple cache
    if hasattr(get_gradio_client, "_client"):
        return getattr(get_gradio_client, "_client")

    try:
        if HF_TOKEN:
            client = Client(GRADIO_SPACE, token=HF_TOKEN)
        else:
            client = Client(GRADIO_SPACE)

        setattr(get_gradio_client, "_client", client)
        logger.info(f"Initialized Gradio client for Space: {GRADIO_SPACE}")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Gradio client: {e}")
        logger.error(traceback.format_exc())
        raise


def generate_model_response(user_message: str) -> str:
    """
    Generate a model-backed response by calling the external Gradio Space API.
    """
    client = get_gradio_client()

    result = client.predict(
        prompt=user_message,
        api_name="/chat",
    )

    # The Space returns a single string
    return str(result).strip()


def generate_fallback_response(user_message: str) -> str:
    """Return a helpful fallback response when the model is unavailable."""
    intro = (
        "The conversational model is not loaded right now, but I'm still here to help. "
        "Here's a structured reply you can use:"
    )
    template = (
        f"{intro}\n\n"
        "1) I received your request:\n"
        f"   \"{user_message}\"\n\n"
        "2) Suggested next steps:\n"
        "- Confirm the database tables and columns involved.\n"
        "- Identify any filters, ordering, or aggregations needed.\n"
        "- Translate the above into SQL using the database's dialect.\n\n"
        "3) Example prompt you can try once the model is ready:\n"
        f"   \"Write a SQL query to address: {user_message}\""
    )
    return template

@method_decorator(csrf_exempt, name='dispatch')
class ChatView(APIView):
    def post(self, request):
        try:
            user_message = request.data.get("message", "")
            if not user_message:
                return Response(
                    {"error": "Message cannot be empty"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            logger.info(f"Received message: {user_message}")

            try:
                response_text: str = generate_model_response(user_message)
            except Exception as gen_err:
                logger.error(f"Gradio model call failed, falling back. Details: {gen_err}")
                logger.error(traceback.format_exc())
                response_text = generate_fallback_response(user_message)

            logger.info(f"Responding with: {response_text[:120]}...")
            return Response({"response": response_text})

        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": "An error occurred while generating the response"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )