#!/bin/sh
# One-time setup for macOS/Linux: copies example config into place if missing.
echo "TradePro setup..."

if [ ! -f ".env" ]; then
  cp ".env.example" ".env"
  echo "Created .env from .env.example"
else
  echo ".env already exists, skipping"
fi

LOCAL_PROPS="backend/src/main/resources/application-local.properties"
if [ ! -f "$LOCAL_PROPS" ]; then
  cp "$LOCAL_PROPS.example" "$LOCAL_PROPS"
  echo "Created backend application-local.properties"
else
  echo "backend application-local.properties already exists, skipping"
fi

echo ""
echo "Next steps:"
echo "  1. Edit $LOCAL_PROPS with your Neon DB details"
echo "  2. Backend:  cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local"
echo "  3. Frontend: npm install && npm run dev"
