@echo off
echo ========================================
echo  MONOPOLY - Iniciando Backend (C#)
echo ========================================
echo.

cd backend-csharp

echo Restaurando dependencias...
dotnet restore

echo.
echo Iniciando servidor en http://localhost:5000
echo Swagger UI: http://localhost:5000/swagger
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

dotnet run
