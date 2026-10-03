-- Answer reuse: an identical question gets the stored answer back instead of another AI call.
-- question_key is the question normalised (src/lib/question-key.ts); lecture_id is the session an Ask was
-- scoped to (NULL = the whole library), so a session-scoped answer is never served to a library-wide ask.
-- Older rows have NULLs, so they are never matched. Backwards compatible: code from before this migration
-- keeps working (it just doesn't fill the new columns).
ALTER TABLE answers ADD COLUMN question_key TEXT;
ALTER TABLE answers ADD COLUMN lecture_id UUID;
CREATE INDEX idx_answers_cache ON answers (question_key, created_at DESC) WHERE question_key IS NOT NULL;
