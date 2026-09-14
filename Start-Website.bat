@echo off
title India Fashions Web Store & Admin
color 0A

:: Always navigate to the directory where this script resides
cd /d "%~dp0"

echo ==========================================================
echo       INDIA FASHIONS - LUXURY ETHNIC COUTURE
echo ==========================================================
echo.
echo [*] Checking Node.js environment...

:: Ensure Node is in PATH
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    set "PATH=C:\Users\Manzoor\.gemini\antigravity\scratch\node\node-v20.18.0-win-x64;%PATH%"
)

:: Verify Node is available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found. Please ensure Node.js is installed.
    pause
    exit /b 1
)

:: Check if server is already running on port 5173
netstat -ano | findstr :5173 >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Server is already active and running!
) else (
    echo [*] Starting Server (Frontend on 5173 + Backend on 3001)...
    start "India Fashions Dev Server" cmd /k "npm run dev"
    
    echo [*] Waiting for server to become ready...
    for /L %%i in (1,1,15) do (
        timeout /t 1 /nobreak >nul
        netstat -ano | findstr :5173 >nul
        if %ERRORLEVEL% equ 0 goto server_ready
    )
    echo [!] Server startup is taking longer than usual, proceeding to open browser...
)

:server_ready
echo [*] Opening India Fashions in your browser...
start http://localhost:5173

echo.
echo ==========================================================
echo   [SUCCESS] Website is live!
echo.
echo   - Laptop Browser:   http://localhost:5173
echo   - Mobile / Tablet:  http://192.168.0.4:5173
echo   - Admin Key:        Click Key symbol (Top-Right)
echo.
echo   Keep the server window open or minimized while using.
echo ==========================================================
echo.
pause
