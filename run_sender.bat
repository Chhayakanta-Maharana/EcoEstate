@echo off
title EcoEstate IoT Telemetry Sender (LAN TCP/UDP & WiFi)
echo =====================================================================
echo Launching EcoEstate Dual-Channel IoT Hardware Sender Application...
echo Channels:
echo   - LAN (Ethernet RJ45): TCP Socket (Port 5000) & UDP Datagram (Port 5005)
echo   - WiFi (ESP32 Wireless): HTTP REST API to http://localhost:8000/api/iot/ingest/
echo =====================================================================
python iot_sender_app.py
pause
