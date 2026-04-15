#!/usr/bin/env bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Claimio — Production Build & Deploy Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Usage:   sudo bash build.sh
# Where:   Run from the EC2 SSH terminal after the server is set up
# Safe:    Idempotent — can be run multiple times without breaking anything
#
# What it does:
#   1. Prompts for all .env values interactively
#   2. Installs PHP dependencies (composer install --no-dev)
#   3. Installs S3 filesystem driver if missing
#   4. Patches frontend API URL for same-domain production
#   5. Patches CORS config for production
#   6. Builds React frontend (npm install && npm run build)
#   7. Runs Laravel artisan commands (migrate, cache, storage:link)
#   8. Sets correct file permissions & ownership
#   9. Restarts PHP-FPM and Nginx
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -euo pipefail

# ──────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────
APP_DIR="/var/www/claimio"
FRONTEND_DIR="${APP_DIR}/claimio-frontend"
ENV_FILE="${APP_DIR}/.env"
DOMAIN="claimio.ddnsking.com"
PHP_FPM_SERVICE="php8.2-fpm"

# ──────────────────────────────────────────────────────────
# Colors
# ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ──────────────────────────────────────────────────────────
# Helper: Print section header
# ──────────────────────────────────────────────────────────
section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ──────────────────────────────────────────────────────────
# Helper: Prompt for a value (re-prompt if blank when required)
#   Usage: prompt_value "Label" "default" "required"
#   Sets the global variable REPLY_VALUE
# ──────────────────────────────────────────────────────────
prompt_value() {
    local label="$1"
    local default="${2:-}"
    local required="${3:-yes}"

    while true; do
        if [ -n "$default" ]; then
            echo -en "${YELLOW}  ${label}${NC} [${GREEN}${default}${NC}]: "
            read -r input
            REPLY_VALUE="${input:-$default}"
        else
            echo -en "${YELLOW}  ${label}${NC}: "
            read -r input
            REPLY_VALUE="$input"
        fi

        # If required and empty, re-prompt
        if [ "$required" = "yes" ] && [ -z "$REPLY_VALUE" ]; then
            echo -e "  ${RED}✗ This value cannot be empty. Please try again.${NC}"
            continue
        fi

        break
    done
}

# ──────────────────────────────────────────────────────────
# Helper: Prompt for a secret (password) — hides input
# ──────────────────────────────────────────────────────────
prompt_secret() {
    local label="$1"
    local required="${2:-yes}"

    while true; do
        echo -en "${YELLOW}  ${label}${NC}: "
        read -rs input
        echo ""
        REPLY_VALUE="$input"

        if [ "$required" = "yes" ] && [ -z "$REPLY_VALUE" ]; then
            echo -e "  ${RED}✗ This value cannot be empty. Please try again.${NC}"
            continue
        fi

        break
    done
}

# ══════════════════════════════════════════════════════════
#  PRE-FLIGHT CHECKS
# ══════════════════════════════════════════════════════════

section "Pre-flight checks"

# Must run as root (for permissions, service restarts)
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}✗ This script must be run as root (or with sudo).${NC}"
    exit 1
fi

# Check project directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}✗ Project directory not found: ${APP_DIR}${NC}"
    echo -e "  Clone your repo first: git clone <repo-url> ${APP_DIR}"
    exit 1
fi

# Check required binaries
for cmd in php composer node npm nginx mysql; do
    if ! command -v "$cmd" &>/dev/null; then
        echo -e "${RED}✗ Required command not found: ${cmd}${NC}"
        echo -e "  Please install all server prerequisites first."
        exit 1
    fi
done

echo -e "${GREEN}✓ All pre-flight checks passed${NC}"

# ══════════════════════════════════════════════════════════
#  STEP 1: COLLECT .env VALUES
# ══════════════════════════════════════════════════════════

section "Configure .env — Enter production values"
echo -e "  ${BOLD}Values with [defaults] can be accepted by pressing Enter.${NC}"
echo -e "  ${BOLD}Passwords/secrets are hidden while typing.${NC}"
echo ""

# ── App Settings ──
echo -e "${CYAN}  ── Application ──${NC}"
prompt_value "APP_ENV" "production"
APP_ENV_VAL="$REPLY_VALUE"

prompt_value "APP_DEBUG (true/false)" "false"
APP_DEBUG_VAL="$REPLY_VALUE"

