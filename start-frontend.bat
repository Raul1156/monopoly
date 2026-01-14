@echo off
echo ========================================
echo  MONOPOLY - Iniciando Frontend (React)
echo ========================================
echo.

echo Instalando dependencias...
call npm install

echo.
echo Iniciando servidor en http://localhost:5173
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

call npm run dev
