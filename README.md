## SQL Chat App (Django + React) + Dataset/Fine-tuning Utilities:

This repo contains:

- **`sql-chat-app/`**: a simple chat UI (React/Vite) + API (Django REST) that answers **database/SQL questions** by calling a **Hugging Face Gradio Space** (with a safe fallback response if the model/API is unavailable).
- **`datasets and Scripts/`**: utilities + notebooks used to prepare datasets / experiment with fine-tuning.

---

## Features

- **Chat UI**: clean single-page chat interface.
- **Backend API**: `POST /api/chat/` that returns a JSON response.
- **Model integration**: backend calls a Gradio Space via `gradio_client` (token supported for private Spaces).
- **Fallback mode**: if the model call fails, the API returns a structured “next steps” response instead of crashing.

---

## Architecture (high level)

1. **Frontend** sends a message to the backend: `POST /api/chat/`
2. **Backend** calls the configured Gradio Space (`GRADIO_SPACE`) to get the model response
3. Backend returns `{ "response": "..." }`

---

## Quickstart (Docker)

### Prerequisites

- Docker + Docker Compose

### Run

```bash
cd sql-chat-app
docker compose up --build
```

### Open

- **Frontend**: `http://localhost` (served via Nginx)
- **Backend API**: `http://localhost/api/chat/` (proxied by Nginx to Django)

---

## Local development (recommended for hacking)

### Backend (Django)

```bash
cd sql-chat-app/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# optional but recommended (see "Environment variables" below)
cp ../env.example .env

python manage.py runserver 0.0.0.0:8000
```

Backend runs at `http://localhost:8000`.

### Frontend (Vite)

```bash
cd sql-chat-app/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

In dev mode the frontend automatically calls the backend at `http://localhost:8000/api`.

---

## Environment variables

The backend looks for a `.env` file in either:

- `sql-chat-app/backend/.env`
- `sql-chat-app/.env`

Create it by copying the example:

```bash
cp sql-chat-app/env.example sql-chat-app/.env
```

### Backend

- **`GRADIO_SPACE`**: Hugging Face Space id to call (default: `saadkhi/SQL_chatbot_API`)
- **`HF_TOKEN`**: optional Hugging Face token (needed for private Spaces)

### Frontend

- **`VITE_API_BASE_URL`** (optional): override API base URL
  - Example for local backend: `http://localhost:8000/api`

---

## APIs

### `POST /api/chat/`

**Request**

```json
{ "message": "Explain LEFT JOIN with an example" }
```

**Response**

```json
{ "response": "..." }
```

**cURL**

```bash
curl -sS -X POST "http://localhost:8000/api/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message":"Write a SQL query to get the top 5 customers by revenue"}'
```

---

## Datasets & scripts

See `datasets and Scripts/` for:

- `dataset/`: JSONL datasets (prompt/completion format)
- `notebook_scripts/`: notebooks for fine-tuning/testing experiments
- `remove_duplicates.py`: helper script

---

## Repo layout

- `sql-chat-app/backend/`: Django project (`sqlchat`) + API app (`api`)
- `sql-chat-app/frontend/`: Vite + React UI
- `sql-chat-app/nginx/`: Nginx reverse-proxy config (used by Docker Compose)

---

## Troubleshooting

- **Frontend can’t reach backend in dev**: ensure Django is running on `http://localhost:8000` and you didn’t override `VITE_API_BASE_URL` incorrectly.
- **Model responses always fall back**: verify `GRADIO_SPACE` is correct and (if the Space is private) set `HF_TOKEN` in your `.env`.





