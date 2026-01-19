#!/bin/bash

# Script para criar um afiliado de teste

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
echo "👤 Criando usuário afiliado..."

# Criar usuário afiliado
USER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "afiliado@teste.com",
    "password": "senha123",
    "name": "Afiliado Teste",
    "role": "AFFILIATE"
  }')

USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ Erro ao criar usuário"
  echo $USER_RESPONSE
  exit 1
fi

echo "✅ Usuário criado: $USER_ID"
echo ""
echo "📝 Criando afiliado..."

AFFILIATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/affiliates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Afiliado Teste\",
    \"userId\": \"$USER_ID\",
    \"externalId\": \"test_affiliate_$(date +%s)\",
    \"siteIds\": [12345]
  }")

echo $AFFILIATE_RESPONSE | python3 -m json.tool 2>/dev/null || echo $AFFILIATE_RESPONSE

AFFILIATE_ID=$(echo $AFFILIATE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$AFFILIATE_ID" ]; then
  echo ""
  echo "✅ Afiliado criado com sucesso!"
  echo "   ID: $AFFILIATE_ID"
  echo ""
  echo "💡 Agora você pode associar um deal:"
  echo "   ./associate_deal.sh DEAL_ID $AFFILIATE_ID"
fi
