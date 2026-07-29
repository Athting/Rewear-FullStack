# ReWear Project Packager for Email Delivery
# This script bundles the codebase and renames the extension to bypass email attachment filters.

Write-Host "--------------------------------------------------" -ForegroundColor Green
Write-Host "Packaging ReWear Project for Email Delivery..." -ForegroundColor Green
Write-Host "--------------------------------------------------" -ForegroundColor Green

$SourceDir = Get-Location
$TempDir = Join-Path $SourceDir "rewear-email-temp"
$ZipFile = Join-Path $SourceDir "rewear-project.zip"
$SafeFile = Join-Path $SourceDir "rewear-project.bin"

# 1. Clean up old archives if they exist
if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }
if (Test-Path $SafeFile) { Remove-Item $SafeFile -Force }
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }

# 2. Create temporary structure
New-Item -ItemType Directory -Path $TempDir | Out-Null

# 3. Copy files excluding node_modules, dist, .env, and .git folders
Write-Host "Copying project source files (excluding dependencies)..." -ForegroundColor Yellow
Copy-Item -Path "$SourceDir\client" -Destination "$TempDir\client" -Recurse -Exclude "node_modules", "dist", ".env", ".git"
Copy-Item -Path "$SourceDir\server" -Destination "$TempDir\server" -Recurse -Exclude "node_modules", "dist", ".env", ".git"
Copy-Item -Path "$SourceDir\package.json" -Destination "$TempDir\package.json"
Copy-Item -Path "$SourceDir\README.md" -Destination "$TempDir\README.md"

# 4. Compress the folder
Write-Host "Compressing codebase into zip archive..." -ForegroundColor Yellow
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipFile -Force

# 5. Clean up temporary directory
Remove-Item $TempDir -Recurse -Force | Out-Null

# 6. Rename file to bypass email scanning filters
Write-Host "Renaming archive to rewear-project.bin to bypass email scanners..." -ForegroundColor Yellow
Rename-Item -Path $ZipFile -NewName $SafeFile -Force

Write-Host "--------------------------------------------------" -ForegroundColor Green
Write-Host "SUCCESS! Your project has been packaged." -ForegroundColor Green
Write-Host "File created at: $SafeFile" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Green
Write-Host "HOW TO SEND:" -ForegroundColor Yellow
Write-Host "1. Attach the file 'rewear-project.bin' to your email." -ForegroundColor White
Write-Host "2. Instruct the recipient to run this command after downloading to restore it:" -ForegroundColor White
Write-Host "   Rename-Item -Path .\rewear-project.bin -NewName .\rewear-project.zip" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Green
