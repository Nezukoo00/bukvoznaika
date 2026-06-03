@echo off
chcp 65001 > nul
title Буквознайка — Запуск
color 0B

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     Буквознайка — Запуск             ║
echo  ╚══════════════════════════════════════╝
echo.

:: Проверяем Node.js
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo  [ОШИБКА] Node.js не установлен!
    echo.
    echo  Скачайте Node.js LTS с сайта: https://nodejs.org
    echo  После установки запустите этот файл снова.
    echo.
    pause
    exit /b 1
)

echo  [OK] Node.js найден
echo.

:: Проверяем .env
if not exist "backend\.env" (
    echo  Файл .env не найден. Запустите start-windows.ps1 для первичной настройки.
    echo.
    echo  Либо создайте backend\.env вручную по образцу backend\.env.example
    pause
    exit /b 1
)

echo  Запускаем бэкенд на порту 3001...
start "Буквознайка — БЭКЕНД" cmd /k "cd backend && npm start"

timeout /t 4 /nobreak > nul

echo  Запускаем фронтенд на порту 3000...
start "Буквознайка — ФРОНТЕНД" cmd /k "cd frontend && npm start"

echo.
echo  ✅ Приложение запускается!
echo.
echo  Фронтенд: http://localhost:3000
echo  API:      http://localhost:3001/api
echo.
echo  Браузер откроется автоматически через ~30 секунд.
echo  Не закрывайте окна бэкенда и фронтенда!
echo.
pause
