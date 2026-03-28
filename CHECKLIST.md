# MEDSTA WhatsApp Automation - Deployment Checklist

Print this and check off as you go.

## Phase 1: Choose Provider

- [ ] Decided: Interakt / AiSensy / WATI
- [ ] Signed up for provider account
- [ ] Verified email/phone
- [ ] Access to provider dashboard

## Phase 2: Get Credentials

For **Interakt**:

- [ ] API Key: `___________________________`
- [ ] Dashboard URL: `https://api.interakt.ai`

For **AiSensy**:

- [ ] API Key: `___________________________`
- [ ] Campaign Name: `___________________________`
- [ ] Dashboard URL: `https://backend.aisensy.com`

For **WATI**:

- [ ] API Token: `___________________________`
- [ ] Dashboard URL: `https://live-mt-server.wati.io`

## Phase 3: Setup Message Template

- [ ] Created template in provider dashboard
- [ ] Template approved (or in pending state)
- [ ] Template name noted: `___________________________`

## Phase 4: Deploy Backend

### Option A: Railway

- [ ] Created GitHub account (if needed)
- [ ] Pushed code to GitHub repo
- [ ] Logged into Railway.app
- [ ] Connected GitHub repo to Railway
- [ ] Deployment completed
- [ ] Railway URL: `https://___________________________`

### Option B: Heroku

- [ ] Installed Heroku CLI
- [ ] Ran `heroku create`
- [ ] Set environment variables
- [ ] App deployed
- [ ] Heroku URL: `https://___________________________`

### Option C: AWS/Other

- [ ] Deployed to EC2 / AppRunner / Lambda
- [ ] Server running on port 8080
- [ ] Public URL accessible: `https://___________________________`

## Phase 5: Configure Environment

In your deployment dashboard, set:

**Basic Config**

```
ENABLE_DB=false
WHATSAPP_MODE=live
WHATSAPP_PROVIDER=<interakt|aisensy|wati>
```

**Provider Credentials**

```
WHATSAPP_BASE_URL=<provider_base_url>
WHATSAPP_API_KEY=<your_api_key>
WHATSAPP_API_TOKEN=<your_token>
WHATSAPP_CAMPAIGN_NAME=<if_aisensy>
```

**Webhook Security**

```
WHATSAPP_WEBHOOK_VERIFY=true
<PROVIDER>_WEBHOOK_SECRET=<random_secret>
```

- [ ] All env vars set
- [ ] Deployment restarted
- [ ] Health check passes: `https://<URL>/health`

## Phase 6: Configure Webhook

In provider dashboard:

- [ ] Set webhook URL: `https://<DEPLOYMENT_URL>/webhook/provider/<interakt|aisensy|wati>`
- [ ] Enable webhook signing
- [ ] Copy webhook secret to env var
- [ ] Redeployed backend
- [ ] Webhook test message sent and received

## Phase 7: Link WhatsApp Business Number

In provider dashboard:

- [ ] WhatsApp Business account linked
- [ ] Your phone number added: `919___________`
- [ ] Phone verified
- [ ] Business profile complete

## Phase 8: Test with Real Number

From your WhatsApp phone:

- [ ] Sent `/start` to business number
- [ ] Received welcome menu (6 options)
- [ ] Selected option `1` (Medicine)
- [ ] Received form prompt
- [ ] Sent details in correct format
- [ ] Received request ID confirmation

## Phase 9: Monitor

- [ ] Set up log viewing (Railway/Heroku)
- [ ] Added monitoring alerts (optional)
- [ ] Checked `/debug/requests` endpoint
- [ ] Verified request status is `AWAITING_QUOTES`

## Phase 10: Go Live

- [ ] Shared WhatsApp business number with users
- [ ] Monitor first 24 hours for errors
- [ ] Check daily for webhook failures
- [ ] Collect user feedback

---

## Useful Commands

Check if running:

```bash
curl https://<DEPLOYMENT_URL>/health
```

View all requests:

```bash
curl https://<DEPLOYMENT_URL>/debug/requests
```

Generate random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Emergency Contacts

**If deployment fails:**

1. Check deployment logs (Railway Logs tab / Heroku logs)
2. Verify all env variables are set
3. Restart deployment
4. Check https://status.rw.railway.app or https://status.heroku.com

**If webhook not working:**

1. Check provider webhook delivery logs
2. Verify webhook URL is exactly correct
3. Verify webhook secret matches
4. Check signature header name

**If users not getting responses:**

1. Check backend health
2. Verify phone number format is E.164
3. Check provider phone verification status
4. Clear message queues and retry

---

## Timeline

- Provider signup: **10 min**
- Get credentials: **5 min**
- Deploy backend: **15 min** (Railway) / **30 min** (Heroku)
- Configure webhook: **10 min**
- End-to-end test: **10 min**
- **Total: ~1 hour**

Good luck! 🚀
