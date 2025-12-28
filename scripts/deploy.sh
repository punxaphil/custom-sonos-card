#!/bin/bash
set -e

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

# Load environment variables
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Please create one with the following variables:"
    echo "  HA_URL=https://your-ha-instance.local"
    echo "  HA_TOKEN=your-long-lived-access-token"
    echo "  HA_TEST_PAGE=/lovelace/test"
    echo "  HA_SSH_USER=root"
    echo "  HA_SSH_HOST=192.168.1.100"
    echo "  HA_SSH_PATH=/homeassistant/www/community"
    exit 1
fi
source "$ENV_FILE"

# Validate required variables
for var in HA_URL HA_SSH_USER HA_SSH_HOST HA_SSH_PATH; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env"
        exit 1
    fi
done

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building...${NC}"
cd "$PROJECT_ROOT"
npm run build

echo -e "${YELLOW}Deploying files to HA server...${NC}"
scp "$PROJECT_ROOT/dist/custom-sonos-card.js" "$HA_SSH_USER@$HA_SSH_HOST:$HA_SSH_PATH/custom-sonos-card/"
scp "$PROJECT_ROOT/dist-maxi-media-player/maxi-media-player.js" "$HA_SSH_USER@$HA_SSH_HOST:$HA_SSH_PATH/maxi-media-player/"

# Check for token in .env
if [ -z "$HA_TOKEN" ]; then
    echo -e "${YELLOW}No HA_TOKEN found in .env. Please create a long-lived access token in HA:${NC}"
    echo "1. Go to $HA_URL/profile"
    echo "2. Scroll to 'Long-Lived Access Tokens'"
    echo "3. Click 'Create Token' and name it 'deploy-script'"
    echo "4. Paste the token here:"
    read -r HA_TOKEN
    echo "" >> "$ENV_FILE"
    echo "HA_TOKEN=$HA_TOKEN" >> "$ENV_FILE"
    export HA_TOKEN
    echo -e "${GREEN}Token saved to .env${NC}"
fi

echo -e "${YELLOW}Updating HA resource hacstag...${NC}"
npx tsx "$PROJECT_ROOT/scripts/deploy.ts"

echo -e "${GREEN}Done!${NC}"
