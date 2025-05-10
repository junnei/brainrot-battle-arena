import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface Battle {
  id: string
  player_brainrot_id: string
  opponent_brainrot_id: string
  winner_id: string | null
  battle_result: string
  battle_narrative: string
  created_at: string
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
    const brainrotId = url.searchParams.get('brainrotId')
    const userId = url.searchParams.get('userId')
    const limit = parseInt(url.searchParams.get('limit') || '5')
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
      .from('battles')
      .select(`
        *,
        player_brainrot:brainrots!player_brainrot_id(*),
        opponent_brainrot:brainrots!opponent_brainrot_id(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)
    
    // 특정 브레인롯의 배틀 기록만 조회
    if (brainrotId) {
      query = query.or(`player_brainrot_id.eq.${brainrotId},opponent_brainrot_id.eq.${brainrotId}`)
    }
    
    // 특정 유저의 브레인롯 배틀 기록만 조회
    if (userId && !brainrotId) {
      // 먼저 해당 유저의 모든 브레인롯 ID 가져오기
      const { data: userBrainrots, error: brainrotError } = await supabaseClient
        .from('brainrots')
        .select('id')
        .eq('user_id', userId)
      
      if (brainrotError) {
        return new Response(
          JSON.stringify({ error: brainrotError.message }),
          { status: 400, headers }
        )
      }
      
      // 해당 유저의 브레인롯이 없으면 빈 결과 반환
      if (!userBrainrots || userBrainrots.length === 0) {
        return new Response(
          JSON.stringify({ 
            data: [], 
            page,
            limit,
            total: 0
          }),
          { status: 200, headers }
        )
      }
      
      // 유저의 모든 브레인롯이 참여한 배틀 조회
      const brainrotIds = userBrainrots.map(b => b.id)
      const conditions = brainrotIds.map(id => 
        `player_brainrot_id.eq.${id},opponent_brainrot_id.eq.${id}`
      ).join(',')
      
      query = query.or(conditions)
    }

    // 데이터 가져오기
    const { data, error } = await query

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers }
      )
    }

    // 총 배틀 수 조회 (페이지네이션용)
    let countQuery = supabaseClient
      .from('battles')
      .select('id', { count: 'exact' })
    
    if (brainrotId) {
      countQuery = countQuery.or(`player_brainrot_id.eq.${brainrotId},opponent_brainrot_id.eq.${brainrotId}`)
    }
    
    if (userId && !brainrotId) {
      const { data: userBrainrots } = await supabaseClient
        .from('brainrots')
        .select('id')
        .eq('user_id', userId)
      
      if (userBrainrots && userBrainrots.length > 0) {
        const brainrotIds = userBrainrots.map(b => b.id)
        const conditions = brainrotIds.map(id => 
          `player_brainrot_id.eq.${id},opponent_brainrot_id.eq.${id}`
        ).join(',')
        
        countQuery = countQuery.or(conditions)
      }
    }
    
    const { count: totalCount, error: countError } = await countQuery
    
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