@echo off
echo ========================================
echo   Starting Py-Gram Backend Server
echo ========================================
echo.
echo Server will run on port 3001
echo Press Ctrl+C to stop the server
echo.

:loop
npx tsx server/start.ts
echo.
echo Server stopped! Restarting in 3 seconds...
timeout /t 3 /nobreak > nul
goto loop
