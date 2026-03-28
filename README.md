# MEDSTA WhatsApp Automation - 100% FREE

End-to-end healthcare request and provider quote flow - completely FREE using Meta's WhatsApp Cloud API.

## 🎉 100% FREE Setup

✅ **Meta WhatsApp Cloud API** - No per-message costs  
✅ **Open Source** - Node.js backend  
✅ **Your Server** - You control where it runs  
✅ **No Vendor Lock-in** - Pure Meta API  
✅ **Hardcoded** - Everything built-in, no external paid dependencies

**Cost:** FREE (for server/hosting you choose)

## 🚀 QUICK START

### Option 1: Test Locally (FREE, 5 minutes)

```bash
# Clone and setup
git clone <your-repo>
cd medsta-whatsapp
npm install

# Start in mock mode (no credentials needed)
npm start
```

Open WhatsApp, send any message to see it logged to console.

### Option 2: Deploy Live (FREE, 15 minutes)

See [SETUP_CLOUD_API.md](./SETUP_CLOUD_API.md) for complete FREE setup guide:

1. Create Meta Business Account (FREE)
2. Create WhatsApp Business App (FREE)
3. Add phone number (FREE)
4. Get credentials (FREE)
5. Deploy to your server/Replit (free or cheap)
6. Go live!

### Finding Help

👉 **[DOCS_MAP.md](DOCS_MAP.md)** — Documents for different situations:

- 💻 Testing locally? → [LOCAL_TESTING.md](LOCAL_TESTING.md)
- 🚀 Want FREE production setup? → [SETUP_CLOUD_API.md](SETUP_CLOUD_API.md)
- 📋 Step-by-step checklist? → [CHECKLIST.md](CHECKLIST.md)

## What This Implements

- Phase 1: Welcome menu and service entry
- Phase 2: Service-specific structured data capture
- Phase 3: Request ID generation + storage
- Phase 4: Provider broadcast by category
- Phase 5: Strict quote parsing and validation
- Phase 6: Quote aggregation (top 3) by count or timeout
- Phase 7: User quote selection with ranking
- Phase 8: Order lock and provider notification
- Phase 9: Provider fulfillment handoff
- Phase 10: Completion workflow
- **Doctor Flow:** Fixed list selection (no bidding)

## Stack

- **WhatsApp:** Meta Cloud API (100% FREE) - no Interakt/AiSensy/WATI needed
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (optional, you manage)
- **Deployment:** Your server, Replit, Railway, etc.

## Quick Local Test

```bash
# Setup
npm install

# Start server in MOCK mode (no credentials)
npm start
```

Server logs all WhatsApp messages to console:

```
📱 MOCK WHATSAPP -> 919876543210
Healthcare - Let's get you the right care. What service do you need?
1️⃣  Medicine Delivery
...
```

## Production Setup

Complete setup guide: [SETUP_CLOUD_API.md](./SETUP_CLOUD_API.md) (15 minutes, FREE)

Configuration (`.env`):

```bash
WHATSAPP_MODE=cloud
WHATSAPP_PHONE_NUMBER_ID=<your-id>
WHATSAPP_ACCESS_TOKEN=<your-token>
WHATSAPP_WEBHOOK_SECRET=<your-secret>
WHATSAPP_WEBHOOK_VERIFY=true
```

