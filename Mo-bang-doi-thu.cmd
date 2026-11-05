@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\open-balance.ps1" -Page opponents
if errorlevel 1 pause
