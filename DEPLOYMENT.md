# MEDSTA WhatsApp Automation - Live Deployment Guide

This guide walks you through getting your WhatsApp automation live with your phone number, end-to-end.

## Prerequisites

- Node.js 16+ installed locally
- Git installed
- A WhatsApp Business Account (or ability to create one)
- A cloud account (Railway, Heroku, AWS, Azure, or similar)
- Your phone number in E.164 format (e.g., `919999999999` for India +91-9999999999)

## Step 1: Choose Your WhatsApp Provider

You have three options. Pick one based on your budget and feature needs.

### Option A: Interakt (Recommended for India)

**Pros**: Simple API, good for India, affordable
**Cons**: Lower throughput tier limits

#### A1: Sign Up

1. Go to https://www.interakt.ai
2. Click "Get Started" or "Sign Up"
3. Verify email
4. Create workspace
5. Add phone number for verification

#### A2: Get Your Credentials

1. Dashboard → Settings → API Keys
2. Copy your **API Key** (starts with `ixp_`)
3. Your base URL is always: `https://api.interakt.ai`

#### A3: Approve Your First Message Template

Interakt requires message templates for certain flows. Go to:

1. Dashboard → Templates
2. Create a new template with name: `medsta_welcome`
3. Body:

```
Welcome to MEDSTA – Healthcare at Home.

No need to travel or wait. We help with:
1. Medicines
2. Lab Tests
3. Doctor Consultation
4. Physiotherapy
5. Radiology

Reply with number.
```

4. Submit for approval (takes 10 min - 24 hours)

**Note**: For now, use free-form messages since your app controls the text. Interakt allows free text in user-to-business flows.

---

### Option B: AiSensy (Good for Global)

**Pros**: Global coverage, good uptime
**Cons**: More setup steps, template requirement strict

#### B1: Sign Up

1. Go to https://www.aisensy.com
2. Click "Sign Up"
3. Verify phone and email
4. Create account

#### B2: Get Credentials

1. Dashboard → Integrations → API
2. Copy **API Key** (looks like `key_xxxxx`)
3. Your base URL: `https://backend.aisensy.com`

#### B3: Create Campaign

