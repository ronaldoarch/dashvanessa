#!/bin/bash

# Script para listar afiliados e associar deals

echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erro ao fazer login"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login realizado com sucesso!"
echo ""
echo "📋 Listando afiliados..."
echo ""

AFFILIATES=$(curl -s http://localhost:3001/api/affiliates \
  -H "Authorization: Bearer $TOKEN")

echo $AFFILIATES | python3 -m json.tool 2>/dev/null || echo $AFFILIATES

echo ""
echo "💡 Para associar um deal a um afiliado, use:"
echo "   ./associate_deal.sh DEAL_ID AFFILIATE_ID"
