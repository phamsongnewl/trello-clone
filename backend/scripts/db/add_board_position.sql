-- Migration: add position column to boards
ALTER TABLE boards ADD COLUMN IF NOT EXISTS position FLOAT;

-- Back-fill existing boards: assign evenly-spaced positions based on createdAt order
UPDATE boards
SET position = sub.new_pos
FROM (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY "createdAt" ASC) * 1000 AS new_pos
  FROM boards
) AS sub
WHERE boards.id = sub.id;
