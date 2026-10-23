# 🚀 Deployment Guide - TerraPulse AI (உழவன் AI)

This project is a complete full-stack smart agriculture platform containing:
- **FastAPI Python Backend** (`/api/...`, WebSockets, SQLite DB, AI inference with Groq / Gemini Vision)
- **Production-Ready Frontend** (Tailwind CSS, responsive desktop & mobile UI, bilingual Tamil/English, live Leaf Camera Scanner, CCTV monitor, dark/light theme)

Because FastAPI automatically serves the entire frontend static folder at the root `/`, **the entire application can be deployed as a single unified service for free!**

---

## 🌟 Option 1: Deploy on Render.com (Recommended - Easiest & Free)

Render allows you to deploy Python web applications for free with automatic SSL (`https://...`).

### Step 1: Push your project to GitHub
1. Create a new repository on [GitHub](https://github.com/new) (e.g. `terrapulse-ai` or `smart-farming`).
2. In your local terminal, initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for production deployment"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

### Step 2: Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and sign in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the following settings:
   - **Name**: `terrapulse-agro-ai` (or your preferred name)
   - **Region**: Singapore or Frankfurt (or closest to you)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables
Under **Environment Variables**, add:
- `PRODUCTION` = `true`
- `GROQ_API_KEY` = `your_groq_api_key` *(Optional, for Groq LLM)*
- `GEMINI_API_KEY` = `your_gemini_api_key` *(Optional, for Gemini Vision)*

### Step 4: Click "Deploy Web Service"
Render will automatically install dependencies, initialize the database, mount the frontend, and provide a live URL like:
👉 `https://terrapulse-agro-ai.onrender.com`

---

## 🚂 Option 2: Deploy on Railway.app

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will automatically detect the `Procfile` and `requirements.txt`.
5. Under **Variables**, add:
   - `PORT` = `8000` (or Railway default)
   - `GROQ_API_KEY` = `your_key`
   - `GEMINI_API_KEY` = `your_key`
6. Under **Settings** → **Networking**, click **Generate Domain**.
7. Your app is live!

---

## 🐳 Option 3: Deploy with Docker (Any VPS / Cloud Run / Fly.io)

A production-ready `Dockerfile` and `.dockerignore` are already included in the root directory.

### Build & Run Locally:
```bash
# Build the Docker image
docker build -t terrapulse-ai .

# Run container on port 8000
docker run -p 8000:8000 -e GROQ_API_KEY="your_key" -e GEMINI_API_KEY="your_key" terrapulse-ai
```
Visit `http://localhost:8000` in your browser.

### Deploy to Fly.io:
```bash
fly launch
fly deploy
```

---

## ⚙️ Verifying Your Deployment

Once deployed:
1. Visit your public URL (e.g. `https://your-app.onrender.com`).
2. Test the health check endpoint: `https://your-app.onrender.com/api/health`.
3. Open API documentation: `https://your-app.onrender.com/docs`.
4. Test language switching (Tamil / English) and dark/light mode.
5. Test the **Scan Leaf** camera on your mobile or laptop device.
