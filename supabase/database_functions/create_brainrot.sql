-- Definition 부분만 복사해놓은 파일. database function을 생성하는 코드로 변환할 필요가 있음.

CREATE OR REPLACE FUNCTION public.create_brainrot(
  p_name TEXT,
  p_description TEXT,
  p_image_url TEXT,
  p_user_id TEXT
) RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  v_brainrot_count INT;
  v_hex_chars TEXT := '123456789ABCDEF'; -- 0 제외한 16진수 문자
  v_first_char TEXT := SUBSTRING(v_hex_chars, (FLOOR(RANDOM() * LENGTH(v_hex_chars)) + 1)::int, 1);
  v_brainrot_id TEXT := v_first_char || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 7);
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_result JSONB;
  v_max_name_length CONSTANT INT := 30; -- 이름 최대 길이
  v_max_desc_length CONSTANT INT := 200; -- 설명 최대 길이
  v_max_brainrots CONSTANT INT := 5; -- 사용자당 최대 브레인롯 수
BEGIN
  -- 이름과 설명 길이 검증
  IF LENGTH(p_name) > v_max_name_length THEN
    RAISE EXCEPTION '브레인롯 이름은 최대 %자까지 입력 가능합니다.', v_max_name_length;
  END IF;
  
  IF LENGTH(p_description) > v_max_desc_length THEN
    RAISE EXCEPTION '브레인롯 설명은 최대 %자까지 입력 가능합니다.', v_max_desc_length;
  END IF;
  
  -- 현재 사용자의 브레인롯 개수 확인
  SELECT COUNT(*) INTO v_brainrot_count
  FROM brainrots
  WHERE user_id = p_user_id;
  
  -- 브레인롯 개수 제한 확인
  IF v_brainrot_count >= v_max_brainrots THEN
    RAISE EXCEPTION '브레인롯은 최대 %개까지만 생성할 수 있습니다.', v_max_brainrots;
  END IF;

  -- 중복 ID를 방지하기 위한 루프 (실제로는 거의 발생하지 않음)
  LOOP
    -- ID가 이미 존재하는지 확인
    IF NOT EXISTS (SELECT 1 FROM brainrots WHERE id = v_brainrot_id) THEN
      EXIT; -- 중복이 없으면 루프 종료
    END IF;
    
    -- 새 ID 생성 시도
    v_first_char := SUBSTRING(v_hex_chars, (FLOOR(RANDOM() * LENGTH(v_hex_chars)) + 1)::int, 1);
    v_brainrot_id := v_first_char || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 7);
  END LOOP;

  -- 브레인롯 테이블에 데이터 삽입
  INSERT INTO brainrots(
    id,
    name,
    description,
    image_url,
    user_id,
    created_at,
    elo,
    wins,
    losses,
    total_battles,
    risk_level  -- 항상 1로 설정
  ) VALUES (
    v_brainrot_id,
    p_name,
    p_description,
    p_image_url,
    p_user_id,
    v_now,
    1000,  -- 초기 ELO 점수
    0,     -- 초기 승리 수
    0,     -- 초기 패배 수
    0,     -- 초기 전체 배틀 수
    1      -- 위험도는 항상 1로 고정
  );

  -- 생성된 브레인롯 정보 조회
  SELECT jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'description', b.description,
    'image_url', b.image_url,
    'user_id', b.user_id,
    'created_at', b.created_at,
    'elo', b.elo,
    'wins', b.wins,
    'losses', b.losses,
    'total_battles', b.total_battles,
    'risk_level', b.risk_level
  ) INTO v_result
  FROM brainrots b
  WHERE b.id = v_brainrot_id;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '브레인롯 생성 중 오류 발생: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- brainrots 테이블의 RLS 정책 설정
-- 이 파일을 SQL 에디터에서 실행하여 RLS 정책을 설정합니다

-- RLS 활성화
ALTER TABLE brainrots ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 모든 인증된 사용자가 모든 브레인롯 조회 가능
DROP POLICY IF EXISTS brainrots_select_policy ON brainrots;
CREATE POLICY brainrots_select_policy ON brainrots 
  FOR SELECT TO authenticated 
  USING (true);

-- INSERT 정책: 자신의 브레인롯만 생성 가능
DROP POLICY IF EXISTS brainrots_insert_policy ON brainrots;
CREATE POLICY brainrots_insert_policy ON brainrots 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid()::text = user_id);

-- UPDATE 정책: 자신의 브레인롯만 수정 가능
DROP POLICY IF EXISTS brainrots_update_policy ON brainrots;
CREATE POLICY brainrots_update_policy ON brainrots 
  FOR UPDATE TO authenticated 
  USING (auth.uid()::text = user_id);

-- DELETE 정책: 자신의 브레인롯만 삭제 가능
DROP POLICY IF EXISTS brainrots_delete_policy ON brainrots;
CREATE POLICY brainrots_delete_policy ON brainrots 
  FOR DELETE TO authenticated 
  USING (auth.uid()::text = user_id);
