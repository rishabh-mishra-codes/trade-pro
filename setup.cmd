@echo off
REM One-time setup for Windows: copies example config into place if missing.
echo TradePro setup...

IF NOT EXIST ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env from .env.example
) ELSE (
  echo .env already exists, skipping
)

IF NOT EXIST "backend\src\main\resources\application-local.properties" (
  copy "backend\src\main\resources\application-local.properties.example" "backend\src\main\resources\application-local.properties" >nul
  echo Created backend application-local.properties
) ELSE (
  echo backend application-local.properties already exists, skipping
)

echo.
echo Next steps:
echo   1. Edit backend\src\main\resources\application-local.properties with your Neon DB details
echo   2. Backend:  cd backend ^&^& mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
echo   3. Frontend: npm install ^&^& npm run dev
