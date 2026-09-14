@echo off
title Deploy India Fashions to Vercel
color 0E
cd /d "%~dp0"

echo ==========================================================
echo        INDIA FASHIONS - DEPLOY TO VERCEL
echo ==========================================================
echo.
echo [*] Checking Node.js environment...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    set "PATH=C:\Users\Manzoor\.gemini\antigravity\scratch\node\node-v20.18.0-win-x64;%PATH%"
)

echo [*] Building latest production bundle...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed. Please check errors above.
    pause
    exit /b 1
)

echo.
echo ==========================================================
echo [*] Deploying to Vercel...
echo [!] If prompted:
echo     - Log in with: asmathbegum995@gmail.com
echo     - Accept default project settings (Press Enter)
echo ==========================================================
echo.

call npx vercel --prod

echo.
echo ==========================================================
echo   Keep this window open or press any key to close.
echo ==========================================================
pause
