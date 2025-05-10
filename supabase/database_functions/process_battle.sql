CREATE OR REPLACE FUNCTION public.process_battle(
  player_brainrot_id TEXT, 
  opponent_brainrot_id TEXT, 
  user_id TEXT
) RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  player_elo INTEGER;
  opponent_elo INTEGER;
  player_name TEXT;
  player_description TEXT;
  player_image_url TEXT;
  player_risk_level INTEGER;
  opponent_name TEXT;
  opponent_description TEXT;
  opponent_image_url TEXT;
  opponent_risk_level INTEGER;
  win_probability FLOAT;
  has_player_won BOOLEAN;
  battle_id TEXT;
  id_exists BOOLEAN;
  winner_id TEXT;
  battle_result TEXT;
  battle_narrative TEXT;
  K CONSTANT INTEGER := 32; -- ELO 변화의 최대치
  player_win_points INTEGER; -- 플레이어가 이길 경우 얻는 점수
  opponent_win_points INTEGER; -- 상대방이 이길 경우 얻는 점수
  player_new_elo INTEGER;
  opponent_new_elo INTEGER;
  v_is_owner BOOLEAN;
BEGIN
  -- 권한 검증
  SELECT validate_user_permissions(user_id, player_brainrot_id, 'brainrot') INTO v_is_owner;
  
  IF NOT v_is_owner THEN
    RAISE EXCEPTION '자신의 브레인롯으로만 배틀을 시작할 수 있습니다';
  END IF;
  
  -- 고유한 10자리 16진수 battle_id 생성 및 중복 검사
  <<id_generation>>
  LOOP
    -- 10자리 16진수 ID 생성
    battle_id := SUBSTRING(MD5(random()::TEXT) FROM 1 FOR 10);
    
    -- ID 중복 검사
    SELECT EXISTS(SELECT 1 FROM battles WHERE id = battle_id) INTO id_exists;
    EXIT id_generation WHEN NOT id_exists;
  END LOOP;
  
  -- 브레인롯 정보 조회
  SELECT 
    brainrots.elo,
    brainrots.name, 
    brainrots.description,
    brainrots.image_url,
    brainrots.risk_level
  INTO 
    player_elo,
    player_name,
    player_description,
    player_image_url,
    player_risk_level
  FROM brainrots 
  WHERE brainrots.id = player_brainrot_id;
  
  SELECT 
    brainrots.elo,
    brainrots.name, 
    brainrots.description,
    brainrots.image_url,
    brainrots.risk_level
  INTO 
    opponent_elo,
    opponent_name,
    opponent_description,
    opponent_image_url,
    opponent_risk_level
  FROM brainrots 
  WHERE brainrots.id = opponent_brainrot_id;
  
  -- 승패 결정 (ELO 기반 확률)
  win_probability := 1.0 / (1.0 + POWER(10, (opponent_elo - player_elo) / 400.0));
  
  -- 위험도 요소 반영
  -- 플레이어의 위험도가 높을수록 극단적인 결과가 나올 확률 증가
  IF player_risk_level > opponent_risk_level THEN
    -- 플레이어의 위험도가 높으면 승률 변동성 증가
    win_probability := win_probability * (1.0 + (player_risk_level - opponent_risk_level) * 0.1);
  END IF;
  
  -- 승률 범위 제한 (0.1~0.9)
  win_probability := GREATEST(0.1, LEAST(0.9, win_probability));
  
  -- 기본 승패 결정
  has_player_won := RANDOM() < win_probability;
  
  -- ELO 변화량 계산 (승률에 반비례)
  -- 플레이어가 이길 경우 얻는 점수 (승률이 낮을수록 더 많은 점수를 얻음)
  player_win_points := ROUND(K * (1 - win_probability));
  
  -- 상대방이 이길 경우 얻는 점수 (상대방의 승률이 낮을수록 더 많은 점수를 얻음)
  opponent_win_points := ROUND(K * win_probability);
  
  -- 무승부 확률 계산 (위험도가 낮을수록 무승부 확률 증가)
  IF ABS(player_elo - opponent_elo) < 100 AND RANDOM() < 0.2 * (4 - player_risk_level) * 0.1 THEN
    -- 무승부
    battle_result := 'DRAW';
    winner_id := NULL;
    player_new_elo := player_elo;
    opponent_new_elo := opponent_elo;
    
    -- 무승부인 경우 양쪽 모두 전투 횟수만 증가
    UPDATE brainrots
    SET total_battles = total_battles + 1
    WHERE id IN (player_brainrot_id, opponent_brainrot_id);
    
  ELSIF has_player_won THEN
    -- 승리
    battle_result := 'WIN';
    winner_id := player_brainrot_id;
    player_new_elo := player_elo + player_win_points;
    opponent_new_elo := opponent_elo - player_win_points;
    
    -- 최소 ELO 보장
    player_new_elo := GREATEST(player_new_elo, 100);
    opponent_new_elo := GREATEST(opponent_new_elo, 100);
    
    -- 승자(플레이어) 업데이트
    UPDATE brainrots
    SET elo = player_new_elo,
        wins = wins + 1,
        total_battles = total_battles + 1
    WHERE id = player_brainrot_id;
    
    -- 패자(상대방) 업데이트
    UPDATE brainrots
    SET elo = opponent_new_elo,
        losses = losses + 1,
        total_battles = total_battles + 1
    WHERE id = opponent_brainrot_id;
  ELSE
    -- 패배
    battle_result := 'LOSS';
    winner_id := opponent_brainrot_id;
    player_new_elo := player_elo - opponent_win_points;
    opponent_new_elo := opponent_elo + opponent_win_points;
    
    -- 최소 ELO 보장
    player_new_elo := GREATEST(player_new_elo, 100);
    opponent_new_elo := GREATEST(opponent_new_elo, 100);
    
    -- 패자(플레이어) 업데이트
    UPDATE brainrots
    SET elo = player_new_elo,
        losses = losses + 1,
        total_battles = total_battles + 1
    WHERE id = player_brainrot_id;
    
    -- 승자(상대방) 업데이트
    UPDATE brainrots
    SET elo = opponent_new_elo,
        wins = wins + 1,
        total_battles = total_battles + 1
    WHERE id = opponent_brainrot_id;
  END IF;
  
  -- 전투 과정 생성
  battle_narrative := generate_battle_narrative(
    player_name, 
    opponent_name, 
    player_description, 
    opponent_description,
    battle_result
  );
  
  -- 배틀 기록 저장
  INSERT INTO battles (
    id, 
    player_brainrot_id, 
    opponent_brainrot_id, 
    winner_id, 
    battle_result,
    battle_narrative,
    created_at
  )
  VALUES (
    battle_id, 
    player_brainrot_id, 
    opponent_brainrot_id, 
    winner_id,
    battle_result,
    battle_narrative,
    NOW()
  );
  
  -- 결과 반환
  RETURN jsonb_build_object(
    'battle_id', battle_id,
    'battle_result', battle_result,
    'battle_narrative', battle_narrative,
    'player_elo', player_elo,
    'opponent_elo', opponent_elo,
    'player_new_elo', player_new_elo,
    'opponent_new_elo', opponent_new_elo
  );
END;
$$ LANGUAGE plpgsql;

-- 배틀 내용 생성 함수
CREATE OR REPLACE FUNCTION generate_battle_narrative(
  player_name TEXT,
  opponent_name TEXT,
  player_desc TEXT,
  opponent_desc TEXT,
  result TEXT
) RETURNS TEXT AS $$
DECLARE
  narrative TEXT;
BEGIN
  narrative := format(
    '용감한 %s(%s)와 강력한 %s(%s)의 치열한 대결이 시작되었습니다.',
    player_name, player_desc, opponent_name, opponent_desc
  );
  
  IF result = 'WIN' THEN
    narrative := narrative || format(' 격렬한 싸움 끝에 %s가 승리했습니다!', player_name);
  ELSIF result = 'LOSS' THEN
    narrative := narrative || format(' 힘든 싸움 끝에 %s가 승리했습니다!', opponent_name);
  ELSE
    narrative := narrative || ' 두 경쟁자의 실력이 막상막하여 무승부로 끝났습니다.';
  END IF;
  
  RETURN narrative;
END;
$$ LANGUAGE plpgsql; 