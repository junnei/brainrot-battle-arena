import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface Brainrot {
  id: string
  user_id: string
  name: string
  description: string
  image_url: string
  created_at: string
  elo: number
  wins: number
  losses: number
  total_battles: number
  risk_level: number
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
    
    // 요청 파라미터 파싱
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const page = parseInt(url.searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // 쿼리 생성
    let query = supabaseClient
      .from('brainrots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)
    
    // 유저 ID가 주어진 경우 필터링
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // 데이터 가져오기
    const { data, error, count } = await query

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers }
      )
    }

    // 총 브레인롯 수 (페이지네이션용)
    const totalQuery = supabaseClient
      .from('brainrots')
      .select('id', { count: 'exact' })
    
    if (userId) {
      totalQuery.eq('user_id', userId)
    }

    const { count: totalCount, error: countError } = await totalQuery
    
    if (countError) {
      console.error('Count error:', countError)
    }

    return new Response(
      JSON.stringify({ 
        data, 
        page,
        limit,
        total: totalCount || 0
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