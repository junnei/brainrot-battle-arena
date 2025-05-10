import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sword } from 'lucide-react';
import Button from '../components/ui/Button';
import BrainrotCard from '../components/brainrots/BrainrotCard';
import { useBrainrots } from '../context/BrainrotContext';
import { useTranslation } from 'react-i18next';

const BattlePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const context = useBrainrots();
  // non-null assertion으로 타입 에러 해결
  const { 
    selectedBrainrot, 
    opponentBrainrot, 
    isLoading, 
    error, 
    findOpponent, 
    startBattle,
    setSelectedBrainrot,
    brainrots
  } = context!; // context가 undefined일 수 없다고 TypeScript에 알려줍니다
  const [isBattleReady, setIsBattleReady] = useState(false);
  const [isBattleStarted, setIsBattleStarted] = useState(false);

  // Check if user has selected a brainrot
  useEffect(() => {
    // 선택된 브레인롯이 없고 로딩 중이 아닐 때만 실행
    if (!selectedBrainrot && !isLoading) {
      const savedBrainrotId = localStorage.getItem('selectedBrainrotId');
      
      if (savedBrainrotId) {
        console.log('로컬 스토리지에서 불러온 브레인롯 ID:', savedBrainrotId);
        const brainrot = brainrots.find(b => b.id === savedBrainrotId);
        if (brainrot) {
          setSelectedBrainrot(brainrot);
        } else {
          console.error('저장된 브레인롯 ID에 해당하는 브레인롯을 찾을 수 없습니다');
          navigate('/');
        }
      } else {
        console.error('선택된 브레인롯이 없습니다');
        navigate('/');
      }
    }
  }, [selectedBrainrot, isLoading, brainrots, navigate, setSelectedBrainrot]);

  // Find an opponent if none exists - 한 번만 실행되도록 최적화
  useEffect(() => {
    // 선택된 브레인롯이 있고, 상대방이 없고, 로딩 중이 아닐 때만 실행
    if (selectedBrainrot && !opponentBrainrot && !isLoading && findOpponent) {
      // 오직 한 번만 실행되도록 함
      findOpponent();
    }
  }, [selectedBrainrot, opponentBrainrot, isLoading, findOpponent]);

  // Set battle ready when both brainrots are selected
  useEffect(() => {
    setIsBattleReady(!!selectedBrainrot && !!opponentBrainrot);
  }, [selectedBrainrot, opponentBrainrot]);

  // Handle start battle
  const handleStartBattle = async () => {
    // 이미 배틀이 시작되었거나 로딩 중이면 중복 호출 방지
    if (isBattleStarted || isLoading) {
      return;
    }
    
    setIsBattleStarted(true);
    
    try {
      // 딜레이를 단일 setTimeout으로 통합
      setTimeout(async () => {
        try {
          // 로그 출력은 개발 모드에서만
          if (process.env.NODE_ENV === 'development') {
            console.log('배틀 시작 - 선택된 브레인롯:', selectedBrainrot?.id);
            console.log('배틀 시작 - 상대 브레인롯:', opponentBrainrot?.id);
          }
          
          await startBattle();
          
          // 결과 페이지로 이동 - startBattle이 성공했을 때만 실행
          setTimeout(() => {
            navigate('/result', { state: { battleCompleted: true } });
          }, 1500);
        } catch (error) {
          console.error('배틀 시작 중 오류 발생:', error);
          setIsBattleStarted(false);
          alert('배틀 시작 중 오류가 발생했습니다. 다시 시도해주세요.');
          navigate('/');
        }
      }, 1000);
    } catch (error) {
      console.error('배틀 시작 중 예외 발생:', error);
      setIsBattleStarted(false);
    }
  };

  // Handle back to home
  const handleBackToHome = () => {
    navigate('/');
  };

  // Loading state
  if (isLoading && !isBattleStarted) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative text-center mb-4">
        <Button 
          variant="primary" 
          onClick={handleBackToHome}
          leftIcon={<ArrowLeft size={16} />}
          className="absolute left-0 px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          {t('common.backToHome')}
        </Button>
        
        <h1 className="text-2xl font-bold text-white text-center mb-1">{t('battlePage.title')}</h1>
      </div>

      <div className="flex justify-center mb-2">
        {isBattleReady && !isBattleStarted && (
          <Button 
            variant="accent"
            onClick={handleStartBattle}
            leftIcon={<Sword size={16} />}
            className="px-4 py-1.5 rounded-full shadow-md hover:shadow-accent-500/20 hover:scale-105 transition-all"
          >
            {t('common.startBattle')}
          </Button>
        )}
        
        {isBattleStarted && (
          <div className="text-center animate-pulse-slow">
            <h3 className="text-lg font-bold text-primary-500">{t('battlePage.battleInProgress')}</h3>
            <p className="text-xs text-gray-300 mt-1">{t('battlePage.fighting')}</p>
          </div>
        )}
      </div>
    
      {error && (
        <div className="bg-accent-600/20 border border-accent-600 text-accent-100 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {selectedBrainrot && opponentBrainrot && !isBattleStarted && (
        <div className="text-center mb-4">
          <div className="bg-gaming-dark/50 rounded-lg p-3 mb-4 border border-gray-700/30 inline-block">
            <p className="text-gray-300 text-sm">
              <span className="text-primary-400 font-medium">{t('common.yourElo')}:</span> {selectedBrainrot.elo || 1000} vs 
              <span className="text-accent-400 font-medium ml-2">{t('common.opponentElo')}:</span> {opponentBrainrot.elo || 1000}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {Math.abs((selectedBrainrot.elo || 1000) - (opponentBrainrot.elo || 1000)) <= 50 
                ? t('battlePage.fairMatch') 
                : Math.abs((selectedBrainrot.elo || 1000) - (opponentBrainrot.elo || 1000)) <= 150
                  ? t('battlePage.closeMatch')
                  : t('battlePage.challengingMatch')}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center">
        <div className="relative mb-4 w-full">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className={`
              bg-primary-600 rounded-full p-5 shadow-lg border-2 border-primary-400
              ${isBattleStarted ? 'scale-150 animate-pulse-slow' : ''}
              transition-all duration-500
            `}>
              <Sword size={32} className={`text-white ${isBattleStarted ? 'animate-sword-swing' : ''}`} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className={`
              transform transition-all duration-500
              ${isBattleStarted ? '-translate-x-4 scale-105' : ''}
              flex justify-center md:justify-end
            `}>
              {selectedBrainrot && (
                <div className="text-center w-full max-w-md">
                  <h2 className="text-xl font-semibold text-primary-400 mb-3">{t('battlePage.yourBrainrot')}</h2>
                  <div className="bg-gaming-dark border border-primary-500/30 rounded-xl p-3 shadow-lg hover:shadow-primary-500/10 transition-shadow">
                    <BrainrotCard 
                      brainrot={selectedBrainrot} 
                      showActions={false}
                      showFullDescription={true}
                      isBattleWinner={false}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className={`
              transform transition-all duration-500
              ${isBattleStarted ? 'translate-x-4 scale-105' : ''}
              flex justify-center md:justify-start
            `}>
              {opponentBrainrot && (
                <div className="text-center w-full max-w-md">
                  <h2 className="text-xl font-semibold text-accent-400 mb-3">{t('battlePage.opponent')}</h2>
                  <div className="bg-gaming-dark border border-accent-500/30 rounded-xl p-3 shadow-lg hover:shadow-accent-500/10 transition-shadow">
                    <BrainrotCard 
                      brainrot={opponentBrainrot} 
                      showActions={false}
                      showFullDescription={true}
                      isBattleWinner={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattlePage; 