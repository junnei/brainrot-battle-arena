import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface ProfileUpdateData {
  nickname?: string;
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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: '잘못된 HTTP 메소드입니다. POST만 허용됩니다.' }),
        { status: 405, headers }
      )
    }

    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // 인증된 사용자 정보 가져오기
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '인증되지 않은 사용자입니다.' }),
        { status: 401, headers }
      )
    }

    // 요청 본문 파싱
    const updateData: ProfileUpdateData = await req.json()
    
    // 닉네임 업데이트 여부 확인
    if (!updateData.nickname) {
      return new Response(
        JSON.stringify({ error: '업데이트할 데이터가 없습니다' }),
        { status: 400, headers }
      )
    }

    // profiles 테이블에서 사용자 데이터 확인
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    let result
    
    if (existingProfile) {
      // 프로필이 존재하면 업데이트
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ nickname: updateData.nickname })
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) {
        return new Response(
          JSON.stringify({ error: '프로필 업데이트 실패' }),
          { status: 500, headers }
        )
      }
      
      result = data
    } else {
      // 프로필이 없으면 새로 생성
      const { data, error } = await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          user_id: user.id,
          nickname: updateData.nickname
        })
        .select()
        .single()
      
      if (error) {
        return new Response(
          JSON.stringify({ error: '프로필 생성 실패' }),
          { status: 500, headers }
        )
      }
      
      result = data
    }

    // Supabase 메타데이터 업데이트
    await supabaseClient.auth.admin.updateUserById(
      user.id,
      { user_metadata: { full_name: updateData.nickname } }
    )

    return new Response(
      JSON.stringify({ 
        success: true,
        profile: result
      }),
      { status: 200, headers }
    )
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