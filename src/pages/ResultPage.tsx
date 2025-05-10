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
    currentBattle, // 현재 전투 정보 
    resetBattle,
    setBrainrots,
    brainrots,
    battles,
    setBattles
  } = useBrainrots()!;

  // 컴포넌트 내부 상태
  const [localSelectedChar, setLocalSelectedChar] = useState<Brainrot | null>(selectedBrainrot);
  const [localOpponentChar, setLocalOpponentChar] = useState<Brainrot | null>(opponentBrainrot);
  const [statsUpdated, setStatsUpdated] = useState(false);
  const [battleRecorded, setBattleRecorded] = useState(false);
  const [battleNarrative, setBattleNarrative] = useState<string | null>(null);

  // 디버깅을 위한 로그 추가 - 개발 모드에서만 1회 출력되도록 수정
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ResultPage 초기 렌더링:', { 
        selectedBrainrot, 
        opponentBrainrot, 
        battleResult, 
        currentBattle 
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워서 초기 렌더링 시에만 실행

  // 캐릭터 데이터 유효성 및 로컬 상태 초기화
  useEffect(() => {
    // 필수 데이터가 없으면 홈으로 리다이렉트
    if (!selectedBrainrot || !opponentBrainrot) {
      if (process.env.NODE_ENV === 'development') {
        console.log('필수 데이터 없음: 홈으로 리다이렉트');
      }
      navigate('/');
      return;
    }
    
    // 초기 렌더링 시 로컬 상태 설정
    setLocalSelectedChar(selectedBrainrot);
    setLocalOpponentChar(opponentBrainrot);
    setStatsUpdated(false); // 페이지 로드 시 업데이트 상태 초기화
    setBattleRecorded(false); // 배틀 기록 상태 초기화
    
    // 전투 서사 설정 (currentBattle에서 가져옴)
    if (currentBattle?.battleNarrative) {
      if (process.env.NODE_ENV === 'development') {
        console.log('배틀 서사 설정:', currentBattle.battleNarrative);
      }
      setBattleNarrative(currentBattle.battleNarrative);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워 마운트 시에만 실행

  // 배틀 내역 기록 - 반드시 한 번만 실행되어야 함
  useEffect(() => {
    if (!localSelectedChar || !localOpponentChar) {
      return; // 필요한 데이터가 없으면 스킵
    }

    // 이미 배틀이 기록되었으면 처리하지 않음
    if (battleRecorded) {
      return;
    }

    if (currentBattle) {
      if (process.env.NODE_ENV === 'development') {
        console.log('현재 배틀 정보 있음:', currentBattle);
      }
      // 이미 현재 배틀 정보가 있으니 기록 완료 표시
      setBattleRecorded(true);
      setStatsUpdated(true);
    } else if (battleResult && !battleRecorded) {
      if (process.env.NODE_ENV === 'development') {
        console.log('fallback: battleResult로 처리', battleResult);
      }
      // battleResult로 처리 (이전 방식 호환)
      setBattleRecorded(true);
      setStatsUpdated(true);
    }
  }, [localSelectedChar, localOpponentChar, currentBattle, battleResult, battleRecorded]);

  // 전투 결과 결정: currentBattle 우선, 없으면 battleResult로 fallback
  const isPlayerWinner = currentBattle?.isPlayerWon || (battleResult?.id === localSelectedChar?.id) || false;
  const isDraw = currentBattle?.isDraw || false;

  // Handle battle again
  const handleBattleAgain = () => {
    resetBattle();
    navigate('/battle');
  };

  // Handle go home
  const handleGoHome = () => {
    resetBattle();
    navigate('/');
  };

  // 승자 브레인롯 결정: currentBattle 우선, 없으면 battleResult로 fallback
  const winnerBrainrot = isDraw ? null : 
    (isPlayerWinner ? localSelectedChar : localOpponentChar);

  // 페이지 로딩 조건 수정 - battleResult나 currentBattle 둘 중 하나만 있어도 진행
  if ((!currentBattle && !battleResult) || !localSelectedChar || !localOpponentChar) {
    console.log('로딩 중...', { currentBattle, battleResult, localSelectedChar, localOpponentChar });
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
            <div className={`flex items-center justify-center rounded-full p-2 h-14 w-14 mx-auto border-2 ${isPlayerWinner ? 'bg-primary-600 border-primary-400 animate-pulse-slow' : (isDraw ? 'bg-yellow-600 border-yellow-400' : 'bg-accent-600 border-accent-400 animate-pulse-slow')}`}>
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
        
        <h1 className="text-3xl font-bold text-white mb-2">
          {isDraw 
            ? t('resultPage.drawTitle') 
            : (isPlayerWinner 
                ? `${localSelectedChar.name} ${t('resultPage.victoryTitle')}!` 
                : `${localOpponentChar.name} ${t('resultPage.victoryTitle')}!`)}
        </h1>
        <p className="text-sm text-gray-300 bg-gaming-card inline-block px-4 py-1 rounded-full">
          {isDraw 
            ? t('resultPage.draw') 
            : t(isPlayerWinner ? 'resultPage.congratulations' : 'resultPage.defeated')}
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
                {isPlayerWinner && !isDraw && (
                  <div className="absolute -top-4 -right-4 z-10">
                    <div className="bg-primary-500 text-white p-1.5 rounded-full border-2 border-primary-700 animate-bounce-gentle">
                      <Medal size={28} />
                    </div>
                  </div>
                )}
                <BrainrotCard 
                  brainrot={localSelectedChar} 
                  isBattle 
                  isBattleWinner={isPlayerWinner && !isDraw}
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
            <div className={`bg-gaming-dark rounded-xl p-4 border-2 ${!isPlayerWinner && !isDraw ? 'border-accent-500 shadow-lg shadow-accent-500/30' : 'border-gray-700'} transition-all hover:scale-[1.02]`}>
              <div className="relative">
                {!isPlayerWinner && !isDraw && (
                  <div className="absolute -top-4 -right-4 z-10">
                    <div className="bg-accent-500 text-white p-1.5 rounded-full border-2 border-accent-700 animate-bounce-gentle">
                      <Medal size={28} />
                    </div>
                  </div>
                )}
                <BrainrotCard 
                  brainrot={localOpponentChar} 
                  isBattle 
                  isBattleWinner={!isPlayerWinner && !isDraw}
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
            {isDraw 
              ? t('resultPage.drawMessage')
              : t('resultPage.victorious', { name: winnerBrainrot?.name || '' })}
          </h3>
          <div className="bg-gaming-card/50 p-4 rounded-lg border border-gray-700/50 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-gray-300 text-sm">
              {/* 배틀 설명(서사)을 표시, 없으면 승리자 브레인롯 설명 사용 */}
              {battleNarrative || winnerBrainrot?.description || t('resultPage.noBattleDescription')}
            </p>
          </div>
        </div>
        
        {/* 상태 표시기 추가 */}
        <div className="text-center mb-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs bg-green-600 text-white">
            전투 결과가 저장되었습니다
          </span>
        </div>
        
        {/* ELO 변화 표시 */}
        <div className="flex justify-center gap-8 my-5 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">{t('common.yourElo')}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                {localSelectedChar?.elo || 1000}
              </span>
              {currentBattle && (
                <span className="text-sm font-semibold">
                  {isDraw ? (
                    <span className="text-yellow-400">+0</span>
                  ) : (
                    <>
                      {currentBattle.playerEndElo && currentBattle.playerStartElo && (
                        <>
                          {currentBattle.playerEndElo > currentBattle.playerStartElo ? (
                            <span className="text-green-400">+{currentBattle.playerEndElo - currentBattle.playerStartElo} ↑</span>
                          ) : (
                            <span className="text-red-400">{currentBattle.playerEndElo - currentBattle.playerStartElo} ↓</span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">{t('common.opponentElo')}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                {localOpponentChar?.elo || 1000}
              </span>
              {currentBattle && (
                <span className="text-sm font-semibold">
                  {isDraw ? (
                    <span className="text-yellow-400">+0</span>
                  ) : (
                    <>
                      {currentBattle.opponentEndElo && currentBattle.opponentStartElo && (
                        <>
                          {currentBattle.opponentEndElo > currentBattle.opponentStartElo ? (
                            <span className="text-green-400">+{currentBattle.opponentEndElo - currentBattle.opponentStartElo} ↑</span>
                          ) : (
                            <span className="text-red-400">{currentBattle.opponentEndElo - currentBattle.opponentStartElo} ↓</span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </span>
              )}
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