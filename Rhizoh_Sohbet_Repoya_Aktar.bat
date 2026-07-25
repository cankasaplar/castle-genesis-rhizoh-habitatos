@echo off
chcp 65001 >nul
echo Rhizoh: masaustu sohbet repoya aktariliyor...
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\LENOVO\Desktop\castle\scripts\llm-chat-desktop-ingest.ps1"
echo.
pause
