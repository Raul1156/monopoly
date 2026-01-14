@echo off
echo ========================================
echo   MONOPOLY - Inicio Completo
echo ========================================
echo.
echo Iniciando Backend y Frontend...
echo.
echo IMPORTANTE: Se abriran 2 ventanas
echo - Backend (C#) en http://localhost:5000
echo - Frontend (React) en http://localhost:5173
echo.
echo Cierra ambas ventanas para detener los servidores
echo.

start "Monopoly Backend" cmd /k "start-backend.bat"
timeout /t 3 >nul
start "Monopoly Frontend" cmd /k "start-frontend.bat"

echo.
echo Servidores iniciados!
echo Backend: http://localhost:5000/swagger
echo Frontend: http://localhost:5173
echo.
pause
