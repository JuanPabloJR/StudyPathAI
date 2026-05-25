# ─── StudyPath AI — Script de configuración inicial (Windows PowerShell) ──────

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       StudyPath AI — Setup Inicial       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js no encontrado. Instala Node.js 20+ desde https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# 2. Verificar Docker
$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
    Write-Host "⚠️  Docker no encontrado. Instala Docker Desktop para usar la BD" -ForegroundColor Yellow
} else {
    Write-Host "✅ $dockerVersion" -ForegroundColor Green
}

# 3. Copiar .env si no existe
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "📝 Archivo .env creado. EDÍTALO con tus API keys:" -ForegroundColor Yellow
    Write-Host "   ANTHROPIC_API_KEY = sk-ant-..." -ForegroundColor Yellow
    Write-Host "   OPENAI_API_KEY    = sk-..."     -ForegroundColor Yellow
    Write-Host "   JWT_SECRET        = (mínimo 32 caracteres)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Presiona Enter cuando hayas configurado el .env..."
    Read-Host
}

# 4. Levantar PostgreSQL
Write-Host "🐘 Levantando PostgreSQL con Docker..." -ForegroundColor Cyan
docker compose up postgres -d
Start-Sleep -Seconds 5

# 5. Instalar dependencias del backend
Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Cyan
Set-Location apps/api
npm install --silent

# 6. Generar cliente Prisma y migrar
Write-Host "🗄️  Configurando base de datos..." -ForegroundColor Cyan
npx prisma generate
npx prisma migrate dev --name init

# 7. Seed de la base de conocimiento
Write-Host "🌱 Poblando base de conocimiento..." -ForegroundColor Cyan
npm run db:seed

# 8. Instalar frontend
Set-Location ../web
Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Cyan
npm install --silent

Set-Location ../..

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ Setup completado exitosamente             ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                              ║" -ForegroundColor Green
Write-Host "║  Backend:  cd apps/api && npm run start:dev  ║" -ForegroundColor Green
Write-Host "║  Frontend: cd apps/web && npm run dev        ║" -ForegroundColor Green
Write-Host "║                                              ║" -ForegroundColor Green
Write-Host "║  API:     http://localhost:3001/api          ║" -ForegroundColor Green
Write-Host "║  Web:     http://localhost:5173              ║" -ForegroundColor Green
Write-Host "║  Swagger: http://localhost:3001/api/docs     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
