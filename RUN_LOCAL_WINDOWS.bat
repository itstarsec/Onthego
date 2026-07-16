@echo off
cd /d "%~dp0"
echo.
echo  Co Thach Coastal Drive is starting...
echo  Open: http://localhost:8080/?resetCT=1&v=4#A1-71e2bdd4@1
echo.
python -m http.server 8080
pause
