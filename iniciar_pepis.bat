@echo off
echo ===================================================
echo       INICIANDO EL SISTEMA DE PEPI'S LOMOS
echo ===================================================
echo.
echo Iniciando el motor de Base de Datos (Backend)...
start cmd /k "cd C:\Users\loren\.gemini\antigravity\scratch\pepis-lomos && .\venv\Scripts\python.exe manage.py runserver"

echo Iniciando la Interfaz Visual (Frontend)...
start cmd /k "cd C:\Users\loren\.gemini\antigravity\scratch\pepis-lomos\frontend && npm run dev"

echo.
echo ¡Todo listo! Se abrieron dos ventanas negras (no las cierres).
echo Pepi's Lomos ya esta funcionando.
echo.
pause
