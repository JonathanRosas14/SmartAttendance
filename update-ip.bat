@echo off
REM Script para actualizar automáticamente la IP en .env cuando cambias de red (Windows)
REM Uso: update-ip.bat

echo.
echo Detectando IP local...

REM Obtener la IP local
for /f "delims=" %%a in ('ipconfig ^| findstr /R "IPv4"') do (
    for %%b in (%%a) do (
        set IP=%%b
    )
)

set ENV_FILE=SmartAttendance-app\.env

if not exist "%ENV_FILE%" (
    echo Error: No se encontro el archivo %ENV_FILE%
    exit /b 1
)

REM Actualizar el .env
powershell -Command "(Get-Content '%ENV_FILE%') -replace 'EXPO_PUBLIC_API_URL=.*', 'EXPO_PUBLIC_API_URL=http://%IP%:5000/api' | Set-Content '%ENV_FILE%'"

echo.
echo ^✓ IP actualizada a: %IP%
echo.
