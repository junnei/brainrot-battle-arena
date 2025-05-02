import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, Trophy, Medal } from 'lucide-react';
import Button from '../components/ui/Button';
import BrainrotCard from '../components/brainrots/BrainrotCard';
import { useBrainrots } from '../context/BrainrotContext';
import { Brainrot, Battle } from '../types'; 
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

const ResultPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    selectedBrainrot, 
    opponentBrainrot, 
    battleResult, 
    resetBattle,
    setBrainrots,
    brainrots,
    battles,
    setBattles
  } = useBrainrots();

  // 컴포넌트 내부 상태
  const [localSelectedChar, setLocalSelectedChar] = useState<Brainrot | null>(selectedBrainrot);
  const [localOpponentChar, setLocalOpponentChar] = useState<Brainrot | null>(opponentBrainrot);
  const [statsUpdated, setStatsUpdated] = useState(false);
  const [battleRecorded, setBattleRecorded] = useState(false);

  // 캐릭터 데이터 유효성 및 로컬 상태 초기화
  useEffect(() => {
    if (!selectedBrainrot || !opponentBrainrot || !battleResult) {
      navigate('/'); // 데이터 없을 시 홈으로 이동
      return;
    }
    // 초기 렌더링 시 로컬 상태 설정
    setLocalSelectedChar(selectedBrainrot);
    setLocalOpponentChar(opponentBrainrot);
    setStatsUpdated(false); // 페이지 로드 시 업데이트 상태 초기화
    setBattleRecorded(false); // 배틀 기록 상태 초기화
  }, [selectedBrainrot, opponentBrainrot, battleResult, navigate]);

  // 배틀 내역 기록
  useEffect(() => {
    if (!localSelectedChar || !localOpponentChar || !battleResult || battleRecorded) {
      return; // 이미 기록했거나 필요한 데이터가 없으면 스킵
    }

    const isPlayerWinner = battleResult.id === localSelectedChar.id;
    
    // 새 배틀 객체 생성
    const newBattle: Battle = {
      id: uuidv4(),
      playerBrainrotId: localSelectedChar.id,
      opponentBrainrotId: localOpponentChar.id,
      winnerId: isPlayerWinner ? localSelectedChar.id : localOpponentChar.id,
      createdAt: new Date(),
      playerBrainrot: localSelectedChar,
      opponentBrainrot: localOpponentChar
    };

    // 배틀 목록 업데이트
    const updatedBattles = [newBattle, ...battles];
    
    // 최대 50개로 제한
    const limitedBattles = updatedBattles.slice(0, 50);
    
    // Context 업데이트
    setBattles(limitedBattles);
    
    // localStorage에 저장
    try {
      localStorage.setItem('battles', JSON.stringify(limitedBattles));
      console.log('배틀 내역이 성공적으로 저장되었습니다:', newBattle);
      setBattleRecorded(true); // 기록 완료 표시
    } catch (error) {
      console.error('배틀 내역 저장 중 오류 발생:', error);
    }
  }, [localSelectedChar, localOpponentChar, battleResult, battleRecorded, battles, setBattles]);

  // 전적 및 ELO 업데이트 (한 번만 실행)
  useEffect(() => {
    // 필요한 데이터가 없거나 이미 업데이트 했다면 스킵
    if (!localSelectedChar || !localOpponentChar || !battleResult || statsUpdated) {
      return;
    }

    const isPlayerWinner = battleResult.id === localSelectedChar.id;

    let finalUpdatedSelected: Brainrot | undefined;
    let finalUpdatedOpponent: Brainrot | undefined;

    // 캐릭터 데이터 업데이트 (기존 brainrots 배열 기준)
    const updatedBrainrots = brainrots.map(brainrot => {
      let updatedBrainrot = { ...brainrot }; // 복사본 생성

      if (brainrot.id === localSelectedChar.id) {
        const stats = brainrot.stats || { wins: 0, losses: 0, totalBattles: 0 };
        let newElo = Number(brainrot.elo) || 1000;
        if (isPlayerWinner) {
          newElo = Math.round(newElo + 20);
        } else {
          newElo = Math.round(newElo - 15); // 최소 점수 제한 제거
        }
        updatedBrainrot = {
          ...brainrot,
          stats: {
            wins: stats.wins + (isPlayerWinner ? 1 : 0),
            losses: stats.losses + (isPlayerWinner ? 0 : 1),
            totalBattles: stats.totalBattles + 1,
          },
          elo: newElo,
        };
        finalUpdatedSelected = updatedBrainrot; // 업데이트된 캐릭터 저장
      }
      else if (brainrot.id === localOpponentChar.id) {
        const stats = brainrot.stats || { wins: 0, losses: 0, totalBattles: 0 };
        let newElo = Number(brainrot.elo) || 1000;
        if (!isPlayerWinner) {
          newElo = Math.round(newElo + 20);
        } else {
          newElo = Math.round(newElo - 15); // 최소 점수 제한 제거
        }
        updatedBrainrot = {
          ...brainrot,
          stats: {
            wins: stats.wins + (!isPlayerWinner ? 1 : 0),
            losses: stats.losses + (!isPlayerWinner ? 0 : 1),
            totalBattles: stats.totalBattles + 1,
          },
          elo: newElo,
        };
        finalUpdatedOpponent = updatedBrainrot; // 업데이트된 캐릭터 저장
      }
      return updatedBrainrot;
    });

    // 1. 글로벌 상태 및 localStorage 업데이트
    setBrainrots(updatedBrainrots);
    try {
      // localStorage에 직접 저장하여 문제 감지
      localStorage.setItem('brainrots', JSON.stringify(updatedBrainrots));
      console.log('캐릭터 데이터가 성공적으로 저장되었습니다:', updatedBrainrots);
    } catch (error) {
      console.error('캐릭터 데이터 저장 중 오류 발생:', error);
    }

    // 2. 로컬 상태 업데이트 (업데이트된 데이터 사용)
    if (finalUpdatedSelected) {
      setLocalSelectedChar(finalUpdatedSelected);
    }
    if (finalUpdatedOpponent) {
      setLocalOpponentChar(finalUpdatedOpponent);
    }

    // 3. 업데이트 완료 플래그 설정
    setStatsUpdated(true);

  // 의존성 배열: battleResult ID, statsUpdated 플래그, brainrots 배열 참조
  // brainrots가 변경되면 로직 재실행 가능성 있으나, statsUpdated 플래그로 방지
  }, [battleResult?.id, statsUpdated, brainrots, setBrainrots, localSelectedChar?.id, localOpponentChar?.id]);

  // 전투 결과가 결정되었는지 확인
  const isPlayerWinner = battleResult?.id === localSelectedChar?.id;

  // Handle battle again
  const handleBattleAgain = () => {
    // 전투 결과 업데이트가 완료되었는지 확인
    if (!statsUpdated) {
      console.warn('전투 결과가 아직 업데이트되지 않았습니다. 업데이트를 기다립니다.');
      // 강제로 localStorage 업데이트 시도
      try {
        localStorage.setItem('brainrots', JSON.stringify(brainrots));
      } catch (error) {
        console.error('강제 저장 시도 중 오류:', error);
      }
    }
    resetBattle();
    navigate('/battle');
  };

  // Handle go home
  const handleGoHome = () => {
    // 전투 결과 업데이트가 완료되었는지 확인
    if (!statsUpdated) {
      console.warn('전투 결과가 아직 업데이트되지 않았습니다. 업데이트를 기다립니다.');
      // 강제로 localStorage 업데이트 시도
      try {
        localStorage.setItem('brainrots', JSON.stringify(brainrots));
      } catch (error) {
        console.error('강제 저장 시도 중 오류:', error);
      }
    }
    resetBattle();
    navigate('/');
  };

  // If no battle result, show loading
  if (!battleResult || !localSelectedChar || !localOpponentChar) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      {/* 결과 헤더 - 개선된 디자인 */}
      <div className="relative text-center mb-6">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Button
            variant="primary"
            onClick={handleGoHome}
            leftIcon={<Home size={16} />}
            className="absolute left-0 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 border-2 border-primary-700 bg-primary-600 hover:bg-primary-500"
          >
            {t('common.backToHome')}
          </Button>
          
          <div className="inline-block">
            <div className={`flex items-center justify-center rounded-full p-2 h-14 w-14 mx-auto border-2 ${isPlayerWinner ? 'bg-primary-600 border-primary-400 animate-pulse-slow' : 'bg-accent-600 border-accent-400 animate-pulse-slow'}`}>
              <Trophy size={24} className="text-white" />
            </div>
          </div>
          
          <Button
            variant="accent"
            onClick={handleBattleAgain}
            leftIcon={<RefreshCw size={16} />}
            className="absolute right-0 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 border-2 border-accent-700 bg-accent-600 hover:bg-accent-500"
          >
            {t('common.battleAgain')}
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">{t('resultPage.title')}</h1>
        <p className="text-sm text-gray-300 bg-gaming-card inline-block px-4 py-1 rounded-full">
          {t(isPlayerWinner ? 'resultPage.congratulations' : 'resultPage.defeated')}
        </p>
      </div>
      
      {/* 캐릭터 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-stretch">
        {/* 플레이어 캐릭터 */}
        <div className="flex justify-center md:justify-end">
          <div className="text-center w-full max-w-md">
            <h2 className="text-xl font-semibold text-primary-400 mb-3">{t('resultPage.yourBrainrot')}</h2>
            <div className={`bg-gaming-dark rounded-xl p-4 border-2 ${isPlayerWinner ? 'border-primary-500 shadow-lg shadow-primary-500/30' : 'border-gray-700'} transition-all hover:scale-[1.02]`}>
              <div className="relative">
                {isPlayerWinner && (
                  <div className="absolute -top-4 -right-4 z-10">
                    <div className="bg-primary-500 text-white p-1.5 rounded-full border-2 border-primary-700 animate-bounce-gentle">
                      <Medal size={28} />
                    </div>
                  </div>
                )}
                <BrainrotCard 
                  brainrot={localSelectedChar} 
                  isBattle 
                  isBattleWinner={isPlayerWinner}
                  showActions={false}
                  showFullDescription={true}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 상대 캐릭터 */}
        <div className="flex justify-center md:justify-start">
          <div className="text-center w-full max-w-md">
            <h2 className="text-xl font-semibold text-accent-400 mb-3">{t('resultPage.opponent')}</h2>
            <div className={`bg-gaming-dark rounded-xl p-4 border-2 ${!isPlayerWinner ? 'border-accent-500 shadow-lg shadow-accent-500/30' : 'border-gray-700'} transition-all hover:scale-[1.02]`}>
              <div className="relative">
                {!isPlayerWinner && (
                  <div className="absolute -top-4 -right-4 z-10">
                    <div className="bg-accent-500 text-white p-1.5 rounded-full border-2 border-accent-700 animate-bounce-gentle">
                      <Medal size={28} />
                    </div>
                  </div>
                )}
                <BrainrotCard 
                  brainrot={localOpponentChar} 
                  isBattle 
                  isBattleWinner={!isPlayerWinner}
                  showActions={false}
                  showFullDescription={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 결과 요약 박스 */}
      <div className="bg-gaming-dark rounded-lg p-6 max-w-2xl mx-auto border-2 border-gray-700 shadow-xl animate-scale-in">
        <div className="text-center mb-5">
          <h3 className="text-2xl font-bold text-white mb-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {t('resultPage.victorious', { name: battleResult.name })}
          </h3>
          <div className="bg-gaming-card/50 p-4 rounded-lg border border-gray-700/50 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-gray-300 text-sm">
              {battleResult.description}
            </p>
          </div>
        </div>
        
        {/* 상태 표시기 추가 */}
        <div className="text-center mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs ${statsUpdated && battleRecorded ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
            {statsUpdated && battleRecorded ? '전투 결과가 저장되었습니다' : '전투 결과 저장 중...'}
          </span>
        </div>
        
        {/* ELO 변화 표시 */}
        <div className="flex justify-center gap-8 my-5 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">{t('common.yourElo')}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                {(localSelectedChar?.elo || 1000) - (isPlayerWinner ? 20 : -15)}
              </span>
              <span className="text-sm font-semibold">
                {isPlayerWinner ? (
                  <span className="text-green-400">+20 ↑</span>
                ) : (
                  <span className="text-red-400">-15 ↓</span>
                )}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">{t('common.opponentElo')}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                {(localOpponentChar?.elo || 1000) - (!isPlayerWinner ? 20 : -15)}
              </span>
              <span className="text-sm font-semibold">
                {!isPlayerWinner ? (
                  <span className="text-green-400">+20 ↑</span>
                ) : (
                  <span className="text-red-400">-15 ↓</span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        {/* 모바일에서는 버튼 세로로 표시, 중간 크기 이상 디스플레이에서는 가로로 표시 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-5 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <Button
            onClick={handleBattleAgain}
            leftIcon={<RefreshCw size={18} />}
            variant="accent"
            className="rounded-full px-6 py-2.5 hover:scale-105 transition-transform shadow-md hover:shadow-lg border-2 border-accent-700 bg-accent-600 hover:bg-accent-500"
          >
            {t('common.battleAgain')}
          </Button>
          <Button
            variant="primary"
            onClick={handleGoHome}
            leftIcon={<Home size={18} />}
            className="rounded-full px-6 py-2.5 hover:scale-105 transition-transform shadow-md hover:shadow-lg border-2 border-primary-700 bg-primary-600 hover:bg-primary-500"
          >
            {t('common.backToHome')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;