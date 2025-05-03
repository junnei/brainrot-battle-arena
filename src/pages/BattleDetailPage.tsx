import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBrainrots } from '../context/BrainrotContext';
import { Battle, Brainrot } from '../types';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy, Swords, Shield, BarChart2 } from 'lucide-react';
import Button from '../components/ui/Button';

const BattleDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { battleId } = useParams<{ battleId: string }>();
  const { battles, brainrots } = useBrainrots()!;
  const [battle, setBattle] = useState<Battle | null>(null);
  const [playerBrainrot, setPlayerBrainrot] = useState<Brainrot | null>(null);
  const [opponentBrainrot, setOpponentBrainrot] = useState<Brainrot | null>(null);
  const [winner, setWinner] = useState<Brainrot | null>(null);

  useEffect(() => {
    if (!battleId) {
      navigate('/');
      return;
    }

    const foundBattle = battles.find((b: Battle) => b.id === battleId);
    if (!foundBattle) {
      navigate('/');
      return;
    }

    setBattle(foundBattle);
    
    // 플레이어 브레인롯 찾기
    const player = brainrots.find((c: Brainrot) => c.id === foundBattle.playerBrainrotId);
    setPlayerBrainrot(player || null);
    
    // 상대 브레인롯 찾기
    const opponent = brainrots.find((c: Brainrot) => c.id === foundBattle.opponentBrainrotId);
    setOpponentBrainrot(opponent || null);
    
    // 승자 브레인롯 찾기
    if (foundBattle.winnerId) {
      const winnerBrainrot = brainrots.find((c: Brainrot) => c.id === foundBattle.winnerId);
      setWinner(winnerBrainrot || null);
    } else {
      setWinner(null);
    }
  }, [battleId, battles, brainrots, navigate]);

  if (!battle || !playerBrainrot || !opponentBrainrot) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isPlayerWinner = battle.battleResult === 'WIN';
  const isDraw = battle.battleResult === 'DRAW';
  const battleDate = battle.createdAt instanceof Date 
    ? battle.createdAt.toLocaleString() 
    : new Date(battle.createdAt).toLocaleString();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="relative text-center mb-8">
        <Button 
          variant="primary" 
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft size={16} />}
          className="absolute left-0 px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          {t('common.backToHome')}
        </Button>
        
        <h1 className="text-2xl font-bold text-white mb-1">{t('resultPage.title')}</h1>
        <p className="text-base text-gray-300">
          {battleDate}
          <span className="ml-2 text-gray-500">#{battle.id.substring(0, 6)}</span>
        </p>
      </div>

      {/* 결과 표시 */}
      <div className="relative text-center mb-8">
        <div className="inline-block">
          <div className={`flex items-center justify-center rounded-full p-3 h-14 w-14 mx-auto border-2 ${
            isDraw ? 'bg-yellow-600 border-yellow-400' : 
            isPlayerWinner ? 'bg-primary-600 border-primary-400' : 
            'bg-accent-600 border-accent-400'
          }`}>
            <Trophy size={24} className="text-white" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-white mt-2 mb-1">
          {isDraw 
            ? t('resultPage.draw') 
            : isPlayerWinner 
              ? t('resultPage.congratulations') 
              : t('resultPage.defeated')
          }
        </h2>
        <p className="text-lg text-accent-400 font-bold">
          {isDraw 
            ? t('resultPage.drawResult') 
            : t('resultPage.victorious', { name: winner?.name || '' })
          }
        </p>
      </div>

      {/* 캐릭터 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 items-stretch">
        {/* 플레이어 캐릭터 */}
        <div className="flex justify-center md:justify-end">
          <div className="text-center w-full max-w-md">
            <h2 className="text-xl font-semibold text-primary-400 mb-3">{t('resultPage.yourBrainrot')}</h2>
            <div className={`bg-gaming-dark rounded-xl p-4 border-2 ${isPlayerWinner ? 'border-primary-500 shadow-md shadow-primary-500/20' : 'border-gray-700'} transition-all`}>
              <div className="relative">
                {isPlayerWinner && !isDraw && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="bg-primary-500 text-white p-1 rounded-full border-2 border-primary-700">
                      <Trophy size={24} />
                    </div>
                  </div>
                )}
                
                <div className="p-4 flex flex-col items-center">
                  <div className="w-32 h-32 mb-4">
                    <img 
                      src={playerBrainrot.imageUrl} 
                      alt={playerBrainrot.name} 
                      className="w-full h-full object-cover rounded-md border border-gray-700"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white truncate mb-2 w-full">{playerBrainrot.name}</h3>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {playerBrainrot.description}
                  </p>
                  <div className="flex justify-between gap-4 w-full text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Shield size={14} />
                      <span>{t('common.elo')}: <span className="text-primary-400 font-medium">{playerBrainrot.elo}</span></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart2 size={14} />
                      <span>{t('common.record', { wins: playerBrainrot.stats?.wins || 0, losses: playerBrainrot.stats?.losses || 0 })}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 상대 캐릭터 */}
        <div className="flex justify-center md:justify-start">
          <div className="text-center w-full max-w-md">
            <h2 className="text-xl font-semibold text-accent-400 mb-3">{t('resultPage.opponent')}</h2>
            <div className={`bg-gaming-dark rounded-xl p-4 border-2 ${battle.battleResult === 'LOSS' ? 'border-accent-500 shadow-md shadow-accent-500/20' : 'border-gray-700'} transition-all`}>
              <div className="relative">
                {battle.battleResult === 'LOSS' && !isDraw && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="bg-accent-500 text-white p-1 rounded-full border-2 border-accent-700">
                      <Trophy size={24} />
                    </div>
                  </div>
                )}
                
                <div className="p-4 flex flex-col items-center">
                  <div className="w-32 h-32 mb-4">
                    <img 
                      src={opponentBrainrot.imageUrl} 
                      alt={opponentBrainrot.name} 
                      className="w-full h-full object-cover rounded-md border border-gray-700"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white truncate mb-2 w-full">{opponentBrainrot.name}</h3>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {opponentBrainrot.description}
                  </p>
                  <div className="flex justify-between gap-4 w-full text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Shield size={14} />
                      <span>{t('common.elo')}: <span className="text-accent-400 font-medium">{opponentBrainrot.elo}</span></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart2 size={14} />
                      <span>{t('common.record', { wins: opponentBrainrot.stats?.wins || 0, losses: opponentBrainrot.stats?.losses || 0 })}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 하단 버튼 */}
      <div className="flex justify-center mt-8">
        <Button
          onClick={() => navigate('/battle')}
          leftIcon={<Swords size={18} />}
          variant="accent"
          className="rounded-full px-6 py-2.5 hover:scale-105 transition-transform mr-4"
        >
          {t('common.battleAgain')}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft size={18} />}
          className="rounded-full px-6 py-2.5 hover:bg-gaming-card transition-colors"
        >
          {t('common.backToHome')}
        </Button>
      </div>
    </div>
  );
};

export default BattleDetailPage; 