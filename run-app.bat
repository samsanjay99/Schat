@echo off
echo Starting Schat application...

rem Load environment variables from .env file
for /f "tokens=*" %%a in (.env) do (
  set "%%a"
)

rem First build the application
echo Building application...
call npm run build

rem Run in production mode
set NODE_ENV=production

rem Run the application
echo Environment variables loaded
echo Starting server in production mode...
node dist/index.js

pause
