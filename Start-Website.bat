@echo off
title India Fashions
color 0A

:: Always navigate to project directory
cd /d "c:\Users\Manzoor\.gemini\antigravity-ide\scratch\india-fashions"

:: Ensure Node and npm are in PATH
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    set "PATH=C:\Users\Manzoor\.gemini\antigravity\scratch\node\node-v20.18.0-win-x64;%PATH%"
)

:: Check if server is already running on port 5173
netstat -ano | findstr :5173 >nul
if %ERRORLEVEL% equ 0 (
    start http://localhost:5173
    exit
)

:: Start dev server
start "India Fashions Dev Server" cmd /k "set PATH=C:\Users\Manzoor\.gemini\antigravity\scratch\node\node-v20.18.0-win-x64;%%PATH%% && cd /d c:\Users\Manzoor\.gemini\antigravity-ide\scratch\india-fashions && call npm run dev"

:: Wait 3 seconds for server
ping -n 4 127.0.0.1 >nul

:: Open browser immediately
start http://localhost:5173
exit
