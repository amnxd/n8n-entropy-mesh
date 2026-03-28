# Local Testing Guide (Before Going Live)

Test the MEDSTA automation locally before deploying to production.

## Setup (5 minutes)

1. **Install dependencies**:

```bash
npm install
```

2. **Copy environment file**:

```bash
copy .env.example .env
```

3. **Verify defaults** (mock mode is safe):

```bash
cat .env
```

Should show:

```
WHATSAPP_MODE=mock
WHATSAPP_PROVIDER=mock
```

4. **Start server**:

```bash
npm start
```

Expected output:

```
MEDSTA automation server running on port 8080
```

## Test: User Entry (Medicine Order)

### 1. Send /start command

```bash
node -e "fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919888888888',message:'/start'})}).then(r=>r.json()).then(console.log)"
```

**Expected output**:

```json
{
  "ok": true,
  "result": {
    "role": "user",
    "reply": "Welcome menu sent."
  }
}
```

In terminal running npm start, you'll see:

```
WHATSAPP -> 919888888888
👋 Welcome to MEDSTA – Healthcare at Home
...
1️⃣ Order Medicines
2️⃣ Book Lab Test at Home
...
```

### 2. Select Medicine (Option 1)

```bash
node -e "fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919888888888',message:'1'})}).then(r=>r.json()).then(console.log)"
```

**Expected**: Prompt for medicine details

### 3. Send Medicine Details

```bash
node -e "fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919888888888',message:'Name: Rahul\\nAge: 34\\nPrescription: None\\nMedicine: Paracetamol 650\\nDosageDays: 5'})}).then(r=>r.json()).then(console.log)"
```

**Expected**:

```json
{
  "ok": true,
  "result": {
    "role": "user",
    "reply": "Request MED-XXXXXX broadcasted."
  }
}
```

In terminal, you'll see broadcast messages to all medicine providers:

```
WHATSAPP -> 919900000101
📢 MEDSTA REQUEST
Request ID: MED-ABC123
...
```

## Test: Provider Quote Response

### 1. Simulate Provider Quote (from pharmacy number)

```bash
node -e "const crypto=require('crypto');const body='REQ_ID: MED-ABC123\\nPRICE: 32\\nETA_MIN: 30\\nIMAGE_URL: https://example.com/med.jpg\\nPROVIDER_NAME: Gupta Medicos';fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919900000101',message:body})}).then(r=>r.json()).then(console.log)"
```

**Expected**: Quote accepted

### 2. Check Aggregated Options Sent to User

After receiving 3 quotes (or 2-minute timeout), the user gets options:

```bash
node -e "fetch('http://localhost:8080/debug/requests').then(r=>r.json()).then(console.log)"
```

Look for your request with status `AWAITING_USER_SELECTION` and quotes array.

## Test: User Selects Quote

```bash
node -e "fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919888888888',message:'1'})}).then(r=>r.json()).then(console.log)"
```

**Expected**: Order confirmed to user and selected provider.

## Test: Doctor Flow

### 1. Start and Select Doctor

```bash
node -e "fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919999999999',message:'/start'})}).then(r=>r.json()).then(console.log)"
```

Then select `3`:

```bash
node -e "fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919999999999',message:'3'})}).then(r=>r.json()).then(console.log)"
```

### 2. Send Patient Details

```bash
node -e "fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919999999999',message:'Name: Priya\\nAge: 28\\nSymptoms: Migraine\\nPreferredTime: 6 PM'})}).then(r=>r.json()).then(console.log)"
```

### 3. Select Doctor

```bash
node -e "fetch('http://localhost:8080/webhook/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'919999999999',message:'1'})}).then(r=>r.json()).then(console.log)"
```

**Expected**: Doctor booked confirmation.

## Test: Webhook Signature (Before Live)

If you enabled `WHATSAPP_WEBHOOK_VERIFY=true` in `.env`:

### 1. Test Signed Request

```bash
node -e "const crypto=require('crypto');const body=JSON.stringify({phoneNumber:'919888888888',message:'/start'});const sig=crypto.createHmac('sha256','test_secret').update(body).digest('hex');fetch('http://localhost:8080/webhook/provider/interakt',{method:'POST',headers:{'Content-Type':'application/json','x-interakt-signature':sig},body}).then(r=>console.log(r.status)).catch(e=>console.log('Error:',e.message))"
```

**Expected**: Status 200 (signature verified)

### 2. Test Bad Signature (Should Fail)

```bash
node -e "const body=JSON.stringify({phoneNumber:'919888888888',message:'/start'});fetch('http://localhost:8080/webhook/provider/interakt',{method:'POST',headers:{'Content-Type':'application/json','x-interakt-signature':'bad_sig'},body}).then(r=>console.log(r.status)).catch(e=>console.log('Error:',e.message))"
```

**Expected**: Status 401 (signature rejected)

## View All Requests

At any time, check all requests (local memory only):

```bash
node -e "fetch('http://localhost:8080/debug/requests').then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))"
```

## Common Issues

### "Cannot find module express"

```bash
npm install
```

### Port 8080 already in use

```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill it (Windows)
taskkill /PID <PID> /F
```

Or use a different port:

```bash
PORT=3000 npm start
```

### TypeError in JSON parsing

Make sure newlines in message bodies use `\\n`:

```
Name: Rahul\nAge: 34
```

### Node version too old

Check version:

```bash
node --version
```

Needs 16+. Update from https://nodejs.org

## Mockups vs Real

**Local (mock mode)**:

- No real WhatsApp messages sent
- Outbound messages logged to console
- Perfect for testing flows

**Live (with real provider)**:

- Replace `WHATSAPP_PROVIDER=mock` with `interakt|aisensy|wati`
- Add real credentials
- Messages actually sent to WhatsApp

See [DEPLOYMENT.md](DEPLOYMENT.md) for live setup.

## Next Steps

Once local tests pass:

1. Choose provider ([DEPLOYMENT.md](DEPLOYMENT.md#step-1-choose-your-whatsapp-provider))
2. Get credentials
3. Deploy to Railway/Heroku ([DEPLOYMENT.md](DEPLOYMENT.md#step-2-deploy-backend))
4. Follow [CHECKLIST.md](CHECKLIST.md)
5. Go live!