Get credentials FREE from [business.facebook.com](https://business.facebook.com)

## Directory Structure

3. Start server:

```bash
npm run dev
```

Server starts on `http://localhost:8080`.

## API Endpoints

- `GET /health`
- `POST /webhook/whatsapp`
- `POST /webhook/provider/:provider` (`provider` = `interakt|aisensy|wati`)
- `GET /debug/requests`
- `POST /admin/complete/:requestId`

## Webhook Payload

```json
{
  "from": "919888888888",
  "message": "/start"
}
```

## User Flow Test (Medicine)

1. Start menu:

```bash
curl -X POST http://localhost:8080/webhook/whatsapp -H "Content-Type: application/json" -d "{\"from\":\"919888888888\",\"message\":\"/start\"}"
```

2. Select medicine:

```bash
curl -X POST http://localhost:8080/webhook/whatsapp -H "Content-Type: application/json" -d "{\"from\":\"919888888888\",\"message\":\"1\"}"
```

3. Send details:

```bash
curl -X POST http://localhost:8080/webhook/whatsapp -H "Content-Type: application/json" -d "{\"from\":\"919888888888\",\"message\":\"Name: Rahul\\nAge: 34\\nPrescription: Optional\\nMedicine: Paracetamol 650\\nDosageDays: 5\"}"
```

The system creates request like `MED-XXXXXX` and broadcasts to medicine providers.

## Provider Quote Test

Use one provider phone from seeded data (`919900000101`, `919900000102`):

```bash
curl -X POST http://localhost:8080/webhook/whatsapp -H "Content-Type: application/json" -d "{\"from\":\"919900000101\",\"message\":\"REQ_ID: MED-XXXXXX\\nPRICE: 32\\nETA_MIN: 30\\nIMAGE_URL: https://example.com/med.jpg\\nPROVIDER_NAME: Gupta Medicos\"}"
```

After enough quotes (or timeout), user receives ranked options and can confirm by replying with option number.

## Doctor Flow Test

1. User selects `3`
2. User sends:

```text
Name: Rahul
Age: 34
Symptoms: Fever
PreferredTime: 7 PM
```

3. User receives static doctors list and selects option number.
4. Selected doctor receives patient intake message.

## PostgreSQL Mode

1. Create database (example: `medsta`)
2. Set in `.env`:

```env
ENABLE_DB=true
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medsta
```

The server auto-runs SQL in `sql/schema.sql` on startup.

## Live WhatsApp Provider Setup

By default, the app runs in `mock` mode and logs outbound messages in console.

To enable live sending:

1. Set mode and provider in `.env`

```env
WHATSAPP_MODE=live
WHATSAPP_PROVIDER=interakt
```

2. Configure provider credentials:

### Interakt

```env
WHATSAPP_BASE_URL=https://api.interakt.ai
WHATSAPP_API_KEY=<your_interakt_api_key>
```

### AiSensy

```env
WHATSAPP_BASE_URL=https://backend.aisensy.com
WHATSAPP_API_KEY=<your_aisensy_api_key>
WHATSAPP_CAMPAIGN_NAME=<approved_campaign_name>
WHATSAPP_SENDER_ID=<optional_sender_label>
```

### WATI

```env
WHATSAPP_BASE_URL=https://live-mt-server.wati.io
WHATSAPP_API_TOKEN=<your_wati_token>
```

## Provider Webhook Verification

Use provider webhook endpoint:

- `POST /webhook/provider/interakt`
- `POST /webhook/provider/aisensy`
- `POST /webhook/provider/wati`

The backend normalizes provider payloads to internal shape (`from`, `message`) and forwards to the main engine.

Enable HMAC verification:

```env
WHATSAPP_WEBHOOK_VERIFY=true
```

Enable replay protection:

```env
WHATSAPP_WEBHOOK_REPLAY_PROTECT=true
WHATSAPP_WEBHOOK_MAX_SKEW_SECONDS=300
WHATSAPP_WEBHOOK_NONCE_TTL_SECONDS=600
```

Configure secrets:

```env
INTERAKT_WEBHOOK_SECRET=<interakt_secret>
AISENSY_WEBHOOK_SECRET=<aisensy_secret>
WATI_WEBHOOK_SECRET=<wati_secret>
```

If your provider uses a different signature header/prefix, override via:

```env
INTERAKT_WEBHOOK_SIGNATURE_HEADER=
INTERAKT_WEBHOOK_SIGNATURE_PREFIX=
AISENSY_WEBHOOK_SIGNATURE_HEADER=
AISENSY_WEBHOOK_SIGNATURE_PREFIX=
WATI_WEBHOOK_SIGNATURE_HEADER=
WATI_WEBHOOK_SIGNATURE_PREFIX=
```

If your provider uses different timestamp/nonce headers for replay defense, override via:

```env
INTERAKT_WEBHOOK_TIMESTAMP_HEADER=
INTERAKT_WEBHOOK_NONCE_HEADER=
AISENSY_WEBHOOK_TIMESTAMP_HEADER=
AISENSY_WEBHOOK_NONCE_HEADER=
WATI_WEBHOOK_TIMESTAMP_HEADER=
WATI_WEBHOOK_NONCE_HEADER=
```

Signed test example (Node):

```bash
node -e "const crypto=require('crypto');const body=JSON.stringify({phoneNumber:'919888888888',message:'/start'});const ts=Math.floor(Date.now()/1000).toString();const nonce='evt-001';const secret='test_secret';const sig=crypto.createHmac('sha256',secret).update(body).digest('hex');fetch('http://localhost:8080/webhook/provider/interakt',{method:'POST',headers:{'Content-Type':'application/json','x-interakt-signature':sig,'x-request-timestamp':ts,'x-request-id':nonce},body}).then(async r=>console.log(r.status,await r.text()));"
```

Replay behavior:

- First valid request: accepted
- Second request with same timestamp+nonce: rejected with `409 Replay request detected.`

Notes:

- Provider APIs differ by account plan and template/session policy.
- If your provider rejects free-form text, use approved templates and map fields in `src/integrations/whatsappGateway.js`.
- Keep `WHATSAPP_MODE=mock` for local development and parser testing.

## n8n / WhatsApp API Integration Notes

- Use env variables to select provider mode. No code changes are required for basic switching.
- Keep this app as your central state engine via webhook.
- n8n can orchestrate reminders, escalation, and retention campaigns by calling this backend.

## Failure Controls Included

- Strict provider quote format parser (rejects messy responses)
- Top 3 options only (decision control)
- Timeout-based aggregation fallback
- State lock to avoid late quote confusion

## Next Production Upgrades

- Auth for admin/debug routes
- Redis for distributed conversation state
- Queue system (BullMQ/RabbitMQ) for reliable outbound delivery
- SLA ranking and provider penalty scoring
- Real delivery status callbacks from WhatsApp provider
- Audit logging and analytics dashboard
# n8n-entropy-mesh
