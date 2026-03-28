const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

class PostgresRepo {
  constructor({ enabled, connectionString }) {
    this.enabled = enabled;
    this.pool = enabled ? new Pool({ connectionString }) : null;
  }

  async init() {
    if (!this.enabled) {
      return;
    }

    const schemaPath = path.join(process.cwd(), "sql", "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await this.pool.query(schemaSql);
  }

  async saveRequest(request) {
    if (!this.enabled) {
      return;
    }

    await this.pool.query(
      `
      INSERT INTO requests (id, user_phone, type, status, details, selected_provider_phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW(), NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        status = EXCLUDED.status,
        details = EXCLUDED.details,
        selected_provider_phone = EXCLUDED.selected_provider_phone,
        updated_at = NOW()
    `,
      [
        request.id,
        request.userPhone,
        request.type,
        request.status,
        JSON.stringify(request.details),
        request.selectedProviderPhone || null
      ]
    );
  }

  async saveQuote(quote) {
    if (!this.enabled) {
      return;
    }

    await this.pool.query(
      `
      INSERT INTO quotes (id, request_id, provider_phone, provider_name, price, eta_minutes, image_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO NOTHING
    `,
      [
        quote.id,
        quote.requestId,
        quote.providerPhone,
        quote.providerName,
        quote.price,
        quote.etaMinutes,
        quote.imageUrl
      ]
    );
  }
}

module.exports = { PostgresRepo };
