# =====================================================
# Буквознайка — Запуск БЕЗ Docker на Windows
# Запускать от имени Администратора в PowerShell
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Буквознайка — Установка и запуск" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- Проверка Node.js ---
Write-Host "`n[1/4] Проверка Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "  ✓ Node.js установлен: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js не найден!" -ForegroundColor Red
    Write-Host "  → Скачайте с https://nodejs.org (LTS версию)" -ForegroundColor White
    Write-Host "  → После установки перезапустите PowerShell и запустите скрипт снова" -ForegroundColor White
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

# --- Проверка PostgreSQL ---
Write-Host "`n[2/4] Проверка PostgreSQL..." -ForegroundColor Yellow
$pgFound = $false
$possiblePgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files\PostgreSQL\17\bin"
)
foreach ($path in $possiblePgPaths) {
    if (Test-Path "$path\psql.exe") {
        $env:PATH = "$path;" + $env:PATH
        Write-Host "  ✓ PostgreSQL найден: $path" -ForegroundColor Green
        $pgFound = $true
        break
    }
}
if (-not $pgFound) {
    Write-Host "  ✗ PostgreSQL не найден!" -ForegroundColor Red
    Write-Host "  → Скачайте с https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  → При установке запомните пароль пользователя postgres!" -ForegroundColor White
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

# --- Настройка базы данных ---
Write-Host "`n[3/4] Настройка базы данных..." -ForegroundColor Yellow

$dbPassword = Read-Host "  Введите пароль пользователя postgres (тот что задали при установке)"

# Создаём БД
Write-Host "  Создаём базу данных bukvoznaika..." -ForegroundColor Gray
$env:PGPASSWORD = $dbPassword
& psql -U postgres -c "CREATE DATABASE bukvoznaika;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ База данных создана" -ForegroundColor Green
} else {
    Write-Host "  ℹ База данных уже существует (или ошибка подключения)" -ForegroundColor Yellow
}

# Создаём .env для бэкенда
$backendDir = Join-Path $PSScriptRoot "backend"
$envContent = @"
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bukvoznaika
DB_USER=postgres
DB_PASSWORD=$dbPassword
DB_SSL=false
JWT_SECRET=bukvoznaika_jwt_secret_$(Get-Random -Maximum 999999)
JWT_REFRESH_SECRET=bukvoznaika_refresh_$(Get-Random -Maximum 999999)
FRONTEND_URL=http://localhost:3000
"@
Set-Content -Path "$backendDir\.env" -Value $envContent
Write-Host "  ✓ Файл .env создан" -ForegroundColor Green

# --- Установка зависимостей и миграции ---
Write-Host "`n[4/4] Установка зависимостей..." -ForegroundColor Yellow

Write-Host "  Устанавливаем пакеты бэкенда..." -ForegroundColor Gray
Set-Location $backendDir
& npm install --prefer-offline 2>&1 | Where-Object { $_ -match "added|error|warn" } | Select-Object -Last 3
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Ошибка установки бэкенда" -ForegroundColor Red; exit 1
}
Write-Host "  ✓ Зависимости бэкенда установлены" -ForegroundColor Green

Write-Host "  Запускаем миграции БД..." -ForegroundColor Gray
& node src/migrations/run.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Ошибка миграций. Проверьте пароль PostgreSQL." -ForegroundColor Red; exit 1
}
Write-Host "  ✓ Таблицы и данные созданы" -ForegroundColor Green

$frontendDir = Join-Path (Split-Path $backendDir) "frontend"
Write-Host "  Устанавливаем пакеты фронтенда (это займёт 2-3 минуты)..." -ForegroundColor Gray
Set-Location $frontendDir
& npm install --prefer-offline 2>&1 | Where-Object { $_ -match "added|error|warn" } | Select-Object -Last 3
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Ошибка установки фронтенда" -ForegroundColor Red; exit 1
}
Write-Host "  ✓ Зависимости фронтенда установлены" -ForegroundColor Green

# --- Запуск ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ Всё готово! Запускаем приложение..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🌐 Фронтенд: http://localhost:3000" -ForegroundColor White
Write-Host "  🔧 API:      http://localhost:3001/api" -ForegroundColor White
Write-Host ""
Write-Host "  Откроется два окна PowerShell (бэкенд и фронтенд)." -ForegroundColor Gray
Write-Host "  Не закрывайте их во время работы!" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 2

# Запускаем бэкенд в отдельном окне
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; Write-Host 'БЭКЕНД запущен на :3001' -ForegroundColor Green; npm start"

Start-Sleep -Seconds 3

# Запускаем фронтенд в отдельном окне
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; Write-Host 'ФРОНТЕНД запускается на :3000...' -ForegroundColor Cyan; npm start"

Write-Host "  Браузер откроется автоматически через ~30 секунд." -ForegroundColor Yellow
Write-Host "  Если не открылся — перейдите на http://localhost:3000" -ForegroundColor Yellow
Read-Host "`nНажмите Enter для выхода из этого окна"