prompt_value "APP_URL" "https://${DOMAIN}"
APP_URL_VAL="$REPLY_VALUE"

prompt_value "FRONTEND_URL" "https://${DOMAIN}"
FRONTEND_URL_VAL="$REPLY_VALUE"

echo ""

# ── Database ──
echo -e "${CYAN}  ── Database (MySQL) ──${NC}"
prompt_value "DB_HOST" "127.0.0.1"
DB_HOST_VAL="$REPLY_VALUE"

prompt_value "DB_PORT" "3306"
DB_PORT_VAL="$REPLY_VALUE"

prompt_value "DB_DATABASE" "claimio_db"
DB_DATABASE_VAL="$REPLY_VALUE"

prompt_value "DB_USERNAME" "claimio"
DB_USERNAME_VAL="$REPLY_VALUE"

prompt_secret "DB_PASSWORD"
DB_PASSWORD_VAL="$REPLY_VALUE"

echo ""

# ── Google OAuth ──
echo -e "${CYAN}  ── Google OAuth (Socialite) ──${NC}"
prompt_value "GOOGLE_CLIENT_ID" "" "yes"
GOOGLE_CLIENT_ID_VAL="$REPLY_VALUE"

prompt_secret "GOOGLE_CLIENT_SECRET"
GOOGLE_CLIENT_SECRET_VAL="$REPLY_VALUE"

prompt_value "GOOGLE_REDIRECT_URI" "https://${DOMAIN}/api/auth/google/callback"
GOOGLE_REDIRECT_URI_VAL="$REPLY_VALUE"

echo ""

# ── AWS S3 ──
echo -e "${CYAN}  ── AWS S3 (File Storage) ──${NC}"
prompt_value "AWS_ACCESS_KEY_ID" "" "yes"
AWS_ACCESS_KEY_ID_VAL="$REPLY_VALUE"

prompt_secret "AWS_SECRET_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY_VAL="$REPLY_VALUE"

prompt_value "AWS_DEFAULT_REGION" "ap-southeast-1"
AWS_DEFAULT_REGION_VAL="$REPLY_VALUE"

prompt_value "AWS_BUCKET" "" "yes"
AWS_BUCKET_VAL="$REPLY_VALUE"

prompt_value "AWS_URL (e.g. https://bucket.s3.region.amazonaws.com)" "" "no"
AWS_URL_VAL="$REPLY_VALUE"

echo ""

# ── Sanctum / Session ──
echo -e "${CYAN}  ── Sanctum & Session ──${NC}"
prompt_value "SANCTUM_STATEFUL_DOMAINS" "${DOMAIN}"
SANCTUM_STATEFUL_DOMAINS_VAL="$REPLY_VALUE"

prompt_value "SESSION_DOMAIN" "${DOMAIN}"
SESSION_DOMAIN_VAL="$REPLY_VALUE"

echo ""

# ── SMS ──
echo -e "${CYAN}  ── UniSMS ──${NC}"
prompt_secret "UNISMS_API_KEY"
UNISMS_API_KEY_VAL="$REPLY_VALUE"

# ══════════════════════════════════════════════════════════
#  STEP 2: WRITE .env FILE
# ══════════════════════════════════════════════════════════

section "Writing .env"

cat > "$ENV_FILE" <<ENVFILE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Claimio — Production Environment
# Generated by build.sh on $(date '+%Y-%m-%d %H:%M:%S %Z')
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APP_NAME=Claimio
APP_ENV=${APP_ENV_VAL}
APP_KEY=
APP_DEBUG=${APP_DEBUG_VAL}
APP_URL=${APP_URL_VAL}
APP_TIMEZONE=Asia/Manila

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US
APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

# ── Database ──────────────────────────────────────────
DB_CONNECTION=mysql
DB_HOST=${DB_HOST_VAL}
DB_PORT=${DB_PORT_VAL}
DB_DATABASE=${DB_DATABASE_VAL}
DB_USERNAME=${DB_USERNAME_VAL}
DB_PASSWORD=${DB_PASSWORD_VAL}

# ── Session ───────────────────────────────────────────
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=${SESSION_DOMAIN_VAL}

# ── Sanctum ───────────────────────────────────────────
SANCTUM_STATEFUL_DOMAINS=${SANCTUM_STATEFUL_DOMAINS_VAL}

# ── Cache / Queue ─────────────────────────────────────
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=s3
QUEUE_CONNECTION=sync
CACHE_STORE=file

