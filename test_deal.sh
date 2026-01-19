#!/bin/bash

# Script para criar um deal facilmente

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
echo "📝 Criando deal..."

DEAL_RESPONSE=$(curl -s -X POST http://localhost:3001/api/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deal Premium",
    "cpaValue": 500,
    "revSharePercentage": 35,
    "description": "Deal de teste"
  }')

echo $DEAL_RESPONSE | python3 -m json.tool 2>/dev/null || echo $DEAL_RESPONSE

echo ""
echo "✅ Deal criado! Use o ID retornado para associar a um afiliado."
