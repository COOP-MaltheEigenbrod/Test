@echo off
rem Double-click this file (or point Windows Task Scheduler at it) to run the import.
cd /d "%~dp0"
python import_monthly_excel.py
if errorlevel 1 pause
