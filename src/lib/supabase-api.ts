import { supabase } from './supabase';
import { Brainrot, Battle, User } from '../types';

// Supabase Edge Functions에 요청을 보내는 기본 함수
const fetchFromEdge = async <T>(
  functionName: string, 
  options: RequestInit = {}, 
  queryParams: Record<string, string> = {}
): Promise<T> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('인증이 필요합니다');
    }

    // URL 파라미터 구성
    const params = new URLSearchParams(queryParams);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // 요청 URL 생성
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${baseUrl}/functions/v1/${functionName}${queryString}`;
    
    // 인증 헤더 추가 - 전체 세션 토큰 사용
    const authToken = session.access_token;
    console.log(`[fetchFromEdge] ${functionName} 요청 시작, 토큰 있음:`, !!authToken);
    
    // 사용자 정보 출력 (디버깅용)
    console.log(`[fetchFromEdge] ${functionName} 현재 사용자:`, {
      id: session.user?.id,
      email: session.user?.email,
      role: session.user?.role
    });
    
    // 요청 본문 출력 (디버깅용)
    if (options.body) {
      try {
        const requestBody = JSON.parse(options.body.toString());
        console.log(`[fetchFromEdge] ${functionName} 요청 본문:`, requestBody);
      } catch (e) {
        console.log(`[fetchFromEdge] ${functionName} 요청 본문 파싱 실패`);
      }
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`
    };
    
    // 요청 전송
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // 응답 데이터를 한 번만 파싱
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      console.error(`[fetchFromEdge] ${functionName} JSON 파싱 오류:`, e);
      throw new Error('응답 처리 중 오류가 발생했습니다');
    }
    
    if (!response.ok) {
      console.error(`[fetchFromEdge] ${functionName} 응답 에러:`, responseData);
      throw new Error(responseData.error || '요청 처리 중 오류가 발생했습니다');
    }
    
    return responseData as T;
  } catch (error) {
    console.error(`Error in ${functionName}:`, error);
    throw error;
  }
};

// 사용자 정보 가져오기
export const getUserProfile = async (): Promise<{ user: User }> => {
  return await fetchFromEdge<{ user: User }>(
    'get-user',
    { method: 'GET' }
  );
};

// 사용자 프로필 업데이트
export const updateProfile = async (nickname: string): Promise<{ success: boolean, profile: any }> => {
  return await fetchFromEdge<{ success: boolean, profile: any }>(
    'update-profile',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nickname })
    }
  );
};

// 브레인롯 목록 가져오기
export const getBrainrots = async (
  userId?: string, 
  limit = 50, 
  page = 1
): Promise<{ data: Brainrot[], page: number, limit: number, total: number }> => {
  const queryParams: Record<string, string> = {
    limit: limit.toString(),
    page: page.toString()
  };
  
  if (userId) {
    queryParams.userId = userId;
  }
  
  return await fetchFromEdge<{ data: Brainrot[], page: number, limit: number, total: number }>(
    'get-brainrots',
    { method: 'GET' },
    queryParams
  );
};

// 배틀 목록 가져오기
export const getBattles = async (
  brainrotId?: string,
  userId?: string,
  limit = 5,
  page = 1
): Promise<{ data: Battle[], page: number, limit: number, total: number }> => {
  const queryParams: Record<string, string> = {
    limit: limit.toString(),
    page: page.toString()
  };
  
  if (brainrotId) {
    queryParams.brainrotId = brainrotId;
  }
  
  if (userId) {
    queryParams.userId = userId;
  }
  
  return await fetchFromEdge<{ data: Battle[], page: number, limit: number, total: number }>(
    'get-battles',
    { method: 'GET' },
    queryParams
  );
};

// 브레인롯 생성하기
export const createBrainrot = async (
  brainrotData: { name: string, description: string, image_url?: string }
): Promise<{ data: Brainrot }> => {
  return await fetchFromEdge<{ data: Brainrot }>(
    'brainrot-operations',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: 'create',
        ...brainrotData
      })
    }
  );
};

// 브레인롯 업데이트하기
export const updateBrainrot = async (
  brainrotId: string,
  updateData: { name?: string, description?: string, image_url?: string }
): Promise<{ data: Brainrot }> => {
  return await fetchFromEdge<{ data: Brainrot }>(
    'brainrot-operations',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: 'update',
        id: brainrotId,
        ...updateData
      })
    }
  );
};

// 브레인롯 삭제하기
export const deleteBrainrot = async (
  brainrotId: string
): Promise<{ success: boolean }> => {
  return await fetchFromEdge<{ success: boolean }>(
    'brainrot-operations',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: 'delete',
        id: brainrotId
      })
    }
  );
};

// 배틀 시작하기
export const startBattle = async (
  playerBrainrotId: string,
  opponentBrainrotId: string
): Promise<{
  battleId: string,
  battleResult: string,
  battleNarrative: string,
  winnerId: string | null,
  playerBrainrot: Brainrot,
  opponentBrainrot: Brainrot,
  playerStartElo: number,
  playerEndElo: number,
  opponentStartElo: number,
  opponentEndElo: number
}> => {
  return await fetchFromEdge(
    'start-battle',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerBrainrotId,
        opponentBrainrotId
      })
    }
  );
};

// 이미지 업로드하기
export const uploadImage = async (file: File): Promise<{ url: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('인증이 필요합니다');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${baseUrl}/functions/v1/upload-image`;
    
    // 인증 토큰 로그 확인
    console.log('[uploadImage] 토큰 존재:', !!session.access_token);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });
    
    // 응답 데이터를 한 번만 파싱
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      console.error('[uploadImage] JSON 파싱 오류:', e);
      throw new Error('응답 처리 중 오류가 발생했습니다');
    }
    
    // 응답 상태 체크
    if (!response.ok) {
      console.error('[uploadImage] 응답 에러:', responseData);
      throw new Error(responseData.error || '이미지 업로드 중 오류가 발생했습니다');
    }
    
    return responseData as { url: string };
  } catch (error) {
    console.error('[uploadImage] 에러:', error);
    throw error;
  }
}; 