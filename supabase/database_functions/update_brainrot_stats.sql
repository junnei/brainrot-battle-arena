-- Definition 부분만 복사해놓은 파일. database function을 생성하는 코드로 변환할 필요가 있음.

CREATE OR REPLACE FUNCTION public.update_brainrot_stats(
  brainrot_id TEXT,
  elo_change INTEGER,
  is_win BOOLEAN
) RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  IF is_win THEN
    UPDATE brainrots
    SET elo = elo + elo_change,
        wins = wins + 1,
        total_battles = total_battles + 1
    WHERE id = brainrot_id;
  ELSE
    UPDATE brainrots
    SET elo = elo - elo_change,
        losses = losses + 1,
        total_battles = total_battles + 1
    WHERE id = brainrot_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
