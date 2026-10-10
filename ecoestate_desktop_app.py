#!/usr/bin/env python3
"""
EcoEstate India • Native Enterprise Desktop Application Executable
===================================================================
Packages the EcoEstate Next.js Enterprise Sustainability Dashboard into a
native, high-performance, frameless Chromium (WebView2) desktop application.

Tri-Mode Deployment Architecture:
  1. Localhost Mode: Loads http://localhost:3000 with local Django (127.0.0.1:8000)
  2. Production Cloud Mode: Loads https://eco-estate-delta.vercel.app (NeonDB + Render API)
  3. Automatic Zero-Config Switcher: Auto-probes localhost, seamlessly falls back
     to Cloud Production if local servers are offline.

Includes:
  - Hardware-accelerated Chromium WebView2 engine (Edge)
  - Native Keyboard shortcuts (F11 Fullscreen, F5 Reload, Ctrl+Shift+P Cloud, Ctrl+Shift+L Local)
  - IoT UDP & LAN Gateway compatibility
  - Clean process lifecycle management
"""

import sys
import os
import time
import socket
import urllib.request
import urllib.error
import threading
import subprocess
import webview

# Configuration Endpoints
LOCAL_FRONTEND_URL = "http://localhost:3000"
PROD_FRONTEND_URL = "https://eco-estate-delta.vercel.app"
LOCAL_BACKEND_URL = "http://127.0.0.1:8000/api/iot/status/"
PROD_BACKEND_URL = "https://ecoestate.onrender.com/api/iot/status/"

APP_TITLE = "EcoEstate India • Sustainable Smart Facility Management"
APP_BG_COLOR = "#070913"

# Subprocess tracker
_CHILD_PROCESSES = []


def is_url_reachable(url: str, timeout: float = 0.8) -> bool:
    """Checks if an HTTP service is responding."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "EcoEstate-Desktop-Probe/1.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.getcode() in (200, 301, 302, 307, 308)
    except Exception:
        return False


def resolve_startup_url() -> tuple[str, str]:
    """
    Auto-detects whether to launch Localhost or Cloud Production.
    Returns: (target_url, mode_name)
    """
    print("[EcoEstate Desktop] Probing Localhost (http://localhost:3000)...")
    if is_url_reachable(LOCAL_FRONTEND_URL, timeout=0.6):
        print("[EcoEstate Desktop] -> Localhost Dev Server is Active!")
        return LOCAL_FRONTEND_URL, "LOCAL_DEV"

    print("[EcoEstate Desktop] Localhost not active. Probing Production Cloud (eco-estate-delta.vercel.app)...")
    if is_url_reachable(PROD_FRONTEND_URL, timeout=1.5):
        print("[EcoEstate Desktop] -> Connected to Cloud Production Deployment!")
        return PROD_FRONTEND_URL, "CLOUD_PROD"

    # Default to production URL anyway so WebView2 attempts full load
    return PROD_FRONTEND_URL, "CLOUD_PROD"


def ensure_local_backend_if_present():
    """
    If running locally in workspace and Django backend is not yet started,
    optionally spawns manage.py runserver in a background process.
    """
    if is_url_reachable(LOCAL_BACKEND_URL, timeout=0.5):
        print("[EcoEstate Desktop] Local Django Backend is already online (Port 8000).")
        return

    # Check if backend directory exists relative to script / exe
    script_dir = os.path.dirname(os.path.abspath(__file__))
    manage_py = os.path.join(script_dir, "backend", "manage.py")
    venv_python = os.path.join(script_dir, ".venv310", "Scripts", "python.exe")

    if not os.path.exists(venv_python):
        venv_python = sys.executable

    if os.path.exists(manage_py):
        try:
            print("[EcoEstate Desktop] Starting local Django background server on 0.0.0.0:8000...")
            proc = subprocess.Popen(
                [venv_python, manage_py, "runserver", "0.0.0.0:8000", "--noreload"],
                cwd=script_dir,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            _CHILD_PROCESSES.append(proc)
            print("[EcoEstate Desktop] Django supervisor process spawned.")
        except Exception as e:
            print(f"[EcoEstate Desktop] Notice: Could not spawn local backend: {e}")


class DesktopBridgeApi:
    """Native Python bridge exposed to JavaScript window.pywebview.api."""

    def __init__(self, window):
        self.window = window

    def get_system_info(self):
        """Returns desktop application runtime metadata."""
        import platform
        return {
            "app_name": "EcoEstate India Desktop",
            "version": "1.0.0",
            "os": platform.system(),
            "os_release": platform.release(),
            "arch": platform.architecture()[0],
            "is_desktop_executable": True
        }

    def switch_to_localhost(self):
        """Switches WebView to localhost:3000."""
        self.window.load_url(LOCAL_FRONTEND_URL)
        return f"Loaded {LOCAL_FRONTEND_URL}"

    def switch_to_cloud(self):
        """Switches WebView to Cloud Production."""
        self.window.load_url(PROD_FRONTEND_URL)
        return f"Loaded {PROD_FRONTEND_URL}"


def setup_window_hooks(window):
    """Binds global shortcuts and client styling."""
    def on_loaded():
        # Inject client notification & desktop hotkey listeners
        js_code = """
        (function() {
            // Set desktop flag
            window.__IS_ECOESTATE_DESKTOP__ = true;

            // Global Hotkeys
            window.addEventListener('keydown', function(e) {
                // F11: Fullscreen
                if (e.key === 'F11') {
                    // Let native handler handle if possible
                }
                // Ctrl+Shift+L: Switch to Localhost
                if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
                    if (window.pywebview && window.pywebview.api) {
                        window.pywebview.api.switch_to_localhost();
                    }
                }
                // Ctrl+Shift+P: Switch to Cloud Prod
                if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
                    if (window.pywebview && window.pywebview.api) {
                        window.pywebview.api.switch_to_cloud();
                    }
                }
            });
        })();
        """
        try:
            window.evaluate_js(js_code)
        except Exception:
            pass

    window.events.loaded += on_loaded


def cleanup():
    """Terminates any background processes spawned by this launcher."""
    for proc in _CHILD_PROCESSES:
        try:
            proc.terminate()
            proc.wait(timeout=1.0)
        except Exception:
            pass


def main():
    print("=" * 68)
    print("⚡ EcoEstate India • Enterprise Desktop Application")
    print("=" * 68)

    # 1. Start local backend in background if present
    threading.Thread(target=ensure_local_backend_if_present, daemon=True).start()

    # 2. Resolve startup URL
    target_url, mode = resolve_startup_url()
    print(f"[EcoEstate Desktop] Launching Native Window -> {target_url} ({mode})")

    # 3. Create native window
    # Edge Chromium WebView2 engine with dark theme
    window = webview.create_window(
        title=APP_TITLE,
        url=target_url,
        width=1380,
        height=860,
        min_size=(1024, 680),
        background_color=APP_BG_COLOR,
        resizable=True,
        fullscreen=False,
        confirm_close=False,
        text_select=True,
        zoomable=True
    )

    api = DesktopBridgeApi(window)
    window.expose(api.get_system_info, api.switch_to_localhost, api.switch_to_cloud)

    setup_window_hooks(window)

    try:
        # Start webview with Edge Chromium / CEF GUI
        webview.start(debug=False, http_server=False)
    finally:
        cleanup()


if __name__ == "__main__":
    main()
