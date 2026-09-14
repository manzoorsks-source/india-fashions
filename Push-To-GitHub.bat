@echo off
title Push India Fashions to GitHub & Vercel
color 0B
cd /d "%~dp0"

echo ==========================================================
echo        INDIA FASHIONS - PUSH TO GITHUB ^& VERCEL
echo ==========================================================
echo.
echo Target Repo: https://github.com/manzoorsks-source/india-fashions.git
echo Live Vercel: https://india-fashions-eight.vercel.app
echo.

:: Check if git-credential-manager exists
set "GCM=C:\Program Files\Git\mingw64\bin\git-credential-manager.exe"
if exist "%GCM%" (
    echo [*] Checking GitHub authorization status...
    "%GCM%" github list | findstr /i "manzoorsks-source" >nul
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [!] GitHub sign-in required for account 'manzoorsks-source'.
        echo [*] Opening your browser to authorize GitHub...
        echo     (Please click the green 'Authorize git-credential-manager' button)
        echo.
        "%GCM%" github login --username manzoorsks-source --browser
    )
)

echo.
echo [*] Pushing 24 commits to GitHub main branch...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ==========================================================
    echo   [SUCCESS] All code successfully pushed to GitHub!
    echo.
    echo   - GitHub Repo:   https://github.com/manzoorsks-source/india-fashions
    echo   - Live Website:   https://india-fashions-eight.vercel.app
    echo.
    echo   Vercel will automatically rebuild and deploy your latest site!
    echo ==========================================================
) else (
    echo.
    echo ==========================================================
    echo   [TROUBLESHOOTING] Push did not complete.
    echo.
    echo   If browser authorization was denied or did not appear:
    echo   You can authenticate using a GitHub Personal Access Token (PAT):
    echo   1. Create token at: https://github.com/settings/tokens
    echo   2. Run command: git push https://YOUR_TOKEN@github.com/manzoorsks-source/india-fashions.git main
    echo ==========================================================
)

echo.
pause
