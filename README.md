# SQL Chat App (Django + React)

A modern, full-stack chat application that answers database/SQL questions using a specialized AI model. Features a robust backend with authentication and chat history, served via a "Gen Z" aesthetic frontend.

## Features

- **AI-Powered Chat**: Answers SQL questions by calling a specialized Hugging Face Gradio Space.
- **Authentication**: Secure Login and Signup using JWT (JSON Web Tokens).
- **Chat History**:
    - **Sidebar**: View past conversations.
    - **Persistence**: Chats are saved to the database.
    - **Delete**: Remove old conversations with a custom confirmation modal.
- **Modern UI ("Gen Z" Aesthetic)**:
    - **Theme**: High-contrast Black background, White text, and Neon Green accents.
    - **Typography**: Inter font for a clean, modern look.
    - **Dynamic Input**: Text area and send button align perfectly.
- **Productivity Tools**:
    - **Edit & Resend**: Correct mistakes or refine prompts easily.
    - **Copy Response**: One-click copy for assistant answers.
- **Fallback Mode**: Graceful handling of model failures with structured error responses.

---

## Architecture

1.  **Frontend**: React (Vite) + TypeScript. Handles UI, Auth state, and API communication.
2.  **Backend**: Django REST Framework. Manages Users, Conversations, Messages, and AI integration.
3.  **AI Model**: Proxies requests to a Hugging Face Space via `gradio_client`.

---

## Quickstart (Local Development)

### Prerequisites

- Python 3.8+
- Node.js 16+
- `pip` and `npm`

### 1. Backend Setup (Django)

```bash
cd sql-chat-app/backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup Environment Variables
cp ../env.example .env
# Edit .env and set HF_TOKEN if needed (for private spaces)

# Run Migrations (Critical for Auth & History)
python manage.py makemigrations
python manage.py migrate

# Create Superuser (Optional)
python manage.py createsuperuser

# Run Server
python manage.py runserver
```
Backend runs at `http://localhost:8000`.

### 2. Frontend Setup (React/Vite)

```bash
cd sql-chat-app/frontend

# Install dependencies
npm install

# Run Dev Server
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## APIs

### Authentication

- **POST** `/api/register/`: Register a new user.
- **POST** `/api/login/`: Login and receive JWT tokens (`access`, `refresh`).

### Chat & History

- **GET** `/api/conversations/`: List all conversations for the logged-in user.
- **POST** `/api/chat/`: Send a message.
    - Body: `{ "message": "query...", "conversation_id": 123 }` (optional `conversation_id`)
    - Response: `{ "response": "AI answer", "conversation_id": 123, "title": "..." }`
- **GET** `/api/conversations/<id>/`: Get messages for a specific conversation.
- **DELETE** `/api/conversations/<id>/`: Delete a conversation.

---

## Environment Variables

Create a `.env` file in `sql-chat-app/backend/` or `sql-chat-app/`:

```ini
# Django Secret Key
SECRET_KEY=django-insecure-...

# Hugging Face Configuration
GRADIO_SPACE=saadkhi/SQL_chatbot_API
HF_TOKEN=hf_...  # Optional: For private spaces
```

---

## Troubleshooting

- **CORS Errors**: Ensure `django-cors-headers` is installed and configured in `settings.py`.
- **Auth Errors**: If login fails repeatedly, check if the `access_token` is expired or invalid in LocalStorage.
- **Model Errors**: If the chatbot returns a fallback message, verify `GRADIO_SPACE` is accessible and `HF_TOKEN` is valid.
