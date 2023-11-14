@echo off
cd /d "%~dp0"  REM Change to the directory of this batch file
echo Starting Math Problem Solver Server...
node server.js
pause
