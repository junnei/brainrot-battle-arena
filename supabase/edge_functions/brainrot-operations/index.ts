import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface BrainrotData {
  name: string
  description: string
  image_url: string
  id?: string
}

// 입력값 유효성 검증 함수
function validateInput(data: any, operation: string): { valid: boolean; error?: string } {
  // 공통 검증: operation 필드는 필수
  if (!operation) {
    return { valid: false, error: '작업 유형(operation)이 지정되지 않았습니다' };
  }

  // 작업별 검증
  switch (operation) {
    case 'create':
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        return { valid: false, error: '브레인롯 이름은 필수입니다' };
      }
      if (!data.description || typeof data.description !== 'string') {
        return { valid: false, error: '브레인롯 설명은 필수입니다' };
      }
      // image_url은 optional이지만, 입력된 경우 string 타입이어야 함
      if (data.image_url !== undefined && (typeof data.image_url !== 'string' || !data.image_url.startsWith('http'))) {
        return { valid: false, error: '이미지 URL은 유효한 URL 형식이어야 합니다' };
      }
      break;
    case 'update':
      if (!data.id || typeof data.id !== 'string') {
        return { valid: false, error: '브레인롯 ID는 필수입니다' };
      }
      // 최소한 하나의 필드는 업데이트해야 함
      if ((!data.name && !data.description && !data.image_url) ||
          (data.name && typeof data.name !== 'string') ||
          (data.description && typeof data.description !== 'string') ||
          (data.image_url && typeof data.image_url !== 'string')) {
        return { valid: false, error: '업데이트할 유효한 필드가 필요합니다' };
      }
      if (data.name !== undefined && data.name.trim().length === 0) {
        return { valid: false, error: '브레인롯 이름은 공백일 수 없습니다' };
      }
      if (data.description !== undefined && data.description.trim().length === 0) {
        return { valid: false, error: '브레인롯 설명은 공백일 수 없습니다' };
      }
      break;
    case 'delete':
      if (!data.id || typeof data.id !== 'string') {
        return { valid: false, error: '브레인롯 ID는 필수입니다' };
      }
      break;
    default:
      return { valid: false, error: '지원하지 않는 작업입니다: ' + operation };
  }

  return { valid: true };
}

