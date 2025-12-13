# SQL Chat App - Setup & Troubleshooting Guide

## Quick Start

### Backend Setup
```bash
cd sql-chat-app/backend
# If you don't have venv, create it
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the server
python3 manage.py runserver
```

The backend will start at: **http://localhost:8000**

### Frontend Setup
```bash
cd sql-chat-app/frontend
npm install
npm run dev
```

The frontend will start at: **http://localhost:5173** (Vite default)

---

## Architecture Overview

### Backend (Django + Transformers)
- **Port**: 8000
- **API Endpoint**: `POST /api/chat/`
- **Model**: Phi-3-mini-4k-instruct-bnb-4bit with LoRA adapter
- **Framework**: Django REST Framework

### Frontend (React + Vite)
- **Port**: 5173
- **Technology**: React + TypeScript + Axios
- **Auto-detection**: Frontend automatically detects backend at `http://localhost:8000`

---

## How It Works

1. **User sends message** via React frontend
2. **Frontend sends OPTIONS preflight request** to check CORS
3. **Backend responds with 200 OK** to preflight
4. **Frontend sends POST request** with message
5. **Backend tokenizes** the message
6. **Model generates** response (takes 20-60 seconds)
7. **Backend decodes** response and returns it
8. **Frontend displays** response with elapsed time

---

## Expected Flow & Timing

```
User sends message
    ↓
Frontend OPTIONS preflight (instant)
    ↓
Frontend POST with message (instant)
    ↓
Backend receives request (log: [REQUEST START])
    ↓
Backend tokenizes message (log: [TOKENIZING])
    ↓
Backend generates response (log: [GENERATING]) ← THIS TAKES 20-60+ SECONDS
    ↓
Backend decodes response (log: [DECODING])
    ↓
Backend returns response (log: [REQUEST END])
    ↓
Frontend displays response
```

---

## Troubleshooting

### Issue 1: "Error: Request timeout - model took too long to generate response"

**Root Cause**: The model is taking longer than expected to generate a response (this is normal).

**Solution**:
- The timeout is now set to **5 minutes (300 seconds)** - this should be enough
- Check Django logs to see where it's hanging:
  - `[TOKENIZING]` - Should be instant
  - `[GENERATING]` - Takes 20-60 seconds (normal)
  - `[DECODING]` - Should be instant

**Check the logs**:
```bash
# In Django terminal, look for:
[INFO] [REQUEST START] Processing message: '...'
[INFO] [TOKENIZING] Applying chat template and tokenizing...
[INFO] [GENERATING] Starting model generation...
[INFO] [GENERATED] Output shape: ...
[INFO] [DECODING] Decoding output tokens...
[INFO] [RESPONSE] Generated: '...'
[INFO] [REQUEST END] Success
```

If logs don't show `[REQUEST START]`, the request isn't reaching Django.

---

### Issue 2: "Network error - cannot connect to server"

**Root Cause**: Backend is not reachable at `http://localhost:8000`

**Solutions**:

1. **Check if Django is running**:
   ```bash
   # In backend terminal, you should see:
   Starting development server at http://127.0.0.1:8000/
   ```

2. **Check if you can access the backend manually**:
   ```bash
   # In a new terminal, run:
   curl http://localhost:8000/api/chat/
   
   # You should get a CORS response (headers include Access-Control-Allow-Origin)
   ```

3. **Check Firefox/Chrome DevTools** (F12):
   - Go to Console tab
   - Look for CORS errors
   - Check Network tab → POST to `/api/chat/`

4. **Ensure CORS is enabled**:
   - Django settings has `CORS_ALLOW_ALL_ORIGINS = True`
   - CorsMiddleware is first in MIDDLEWARE list

---

### Issue 3: "Backend: ✗ Disconnected" badge in UI

**Root Cause**: OPTIONS preflight request failed

**Solutions**:

