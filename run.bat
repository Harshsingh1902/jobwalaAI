@echo off
title LinkedIn Job Mail Automator - Vibhu Dixit
cd /d "%~dp0"
set PYTHONPATH=%~dp0;%PYTHONPATH%
echo ========================================================
echo  LinkedIn Job Mail Automator - Vibhu Dixit
echo ========================================================
python backend\main.py
pause