# ── AWS S3 ────────────────────────────────────────────
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID_VAL}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY_VAL}
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION_VAL}
AWS_BUCKET=${AWS_BUCKET_VAL}
AWS_URL=${AWS_URL_VAL}
AWS_USE_PATH_STYLE_ENDPOINT=false

# ── Google OAuth (Socialite) ─────────────────────────
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID_VAL}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET_VAL}
GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI_VAL}

# ── Claimio Config ────────────────────────────────────
ALLOWED_EMAIL_DOMAIN=tip.edu.ph
FRONTEND_URL=${FRONTEND_URL_VAL}

# ── UniSMS (SMS Notifications) ───────────────────────
UNISMS_API_KEY=${UNISMS_API_KEY_VAL}

# ── Vite ──────────────────────────────────────────────
VITE_APP_NAME=Claimio
ENVFILE

echo -e "${GREEN}✓ .env written to ${ENV_FILE}${NC}"

# ══════════════════════════════════════════════════════════
#  STEP 3: INSTALL PHP DEPENDENCIES
# ══════════════════════════════════════════════════════════

section "Installing PHP dependencies"
cd "$APP_DIR"

composer install --no-dev --optimize-autoloader --no-interaction 2>&1 | tail -5
echo -e "${GREEN}✓ Composer install complete${NC}"

# Install S3 filesystem driver if not already present
if ! composer show league/flysystem-aws-s3-v3 &>/dev/null 2>&1; then
    echo -e "${YELLOW}📦 Installing AWS S3 filesystem driver...${NC}"
    composer require league/flysystem-aws-s3-v3 "^3.0" --no-interaction 2>&1 | tail -3
    echo -e "${GREEN}✓ S3 driver installed${NC}"
else
    echo -e "${GREEN}✓ S3 driver already installed${NC}"
fi

# ══════════════════════════════════════════════════════════
#  STEP 4: GENERATE APP KEY
# ══════════════════════════════════════════════════════════

section "Generating application key"
php artisan key:generate --force --no-interaction
echo -e "${GREEN}✓ APP_KEY generated${NC}"

# ══════════════════════════════════════════════════════════
#  STEP 5: PATCH FRONTEND FOR PRODUCTION
# ══════════════════════════════════════════════════════════

section "Patching frontend for production"

# 5a. Update API base URL to relative /api (same-domain deployment)
#     In development it points to http://localhost:8000/api
#     In production, both SPA and API are on the same domain
API_JS="${FRONTEND_DIR}/src/services/api.js"
if [ -f "$API_JS" ]; then
    sed -i "s|baseURL: .*'/api.*|baseURL: '/api',|" "$API_JS"
    # Also handle double-quote variants
    sed -i 's|baseURL: .*"/api.*|baseURL: "/api",|' "$API_JS"
    echo -e "${GREEN}✓ API baseURL set to /api (same-domain)${NC}"
else
    echo -e "${YELLOW}⚠ api.js not found at ${API_JS} — skipping patch${NC}"
fi

# 5b. Update CORS config for production
CORS_PHP="${APP_DIR}/config/cors.php"
if [ -f "$CORS_PHP" ]; then
    # Replace hardcoded localhost with env-based origin
    sed -i "s|'allowed_origins' => \['http://localhost:5173'\]|'allowed_origins' => [env('FRONTEND_URL', 'https://${DOMAIN}')]|" "$CORS_PHP"
    echo -e "${GREEN}✓ CORS config updated for production${NC}"
else
    echo -e "${YELLOW}⚠ cors.php not found — skipping patch${NC}"
fi

# ══════════════════════════════════════════════════════════
#  STEP 6: BUILD REACT FRONTEND
# ══════════════════════════════════════════════════════════

section "Building React frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}✗ Frontend directory not found: ${FRONTEND_DIR}${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

echo "📦 Installing Node.js dependencies..."
npm install --production=false 2>&1 | tail -3
echo -e "${GREEN}✓ npm install complete${NC}"

echo "🔨 Building production bundle..."
npm run build 2>&1 | tail -5

if [ ! -d "${FRONTEND_DIR}/dist" ]; then
    echo -e "${RED}✗ Frontend build failed — dist/ directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built → ${FRONTEND_DIR}/dist/${NC}"

# Return to app directory
cd "$APP_DIR"