serve(async (req) => {
  try {
    // CORS 헤더 설정
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    }

    // OPTIONS 요청 처리 (CORS 프리플라이트)
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers })
    }

    // 인증 처리 - 요청 헤더에서 JWT 토큰 가져오기
    const authHeader = req.headers.get('Authorization')
    console.log('brainrot-operations: Authorization 헤더 존재?', !!authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers }
      )
    }

    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
      }
    )

    // 인증된 사용자 정보 직접 가져오기 시도
    const token = authHeader.split(' ')[1];
    console.log('brainrot-operations: 토큰 추출됨', token.substring(0, 10) + '...');
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('brainrot-operations: 사용자 인증 오류', userError);
      return new Response(
        JSON.stringify({ error: '인증되지 않은 사용자입니다.' }),
        { status: 401, headers }
      )
    }

    console.log('brainrot-operations: 인증된 사용자 ID', user.id);

    // 사용자의 프로필 정보 가져오기 (profiles 테이블에서 user_id 조회)
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('brainrot-operations: 프로필 정보 조회 오류', profileError);
      return new Response(
        JSON.stringify({ error: '사용자 프로필 정보를 찾을 수 없습니다.' }),
        { status: 404, headers }
      )
    }

    const userIdentifier = profileData.user_id;
    console.log('brainrot-operations: 사용자 식별자(user_id)', userIdentifier);

    // 요청 본문을 한 번만 파싱
    const requestData = await req.json();
    const { operation } = requestData;
    
    console.log('brainrot-operations: 요청 작업 종류', operation);

    // 입력값 유효성 검증
    const validation = validateInput(requestData, operation);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers }
      )
    }

    // 브레인롯 작업 종류에 따라 처리
    switch (operation) {
      case 'create': {
        const { name, description, image_url } = requestData;
        
        console.log('브레인롯 생성 요청:', { name, description, image_url, userId: user.id, userIdentifier });
        
        const { data, error } = await supabaseClient.rpc(
          'create_brainrot',
          {
            p_name: name,
            p_description: description,
            p_image_url: image_url,
            p_user_id: userIdentifier
          }
        )

        if (error) {
          console.error('브레인롯 생성 오류:', error);
          throw error;
        }
        
        console.log('브레인롯 생성 성공:', data);
        return new Response(JSON.stringify({ data }), { headers })
      }
      
      case 'update': {
        const { id, name, description, image_url } = requestData;
        
        // 사용자 권한 확인 로그 - 더 많은 디버그 정보 추가
        console.log('brainrot-operations: 브레인롯 수정 시도 (상세정보)', { 
          userId: user.id, 
          userIdentifier,
          brainrotId: id,
          userIdType: typeof user.id,
          brainrotIdType: typeof id,
          authHeader: authHeader.substring(0, 20) + '...',
          requestData
        });
        
        try {
          // 수정하려는 브레인롯이 존재하는지 먼저 확인
          const { data: brainrotData, error: brainrotError } = await supabaseClient
            .from('brainrots')
            .select('id, user_id')
            .eq('id', id)
            .single();
            
          if (brainrotError) {
            console.error('brainrot-operations: 브레인롯 조회 오류', brainrotError);
            return new Response(
              JSON.stringify({ error: '브레인롯을 찾을 수 없습니다' }),
              { status: 404, headers }
            )
          }
          
          console.log('brainrot-operations: 브레인롯 조회 결과', {
            brainrotData,
            userIdFromBrainrot: brainrotData.user_id,
            currentUserId: user.id,
            userIdentifier,
            isMatching: brainrotData.user_id === userIdentifier
          });
          
          // 직접 소유권 확인 (profiles의 user_id와 brainrots의 user_id 비교)
          if (brainrotData.user_id !== userIdentifier) {
            console.error('brainrot-operations: 소유권 불일치', {
              brainrotUserId: brainrotData.user_id,
              currentUserId: user.id,
              userIdentifier
            });
            return new Response(
              JSON.stringify({ error: '브레인롯 수정 권한이 없습니다' }),
              { status: 403, headers }
            )
          }

          // 브레인롯 업데이트 실행
          const { data, error } = await supabaseClient
            .from('brainrots')
            .update({ name, description, image_url })
            .eq('id', id)
            .select()
            .single();

          if (error) {
            console.error('brainrot-operations: 브레인롯 수정 오류', error);
            return new Response(
              JSON.stringify({ error: `브레인롯 수정 실패: ${error.message}` }),
              { status: 500, headers }
            )
          }
          
          console.log('brainrot-operations: 브레인롯 수정 성공', { id });
          return new Response(JSON.stringify({ data }), { headers })
        } catch (updateError) {
          console.error('brainrot-operations: 브레인롯 수정 처리 중 예외 발생', updateError);
          return new Response(
            JSON.stringify({ error: `브레인롯 수정 중 오류 발생: ${updateError.message}` }),
            { status: 500, headers }
          )
        }
      }
      
      case 'delete': {
        const { id } = requestData;
        
        // 사용자 권한 확인 로그 - 더 많은 디버그 정보 추가
        console.log('brainrot-operations: 브레인롯 삭제 시도 (상세정보)', { 
          userId: user.id, 
          userIdentifier,
          brainrotId: id,
          userIdType: typeof user.id,
          brainrotIdType: typeof id,
          authHeader: authHeader.substring(0, 20) + '...',
          requestData
        });
        
        try {
          // 삭제하려는 브레인롯이 존재하는지 먼저 확인
          const { data: brainrotData, error: brainrotError } = await supabaseClient
            .from('brainrots')
            .select('id, user_id')
            .eq('id', id)
            .single();
            
          if (brainrotError) {
            console.error('brainrot-operations: 브레인롯 조회 오류', brainrotError);
            return new Response(
              JSON.stringify({ error: '브레인롯을 찾을 수 없습니다' }),
              { status: 404, headers }
            )
          }
          
          console.log('brainrot-operations: 브레인롯 조회 결과', {
            brainrotData,
            userIdFromBrainrot: brainrotData.user_id,
            currentUserId: user.id,
            userIdentifier,
            isMatching: brainrotData.user_id === userIdentifier
          });
          
          // 직접 소유권 확인 (profiles의 user_id와 brainrots의 user_id 비교)
          if (brainrotData.user_id !== userIdentifier) {
            console.error('brainrot-operations: 소유권 불일치', {
              brainrotUserId: brainrotData.user_id,
              currentUserId: user.id,
              userIdentifier
            });
            return new Response(
              JSON.stringify({ error: '브레인롯 삭제 권한이 없습니다' }),
              { status: 403, headers }
            )
          }

          // RPC 대신 직접 삭제 실행 (더 명확한 에러 처리를 위해)
          const { error } = await supabaseClient
            .from('brainrots')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('brainrot-operations: 브레인롯 삭제 오류', error);
            return new Response(
              JSON.stringify({ error: `브레인롯 삭제 실패: ${error.message}` }),
              { status: 500, headers }
            )
          }
          
          console.log('brainrot-operations: 브레인롯 삭제 성공', { id });
          return new Response(JSON.stringify({ success: true }), { headers })
        } catch (deleteError) {
          console.error('brainrot-operations: 브레인롯 삭제 처리 중 예외 발생', deleteError);
          return new Response(
            JSON.stringify({ error: `브레인롯 삭제 중 오류 발생: ${deleteError.message}` }),
            { status: 500, headers }
          )
        }
      }
      
      default:
        return new Response(
          JSON.stringify({ error: '지원하지 않는 작업입니다.' }),
          { status: 400, headers }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: `서버 오류: ${error.message}` }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      }
    )
  }
}) 