@echo off
title GitHub Repository Publisher - Geeth Accounts
echo ====================================================
echo      GITHUB REPOSITORY PUBLISHER - GEETH LLC
echo ====================================================
echo.

:: Check if git command is available
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on your system or not in your PATH.
    echo.
    echo Please install Git for Windows from:
    echo https://git-scm.com/download/win
    echo.
    echo Note: After installation, you MUST close this CMD window and 
    echo open a fresh one to run the script.
    echo.
    pause
    exit /b
)

:: Check if repo is already initialized, otherwise initialize
if not exist ".git" (
    echo [1/4] Initializing Git repository...
    git init
    echo.
) else (
    echo [1/4] Git repository already initialized.
    echo.
)

:: Stage files
echo [2/4] Staging project files...
git add .
echo.

:: Commit files
echo [3/4] Creating commit...
git commit -m "Initial commit - Rebranded to Geeth LLC"
git branch -M main
echo.

:: Ask for remote repository URL
echo ====================================================
echo   Please create a new blank repository on GitHub:
echo   1. Go to https://github.com/new
echo   2. Name it (e.g. "accounts-receivable-system")
echo   3. Do NOT check "Add a README", ".gitignore", or "license"
echo   4. Copy the repository URL (ends with .git)
echo ====================================================
echo.

set /p REPO_URL="Enter your GitHub Repository URL: "
echo.

:: Remove old origin if exists, then add new one
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

:: Push to remote main
echo [4/4] Uploading (pushing) code to GitHub...
echo.
git push -u origin main

echo.
echo ====================================================
echo ✔ SUCCESS: Code pushed to GitHub successfully!
echo ====================================================
echo.
pause
