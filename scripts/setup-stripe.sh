#!/usr/bin/env bash
# Creates the three plans and the billing webhook in Stripe.
# Usage: scripts/setup-stripe.sh https://your-domain.com [--live]
set -euo pipefail
URL="${1:?app url}"; MODE="${2:-}"
price() {
  local name=$1 amount=$2 key=$3
  local prod=$(stripe products create $MODE --name "$BRAND $name" -d "metadata[plan]=$key" | jq -r .id)
  stripe prices create $MODE --product "$prod" --unit-amount "$amount" --currency usd \
    -d "recurring[interval]=month" --lookup-key "$key" | jq -r .id
}
BRAND="${BRAND:-DeclineKit}"
echo "STRIPE_PRICE_STARTER=$(price Starter 2900 starter)"
echo "STRIPE_PRICE_GROWTH=$(price Growth 7900 growth)"
echo "STRIPE_PRICE_SCALE=$(price Scale 14900 scale)"
stripe webhook_endpoints create $MODE --url "$URL/api/billing/webhook" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" | jq -r '"STRIPE_WEBHOOK_SECRET=" + .secret'
