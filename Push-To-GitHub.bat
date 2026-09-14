@echo off
title Push India Fashions to GitHub
color 0B
cd /d "%~dp0"

echo ==========================================================
echo        INDIA FASHIONS - PUSH LATEST CODE TO GITHUB
echo ==========================================================
echo.
echo Remote URL: https://github.com/manzoorsks-source/india-fashions.git
echo Branch:     main
echo.
echo [*] Pushing commits to GitHub...
echo [!] If prompted by GitHub / Git Credential Manager,
echo     please click "Sign in with your browser" to authorize.
echo.

git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ==========================================================
    echo   [SUCCESS] Code pushed to GitHub successfully!
    echo   Check your repo: https://github.com/manzoorsks-source/india-fashions
    echo ==========================================================
) else (
    echo.
    echo ==========================================================
    echo   [NOTICE] If the push did not succeed:
    echo   Please ensure you have write access to manzoorsks-source/india-fashions
    echo   and authorize the Git sign-in prompt.
    echo ==========================================================
)

echo.
pause