# ══════════════════════════════════════════════════════════
#  STEP 7: DATABASE MIGRATION
# ══════════════════════════════════════════════════════════

section "Running database migrations"

# Quick connectivity check
echo "🔍 Checking MySQL connection..."
if php artisan db:show --no-interaction &>/dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection OK${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify database connection. Attempting migration anyway...${NC}"
fi

php artisan migrate --force --no-interaction
echo -e "${GREEN}✓ Migrations complete${NC}"

# ══════════════════════════════════════════════════════════
#  STEP 8: LARAVEL OPTIMIZATION
# ══════════════════════════════════════════════════════════

section "Optimizing Laravel"

# Clear old caches first (idempotent)
php artisan config:clear --no-interaction 2>/dev/null || true
php artisan route:clear --no-interaction 2>/dev/null || true
php artisan view:clear --no-interaction 2>/dev/null || true

# Rebuild caches
php artisan config:cache --no-interaction
echo -e "${GREEN}  ✓ Config cached${NC}"

php artisan route:cache --no-interaction
echo -e "${GREEN}  ✓ Routes cached${NC}"

php artisan view:cache --no-interaction
echo -e "${GREEN}  ✓ Views cached${NC}"

# Create storage symlink (idempotent — skips if exists)
php artisan storage:link --no-interaction 2>/dev/null || true
echo -e "${GREEN}  ✓ Storage symlink verified${NC}"

echo -e "${GREEN}✓ Laravel optimization complete${NC}"

# ══════════════════════════════════════════════════════════
#  STEP 9: FILE PERMISSIONS
# ══════════════════════════════════════════════════════════

section "Setting file permissions"

# Ensure www-data can write to storage and cache
chmod -R 775 "${APP_DIR}/storage" "${APP_DIR}/bootstrap/cache"
chown -R www-data:www-data "${APP_DIR}/storage" "${APP_DIR}/bootstrap/cache"

# Ensure .env is not world-readable
chmod 640 "$ENV_FILE"
chown www-data:www-data "$ENV_FILE"

# Ensure frontend dist is readable by Nginx
chmod -R 755 "${FRONTEND_DIR}/dist" 2>/dev/null || true

echo -e "${GREEN}✓ Permissions set${NC}"

# ══════════════════════════════════════════════════════════
#  STEP 10: RESTART SERVICES
# ══════════════════════════════════════════════════════════

section "Restarting services"

# Verify Nginx config syntax
echo "🔍 Testing Nginx configuration..."
nginx -t 2>&1

systemctl restart "$PHP_FPM_SERVICE"
echo -e "${GREEN}  ✓ ${PHP_FPM_SERVICE} restarted${NC}"

systemctl restart nginx
echo -e "${GREEN}  ✓ Nginx restarted${NC}"

echo -e "${GREEN}✓ All services restarted${NC}"

# ══════════════════════════════════════════════════════════
#  DONE
# ══════════════════════════════════════════════════════════

section "🎉 Deployment Complete!"

echo ""
echo -e "${GREEN}  ╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║                                                  ║${NC}"
echo -e "${GREEN}  ║   Claimio is now live at:                        ║${NC}"
echo -e "${GREEN}  ║   ${BOLD}https://${DOMAIN}${NC}${GREEN}                ║${NC}"
echo -e "${GREEN}  ║                                                  ║${NC}"
echo -e "${GREEN}  ║   API:  https://${DOMAIN}/api${NC}${GREEN}            ║${NC}"
echo -e "${GREEN}  ║   Health: https://${DOMAIN}/up${NC}${GREEN}           ║${NC}"
echo -e "${GREEN}  ║                                                  ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}  📋 Post-deployment checklist:${NC}"
echo -e "     1. Verify Google OAuth callback URL in Google Cloud Console:"
echo -e "        ${BOLD}https://${DOMAIN}/api/auth/google/callback${NC}"
echo -e "     2. Verify cron job is set up for the scheduler:"
echo -e "        ${BOLD}crontab -e${NC}"
echo -e "        ${BOLD}* * * * * cd ${APP_DIR} && php artisan schedule:run >> /dev/null 2>&1${NC}"
echo -e "     3. Test login with a @tip.edu.ph Google account"
echo -e "     4. Test report submission with image upload (S3)"
echo -e "     5. Check SSL certificate: ${BOLD}https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}${NC}"
echo ""
