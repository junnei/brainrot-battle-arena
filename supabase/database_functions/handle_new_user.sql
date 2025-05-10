-- Definition 부분만 복사해놓은 파일. database function을 생성하는 코드로 변환할 필요가 있음.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  provider TEXT;
  new_user_id TEXT;
  last_user_id TEXT;
  next_id INTEGER;
BEGIN
  -- 로그인 제공자 확인
  provider := NEW.raw_app_meta_data->>'provider';
  
  -- 디버깅 로그
  RAISE LOG 'New user sign up with provider: %', provider;
  RAISE LOG 'User ID: %', NEW.id;
  RAISE LOG 'Email: %', NEW.email;
  RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
  
  -- 16진수 사용자 ID 생성 로직
  SELECT user_id INTO last_user_id FROM public.profiles ORDER BY user_id DESC LIMIT 1;
  
  IF last_user_id IS NULL OR last_user_id = '' THEN
    -- 첫 번째 사용자인 경우 A00000으로 시작
    new_user_id := 'A00000';
  ELSE
    -- 마지막 사용자 ID가 16진수 형식인지 확인 (A 다음에 5자리 16진수)
    IF last_user_id ~ '^A[0-9A-F]{5}$' THEN
      -- 16진수 문자열을 정수로 변환 ('A'를 제외하고 16진수로 해석)
      next_id := ('x' || SUBSTRING(last_user_id, 2))::bit(20)::integer + 1;
      -- 다시 16진수 형식으로 변환하고 'A'를 앞에 붙임
      new_user_id := 'A' || LPAD(TO_HEX(next_id), 5, '0');
    ELSE
      -- 기존 ID 형식이 다른 경우 안전하게 A00000으로 시작
      new_user_id := 'A00000';
    END IF;
  END IF;
  
  -- 프로필 테이블에 데이터 삽입
  IF provider = 'google' THEN
    INSERT INTO public.profiles (id, nickname, user_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '사용자'),
      new_user_id
    );
  ELSIF provider = 'email' THEN
    INSERT INTO public.profiles (id, nickname, user_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'user_name', '사용자'),
      new_user_id
    );
  ELSE
    -- 기본 처리
    INSERT INTO public.profiles (id, nickname, user_id)
    VALUES (
      NEW.id,
      '사용자',
      new_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();