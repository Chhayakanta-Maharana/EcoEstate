@echo off
title EcoEstate IoT Telemetry Sender (LAN TCP/UDP & WiFi - Shared WiFi Ready)
echo =====================================================================
echo Launching EcoEstate Dual-Channel IoT Hardware Sender Application...
echo Channels:
echo   - LAN (Ethernet RJ45): TCP Socket (Port 5000) ^& UDP Datagram (Port 5005)
echo   - WiFi (ESP32 Wireless): HTTP REST API (Auto-detects server IP)
echo.
echo SHARED WIFI MODE: The app auto-detects your network IP and can
echo discover the Django backend server on any shared WiFi network.
echo =====================================================================
python iot_sender_app.py
pause
