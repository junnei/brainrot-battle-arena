import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { getUserProfile, updateProfile } from '../lib/supabase-api';

// 확장된 User 타입 (Edge Function 응답에 맞춤)
interface ExtendedUser extends User {
  profile?: {
    id?: string;
    user_id?: string;
    nickname?: string;
  }
}

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
    let initialSessionHandled = false; // 초기 세션 처리 여부 플래그
    setIsLoading(true); // Start loading
    
    // 세션 조회 함수
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!isMounted) return; // Exit if unmounted during async call

      if (error) {
        console.error('[AuthContext] Error getting initial session:', error);
        setUser(null);
        setIsLoading(false);
      } else if (session) {
        if (IS_DEV) console.log('[AuthContext] Initial session found, handling...');
        initialSessionHandled = true;
        await handleSessionChange(session); // Handles its own loading state changes
      } else {
        if (IS_DEV) console.log('[AuthContext] No initial session found.');
        setUser(null);
        setIsLoading(false);
      }

      // Now that initial state is set, listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: string, session: Session | null) => {
          if (!isMounted) return;
          if (IS_DEV) console.log('[AuthContext] onAuthStateChange Event:', event);

          // INITIAL_SESSION은 getSession으로 이미 처리된 경우 무시
          if (event === 'INITIAL_SESSION' && initialSessionHandled) {
            return;
          }

          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
            const { data: { session: freshSession } } = await supabase.auth.getSession();
            if (freshSession) {
              await handleSessionChange(freshSession);
            }
          }
          // Handle sign out
          else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            if (IS_DEV) console.log('[AuthContext] Signed out or user deleted.');
            setUser(null);
          }
        }
      );

      // Return cleanup function for the listener
      return () => {
        isMounted = false;
        if (IS_DEV) console.log('[AuthContext] Unsubscribing auth listener.');
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
  }, []); // 의존성 배열 비움 - 마운트 시 1회만 실행

  // 세션 변경 처리
  const handleSessionChange = async (session: Session) => {
    setIsLoading(true); // Set loading true when starting session handling
    if (IS_DEV) console.log('[handleSessionChange] 시작');
    
    try {
      if (!session.user) {
        console.error(t('auth.errors.noUserInSession', '세션에 사용자 정보가 없습니다'));
        setUser(null);
        return;
      }
      
      if (IS_DEV) console.log('[handleSessionChange] 세션 사용자 정보:', session.user.id);
      
      // 기본 사용자 정보
      let userData: User = {
        id: session.user.id,
        email: session.user.email || '',
        username: session.user.user_metadata.name || 
                 session.user.user_metadata.full_name || 
                 session.user.user_metadata.user_name || 
                 '사용자'
      };
      
      // 현재 사용자와 새 세션 사용자 ID가 같으면 프로필 재조회 생략 가능한지 확인
      const shouldSkipProfileFetch = user && user.id === session.user.id && user.user_id;
      
      if (shouldSkipProfileFetch) {
        if (IS_DEV) console.log('[handleSessionChange] 기존 사용자와 ID 동일, 프로필 조회 생략');
        // 기존 사용자 정보 유지, 로딩 완료
        setIsLoading(false);
        return;
      }
      
      try {
        // Edge Function을 통해 프로필 정보 조회
        if (IS_DEV) console.log('[handleSessionChange] Edge Function을 통한 프로필 조회 시작');
        
        const { user: profileUser } = await getUserProfile();
        
        if (IS_DEV) console.log('[handleSessionChange] Edge Function 프로필 조회 결과:', profileUser);
        
        // 조회 성공 시 userData 업데이트
        if (profileUser) {
          const extendedUser = profileUser as ExtendedUser;
          if (extendedUser.profile) {
            debugProfileData(extendedUser.profile, 'Edge Function으로 조회 성공');
            userData = {
              ...userData,
              username: extendedUser.profile.nickname || userData.username, // 프로필 닉네임 우선 사용
              user_id: extendedUser.profile.user_id || userData.id // user_id가 있으면 사용, 없으면 id 사용
            };
          } else {
            console.warn('[handleSessionChange] 프로필 정보 없음 (profileUser.profile 없음)');
          }
        } else {
          console.warn('[handleSessionChange] 프로필 정보 없음 (profileUser null)');
        }
 
      } catch (error) {
        console.error('[handleSessionChange] 프로필 조회 오류:', error);
        // 프로필 조회 실패 시 기본 사용자 정보만 사용
      } finally {
        if (IS_DEV) console.log('[handleSessionChange] 프로필 조회 완료, userData:', userData);
        // Whether profile fetch succeeded or failed, set the user state
        setUser(userData);
      }
    } catch (error) {
      console.error('[handleSessionChange] 세션 처리 중 오류:', error);
      // 예외 발생 시 null로 설정하고 로딩 종료
      setUser(null);
    } finally {
      setIsLoading(false); // Ensure loading is set to false after handling
    }
  };

  // 구글 로그인 함수
  const login = async () => {
    setIsLoading(true);
    try {
      // 현재 도메인(배포 환경 또는 로컬호스트) 기반으로 설정
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

  // Edge Function을 사용한 사용자 정보 업데이트
  const updateUser = async (updatedInfo: Partial<User>) => {
    if (!user) {
      throw new Error(t('auth.errors.notLoggedIn', '로그인되지 않은 사용자'));
    }
    
    setIsLoading(true);
    try {
      if (updatedInfo.username) {
        console.log('사용자 닉네임 업데이트:', user.id, updatedInfo.username);
        
        // Edge Function을 통해 프로필 업데이트
        const { success, profile } = await updateProfile(updatedInfo.username);
        
        if (!success) {
          throw new Error(t('profilePage.usernameUpdateError', '닉네임 변경에 실패했습니다.'));
        }
        
        // Supabase Auth 메타데이터 업데이트 (로그인 세션 업데이트를 위해 필요)
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