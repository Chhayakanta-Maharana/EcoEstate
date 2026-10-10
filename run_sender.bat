@echo off
title EcoEstate IoT Telemetry Hardware Sender (LAN TCP/UDP Broadcast & Shared WiFi)
echo ==============================================================================
echo        EcoEstate India • IoT Telemetry Hardware Sender Application
echo ==============================================================================
echo.
echo Transmission Protocols Supported:
echo   1. UDP Broadcast : 255.255.255.255:5005 (Zero-Config on any Shared WiFi / LAN)
echo   2. TCP Socket    : Modbus-TCP / JSON Stream on Port 5000
echo   3. WiFi REST API : ESP32 Node HTTP POST on Port 8000
echo.
echo Auto-Detects Local Network IP & Subnet Broadcast automatically.
echo ==============================================================================
echo.

if exist "EcoEstate_IoT_Sender.exe" (
    echo Launching standalone executable: EcoEstate_IoT_Sender.exe ...
    start "" "EcoEstate_IoT_Sender.exe"
    exit /b 0
)

if exist ".venv310\Scripts\python.exe" (
    echo Launching via Virtual Environment Python...
    ".venv310\Scripts\python.exe" iot_sender_app.py
    pause
    exit /b 0
)

echo Launching via system Python...
python iot_sender_app.py
pause