1. Dashboard → Campaigns
2. Create new campaign: `medsta`
3. Select channel: WhatsApp
4. Add phone number
5. Copy **Campaign Name** (you'll need this)

#### B4: Create Message Template

1. Go to Campaign → Templates
2. Create template `welcome_template`
3. Type: Text
4. Body: Your welcome message
5. Save and submit for approval

---

### Option C: WATI (Good for High Volume)

**Pros**: High throughput, rich media support
**Cons**: Slightly higher cost

#### C1: Sign Up

1. Go to https://www.wati.io
2. Sign up with email
3. Verify account

#### C2: Get Credentials

1. Dashboard → Settings → API Token
2. Copy token (starts with `Bearer`)
3. Your base URL: `https://live-mt-server.wati.io`

#### C3: Connect Phone

1. Settings → Phone Numbers
2. Add your business WhatsApp number
3. Scan QR code with WhatsApp Business app
4. Verify

---

## Step 2: Deploy Backend

Choose one deployment option:

### Option 1: Railway (Easiest, ≈$5/mo)

#### 1. Prepare Code

```bash
cd c:\Users\bud\Documents\code\medsta-whatsapp
git init
git add .
git commit -m "Initial MEDSTA automation"
```

#### 2. Create GitHub Repo

1. Go to https://github.com/new
2. Name: `medsta-whatsapp`
3. Create public repo
4. Follow push instructions to upload code

#### 3. Deploy with Railway

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway
4. Click "New Project"
5. Select "Deploy from GitHub repo"
6. Choose `medsta-whatsapp`
7. Wait for auto-deploy

#### 4. Configure Environment

1. Railway Dashboard → Your Project → Settings
2. Add Variables:

```
PORT=8080
ENABLE_DB=false
WHATSAPP_MODE=live
WHATSAPP_PROVIDER=interakt  # or aisensy or wati
WHATSAPP_BASE_URL=https://api.interakt.ai
WHATSAPP_API_KEY=<your_api_key_here>
WHATSAPP_WEBHOOK_VERIFY=true
INTERAKT_WEBHOOK_SECRET=<long_random_string>
```

To generate a webhook secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output example: `a1b2c3d4e5f6...` (copy this)

#### 5. Get Your Deployment URL

1. Railway Dashboard → Deployments tab
2. Copy the URL (looks like `https://medsta-whatsapp-production.up.railway.app`)
3. This is your `DEPLOYMENT_URL`

---

### Option 2: Heroku (Needs Credit Card)

#### 1. Install Heroku CLI

```bash
npm install -g heroku
heroku login
```

#### 2. Create App

```bash
cd c:\Users\bud\Documents\code\medsta-whatsapp
heroku create medsta-whatsapp
```

#### 3. Set Environment Variables

```bash
heroku config:set WHATSAPP_MODE=live
heroku config:set WHATSAPP_PROVIDER=interakt
heroku config:set WHATSAPP_BASE_URL=https://api.interakt.ai
heroku config:set WHATSAPP_API_KEY=<your_key>
heroku config:set WHATSAPP_WEBHOOK_VERIFY=true
heroku config:set INTERAKT_WEBHOOK_SECRET=<random_secret>
```

#### 4. Deploy

```bash
git push heroku main
```

Get your URL:

```bash
heroku info
```

Look for "Web URL"

---

### Option 3: AWS Lambda + API Gateway (Serverless)

This is more complex. Use Railway/Heroku first, then upgrade if needed.

---

## Step 3: Configure Webhook

Your provider needs to know where to send inbound messages.

### For Interakt

1. Dashboard → Webhooks / Settings → Webhooks
2. Webhook URL: `https://<DEPLOYMENT_URL>/webhook/provider/interakt`
3. Events: Message received
4. Copy the **Webhook Secret** they show
5. Add to your deployment env vars:

```
INTERAKT_WEBHOOK_SECRET=<their_webhook_secret>
```

### For AiSensy

1. Dashboard → Campaign → Webhooks
2. Webhook URL: `https://<DEPLOYMENT_URL>/webhook/provider/aisensy`
3. Events: Incoming Message
4. Enable signature verification
5. Copy secret → set in env var:

```
AISENSY_WEBHOOK_SECRET=<their_secret>
```

### For WATI

1. Dashboard → API → Webhooks
2. Webhook URL: `https://<DEPLOYMENT_URL>/webhook/provider/wati`
3. Events: Incoming Messages
4. Enable HMAC verification
5. Copy secret → set in env var:

```
WATI_WEBHOOK_SECRET=<their_secret>
```

---

## Step 4: Test End-to-End

### 4A: Health Check

Open in browser or curl:

```bash
https://<DEPLOYMENT_URL>/health
```

You should see:

```json
{ "ok": true, "service": "medsta-whatsapp-automation" }
```

### 4B: Send Test Message with Your Real Number

1. Open WhatsApp on your phone
2. Go to your provider's business WhatsApp number in your contacts
3. Send: `/start`
4. **Expected response**: Welcome menu with 6 options

If you get no response:

- Check provider logs for webhook delivery errors
- Check deployment logs:
  - Railway: Logs tab
  - Heroku: `heroku logs --tail`
- Verify webhook URL is exactly correct (trailing slash matters)

### 4C: Test Full Medicine Flow

Send from your phone:

```
1
```

Expected: Prompt for medicine details

Send:

```
Name: Rahul
Age: 34
Prescription: None
Medicine: Paracetamol 650
DosageDays: 5
```

Expected: Request ID created (e.g., `MED-ABC123`)

### 4D: Test Provider Quote Flow

To fully test quotes, you need a provider account. For now, verify the request was logged:

```bash
https://<DEPLOYMENT_URL>/debug/requests
```

You should see your request with `AWAITING_QUOTES` status.

---

## Step 5: Configure Your Business Phone

Return to your provider dashboard and complete:

1. **Link your WhatsApp Business Account**
   - Interakt: Settings → WhatsApp Account → Link
   - AiSensy: Connect WhatsApp Business Phone
   - WATI: Phone Numbers → Verify

2. **Add Your Real Phone Number**
   - Format: `919999999999` (India) or `+1234567890` (US)
   - This is where users will message you

3. **Approve Sender ID (if needed)**
   - Some providers require approval
   - Add company name
   - Submit for review

---

## Step 6: Go Live

### 6A: Share Your WhatsApp Number

Users can now message your WhatsApp Business number. They'll:

1. Send any message
2. Receive welcome menu
3. Select service → provide details → get quotes → select → done

### 6B: Monitor

Check logs daily:

```bash
# Railway
Railway Dashboard → Logs

# Heroku
heroku logs --tail
```

Watch for:

- Queue timeouts
- Provider API errors
- Malformed webhook payloads

---

## Step 7: Add Admin Auth (Production)

Right now, `/debug/requests` is public. Add auth:

In `.env` on your deployment:

```
ADMIN_TOKEN=<random_long_string>
```

Example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add middleware stub in `src/app.js` (I'll create this if you ask).

---

## Troubleshooting

### Webhook not delivering

1. Provider logs → check delivery attempts
2. Check signature header name matches exactly
3. Verify raw body is being sent (not parsed JSON first)
4. Test locally with mock mode first

### No response to user message

1. Check `https://<DEPLOYMENT_URL>/health` returns 200
2. Verify webhook secret matches provider settings
3. Check deployment logs for errors
4. Test with `/webhook/whatsapp` endpoint directly:

```bash
node -e "fetch('https://<URL>/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919999999999',message:'/start'})}).then(r=>r.json()).then(console.log)"
```

### Timeout on provider API

Increase timeout in `.env`:

```
WHATSAPP_TIMEOUT_MS=30000
```

### Quote not sending to providers

1. Verify at least one provider phone is in `src/data/providers.js`
2. Check quote timeout: `QUOTE_TIMEOUT_SECONDS=120` (increase if needed)
3. Manually test provider quote path to make sure quotes are received

---

## Next Steps (Production)

1. **Add PostgreSQL** for request persistence
   - Create AWS RDS instance
   - Set `ENABLE_DB=true`
   - Set `DATABASE_URL` to RDS connection string

2. **Add Redis** for distributed state
   - For multi-instance deployments
   - Replace in-memory `replaySeen` with Redis store

3. **Setup Monitoring**
   - Sentry (error tracking)
   - Datadog (metrics)
   - CloudWatch (AWS logs)

4. **Add Analytics**
   - Track requests by type
   - Provider response times
   - User drop-off points

5. **Implement n8n** for advanced workflows
   - Auto-escalation after timeout
   - Reminder messages
   - Feedback collection

---

## Support

If deployment fails:

1. Share error message from logs
2. Share which provider you chose
3. Share which deployment platform
4. I can debug and adjust

Good luck! 🚀
