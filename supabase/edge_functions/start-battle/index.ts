import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface BattleRequest {
  playerBrainrotId: string
  opponentBrainrotId: string
}

// 입력값 유효성 검증 함수
function validateBattleRequest(data: any): { valid: boolean; error?: string } {
  // playerBrainrotId 검증
  if (!data.playerBrainrotId || typeof data.playerBrainrotId !== 'string' || data.playerBrainrotId.trim().length === 0) {
    return { valid: false, error: '플레이어 브레인롯 ID는 필수입니다' };
  }
  
  // opponentBrainrotId 검증
  if (!data.opponentBrainrotId || typeof data.opponentBrainrotId !== 'string' || data.opponentBrainrotId.trim().length === 0) {
    return { valid: false, error: '상대방 브레인롯 ID는 필수입니다' };
  }
  
  // 자기 자신과의 대결 방지
  if (data.playerBrainrotId === data.opponentBrainrotId) {
    return { valid: false, error: '자신의 브레인롯과는 대결할 수 없습니다' };
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
    console.log('start-battle: Authorization 헤더 존재?', !!authHeader);
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
      console.error('start-battle: 사용자 인증 오류', userError);
      return new Response(
        JSON.stringify({ error: '인증되지 않은 사용자입니다.' }),
        { status: 401, headers }
      )
    }

    console.log('start-battle: 인증된 사용자 ID', user.id);

    // 사용자의 프로필 정보 가져오기 (profiles 테이블에서 user_id 조회)
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('start-battle: 프로필 정보 조회 오류', profileError);
      return new Response(
        JSON.stringify({ error: '사용자 프로필 정보를 찾을 수 없습니다.' }),
        { status: 404, headers }
      )
    }

    const userIdentifier = profileData.user_id;
    console.log('start-battle: 사용자 식별자(user_id)', userIdentifier);

    // 요청 데이터 파싱
    const battleRequest: BattleRequest = await req.json()
    
    // 입력값 유효성 검증
    const validation = validateBattleRequest(battleRequest);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers }
      )
    }

    // 일일 배틀 제한 확인 - 사용자당 하루 최대 30회
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayBattleCount, error: battleCountError } = await supabaseClient
      .from('battles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .eq('user_id', userIdentifier);
    
    if (battleCountError) {
      console.error('start-battle: 배틀 수 조회 오류', battleCountError);
    } else if (todayBattleCount && todayBattleCount >= 30) {
      return new Response(
        JSON.stringify({ error: '하루 최대 30회까지만 배틀을 할 수 있습니다. 내일 다시 시도해주세요.' }),
        { status: 429, headers }
      )
    }

    // 브레인롯 존재 여부 확인
    const { data: brainrots, error: brainrotsError } = await supabaseClient
      .from('brainrots')
      .select('id, user_id')
      .in('id', [battleRequest.playerBrainrotId, battleRequest.opponentBrainrotId]);
      
    if (brainrotsError || !brainrots || brainrots.length !== 2) {
      return new Response(
        JSON.stringify({ error: '플레이어 또는 상대방 브레인롯을 찾을 수 없습니다' }),
        { status: 404, headers }
      )
    }
    
    // 플레이어 브레인롯 정보 찾기
    const playerBrainrot = brainrots.find(b => b.id === battleRequest.playerBrainrotId);
    if (!playerBrainrot) {
      return new Response(
        JSON.stringify({ error: '플레이어 브레인롯을 찾을 수 없습니다' }),
        { status: 404, headers }
      )
    }
    
    // 소유권 확인
    if (playerBrainrot.user_id !== userIdentifier) {
      return new Response(
        JSON.stringify({ error: '자신의 브레인롯으로만 배틀을 시작할 수 있습니다' }),
        { status: 403, headers }
      )
    }

    // 배틀 처리를 위해 Database Function 호출
    const { data: battleResult, error: battleError } = await supabaseClient.rpc(
      'process_battle',
      {
        player_brainrot_id: battleRequest.playerBrainrotId,
        opponent_brainrot_id: battleRequest.opponentBrainrotId,
        user_id: userIdentifier
      }
    )
    
    if (battleError) {
      return new Response(
        JSON.stringify({ error: battleError.message }),
        { status: 500, headers }
      )
    }

    // 배틀 결과 반환
    const { 
      battle_id, 
      battle_result, 
      battle_narrative,
      player_elo,
      opponent_elo,
      player_new_elo,
      opponent_new_elo
    } = battleResult
    
    // 승자 ID 결정 (DB에서 받지 않고 클라이언트에서 계산)
    const winner_id = battle_result === 'WIN' 
      ? battleRequest.playerBrainrotId 
      : (battle_result === 'LOSS' ? battleRequest.opponentBrainrotId : null)
    
    // ELO 값 확인 로깅
    console.log('start-battle: ELO 변화:', {
      playerElo: { before: player_elo, after: player_new_elo, diff: player_new_elo - player_elo },
      opponentElo: { before: opponent_elo, after: opponent_new_elo, diff: opponent_new_elo - opponent_elo }
    });
    
    // 배틀 후 업데이트된 브레인롯 정보 가져오기
    const [updatedPlayerResult, updatedOpponentResult] = await Promise.all([
      supabaseClient
        .from('brainrots')
        .select('*')
        .eq('id', battleRequest.playerBrainrotId)
        .single(),
      supabaseClient
        .from('brainrots')
        .select('*')
        .eq('id', battleRequest.opponentBrainrotId)
        .single()
    ])
    
    if (updatedPlayerResult.error || updatedOpponentResult.error) {
      return new Response(
        JSON.stringify({ 
          error: '업데이트된 브레인롯 정보를 가져오는 데 실패했습니다',
          battle_id,
          battle_result,
          battle_narrative
        }),
        { status: 200, headers } // 배틀 자체는 성공했으므로 200 반환
      )
    }
    
    // 배틀 상세 정보 반환
    return new Response(
      JSON.stringify({
        battleId: battle_id,
        battleResult: battle_result,
        battleNarrative: battle_narrative,
        winnerId: winner_id,
        playerBrainrot: updatedPlayerResult.data,
        opponentBrainrot: updatedOpponentResult.data,
        playerStartElo: player_elo,
        opponentStartElo: opponent_elo,
        playerEndElo: player_new_elo,
        opponentEndElo: opponent_new_elo,
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