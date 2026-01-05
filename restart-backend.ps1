# Restart Backend Script

Write-Host "Stopping any running Spring Boot applications..." -ForegroundColor Yellow

# Find and kill Java processes running Spring Boot
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -match "store" -or $_.CommandLine -match "StoreApplication"
}

if ($javaProcesses) {
    $javaProcesses | Stop-Process -Force
    Write-Host "Stopped existing Spring Boot processes" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "No existing Spring Boot processes found" -ForegroundColor Cyan
}

Write-Host "`nRebuilding application..." -ForegroundColor Yellow
Set-Location E:\PMS\store
& .\mvnw clean package -DskipTests

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful! Starting application..." -ForegroundColor Green
    Write-Host "Application will be available at: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the application`n" -ForegroundColor Yellow
    
    # Start the application
    java -jar target\store-0.0.1-SNAPSHOT.jar
} else {
    Write-Host "`nBuild failed! Please check the errors above." -ForegroundColor Red
    exit 1
}
