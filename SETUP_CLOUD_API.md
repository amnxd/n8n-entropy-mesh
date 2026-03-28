# 🎉 MEDSTA WhatsApp Automation - 100% FREE Setup

This guide shows you how to set up MEDSTA with **Meta's WhatsApp Cloud API** - completely FREE, no per-message costs, no vendor lock-in.

## What's Included (All FREE)

✅ **Meta WhatsApp Cloud API** - Free forever  
✅ **Node.js Backend** - Open source, free  
✅ **Your Server** - You control it (free or paid, your choice)  
✅ **Automation** - Use n8n (self-hosted, free) if needed  
✅ **Database** - Optional (PostgreSQL free)

## Setup Steps (15 minutes)

### Step 1: Create Meta Business Account (FREE)

1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create Account"
3. Enter your business name and email
4. Complete the setup wizard

### Step 2: Create WhatsApp Business App (FREE)

1. In Business Manager, go to **Apps** → **My Apps**
2. Click **Create App**
3. Choose **Business** as app type
4. Name: `MEDSTA` (or anything)
5. Complete the setup
6. Look for **WhatsApp** product and add it

### Step 3: Add Your Phone Number (FREE)

1. Go to **WhatsApp** product settings
2. Click **Getting Started**
3. Click **Start using the API** OR **Manage phone number list**
4. Choose: **Use your own phone number**
5. Enter your WhatsApp Business phone number (usually your business cell)
6. Verify ownership (Meta will send WhatsApp message)
7. **Save** the **Phone Number ID** (looks like: `102391847320123`)

### Step 4: Get Access Token (FREE)

