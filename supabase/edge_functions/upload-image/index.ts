import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0'

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
    console.log('upload-image: Authorization 헤더 존재?', !!authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers }
      )
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
        global: { headers: { Authorization: authHeader } },
      }
    )

    // 인증된 사용자 정보 직접 가져오기 시도
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('upload-image: 사용자 인증 오류', userError);
      return new Response(
        JSON.stringify({ error: '인증되지 않은 사용자입니다.' }),
        { status: 401, headers }
      )
    }

    console.log('upload-image: 인증된 사용자 ID', user.id);

    // 요청 형식 확인
    const contentType = req.headers.get('Content-Type')
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: '요청은 multipart/form-data 형식이어야 합니다' }),
        { status: 400, headers }
      )
    }

    // FormData 파싱
    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: '파일이 필요합니다' }),
        { status: 400, headers }
      )
    }

    // 파일 형식 검증
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif']
    if (!fileExt || !allowedExts.includes(fileExt)) {
      return new Response(
        JSON.stringify({ error: '지원되지 않는 파일 형식입니다. (JPG, PNG, GIF 허용)' }),
        { status: 400, headers }
      )
    }
    
    // 파일 크기 검증 (5MB 이하)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: '파일 크기가 너무 큽니다. 5MB 이하의 이미지를 사용해주세요.' }),
        { status: 400, headers }
      )
    }

    // 파일 이름 생성
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`
    const bucket = 'brainrot-images'
    
    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    
    // Supabase Storage에 업로드
    const { error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: file.type
      })
    
    if (uploadError) {
      return new Response(
        JSON.stringify({ error: '이미지 업로드에 실패했습니다' }),
        { status: 500, headers }
      )
    }
    
    // 업로드된 이미지의 공개 URL 가져오기
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(fileName)
    
    if (!urlData?.publicUrl) {
      return new Response(
        JSON.stringify({ error: '이미지 URL을 가져오지 못했습니다' }),
        { status: 500, headers }
      )
    }
    
    return new Response(
      JSON.stringify({ url: urlData.publicUrl }),
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