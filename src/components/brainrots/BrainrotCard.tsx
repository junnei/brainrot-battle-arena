import React from 'react';
import { Brainrot } from '../../types';
import Button from '../ui/Button';
import { Swords } from 'lucide-react';
import { useBrainrots } from '../../context/BrainrotContext';
import { useTranslation } from 'react-i18next';

interface BrainrotCardProps {
  brainrot: Brainrot;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  showActions?: boolean;
  isBattle?: boolean;
  isBattleWinner?: boolean;
  showFullDescription?: boolean;
}

const BrainrotCard: React.FC<BrainrotCardProps> = ({
  brainrot,
  isSelectable = false,
  isSelected = false,
  onSelect,
  showActions = true,
  isBattle = false,
  isBattleWinner = false,
  showFullDescription = false,
}) => {
  const { t } = useTranslation();
  const stats = brainrot.stats || { wins: 0, losses: 0, totalBattles: 0 };
  const { wins, losses } = stats;
  
  return (
    <div className={`flex flex-col items-center gap-3 ${isBattleWinner ? 'animate-battle-shake' : ''}`}>
      <div className="w-full">
        <img 
          src={brainrot.imageUrl} 
          alt={brainrot.name} 
          className="w-full aspect-square object-cover rounded-md border border-gray-700 shadow-lg"
        />
      </div>
      <div className="flex-1 w-full text-center">
        <h3 className="text-lg font-bold text-white truncate mb-1">{brainrot.name}</h3>
        <div className="h-10 overflow-hidden">
          <p className={`text-gray-300 text-sm mb-2 ${showFullDescription ? 'line-clamp-2' : 'line-clamp-2 truncate'}`}>
            {brainrot.description}
          </p>
        </div>
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <span>{t('common.elo')}: <span className="text-primary-400 font-medium">{brainrot.elo}</span></span>
          <span>{t('common.record', { wins, losses })}</span>
        </div>
      {showActions && (
          <div className="flex justify-center gap-2 mt-2">
          {isSelectable && !isSelected && (
            <Button 
              size="sm" 
              onClick={onSelect}
              leftIcon={<Swords size={16} />}
            >
                {t('common.select')}
            </Button>
          )}
          {isSelected && (
              <span className="text-primary-400 font-medium text-sm">{t('common.selected')}</span>
          )}
          </div>
      )}
      </div>
    </div>
  );
};

export default BrainrotCard; 