import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 개발 모드에서만 로깅하도록 설정
const IS_DEV = import.meta.env.DEV;
const logDebug = (message: string, ...args: unknown[]) => {
  if (IS_DEV) console.log(message, ...args);
};

// 환경 변수 디버깅
logDebug('Supabase 환경 변수 확인');
logDebug('SUPABASE_URL 설정 여부:', !!supabaseUrl); 
// 실제 값은 보안상 로깅하지 않음
logDebug('SUPABASE_ANON_KEY 설정 여부:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 설정 오류: URL 또는 Anon Key가 설정되지 않았습니다');
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다.');
}

// 세션 만료 확인 함수
const isTokenValid = () => {
  try {
    const tokenString = localStorage.getItem('supabase-auth-token');
    if (!tokenString) return false;
    
    const token = JSON.parse(tokenString);
    const expiresAt = token?.expires_at;
    
    return expiresAt && new Date(expiresAt * 1000) > new Date();
  } catch {
    return false;
  }
};

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'supabase-auth-token',
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
});

// 세션 복원 헬퍼 함수
export const refreshSession = async () => {
  try {
    // 토큰이 유효하지 않으면 바로 실패 반환
    if (!isTokenValid()) {
      return { success: false, error: new Error('유효한 토큰이 없음') };
    }
    
    // 세션 갱신 시도
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('세션 갱신 실패:', error);
      return { success: false, error };
    }
    
    return { 
      success: !!data.session, 
      session: data.session 
    };
  } catch (e) {
    console.error('세션 갱신 예외:', e);
    return { success: false, error: e };
  }
};

export { supabase, isTokenValid }; 