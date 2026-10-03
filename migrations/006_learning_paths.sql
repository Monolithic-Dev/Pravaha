-- Learning Paths (/learn, shared at /p/[id]): a topic turned into an ordered micro-course of moments from
-- across the library, stitched into one Cloudinary video. Stored exactly as generated, like answers.
CREATE TABLE learning_paths (
    id         TEXT PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{10}$'),
    topic      TEXT NOT NULL CHECK (length(topic) <= 200),
    result     JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_learning_paths_recent ON learning_paths (created_at DESC);
