import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sword, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import BrainrotCard from '../components/brainrots/BrainrotCard';
import { useBrainrots } from '../context/BrainrotContext';
import { useTranslation } from 'react-i18next';

const BattlePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    selectedBrainrot, 
    opponentBrainrot, 
    isLoading, 
    error, 
    findOpponent, 
    startBattle,
  } = useBrainrots();
  const [isBattleReady, setIsBattleReady] = useState(false);
  const [isBattleStarted, setIsBattleStarted] = useState(false);

  // Check if user has selected a brainrot
  useEffect(() => {
    if (!selectedBrainrot) {
      navigate('/');
    }
  }, [selectedBrainrot, navigate]);

  // Find an opponent if none exists
  useEffect(() => {
    if (selectedBrainrot && !opponentBrainrot && !isLoading) {
      findOpponent();
    }
  }, [selectedBrainrot, opponentBrainrot, isLoading, findOpponent]);

  // Set battle ready when both brainrots are selected
  useEffect(() => {
    if (selectedBrainrot && opponentBrainrot) {
      setIsBattleReady(true);
    } else {
      setIsBattleReady(false);
    }
  }, [selectedBrainrot, opponentBrainrot]);

  // Handle start battle
  const handleStartBattle = () => {
    setIsBattleStarted(true);
    
    // Add a delay for animation effect
    setTimeout(() => {
      startBattle();
      
      // Navigate to result page after battle animation
      setTimeout(() => {
        navigate('/result', { state: { battleCompleted: true } });
      }, 1500);
    }, 1000);
  };

  // Handle find new opponent
  const handleFindNewOpponent = () => {
    findOpponent();
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
                      isBattle 
                      showActions={false}
                      showFullDescription={true}
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
                      isBattle 
                      showActions={false}
                      showFullDescription={true}
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