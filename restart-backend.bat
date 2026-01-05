@echo off
echo ============================================
echo    PMS Backend Restart Script
echo ============================================
echo.

echo [1/4] Stopping existing Spring Boot processes...
taskkill /F /FI "WINDOWTITLE eq *StoreApplication*" 2>nul
taskkill /F /FI "IMAGENAME eq java.exe" /FI "STATUS eq running" 2>nul
timeout /t 3 >nul
echo     Done!
echo.

echo [2/4] Cleaning old build...
cd /d E:\PMS\store
call mvnw clean
echo     Done!
echo.

echo [3/4] Building application (skipping tests)...
call mvnw package -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed! Check the errors above.
    pause
    exit /b 1
)
echo     Done!
echo.

echo [4/4] Starting Spring Boot application...
echo.
echo ============================================
echo    Application Starting...
echo    URL: http://localhost:8080
echo    Press Ctrl+C to stop
echo ============================================
echo.

java -jar target\store-0.0.1-SNAPSHOT.jar
