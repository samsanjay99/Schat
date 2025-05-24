@echo off
echo This script will set PowerShell execution policy to allow running scripts.
echo You will need to run this as Administrator.
echo.
echo Press any key to continue...
pause > nul

powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force\"' -Verb RunAs"

echo.
echo If no errors appeared, the execution policy has been updated.
echo You should now be able to run npm commands without restrictions.
echo.
echo Press any key to exit...
pause > nul
