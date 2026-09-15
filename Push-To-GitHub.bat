@echo off
title India Fashions - Push to GitHub and Vercel
color 0B
cd /d "c:\Users\Manzoor\.gemini\antigravity-ide\scratch\india-fashions"

echo ===================================================================
echo             INDIA FASHIONS - PUSH ALL COMMITS TO GITHUB ^& VERCEL
echo ===================================================================
echo.
echo Repo:   https://github.com/manzoorsks-source/india-fashions
echo Vercel: https://india-fashions-eight.vercel.app
echo.
echo [*] Checking unpushed commits...
git log origin/main..HEAD --oneline
echo.

set "GCM=C:\Program Files\Git\mingw64\bin\git-credential-manager.exe"
if exist "%GCM%" (
    echo [*] Starting GitHub Browser Authentication...
    echo     Agar browser me GitHub page khule, toh green "Authorize" button dabayein.
    "%GCM%" github login --username manzoorsks-source --browser
)

echo.
echo [*] Pushing all commits to GitHub main...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================================
    echo   [MUBARAK / SUCCESS] All 27 commits successfully pushed to GitHub!
    echo.
    echo   1. GitHub Repo updated:
    echo      https://github.com/manzoorsks-source/india-fashions
    echo.
    echo   2. Vercel automatically new website build shuru kar chuka hai!
    echo      2 minute me check karein: https://india-fashions-eight.vercel.app
    echo ===================================================================
    echo.
    pause
    exit /b 0
)

echo.
echo ===================================================================
echo   [OPTION 2] Agar browser se login nahi hua, toh GitHub Token dalein:
echo.
echo   1. Is link se token copy karein (Repo permission check hona chahiye):
echo      https://github.com/settings/tokens/new
echo.
echo   2. Niche apna GitHub Personal Access Token (ghp_...) paste karein:
echo ===================================================================
echo.
set /p "GITHUB_PAT=Token Paste karein (ya Enter dabayein band karne ke liye): "

if not "%GITHUB_PAT%"=="" (
    echo [*] Pushing using Personal Access Token...
    git push https://manzoorsks-source:%GITHUB_PAT%@github.com/manzoorsks-source/india-fashions.git main
    if %ERRORLEVEL% equ 0 (
        echo.
        echo ===================================================================
        echo   [SUCCESS] GitHub aur Vercel update ho gaye hain!
        echo ===================================================================
        pause
        exit /b 0
    )
)

echo.
pause
