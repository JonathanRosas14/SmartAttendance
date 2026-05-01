#!/bin/bash

# Script para actualizar automáticamente la IP en .env cuando cambias de red
# Uso: bash update-ip.sh

echo "🔍 Detectando IP local..."

# Obtener la IP local (ignora IPs de Docker)
IP=$(hostname -I | grep -oE '192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)

if [ -z "$IP" ]; then
  echo "❌ Error: No se pudo detectar la IP local"
  exit 1
fi

ENV_FILE="SmartAttendance-app/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: No se encontró el archivo $ENV_FILE"
  exit 1
fi

# Obtener la IP actual del .env
OLD_IP=$(grep "EXPO_PUBLIC_API_URL" "$ENV_FILE" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')

if [ "$IP" = "$OLD_IP" ]; then
  echo "✅ La IP ya es correcta: $IP"
  exit 0
fi

# Actualizar el .env
sed -i "s|EXPO_PUBLIC_API_URL=http://[0-9.]*:5000/api|EXPO_PUBLIC_API_URL=http://$IP:5000/api|" "$ENV_FILE"

echo "✅ IP actualizada:"
echo "   Anterior: $OLD_IP"  
echo "   Nueva:    $IP"


