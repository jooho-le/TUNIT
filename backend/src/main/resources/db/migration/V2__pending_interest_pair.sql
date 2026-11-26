-- Approved 2026-11-27: one PENDING request per unordered pair; terminal history is retained.
-- Existing duplicates cause migration failure for manual review, never silent data deletion.
CREATE UNIQUE INDEX uq_pending_interest_pair
ON interest_requests (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id))
WHERE status = 'PENDING';
