-- Shareable answers (/a/[id]) and learner feedback on them.
-- An answer is stored exactly as the learner saw it, so a shared link never re-runs the model or changes.
CREATE TABLE answers (
    id         TEXT PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{10}$'),
    question   TEXT NOT NULL CHECK (length(question) <= 300),
    result     JSONB NOT NULL,
    helpful    INTEGER NOT NULL DEFAULT 0 CHECK (helpful >= 0),
    unhelpful  INTEGER NOT NULL DEFAULT 0 CHECK (unhelpful >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_answers_recent ON answers (created_at DESC);
