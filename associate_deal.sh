#!/bin/bash

# Script para associar deal a afiliado
# Uso: ./associate_deal.sh DEAL_ID AFFILIATE_ID

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Uso: ./associate_deal.sh DEAL_ID AFFILIATE_ID"
  echo ""
  echo "Exemplo:"
  echo "  ./associate_deal.sh cmklge8ny00031ailusrjsbiu cmklg6nwq0000dhm1arexvp2l"
  exit 1
fi

DEAL_ID=$1
AFFILIATE_ID=$2

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

echo "✅ Login realizado!"
echo ""
echo "🔗 Associando deal $DEAL_ID ao afiliado $AFFILIATE_ID..."

RESPONSE=$(curl -s -X POST "http://localhost:3001/api/deals/$DEAL_ID/affiliate/$AFFILIATE_ID" \
  -H "Authorization: Bearer $TOKEN")

echo $RESPONSE | python3 -m json.tool 2>/dev/null || echo $RESPONSE

echo ""
echo "✅ Deal associado com sucesso!"
