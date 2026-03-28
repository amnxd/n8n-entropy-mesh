CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  user_phone TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB NOT NULL,
  selected_provider_phone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  provider_phone TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  eta_minutes INT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_type_status ON requests(type, status);
CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON quotes(request_id);
