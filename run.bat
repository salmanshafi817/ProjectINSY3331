@echo off
echo ========================================================
echo   Gatherly - AI Event Staffing Copilot
echo   Starting local SaaS server...
echo ========================================================

REM Try to find Python
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start http://localhost:8000
    py server.py
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start http://localhost:8000
    python server.py
    goto end
)

REM Fallback to local python installation in AppData if not in PATH
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    start http://localhost:8000
    "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" server.py
    goto end
)

echo Python was not found in PATH or standard AppData directories.
echo Opening index.html directly in your default browser...
start index.html

:end
