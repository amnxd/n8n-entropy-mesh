# n8n Entropy Mesh

Event-driven orchestration project that couples a Node.js request engine with n8n workflow automation for secure routing, validation, and operational fallback handling.

## Overview

This repository provides a production-oriented orchestration baseline where:

- inbound requests are validated and normalized in the backend
- events are emitted to n8n through a webhook contract
- n8n enforces key validation and controlled branching
- unsupported or unauthorized events are handled through explicit fallback paths

## Architecture

Core components:

- Node.js service layer for request lifecycle and provider broadcast
- n8n workflow for event routing and automation control
- optional PostgreSQL persistence for durable request and quote state

Primary flow:

1. request is created in backend
2. backend emits `request.created` to n8n webhook
3. n8n validates automation key
4. n8n routes by service type across 5 branches
5. n8n returns standardized webhook response

## Workflow Capabilities

- key-gated webhook entry
- event gate (`request.created`)
- service routing branches:
  - MEDICINE
  - LAB
  - DOCTOR
  - PHYSIOTHERAPY
  - RADIOLOGY
- unauthorized response path
- fallback response path for unsupported events or service values

## Project Structure

- `src/` backend services, routing logic, and integrations
- `sql/` database schema assets
- `n8n-workflows/` workflow-related assets
- hardened n8n workflow export JSON (single canonical file)

## Local Setup

Install dependencies:

```bash
npm install
```

Run backend:

```bash
npm start
```

Run n8n in a separate terminal:

```bash
n8n start
```

## Configuration

Set the automation webhook and shared key in local environment configuration.

Required automation variables:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/<workflow-path>
N8N_API_KEY=<shared-secret>
N8N_TIMEOUT_MS=5000
```

Ensure the same shared secret is used in backend and in the n8n workflow key-validation condition.

## API Surface

- `GET /health`
- `POST /webhook/<channel>`
- `GET /debug/requests`
- `POST /admin/complete/:requestId`

## Operational Notes

- keep a single canonical workflow export and avoid parallel variants
- publish workflow updates with explicit version notes
- keep fallback path enabled for unsupported event or service payloads
- validate execution traces in n8n after each workflow revision

## Documentation

Additional operational context:

- [n8n-notes.md](./n8n-notes.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [LOCAL_TESTING.md](./LOCAL_TESTING.md)
