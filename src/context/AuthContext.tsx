import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';

// 개발 모드에서만 로깅
const IS_DEV = import.meta.env.DEV;

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => Promise.resolve(false),
  updateUser: async () => {},
});

// AuthProvider 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  // 프로필 데이터 디버그 로깅 함수
  const debugProfileData = (profile: {id?: string; user_id?: string; nickname?: string}, source: string) => {
    if (IS_DEV) {
      console.log(`프로필 데이터 (${source}):`, {
        id: profile?.id,
        user_id: profile?.user_id,
        nickname: profile?.nickname
      });
    }
  };

  // 초기 세션 체크 및 이벤트 구독
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); // Start loading
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!isMounted) return; // Exit if unmounted during async call

      if (error) {
        console.error('[AuthContext] Error getting initial session:', error);
        setUser(null);
        setIsLoading(false);
      } else if (session) {
        console.log('[AuthContext] Initial session found, handling...');
        await handleSessionChange(session); // Handles its own loading state changes
      } else {
        console.log('[AuthContext] No initial session found.');
        setUser(null);
        setIsLoading(false);
      }

      // Now that initial state is set, listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: string, session: Session | null) => {
          if (!isMounted) return;
          console.log('[AuthContext] onAuthStateChange Event:', event);

          // Handle session related events (excluding INITIAL_SESSION as it's handled above)
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
            await handleSessionChange(session);
          } 
          // Handle sign out
          else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            console.log('[AuthContext] Signed out or user deleted.');
            setUser(null);
            // isLoading should already be false from the previous state or handleSessionChange
            // Avoid setting isLoading here unless necessary to prevent flickering?
            // Let's assume previous state correctly set it.
          }
          // Ignore INITIAL_SESSION here as it's handled by getSession()
        }
      );

      // Return cleanup function for the listener
      return () => {
        isMounted = false;
        console.log('[AuthContext] Unsubscribing auth listener.');
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }).catch(error => {
      // Catch potential errors from the initial getSession() promise itself
      if (!isMounted) return;
      console.error('[AuthContext] Critical error during initial session check setup:', error);
      setUser(null);
      setIsLoading(false);
    });
  }, []);

  // 세션 변경 처리
  const handleSessionChange = async (session: Session) => {
    setIsLoading(true); // Set loading true when starting session handling
    console.log('[handleSessionChange] 시작');
    try {
      if (!session.user) {
        console.error(t('auth.errors.noUserInSession', '세션에 사용자 정보가 없습니다'));
        setUser(null);
        return;
      }
      
      console.log('[handleSessionChange] 세션 사용자 정보:', session.user.id);
      
      // 기본 사용자 정보
      let userData: User = {
        id: session.user.id,
        email: session.user.email || '',
        username: session.user.user_metadata.name || 
                 session.user.user_metadata.full_name || 
                 session.user.user_metadata.user_name || 
                 '사용자'
      };
      
      try {
        // profiles 테이블에서 사용자 ID(UUID)로 프로필 정보 조회
        console.log('[handleSessionChange] 프로필 조회 시작 (id):', session.user.id);
        
        console.log('[handleSessionChange] Supabase 프로필 조회 전');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, nickname, user_id') // 필요한 컬럼만 선택
          .eq('id', session.user.id)
          .single();
        console.log('[handleSessionChange] Supabase 프로필 조회 후:', { profileData, profileError });
        
        // 조회 성공 시 userData 업데이트
        if (profileData) {
          debugProfileData(profileData, 'id로 조회 성공');
          userData = {
            ...userData,
            username: profileData.nickname || userData.username, // 프로필 닉네임 우선 사용
            user_id: profileData.user_id || undefined // user_id가 있으면 사용, 없으면 undefined
          };
        } else if (profileError && profileError.code !== 'PGRST116') {
          console.error('[handleSessionChange] 프로필 조회 오류 (PGRST116 아님):', profileError);
          // 'PGRST116' (No rows found) 에러 외의 다른 에러 발생 시 로깅
          console.error('프로필 조회 중 오류 발생 (id 기준):', profileError);
        } else {
          console.warn('[handleSessionChange] 프로필 정보 없음 (profileData null 또는 PGRST116 오류)');
          // profileData가 없고, 에러도 없거나 'PGRST116' 에러인 경우 (프로필이 아직 생성되지 않음 등)
          // 이 경우 초기 userData (Google 이름 등)를 그대로 사용
          console.warn('ID에 해당하는 프로필 정보를 찾을 수 없습니다:', session.user.id);
          // 필요하다면 여기서 기본 프로필 생성 로직을 추가할 수도 있습니다.
        }
 
      } catch (error) {
        console.error('[handleSessionChange] 프로필 조회 try/catch 블록 오류:', error);
        console.error('세션 처리 중 예기치 않은 오류 발생:', error);
        setUser(null); // Set user to null on profile fetch error
      } finally {
        console.log('[handleSessionChange] 프로필 조회 finally 블록 시작, userData:', userData);
        // Whether profile fetch succeeded or failed, set the user state
        // If profile fetch failed, userData might only have basic info
        setUser(userData);
        console.log('[handleSessionChange] setUser 호출됨');
      }
    } catch (error) {
      console.error('[handleSessionChange] 외부 try/catch 블록 오류:', error);
      console.error('세션 처리 중 오류:', error);
      // 예외 발생 시 null로 설정하고 로딩 종료
      setUser(null);
    } finally {
      console.log('[handleSessionChange] 외부 finally 블록 시작');
      setIsLoading(false); // Ensure loading is set to false after handling
      console.log('[handleSessionChange] setIsLoading(false) 호출됨');
      // 로딩 상태 항상 종료
    }
  };

  // 구글 로그인 함수
  const login = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true
        }
      });
      if (error) {
        console.error('Login error:', error);
        throw new Error(t('auth.errors.loginFailed', '로그인에 실패했습니다'));
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      console.warn('No redirect URL received during login.');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Login exception:', error.message);
        throw new Error(error.message);
      }
      throw new Error(t('auth.errors.loginFailed', '로그인에 실패했습니다'));
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 함수 (구글 로그인과 동일)
  const signup = async () => {
    return login();
  };

  // 로그아웃 함수
  const logout = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 로컬 상태 초기화
      setUser(null);
      
      // Supabase 로그아웃 실행
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Supabase 로그아웃 실패:', error);
        throw error;
      }
      
      // 로컬 스토리지에서 Supabase 관련 항목 제거
      Object.keys(localStorage)
        .filter(key => 
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('session')
        )
        .forEach(key => localStorage.removeItem(key));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      setIsLoading(false);
      return false;
    }
  };

  // 사용자 정보 업데이트 함수
  const updateUser = async (updatedInfo: Partial<User>) => {
    if (!user) {
      throw new Error(t('auth.errors.notLoggedIn', '로그인되지 않은 사용자'));
    }
    
    setIsLoading(true);
    try {
      if (updatedInfo.username) {
        console.log('사용자 닉네임 업데이트:', user.id, updatedInfo.username);
        
        // profiles 테이블에서 사용자 데이터 확인
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        
        if (existingProfile) {
          // 프로필이 존재하면 업데이트
          const { error } = await supabase
            .from('profiles')
            .update({ nickname: updatedInfo.username })
            .eq('id', user.id);
          
          if (error) {
            console.error('프로필 업데이트 실패:', error);
            throw new Error(t('profilePage.usernameUpdateError', '닉네임 변경에 실패했습니다.'));
          }
        } else {
          // 프로필이 없으면 새로 생성
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              user_id: user.id,
              nickname: updatedInfo.username
            });
          
          if (error) {
            console.error('프로필 생성 실패:', error);
            throw new Error(t('profilePage.usernameUpdateError', '닉네임 변경에 실패했습니다.'));
          }
        }

        // Supabase 메타데이터 업데이트
        await supabase.auth.updateUser({
          data: { full_name: updatedInfo.username }
        });
      }
      
      // 로컬 사용자 상태 업데이트
      setUser({ ...user, ...updatedInfo });
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error(t('profilePage.usernameUpdateError', '사용자 업데이트 실패'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 인증 컨텍스트 사용을 위한 훅
export const useAuth = () => useContext(AuthContext);