@echo off
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0scripts\start-auth0.ps1" %*
exit /b %ERRORLEVEL%
