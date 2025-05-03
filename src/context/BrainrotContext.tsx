import React, { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase'; 
import { Brainrot, Battle, BrainrotContextType } from '../types';
import { useAuth } from './AuthContext'; 

// 로컬 스토리지 키
const BRAINROTS_STORAGE_KEY = 'brainrots';
const BATTLES_STORAGE_KEY = 'battles'; // 배틀 기록용 키
const BRAINROT_IMAGES_BUCKET = 'brainrot-images'; // Supabase Storage 버킷 이름

// Sample Data (defined outside the component)
const sampleBrainrots: Brainrot[] = [
  {
    id: uuidv4(),
    userId: 'sample-user-1',
    name: '멸망 드래곤',
    description: '화염과 파괴를 가져오는 강력한 드래곤',
    imageUrl: 'https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: new Date(),
    stats: { wins: 0, losses: 0, totalBattles: 0 },
    elo: 1000,
    riskLevel: 3, // 높은 위험도
  },
  {
    id: uuidv4(),
    userId: 'sample-user-2',
    name: '마법사 마스터',
    description: '상처 입고 분노한 마법사',
    imageUrl: 'https://images.pexels.com/photos/6665327/pexels-photo-6665327.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: new Date(),
    stats: { wins: 0, losses: 0, totalBattles: 0 },
    elo: 1000,
    riskLevel: 2, // 중간 위험도
  },
  {
    id: uuidv4(),
    userId: 'sample-user-3',
    name: '그림자 암살자',
    description: '그림자 속에서 움직이는 치명적인 암살자',
    imageUrl: 'https://images.pexels.com/photos/5435304/pexels-photo-5435304.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: new Date(),
    stats: { wins: 0, losses: 0, totalBattles: 0 },
    elo: 1000,
    riskLevel: 1, // 낮은 위험도
  },
];

// 컨텍스트 생성
export const BrainrotContext = createContext<BrainrotContextType | undefined>(
  undefined
);

export const BrainrotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [brainrots, setBrainrots] = useState<Brainrot[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [selectedBrainrot, setSelectedBrainrot] = useState<Brainrot | null>(null);
  const [opponentBrainrot, setOpponentBrainrot] = useState<Brainrot | null>(null);
  const [battleResult, setBattleResult] = useState<Brainrot | null>(null);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null); // 현재 배틀 정보
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase 형식의 객체를 Brainrot 타입으로 변환
  const convertToBrainrot = (data: {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    image_url?: string;
    created_at: string;
    elo?: number;
    wins?: number;
    losses?: number;
    total_battles?: number;
    risk_level?: number;
  }): Brainrot => ({
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description || '',
    imageUrl: data.image_url || '',
    createdAt: new Date(data.created_at),
    elo: data.elo || 1000,
    riskLevel: data.risk_level || 1,
    stats: {
      wins: data.wins || 0,
      losses: data.losses || 0,
      totalBattles: data.total_battles || 0
    }
  });

  // 사용자 상태가 변경되면 데이터를 다시 로드합니다.
  useEffect(() => {
    // fetchBrainrots 함수를 useEffect 내부에 선언하여 종속성 문제 해결
    const fetchBrainrots = async () => {
      // 이미 로딩 중이면 중복 요청 방지
      if (isLoading) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 브레인롯 데이터 로드
        const { data: brainrotsData, error: brainrotsError } = await supabase
          .from('brainrots')
          .select('*')
          .order('created_at', { ascending: false });

        let fetchedBrainrots: Brainrot[] = [];
        if (brainrotsError) {
          console.error('브레인롯 조회 실패:', brainrotsError);
          // 로컬 스토리지 폴백 시도 (필요한 경우)
          const localData = localStorage.getItem(BRAINROTS_STORAGE_KEY);
          if (localData) {
            try {
              fetchedBrainrots = JSON.parse(localData);
              console.warn('Supabase 조회 실패, 로컬 데이터 사용');
            } catch (parseError) {
              console.error('로컬 데이터 파싱 실패:', parseError);
              setBrainrots(sampleBrainrots); // 샘플 데이터 직접 설정
              console.warn('Supabase 및 로컬 데이터 조회 실패, 샘플 데이터 사용');
              
              // 배틀 데이터 로드 건너뛰기
              setIsLoading(false);
              return;
            }
          } else {
            setBrainrots(sampleBrainrots); // 샘플 데이터 직접 설정
            console.warn('Supabase 및 로컬 데이터 조회 실패, 샘플 데이터 사용');
            
            // 배틀 데이터 로드 건너뛰기
            setIsLoading(false);
            return;
          }
        } else if (brainrotsData && brainrotsData.length > 0) {
          fetchedBrainrots = brainrotsData.map(convertToBrainrot);
        } else {
          setBrainrots(sampleBrainrots); // 샘플 데이터 직접 설정
          console.warn('Supabase 데이터가 비어있어 샘플 데이터를 사용합니다.');
          
          // 배틀 데이터 로드 건너뛰기
          setIsLoading(false);
          return;
        }
        setBrainrots(fetchedBrainrots); // Set brainrots state correctly

        // 배틀 기록 로드 (로그인 상태일 때만)
        if (user) {
          try {
            const { data: battlesData, error: battlesError } = await supabase
              .from('battles')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50); // Limit results

            if (battlesError) {
              console.error('배틀 기록 조회 실패:', battlesError);
              setBattles([]); // Clear or handle battle state on error
            } else {
              // Map fetched battle data (snake_case) to Battle interface (camelCase)
              const mappedBattles = battlesData.map((battle: {
                id: string;
                player_brainrot_id: string;
                opponent_brainrot_id: string;
                winner_id: string | null;
                battle_result?: string;
                battle_narrative?: string;
                created_at: string;
              }): Battle => ({
                id: battle.id, // UUID가 문자열로 반환됨
                playerBrainrotId: battle.player_brainrot_id,
                opponentBrainrotId: battle.opponent_brainrot_id,
                winnerId: battle.winner_id,
                battleResult: battle.battle_result as 'WIN' | 'LOSS' | 'DRAW' | undefined,
                battleNarrative: battle.battle_narrative,
                createdAt: new Date(battle.created_at),
                playerBrainrot: fetchedBrainrots.find(b => b.id === battle.player_brainrot_id),
                opponentBrainrot: fetchedBrainrots.find(b => b.id === battle.opponent_brainrot_id),
                // 승패 결과 계산
                isPlayerWon: battle.battle_result === 'WIN',
                isDraw: battle.battle_result === 'DRAW'
              }));
              setBattles(mappedBattles); // Set battles state correctly
            }
          } catch (battleError) {
            console.error('배틀 데이터 로딩 중 예외 발생:', battleError);
            setBattles([]);
          }
        }
      } catch (error) {
        console.error('브레인롯 또는 배틀 데이터 로딩 실패:', error);
        setError('데이터 로딩 중 오류가 발생했습니다');
        setBrainrots(sampleBrainrots); // 직접 샘플 데이터 설정
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrainrots();
    
    // 정리 함수 추가: 언마운트 시 실행되어 추가 요청 방지
    return () => {
      setIsLoading(false);
    };
    
  // 종속성 배열에서 loadSampleBrainrots와 같은 함수 참조 제거, user?.user_id만 포함
  }, [user?.user_id, user]);

  // 이미지 파일을 Supabase Storage에 업로드하는 함수
  const uploadBrainrotImage = async (file: File): Promise<string> => {
    if (!user || !user.user_id) {
      throw new Error('이미지를 업로드하려면 로그인이 필요합니다');
    }

    // 파일 형식 검증
    const fileExt = file.name.split('.').pop();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif'];
    if (!fileExt || !allowedExts.includes(fileExt.toLowerCase())) {
      throw new Error('지원되지 않는 파일 형식입니다. (JPG, PNG, GIF 허용)');
    }
    
    // 파일 크기 검증 (5MB 이하)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('파일 크기가 너무 큽니다. 5MB 이하의 이미지를 사용해주세요.');
    }
    
    const fileName = `${user.user_id}/${uuidv4()}.${fileExt}`; // Use text user_id for path
    
    try {
      // 이미지 업로드
      const { error: uploadError } = await supabase.storage
        .from(BRAINROT_IMAGES_BUCKET)
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('이미지 업로드 오류:', uploadError);
        throw new Error('이미지 업로드에 실패했습니다.');
      }
      
      // 업로드된 이미지의 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from(BRAINROT_IMAGES_BUCKET)
        .getPublicUrl(fileName);
        
      if (urlData?.publicUrl) {
        return urlData.publicUrl;
      } else {
        throw new Error('이미지 URL을 가져오지 못했습니다.');
      }
    } catch (err) {
      console.error('이미지 업로드 중 예외 발생:', err);
      throw new Error('이미지 업로드에 실패했습니다.');
    }
  };

  // 브레인롯 생성 함수
  const createBrainrot = async (brainrotData: Omit<Brainrot, 'id' | 'userId' | 'createdAt' | 'stats'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user || !user.user_id) { 
        throw new Error('로그인 상태가 아니거나 사용자 프로필 ID가 없습니다');
      }

      // Supabase 데이터베이스 함수 호출
      const { data: createdBrainrot, error } = await supabase.rpc(
        'create_brainrot',
        {
          p_name: brainrotData.name,
          p_description: brainrotData.description,
          p_image_url: brainrotData.imageUrl || '',
          p_user_id: user.user_id
          // risk_level은 서버에서 항상 1로 설정
        }
      );

      if (error) {
        console.error('브레인롯 생성 오류:', error);
        throw new Error('브레인롯 생성 중 오류가 발생했습니다');
      }

      if (!createdBrainrot) {
        throw new Error('브레인롯 생성 후 데이터를 받지 못했습니다.');
      }

      // 반환된 데이터를 Brainrot 형식으로 변환
      const newBrainrot = convertToBrainrot(createdBrainrot);
      
      // 로컬 상태 업데이트
      const updatedBrainrots = [...brainrots, newBrainrot];
      setBrainrots(updatedBrainrots);
      
      console.log('브레인롯이 성공적으로 생성되었습니다:', newBrainrot);

    } catch (err) {
      console.error('브레인롯 생성 실패:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('브레인롯 생성에 실패했습니다');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectBrainrot = (brainrotId: string) => {
    const brainrot = brainrots.find(b => b.id === brainrotId) || null;
    setSelectedBrainrot(brainrot);
  };

  const findOpponent = () => {
    setIsLoading(true);
    
    try {
      if (!selectedBrainrot) {
        throw new Error('선택한 브레인롯이 없습니다. 먼저 브레인롯을 선택해주세요.');
      }

      // 현재 브레인롯의 ELO 점수
      const playerElo = selectedBrainrot.elo || 1000;
      
      // 1. 사용자의 브레인롯을 제외한 다른 사용자의 브레인롯 찾기
      const otherUserBrainrots = brainrots.filter(b => user && b.userId !== user.user_id);
      
      // 2. 다른 사용자의 브레인롯이 없으면 샘플 브레인롯 생성하여 사용
      if (otherUserBrainrots.length === 0) {
        console.log('대결 가능한 상대가 없어 샘플 브레인롯을 생성합니다.');
        
        // 샘플 브레인롯 생성 - 플레이어 ELO 기준으로 비슷한 ELO 값을 가지도록 설정
        const sampleBrainrots: Brainrot[] = [
          {
            id: uuidv4(),
            userId: 'sample-user-1',
            name: '멸망 드래곤',
            description: '화염과 파괴를 가져오는 강력한 드래곤',
            imageUrl: 'https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=800',
            createdAt: new Date(),
            stats: { wins: 5, losses: 2, totalBattles: 7 },
            elo: playerElo + Math.floor(Math.random() * 100) - 50, // 플레이어 ELO의 ±50 범위
            riskLevel: 3, // 높은 위험도
          },
          {
            id: uuidv4(),
            userId: 'sample-user-2',
            name: '마법사 마스터',
            description: '상처 입고 분노한 마법사',
            imageUrl: 'https://images.pexels.com/photos/6665327/pexels-photo-6665327.jpeg?auto=compress&cs=tinysrgb&w=800',
            createdAt: new Date(),
            stats: { wins: 3, losses: 1, totalBattles: 4 },
            elo: playerElo + Math.floor(Math.random() * 150) - 75, // 플레이어 ELO의 ±75 범위
            riskLevel: 2, // 중간 위험도
          },
          {
            id: uuidv4(),
            userId: 'sample-user-3',
            name: '그림자 암살자',
            description: '그림자 속에서 움직이는 치명적인 암살자',
            imageUrl: 'https://images.pexels.com/photos/5435304/pexels-photo-5435304.jpeg?auto=compress&cs=tinysrgb&w=800',
            createdAt: new Date(),
            stats: { wins: 2, losses: 2, totalBattles: 4 },
            elo: playerElo + Math.floor(Math.random() * 200) - 100, // 플레이어 ELO의 ±100 범위
            riskLevel: 1, // 낮은 위험도
          },
        ];
        
        // 샘플 브레인롯 중 랜덤으로 선택
        const randomIndex = Math.floor(Math.random() * sampleBrainrots.length);
        const selectedSampleBrainrot = sampleBrainrots[randomIndex];
        
        // 현재 브레인롯 목록에 샘플 브레인롯 추가
        const updatedBrainrots = [...brainrots, ...sampleBrainrots];
        setBrainrots(updatedBrainrots);
        
        // 선택된 샘플 브레인롯에 대한 로그
        console.log('선택된 샘플 브레인롯:', selectedSampleBrainrot.name);
        console.log('플레이어 ELO:', playerElo, '상대방 ELO:', selectedSampleBrainrot.elo);
        
        // 선택된 샘플 브레인롯을 상대로 설정
        setOpponentBrainrot(selectedSampleBrainrot);
      } else {
        // ELO 점수 차이를 기준으로 정렬 (차이가 적은 순으로)
        const sortedByEloDiff = [...otherUserBrainrots].sort((a, b) => {
          const aEloDiff = Math.abs((a.elo || 1000) - playerElo);
          const bEloDiff = Math.abs((b.elo || 1000) - playerElo);
          return aEloDiff - bEloDiff;
        });
        
        // ELO 차이가 가장 적은 상위 N개 중에서 랜덤 선택 (ELO가 비슷한 상대만 선택하되 다양성 유지)
        const topSimilarEloCount = Math.min(3, sortedByEloDiff.length);
        const randomIndex = Math.floor(Math.random() * topSimilarEloCount);
        const selectedOpponent = sortedByEloDiff[randomIndex];
        
        // 선택된 상대방에 대한 로그
        console.log('선택된 상대방:', selectedOpponent.name);
        console.log('플레이어 ELO:', playerElo, '상대방 ELO:', selectedOpponent.elo);
        console.log('ELO 차이:', Math.abs((selectedOpponent.elo || 1000) - playerElo));
        
        setOpponentBrainrot(selectedOpponent);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('상대 찾기에 실패했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 특정 브레인롯의 배틀 기록 가져오기
  const getBrainrotBattles = (brainrotId: string): Battle[] => {
    // 배틀 기록에서 해당 브레인롯 ID가 포함된 배틀 필터링
    return battles.filter(battle => 
      battle.playerBrainrotId === brainrotId || 
      battle.opponentBrainrotId === brainrotId
    ).slice(0, 5); // 각 브레인롯당 최대 5개의 배틀 내역만 반환
  };

  // 배틀 시작 함수
  const startBattle = async () => {
    if (!selectedBrainrot || !opponentBrainrot) {
      console.error('브레인롯이 선택되지 않았습니다.');
      return;
    }

    if (!user) {
      console.error('로그인 상태가 아닙니다.');
      setError('로그인 후 배틀을 시작할 수 있습니다.');
      return;
    }

    setIsLoading(true);
    
    try {
      // 전투 시작 전 ELO 점수 저장
      const playerStartElo = selectedBrainrot.elo;
      const opponentStartElo = opponentBrainrot.elo;
      
      // Supabase RPC 호출을 사용하여 서버 측에서 배틀 처리
      const { data: battleResultData, error } = await supabase.rpc('process_battle', {
        player_brainrot_id: selectedBrainrot.id,
        opponent_brainrot_id: opponentBrainrot.id,
        user_id: user.user_id
      });
      
      if (error) {
        console.error('배틀 처리 중 오류 발생:', error);
        setError('배틀 처리 중 오류가 발생했습니다.');
        return;
      }
      
      const { 
        battle_id, 
        battle_result, 
        battle_narrative
      } = battleResultData;
      
      // 승자 ID 결정 (DB에서 받지 않고 클라이언트에서 계산)
      const winner_id = battle_result === 'WIN' 
        ? selectedBrainrot.id 
        : (battle_result === 'LOSS' ? opponentBrainrot.id : null);
      
      // 업데이트된 브레인롯 정보 가져오기
      const [playerResult, opponentResult] = await Promise.all([
        supabase.from('brainrots').select('*').eq('id', selectedBrainrot.id).single(),
        supabase.from('brainrots').select('*').eq('id', opponentBrainrot.id).single()
      ]);
      
      if (playerResult.error || opponentResult.error) {
        console.error('업데이트된 브레인롯 정보 가져오기 실패:', playerResult.error || opponentResult.error);
        setError('배틀 결과를 불러오는 데 실패했습니다.');
        return;
      }
      
      // 결과 업데이트
      if (playerResult.data && opponentResult.data) {
        const updatedPlayerBrainrot = convertToBrainrot(playerResult.data);
        const updatedOpponentBrainrot = convertToBrainrot(opponentResult.data);
        
        // 전투 후 ELO 점수 저장
        const playerEndElo = updatedPlayerBrainrot.elo;
        const opponentEndElo = updatedOpponentBrainrot.elo;
        
        // 상태 업데이트
        setSelectedBrainrot(updatedPlayerBrainrot);
        setOpponentBrainrot(updatedOpponentBrainrot);
        
        // 배틀 결과에 따라 승자 브레인롯 설정
        const isPlayerWon = battle_result === 'WIN';
        const isDraw = battle_result === 'DRAW';
        setBattleResult(isPlayerWon ? updatedPlayerBrainrot : (isDraw ? null : updatedOpponentBrainrot));
        
        // 배틀 내역 생성
        const newBattle: Battle = {
          id: battle_id,
          playerBrainrotId: selectedBrainrot.id,
          opponentBrainrotId: opponentBrainrot.id,
          winnerId: winner_id,
          createdAt: new Date(),
          playerBrainrot: updatedPlayerBrainrot,
          opponentBrainrot: updatedOpponentBrainrot,
          battleResult: battle_result,
          battleNarrative: battle_narrative,
          isPlayerWon: isPlayerWon,
          isDraw: isDraw,
          playerStartElo: playerStartElo,
          playerEndElo: playerEndElo,
          opponentStartElo: opponentStartElo,
          opponentEndElo: opponentEndElo
        };
        
        setCurrentBattle(newBattle);
        setBattles(prevBattles => [newBattle, ...prevBattles]);
        
        // 로컬 스토리지에도 저장 (폴백)
        localStorage.setItem(BATTLES_STORAGE_KEY, JSON.stringify([newBattle, ...battles]));
        
        console.log('배틀 ID:', battle_id);
        console.log('배틀 결과:', battle_result);
        console.log('배틀 서사:', battle_narrative);
        console.log('플레이어 ELO 변화:', playerStartElo, '->', playerEndElo, '(변화량:', playerEndElo - playerStartElo, ')');
        console.log('상대방 ELO 변화:', opponentStartElo, '->', opponentEndElo, '(변화량:', opponentEndElo - opponentStartElo, ')');
      }
      
    } catch (error) {
      console.error('배틀 처리 중 오류 발생:', error);
      setError('배틀 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 배틀 초기화 함수
  const resetBattle = async () => {
    setOpponentBrainrot(null);
    setBattleResult(null);
    setCurrentBattle(null); // 현재 배틀 정보 초기화
    
    // 최신 브레인롯 데이터 다시 로드
    try {
      if (selectedBrainrot) {
        const { data, error } = await supabase
          .from('brainrots')
          .select('*')
          .eq('id', selectedBrainrot.id)
          .single();
          
        if (error) {
          console.error('브레인롯 새로고침 오류:', error);
        } else if (data) {
          // 선택된 브레인롯 정보 업데이트
          const updatedBrainrot: Brainrot = {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            description: data.description || '',
            imageUrl: data.image_url || '',
            createdAt: new Date(data.created_at),
            elo: data.elo || 1000,
            riskLevel: data.risk_level || 1,
            stats: {
              wins: data.wins || 0,
              losses: data.losses || 0,
              totalBattles: data.total_battles || 0
            }
          };
          
          setSelectedBrainrot(updatedBrainrot);
          
          // 브레인롯 목록에서도 업데이트
          const updatedBrainrots = brainrots.map(b => 
            b.id === updatedBrainrot.id ? updatedBrainrot : b
          );
          setBrainrots(updatedBrainrots);
        }
      }
    } catch (error) {
      console.error('브레인롯 재로딩 오류:', error);
    }
  };

  // 사용자의 배틀 기록 조회
  const getUserBattles = (): Battle[] => {
    if (!user) return [];
    return battles.filter(battle => 
      battle.playerBrainrotId === selectedBrainrot?.id || 
      battle.opponentBrainrotId === selectedBrainrot?.id
    );
  };

  // 브레인롯 삭제 함수
  const deleteBrainrot = async (brainrotId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user || !user.user_id) { 
        throw new Error('로그인 상태가 아닙니다');
      }
      
      // 먼저 브레인롯이 현재 사용자의 것인지 확인
      const brainrotToDelete = brainrots.find(b => b.id === brainrotId);
      if (!brainrotToDelete) {
        throw new Error('브레인롯을 찾을 수 없습니다');
      }
      
      if (brainrotToDelete.userId !== user.user_id) { 
        throw new Error('다른 사용자의 브레인롯은 삭제할 수 없습니다');
      }
      
      // Supabase에서 삭제
      const { error } = await supabase
        .from('brainrots')
        .delete()
        .eq('id', brainrotId);

      if (error) {
        console.error('브레인롯 삭제 오류:', error);
        throw new Error('브레인롯 삭제 중 오류가 발생했습니다');
      }

      // 이미지 파일 삭제 (오류 발생해도 계속 진행)
      if (brainrotToDelete.imageUrl) {
        try {
          const urlParts = brainrotToDelete.imageUrl.split('/');
          const imagePath = urlParts.slice(urlParts.indexOf(BRAINROT_IMAGES_BUCKET) + 1).join('/');
          if (imagePath) {
            const { error: deleteImageError } = await supabase.storage
              .from(BRAINROT_IMAGES_BUCKET)
              .remove([imagePath]);
            if (deleteImageError) {
              console.warn('이미지 파일 삭제 오류:', deleteImageError);
            }
          }
        } catch (imgErr) {
          console.warn('이미지 파일 삭제 중 예외 발생:', imgErr);
        }
      }

      // 로컬 상태 업데이트
      const updatedBrainrots = brainrots.filter(b => b.id !== brainrotId);
      setBrainrots(updatedBrainrots);

      // 선택된 브레인롯이 삭제된 경우 선택 해제
      if (selectedBrainrot?.id === brainrotId) {
        setSelectedBrainrot(null);
      }

      // 로컬 스토리지 업데이트
      localStorage.setItem(BRAINROTS_STORAGE_KEY, JSON.stringify(updatedBrainrots));

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('브레인롯 삭제에 실패했습니다');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 브레인롯 업데이트 함수
  const updateBrainrot = async (brainrotId: string, updatedData: Partial<Omit<Brainrot, 'id' | 'userId' | 'createdAt'>>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user || !user.user_id) { 
        throw new Error('로그인 상태가 아닙니다');
      }

      // 먼저 브레인롯이 현재 사용자의 것인지 확인
      const brainrotToUpdate = brainrots.find(b => b.id === brainrotId);
      if (!brainrotToUpdate) {
        throw new Error('브레인롯을 찾을 수 없습니다');
      }

      if (brainrotToUpdate.userId !== user.user_id) { 
        throw new Error('다른 사용자의 브레인롯은 수정할 수 없습니다');
      }

      // Supabase 데이터 형식으로 변환
      const dataToUpdate: {
        name?: string;
        description?: string;
        image_url?: string;
        elo?: number;
        wins?: number;
        losses?: number;
        total_battles?: number;
        risk_level?: number;
      } = {};
      
      // 필드 매핑 (클라이언트 camelCase -> 서버 snake_case)
      if (updatedData.name) dataToUpdate.name = updatedData.name;
      if (updatedData.description) dataToUpdate.description = updatedData.description;
      
      // imageUrl은 image_url로 변환해서 저장
      if (updatedData.imageUrl) dataToUpdate.image_url = updatedData.imageUrl;
      
      if (updatedData.elo) dataToUpdate.elo = updatedData.elo;
      if (updatedData.stats) {
        dataToUpdate.wins = updatedData.stats.wins;
        dataToUpdate.losses = updatedData.stats.losses;
        dataToUpdate.total_battles = updatedData.stats.totalBattles;
      }
      
      if (updatedData.riskLevel) dataToUpdate.risk_level = updatedData.riskLevel;
      
      // Supabase 업데이트
      const { error } = await supabase
        .from('brainrots')
        .update(dataToUpdate)
        .eq('id', brainrotId);
      
      if (error) {
        console.error('브레인롯 업데이트 오류:', error);
        throw new Error('브레인롯 업데이트 중 오류가 발생했습니다');
      }
      
      // 로컬 상태 업데이트
      const updatedBrainrots = brainrots.map(brainrot => {
        if (brainrot.id === brainrotId) {
          return { ...brainrot, ...updatedData };
        }
        return brainrot;
      });
      
      setBrainrots(updatedBrainrots);
      localStorage.setItem(BRAINROTS_STORAGE_KEY, JSON.stringify(updatedBrainrots));

      // 선택된 브레인롯이 업데이트된 경우 선택 상태도 업데이트
      if (selectedBrainrot?.id === brainrotId) {
        const updatedSelected = updatedBrainrots.find(b => b.id === brainrotId);
        setSelectedBrainrot(updatedSelected || null);
      }

    } catch (err) {
      console.error('브레인롯 업데이트 실패:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('브레인롯 업데이트에 실패했습니다');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BrainrotContext.Provider
      value={{
        brainrots,
        userBrainrots: user ? brainrots.filter(b => b.userId === user.user_id) : [],
        selectedBrainrot,
        opponentBrainrot,
        battleResult,
        currentBattle, // 현재 배틀 정보 추가
        battles,
        isLoading,
        error,
        createBrainrot,
        selectBrainrot,
        findOpponent,
        startBattle,
        resetBattle,
        getUserBattles,
        getBrainrotBattles,
        setBrainrots,
        setSelectedBrainrot,
        setOpponentBrainrot,
        deleteBrainrot,
        updateBrainrot,
        setBattles,
        uploadBrainrotImage,
      }}
    >
      {children}
    </BrainrotContext.Provider>
  );
};

export const useBrainrots = () => useContext(BrainrotContext);