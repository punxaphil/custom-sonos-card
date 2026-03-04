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

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate required variables (skip SSH vars for localhost)
if [ -n "$DEPLOY_LOCALHOST" ]; then
    REQUIRED_VARS=(HA_URL HA_LOCALHOST_CONFIG_PATH)
else
    REQUIRED_VARS=(HA_URL HA_SSH_USER HA_SSH_HOST HA_SSH_PATH)
fi
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env"
        exit 1
    fi
done

# Use remote or localhost host if DEPLOY_REMOTE/DEPLOY_LOCALHOST is set
SCP_PORT_FLAG=""
DEPLOY_LOCAL=false
if [ -n "$DEPLOY_REMOTE" ]; then
    if [ -z "$HA_SSH_HOST_REMOTE" ]; then
        echo "Error: HA_SSH_HOST_REMOTE is not set in .env"
        exit 1
    fi
    HA_SSH_HOST="${HA_SSH_HOST_REMOTE%%:*}"
    REMOTE_PORT="${HA_SSH_HOST_REMOTE##*:}"
    if [ "$REMOTE_PORT" != "$HA_SSH_HOST" ]; then
        SCP_PORT_FLAG="-P $REMOTE_PORT"
    fi
    echo -e "${YELLOW}Using remote host: $HA_SSH_HOST${REMOTE_PORT:+:$REMOTE_PORT}${NC}"
elif [ -n "$DEPLOY_LOCALHOST" ]; then
    DEPLOY_LOCAL=true
    if [ -n "$HA_TOKEN_LOCALHOST" ]; then
        export HA_TOKEN="$HA_TOKEN_LOCALHOST"
    fi
    if [ -n "$HA_URL_LOCALHOST" ]; then
        export HA_URL="$HA_URL_LOCALHOST"
    else
        export HA_URL="http://localhost:8123"
    fi
    export HA_RESOURCE_PREFIX="/local/community"
    echo -e "${YELLOW}Using localhost: $HA_LOCALHOST_CONFIG_PATH (HA_URL=$HA_URL)${NC}"
fi

echo -e "${YELLOW}Building...${NC}"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}Deploying files to HA server...${NC}"
if [ "$DEPLOY_LOCAL" = true ]; then
    LOCAL_WWW="$HA_LOCALHOST_CONFIG_PATH/www/community"
    mkdir -p "$LOCAL_WWW/custom-sonos-card" "$LOCAL_WWW/maxi-media-player"
    cp "$PROJECT_ROOT/dist/custom-sonos-card.js" "$LOCAL_WWW/custom-sonos-card/"
    cp "$PROJECT_ROOT/dist-maxi-media-player/maxi-media-player.js" "$LOCAL_WWW/maxi-media-player/"
else
    scp $SCP_PORT_FLAG "$PROJECT_ROOT/dist/custom-sonos-card.js" "$HA_SSH_USER@$HA_SSH_HOST:$HA_SSH_PATH/custom-sonos-card/"
    scp $SCP_PORT_FLAG "$PROJECT_ROOT/dist-maxi-media-player/maxi-media-player.js" "$HA_SSH_USER@$HA_SSH_HOST:$HA_SSH_PATH/maxi-media-player/"
fi

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
