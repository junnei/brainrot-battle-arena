import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

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
    console.log('get-user: Authorization 헤더 존재?', !!authHeader);
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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('get-user: 사용자 인증 오류', userError);
      return new Response(
        JSON.stringify({ error: '인증되지 않은 사용자입니다.' }),
        { status: 401, headers }
      )
    }

    console.log('get-user: 인증된 사용자 ID', user.id);

    // 사용자 프로필 정보 가져오기
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('get-user: 프로필 정보 조회 실패:', profileError)
      // 기본 사용자 정보만 반환
      return new Response(
        JSON.stringify({ 
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata
          }
        }),
        { status: 200, headers }
      )
    }

    console.log('get-user: 프로필 정보 조회 성공:', profileData);

    // 사용자와 프로필 정보 결합
    return new Response(
      JSON.stringify({ 
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          profile: profileData
        }
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('get-user: 처리 중 오류 발생:', error);
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