CREATE OR REPLACE FUNCTION public.validate_user_permissions(
  p_user_id TEXT,
  p_resource_id TEXT,
  p_resource_type TEXT
) RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_resource_owner TEXT;
  v_count INTEGER;
BEGIN
  -- 디버그 로그 출력
  RAISE LOG 'validate_user_permissions 호출: p_user_id=%, p_resource_id=%, p_resource_type=%',
    p_user_id, p_resource_id, p_resource_type;
  
  IF p_resource_type = 'brainrot' THEN
    -- 먼저 브레인롯이 존재하는지 확인
    SELECT COUNT(*) INTO v_count
    FROM brainrots
    WHERE id = p_resource_id;
    
    IF v_count = 0 THEN
      RAISE LOG '브레인롯이 존재하지 않음: %', p_resource_id;
      RETURN FALSE;
    END IF;
    
    -- user_id 조회 먼저 (디버그용)
    SELECT user_id INTO v_resource_owner 
    FROM brainrots 
    WHERE id = p_resource_id;
    
    RAISE LOG '브레인롯 소유자 ID: %, 요청자 ID: %, 타입 비교: % = %', 
      v_resource_owner, p_user_id, 
      pg_typeof(v_resource_owner), pg_typeof(p_user_id);
    
    -- 소유권 확인 (이제 둘 다 TEXT 타입이므로 직접 비교)
    SELECT (user_id = p_user_id) INTO v_is_owner 
    FROM brainrots 
    WHERE id = p_resource_id;
    
    RAISE LOG '브레인롯 소유권 결과: %, user_id: %, p_user_id: %', 
      v_is_owner, v_resource_owner, p_user_id;
    
  ELSIF p_resource_type = 'profile' THEN
    -- 먼저 프로필이 존재하는지 확인
    SELECT COUNT(*) INTO v_count
    FROM profiles
    WHERE id::TEXT = p_resource_id;
    
    IF v_count = 0 THEN
      RAISE LOG '프로필이 존재하지 않음: %', p_resource_id;
      RETURN FALSE;
    END IF;
  
    -- 프로필 소유권 확인 (profiles.id는 UUID이지만 user_id는 TEXT)
    SELECT user_id INTO v_resource_owner
    FROM profiles
    WHERE id::TEXT = p_resource_id;
    
    RAISE LOG '프로필 소유자 ID: %, 요청자 ID: %', v_resource_owner, p_user_id;
    
    SELECT (user_id = p_user_id) INTO v_is_owner 
    FROM profiles 
    WHERE id::TEXT = p_resource_id;
    
  ELSE
    RAISE LOG '알 수 없는 리소스 타입: %', p_resource_type;
    RETURN FALSE;
  END IF;
  
  -- NULL인 경우 FALSE 반환
  v_is_owner := COALESCE(v_is_owner, FALSE);
  RAISE LOG '권한 확인 최종 결과: %', v_is_owner;
  
  RETURN v_is_owner;
END;
$$ LANGUAGE plpgsql; 