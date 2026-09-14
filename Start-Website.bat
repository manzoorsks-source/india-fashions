@echo off
title India Fashions Web Store & Admin
color 0A

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

:: Check if server is already running on port 5173
netstat -ano | findstr 0.0.0.0:5173 >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Server is already running on port 5173!
) else (
    echo [*] Starting Server (Frontend + Backend)...
    start /min "India Fashions Server" cmd /c "npm run dev"
    echo [*] Waiting for server to initialize...
    timeout /t 3 /nobreak >nul
)

:: Automatically open the browser to the web store
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
echo   Keep this window open or minimize it while using.
echo ==========================================================
echo.
pause
