import uvicorn
import os
import sys

# Ensure backend folder is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    is_prod = bool(os.environ.get("PRODUCTION") or os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT"))
    print(f"Starting AgroSmart / Ulavan Connect AI Backend Server on http://{host}:{port} ...")
    print(f"Interactive Swagger API Docs available at http://{host}:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=not is_prod)
