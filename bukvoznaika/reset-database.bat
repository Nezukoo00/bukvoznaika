@echo off
chcp 65001 > nul
title Буквознайка — Сброс и пересоздание базы данных
color 0E

echo.
echo  ╔════════════════════════════════════════════╗
echo  ║   ВНИМАНИЕ: Полный сброс базы данных        ║
echo  ╚════════════════════════════════════════════╝
echo.
echo  Этот скрипт УДАЛИТ все данные (профили, прогресс)
echo  и пересоздаст базу с правильным набором уроков.
echo.
echo  Используйте это, если буквы/числа открываются
echo  неправильно после обновления.
echo.
pause

echo.
echo  [1/4] Останавливаем контейнеры...
docker-compose down

echo.
echo  [2/4] Удаляем старый том базы данных...
docker volume rm bukvoznaika_pgdata 2>nul
if %errorlevel% neq 0 (
    echo  Пробуем другое имя тома...
    docker volume rm bukvoznaika_1_pgdata 2>nul
)

echo.
echo  [3/4] Пересобираем образы...
docker-compose build

echo.
echo  [4/4] Запускаем заново с чистой базой...
docker-compose up -d

echo.
echo  ✅ Готово! База пересоздана с правильными уроками.
echo.
echo  Откройте http://localhost:3000
echo  Зарегистрируйтесь заново — старые аккаунты удалены.
echo.
pause
