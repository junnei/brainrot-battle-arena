-- Drop existing table if it exists
DROP TABLE IF EXISTS battles;

-- Create the battles table
CREATE TABLE battles (
  id TEXT PRIMARY KEY, -- 10자리 16진수 ID를 저장하기 위해 TEXT 타입 사용
  player_brainrot_id TEXT REFERENCES brainrots(id) NOT NULL,
  opponent_brainrot_id TEXT REFERENCES brainrots(id) NOT NULL,
  winner_id TEXT REFERENCES brainrots(id),
  battle_result TEXT,           -- 'WIN', 'LOSS', 'DRAW'
  battle_narrative TEXT,        -- 전투 과정 텍스트
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_battles_player_brainrot_id ON battles(player_brainrot_id);
CREATE INDEX idx_battles_opponent_brainrot_id ON battles(opponent_brainrot_id);
CREATE INDEX idx_battles_winner_id ON battles(winner_id);
CREATE INDEX idx_battles_created_at ON battles(created_at);

-- Permissions
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

-- Policy to allow read access to any authenticated user
CREATE POLICY battles_select_policy ON battles 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow insert to own battles
CREATE POLICY battles_insert_policy ON battles 
  FOR INSERT WITH CHECK (
    auth.uid()::text = (
      SELECT user_id FROM brainrots WHERE id = player_brainrot_id
    )
  );

-- Policy for updates (restrict to creator)
CREATE POLICY battles_update_policy ON battles 
  FOR UPDATE USING (
    auth.uid()::text = (
      SELECT user_id FROM brainrots WHERE id = player_brainrot_id
    )
  );

-- Policy for deletes (restrict to creator)
CREATE POLICY battles_delete_policy ON battles 
  FOR DELETE USING (
    auth.uid()::text = (
      SELECT user_id FROM brainrots WHERE id = player_brainrot_id
    )
  ); 