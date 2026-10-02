-- "Try it with your own video" (/try): public trial sessions. A trial is an ordinary lecture row that is
-- always unlisted and expires; src/lib/trials.ts deletes it (and its Cloudinary assets) after expiry.
-- trial_ip_hash (salted SHA-256, like ask_requests) only rate-limits trials per network.
ALTER TABLE lectures ADD COLUMN trial_expires_at TIMESTAMPTZ;
ALTER TABLE lectures ADD COLUMN trial_ip_hash TEXT;
ALTER TABLE lectures ADD CONSTRAINT trials_stay_unlisted CHECK (trial_expires_at IS NULL OR visibility = 'unlisted');
CREATE INDEX idx_lectures_trials ON lectures (created_at) WHERE trial_expires_at IS NOT NULL;