1. In Business Manager, go to **Settings** → **Accounts** → **System Users**
2. Create new System User (if you don't have one):
   - Name: `MEDSTA API`
   - Role: `Admin`
3. Click the system user
4. Go to **Apps** tab
5. Click **Generate New Token**
6. Select your WhatsApp app
7. Choose permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_account_management`
8. **Copy the token** (you'll need this!)

> **⚠️ Token looks like:** `EAABaB...xyz123abc` (long string)

### Step 5: Test Locally (FREE)

Create `.env` file with mock mode (no credentials needed):

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=8080
WHATSAPP_MODE=mock
```

Run server:

```bash
npm start
```

Test on your phone:

1. Open WhatsApp
2. Send any message to test phone number
3. Watch the console - you'll see the message logged

Example output:

```
📱 MOCK WHATSAPP -> 919876543210

Healthcare - Let's get you the right care. What service do you need?
1️⃣  Medicine Delivery
2️⃣  Lab Tests
3️⃣  Doctor Consultation
...
```

### Step 6: Go Production (Still FREE!)

Update `.env`:

```bash
WHATSAPP_MODE=cloud
WHATSAPP_PHONE_NUMBER_ID=102391847320123
WHATSAPP_ACCESS_TOKEN=EAABaB...xyz123abc
WHATSAPP_WEBHOOK_VERIFY_TOKEN=my_random_token_12345
WHATSAPP_WEBHOOK_SECRET=my_webhook_secret_12345
WHATSAPP_WEBHOOK_VERIFY=true
```

### Step 7: Deploy to Your Server (FREE or Cheap)

Choose one:

#### Option A: Free - Deploy on Replit.com

1. Push code to GitHub
2. Go to [replit.com](https://replit.com)
3. Import from GitHub
4. Add secrets (.env variables)
5. Click Run
6. Share the URL

#### Option B: Cheap - Railway.app ($5/month)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. New Project → GitHub Repo
4. Add variables
5. Deploy (auto-deploys on git push)

#### Option C: Your VPS

1. SSH to your server
2. Clone: `git clone <your-repo>`
3. `npm install`
4. Add `.env` file with production credentials
5. `npm start` (or use PM2/systemd for persistence)

**Get your public URL:**

```
https://yourdomain.com/
https://your-railway-url.up.railway.app/
https://your-replit-url.replit.dev/
```

### Step 8: Configure Webhook in Meta Dashboard

1. Go to **WhatsApp** product → **Configuration**
2. Under **Webhooks**, click **Edit**
3. **Callback URL**: `https://your-domain.com/webhook/whatsapp`
4. **Verify Token**: `my_random_token_12345` (same as .env)
5. Click **Edit** under **Webhook Fields**
6. Select: `messages`, `message_status`, `message_template_status_update`
7. Click **Verify and Save**

### Step 9: Test End-to-End

1. Open WhatsApp
2. Send message to your business number: `/start`
3. You'll see menu:

```
Healthcare - Let's get you the right care. What service do you need?
1️⃣  Medicine Delivery
2️⃣  Lab Tests
...
```

4. Send: `1` → You'll get medicine form
5. Complete the flow!

## Cost Breakdown (For Reference)

| Item                  | Cost        | Notes                                           |
| --------------------- | ----------- | ----------------------------------------------- |
| WhatsApp Cloud API    | **FREE**    | No per-message cost, conversation starters free |
| Meta Business Account | **FREE**    | Forever free                                    |
| Server (self-hosted)  | FREE-$30/mo | Your choice (Replit is free)                    |
| Database (optional)   | FREE-$20/mo | PostgreSQL optional                             |
| Domain (optional)     | $1-15/yr    | Optional, can use free subdomain                |
| **TOTAL**             | **FREE**    | Yes, completely free!                           |

## Optional: Add Automation with n8n (FREE Self-Hosted)

### What is n8n?

**n8n** is a workflow automation tool with TWO pricing models:

| Version         | Cost         | Best For                     |
| --------------- | ------------ | ---------------------------- |
| **Self-Hosted** | **FREE** ✅  | Your setup (Replit, local)   |
| Cloud (n8n.io)  | $20-1000+/mo | Managed hosting (not needed) |

**Use the self-hosted version** — it's open-source and completely free!

### Setup n8n Self-Hosted

```bash
# Option A: Docker (Easiest)
docker run -it -p 5678:5678 -v ~/.n8n:/root/.n8n \
  docker.io/n8nio/n8n:latest

# Option B: npm (if Docker not available)
npm install -g n8n
n8n start
```

Open [http://localhost:5678](http://localhost:5678) and create your account

### Create Your First Workflow

1. Create new workflow
2. Add trigger: **Webhook** (MEDSTA will call this)
3. Add action: **Execute any code** or **Call API** (call your providers)
4. Configure routes for different request types

**Example Workflow: Auto-forward consultations**

```
Trigger: Webhook from MEDSTA (request created)
  ↓
Extract: type (doctor_consultation), user details
  ↓
Branch: if type == doctor_consultation
  ↓
Action: Send notification to available doctors
  ↓
Action: Log to database
```

**Cost?** $0/month (runs on your server, no per-message fees)

## Differences from Paid Providers

| Feature          | Meta Cloud API          | Paid Providers |
| ---------------- | ----------------------- | -------------- |
| Cost             | ✅ **FREE**             | ❌ $25-100/mo  |
| Setup Complexity | ✅ **Simple** (5 steps) | ❌ Complex     |
| Vendor Lock-in   | ✅ **No**               | ❌ Yes         |
| Official Support | ✅ Meta docs            | ❌ Depends     |
| Reliability      | ✅ 99.9% SLA            | ✅ 99.9% SLA   |
| Rate Limits      | ✅ Generous             | ✅ Same        |

## Troubleshooting

### Messages not sending?

- Check `WHATSAPP_ACCESS_TOKEN` is correct
- Check `WHATSAPP_PHONE_NUMBER_ID` is correct
- Check phone number has + prefix: `+919876543210`

### Webhook not receiving messages?

- Make sure `WHATSAPP_WEBHOOK_VERIFY=true`
- Check callback URL is publicly accessible
- Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches Meta dashboard

### "Invalid signature" error?

- Make sure `WHATSAPP_WEBHOOK_SECRET` matches Meta dashboard
- Secret must be same on both sides

### How to test webhook locally?

See [LOCAL_TESTING.md](./LOCAL_TESTING.md) for curl examples

## Next Steps

1. ✅ Complete setup above
2. 📖 Read [MEDSTA_PHASES.md](./MEDSTA_PHASES.md) to understand 10-phase flow
3. 🚀 Deploy to production
4. 🔄 Optional: Add n8n for advanced automation
5. 📊 Monitor usage in Meta Business Dashboard

## FAQ

**Q: Is this really free forever?**  
A: Yes! Meta's WhatsApp Cloud API has no per-message costs for conversation starters. You only pay for message template costs for session messages (very cheap). Complete setup is FREE.

**Q: Can I use my existing WhatsApp number?**  
A: No, you need a WhatsApp Business number. But it's free to create.

**Q: What if I need to migrate to another platform later?**  
A: Your code is vendor-agnostic. We just use Meta's Cloud API HTTP endpoints. Easy to migrate.

**Q: Can I use this for commercial purposes?**  
A: Yes! No restrictions on business use.

**Q: What's the maximum message volume?**  
A: Depends on your server. Meta doesn't limit API calls for Cloud API.

---

**Questions?** Check [DOCS_MAP.md](./DOCS_MAP.md) for more guides.

**Ready to go live?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup.
