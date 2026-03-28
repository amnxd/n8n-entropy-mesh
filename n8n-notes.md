# n8n Integration Notes

Use n8n as an automation layer around this backend.

## Current WhatsApp Mode

- Local/dev: `WHATSAPP_MODE=mock` (outbound logs only)
- Live: `WHATSAPP_MODE=cloud` (Meta WhatsApp Cloud API)

Incoming WhatsApp messages should continue to hit this backend at `GET/POST /webhook/whatsapp`.

## MEDSTA -> n8n Trigger (Built In)

When a new request is created, MEDSTA can automatically POST to your n8n workflow webhook.

Set in `.env`:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/medsta-request-created
N8N_API_KEY=optional-shared-secret
N8N_TIMEOUT_MS=5000
```

If `N8N_API_KEY` is set, backend adds this header to n8n calls:

- `x-medsta-automation-key: <N8N_API_KEY>`

Recommended: add an `If` node in n8n right after Webhook to validate this header before continuing.

Payload sent to n8n:

```json
{
  "event": "request.created",
  "request": {
    "id": "REQ_MED_...",
    "userPhone": "9198...",
    "type": "MEDICINE",
    "sourceType": "MEDICINE",
    "status": "AWAITING_QUOTES",
    "details": {}
  },
  "targets": [
    {
      "phone": "9197...",
      "name": "Provider Name",
      "type": "medicine"
    }
  ],
  "emittedAt": "2026-03-28T00:00:00.000Z"
}
```

Type normalization sent by backend:

- `MEDICINE`, `LAB`, `DOCTOR`, `RADIOLOGY` unchanged
- `PHYSIO` is sent as `type: PHYSIOTHERAPY` and preserved as `sourceType: PHYSIO`

This keeps workflow naming user-friendly while retaining the original source value for audits.

If `N8N_WEBHOOK_URL` is not set, MEDSTA skips automation and continues normally.

Audit logs produced by backend:

- Success: `n8n workflow triggered for <REQ_ID> (<TYPE>) -> <TARGET_COUNT> targets`
- Non-2xx: `n8n webhook returned non-2xx for ...`
- Failure/timeout: `n8n webhook call failed for ...`

## Suggested Workflows

1. Request Created Router

- Trigger: Webhook (`request.created`)
- Action: Branch by `request.type`
- Action: Notify internal channels or CRM

2. Quote Escalation

- Trigger: Cron every 1 minute
- Action: GET `/debug/requests`
- Action: If pending too long, notify fallback providers/support

3. Retention

- Trigger: Cron or completed-request signal
- Action: Send follow-up and reorder reminder

4. Provider SLA Scoring

- Trigger: New quote/locked request events
- Action: Compute response delay and write score externally

## Important

- Keep phone numbers in E.164 style without extra symbols.
- Do not bypass this backend state machine from n8n.