1. **Verify URLs match**:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:5173`
   - They should be able to reach each other

2. **Test CORS manually**:
   ```bash
   curl -X OPTIONS http://localhost:8000/api/chat/ \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type" \
     -v
   
   # Look for: Access-Control-Allow-Origin in response
   ```

3. **Restart both servers**:
   - Kill Django (Ctrl+C)
   - Kill Vite (Ctrl+C)
   - Start Django again
   - Start Vite again

---

### Issue 4: "Model is still loading or failed to load"

**Root Cause**: Model failed to load during startup

**Solution**:

1. **Check Django startup logs**:
   ```
   Loading model... (this takes 20–40 seconds)
   ============================================================
   Attempting to load base model...
   ✓ Base model loaded successfully
   ✓ PEFT adapter loaded successfully
   ✓ Tokenizer loaded successfully
   ✓ Model set to evaluation mode
   ============================================================
   ✓ Model loaded successfully!
   ```

2. **If it shows error**:
   - Check if `model_lora/` folder exists in backend directory
   - Check if you have enough GPU memory (requires ~8GB VRAM)
   - Check if transformers/peft packages are installed

3. **Verify installation**:
   ```bash
   pip list | grep -E "torch|transformers|peft"
   ```

---

### Issue 5: GPU Out of Memory

**Symptoms**: 
- GPU error in logs
- "GPU ran out of memory" error message

**Solutions**:

1. **Reduce max_new_tokens** in `views.py`:
   ```python
   max_new_tokens=256,  # Instead of 512
   ```

2. **Clear GPU cache**:
   ```bash
   # Restart Django server to clear GPU memory
   ```

3. **Monitor GPU usage**:
   ```bash
   nvidia-smi -l 1  # Watch GPU memory every second
   ```

---

### Issue 6: Model takes too long (60+ seconds)

**Normal behavior**: 
- First request might take 60+ seconds
- Subsequent requests might be faster (if not hitting OOM)

**Why**:
- Model compilation on first run
- GPU warmup
- Complex prompt processing

**What to do**:
- Be patient, it's normal
- Try a simpler prompt (shorter input)
- Check GPU utilization with `nvidia-smi`

---

## Monitoring & Debugging

### Enable detailed logging in Django:

The logging is already configured. You'll see messages like:
```
[DEBUG] api - [REQUEST START] Processing message: '...'
[DEBUG] api - [TOKENIZING] Applying chat template...
[DEBUG] api - [GENERATING] Starting model generation...
[INFO] django - Performed action on /api/chat/
```

### Browser DevTools Debugging:

1. **Open DevTools** (F12)
2. **Network Tab**:
   - Look for OPTIONS request (preflight)
   - Look for POST request (actual chat)
   - Check response status and headers
3. **Console Tab**:
   - Watch for network errors
   - Check log messages (we log API URL and status)

### Backend Debugging:

Check these specific log messages in Django terminal:
- `✓ Backend connected at:` (in browser console) - shows which URL is being used
- `[REQUEST START]` - request reached Django
- `[TOKENIZING]` - tokenization started
- `[GENERATING]` - model generation started (will be slow)
- `[REQUEST END]` - request completed successfully

---

## Performance Tips

1. **Use shorter prompts**: Longer inputs = longer generation time
2. **GPU warmup**: First request is slower, subsequent are faster
3. **Monitor GPU**: Use `nvidia-smi` to check memory/utilization
4. **Check temperature**: Long inference can heat up GPU
5. **Restart if stuck**: If Django hangs, Ctrl+C and restart

---

## File Structure

```
sql-chat-app/
├── backend/
│   ├── api/
│   │   ├── views.py           # ← Main API logic (UPDATED)
│   │   ├── urls.py            # API routing
│   │   └── models.py
│   ├── sqlchat/
│   │   ├── settings.py        # ← CORS & logging config (UPDATED)
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── model_lora/            # LoRA adapter files
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # ← React component (UPDATED)
│   │   ├── main.tsx
│   │   └── ...
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── SETUP_AND_TROUBLESHOOTING.md (this file)
```

---

## Quick Reference: Common Commands

```bash
# Backend
cd backend
source venv/bin/activate
python3 manage.py runserver          # Start Django

# Frontend
cd frontend  
npm run dev                          # Start Vite dev server
npm run build                        # Build for production

# Testing
curl http://localhost:8000/api/chat/ # Check if backend is up
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "write 2 sql queries"}'
```

---

## FAQ

**Q: How long should each request take?**
A: First request: 30-60 seconds. Subsequent requests: 20-40 seconds (GPU warmup).

**Q: Can I run this without GPU?**
A: Not with the current model. It requires CUDA/GPU.

**Q: What if I get `ModuleNotFoundError`?**
A: Run `pip install -r requirements.txt` in the backend venv.

**Q: Can I change the model?**
A: Yes, modify the `load_model()` function in `api/views.py`.

**Q: Does the frontend need to be on localhost?**
A: No, but the backend must be at `http://localhost:8000` (or modify API_URL).

---

## Getting Help

1. **Check the logs first** - Both browser and Django logs have detailed info
2. **Note the timing** - When exactly does it timeout?
3. **Check GPU status** - `nvidia-smi` shows if model is running
4. **Restart everything** - Sometimes a clean restart fixes issues
5. **Check network** - Use `curl` to test backend connectivity

---

**Last Updated**: December 12, 2025
**Status**: All issues fixed and documented
