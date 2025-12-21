#!/bin/bash
set -e

# Load environment variables
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create one with the following variables:"
    echo "  HA_URL=https://your-ha-instance.local"
    echo "  HA_TEST_PAGE=/lovelace/test"
    echo "  HA_SSH_USER=root"
    echo "  HA_SSH_HOST=192.168.1.100"
    echo "  HA_SSH_PATH=/homeassistant/www/community"
    exit 1
fi
source .env

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
npm run build

echo -e "${YELLOW}Deploying files to HA server...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
scp "$SCRIPT_DIR/dist/custom-sonos-card.js" "$HA_SSH_USER@$HA_SSH_HOST:$HA_SSH_PATH/custom-sonos-card/"
scp "$SCRIPT_DIR/dist-maxi-media-player/maxi-media-player.js" "$HA_SSH_USER@$HA_SSH_HOST:$HA_SSH_PATH/maxi-media-player/"

# Check for token
TOKEN_FILE=".ha_token"
if [ ! -f "$TOKEN_FILE" ]; then
    echo -e "${YELLOW}No token found. Please create a long-lived access token in HA:${NC}"
    echo "1. Go to $HA_URL/profile"
    echo "2. Scroll to 'Long-Lived Access Tokens'"
    echo "3. Click 'Create Token' and name it 'deploy-script'"
    echo "4. Paste the token here:"
    read -r HA_TOKEN
    echo "$HA_TOKEN" > "$TOKEN_FILE"
    chmod 600 "$TOKEN_FILE"
    echo -e "${GREEN}Token saved to $TOKEN_FILE${NC}"
fi

echo -e "${YELLOW}Updating HA resource hacstag...${NC}"
npx tsx deploy.ts

echo -e "${GREEN}Done!${NC}"
