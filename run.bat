@echo off
title JobwalaAI - Job Outreach Automator - Harsh Kumar Singh
cd /d "%~dp0"
set PYTHONPATH=%~dp0;%PYTHONPATH%
echo ========================================================
echo  JobwalaAI - Job Outreach Automator - Harsh Kumar Singh
echo ========================================================
python backend\main.py
pause
