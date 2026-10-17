import sys
from pathlib import Path

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import uvicorn
import webbrowser
import threading
import time
from backend.app import app

def open_browser():
    time.sleep(1.2)
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting JobwalaAI - Mail Automator for Harsh Kumar Singh...")
    print("🌐 Opening: http://127.0.0.1:8000")
    print("=" * 60)
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
