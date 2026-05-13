# Script to setup test database configuration
# This script updates the .env file to use the test MongoDB database

$envPath = Join-Path $PSScriptRoot "..\.env"
$testDbUrl = "mongodb+srv://vishesh_db_user:W3QF7cjxBpvm9Vx7@cluster0.ar2uq6y.mongodb.net/"

if (-not (Test-Path $envPath)) {
    Write-Host "Error: .env file not found at $envPath" -ForegroundColor Red
    exit 1
}

# Read current .env content
$content = Get-Content $envPath -Raw

# Check if we already have a commented test db section
if ($content -match "# Test Database") {
    Write-Host "Test database configuration already exists. Updating..."
}

# Create new env content with test DB configuration
$newContent = @"
# ============================================
# PRODUCTION DATABASE (COMMENTED OUT FOR TESTING)
# ============================================
# DATABASE_URL=your_production_mongodb_url_here
# MONGO_URL=your_production_mongodb_url_here

# ============================================
# TEST DATABASE (ACTIVE)
# ============================================
DATABASE_URL=$testDbUrl

# ============================================
# REST OF CONFIGURATION (KEEP EXISTING VALUES)
# ============================================
"@

# Extract non-database related env vars (lines that don't start with DATABASE_URL or MONGO_URL)
$existingLines = $content -split "`n" | Where-Object { 
    $_ -notmatch "^DATABASE_URL=" -and 
    $_ -notmatch "^MONGO_URL=" -and
    $_ -notmatch "^# Test Database" -and
    $_ -notmatch "^# PRODUCTION" -and
    $_ -notmatch "^# ============================================"
}

# Combine new config with existing non-db vars
$finalContent = $newContent + ($existingLines -join "`n")

# Write to .env file
Set-Content -Path $envPath -Value $finalContent -NoNewline

Write-Host "Successfully updated .env to use test database!" -ForegroundColor Green
Write-Host "Test DB URL: $testDbUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx prisma db push" -ForegroundColor White
Write-Host "2. Start dev server: npm run dev" -ForegroundColor White
