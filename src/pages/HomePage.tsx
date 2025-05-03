import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Swords, Users, ChevronRight, X, Pencil, ArrowLeft, Clock, Award, Shield, BarChart2, Plus, Star, BookOpen, UserPlus, ChevronDown, ChevronUp, Trash2, Edit, FileQuestion, AlertCircle, LockIcon } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useBrainrots } from '../context/BrainrotContext';
import BrainrotCard from '../components/brainrots/BrainrotCard';
import { useTranslation } from 'react-i18next';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { Battle } from '../types';
import BrainrotFormModal from '../components/brainrots/BrainrotFormModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { toast } from 'react-toastify';

const HAS_STARTED_KEY = 'has_started_arena';

// localStorage 값을 읽어 초기 상태를 결정하는 함수
const getInitialStartedState = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(HAS_STARTED_KEY) === 'true';
  }
  return false; // 서버 사이드 렌더링 등 localStorage가 없는 경우 기본값
};

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { 
    userBrainrots, 
    setBrainrots,
    brainrots, 
    createBrainrot,
    selectBrainrot, 
    deleteBrainrot,
    getUserBattles,
    isLoading,
    updateBrainrot,
    battles
  } = useBrainrots();

  const [isStarted, setIsStarted] = useState<boolean>(getInitialStartedState);
  const [showBrainrots, setShowBrainrots] = useState<boolean>(getInitialStartedState);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [selectedBrainrotId, setSelectedBrainrotId] = useState<string | null>(null);

  // 편집 상태 관리
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // 배틀 내역 뷰 관련 상태 변경
  const [expandedBattleIds, setExpandedBattleIds] = useState<string[]>([]);

  // 브레인롯 관련 상태 변경
  const [newBrainrotModalOpen, setNewBrainrotModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // 최근 배틀 목록
  const recentBattles = battles.slice(0, 5);
  
  // 상위 ELO 브레인롯 목록
  const topBrainrots = [...brainrots]
    .sort((a, b) => (b.elo || 1000) - (a.elo || 1000))
    .slice(0, 6);
    
  // 날짜 형식화 함수
  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  };

  // 페이지 로드 시 시작 상태 확인 (useState 초기화 후 추가 확인)
  // 이 useEffect는 필수는 아니지만, 혹시 모를 초기화 로직 대비용
  useEffect(() => {
    const hasStartedBefore = localStorage.getItem(HAS_STARTED_KEY) === 'true';
    if (hasStartedBefore && !isStarted) {
      setIsStarted(true);
      setShowBrainrots(true);
    }
  }, [isStarted]); // isStarted가 변경될 때만 확인

  // 브레인롯 생성 취소 후 바로 목록 표시
  useEffect(() => {
    if (location.state?.fromCancel) {
      if (!isStarted) {
        setIsStarted(true);
        localStorage.setItem(HAS_STARTED_KEY, 'true'); // 시작 상태 저장
      }
      setShowBrainrots(true);
      // 상태를 사용했으므로 제거 (뒤로 가기 등으로 다시 트리거되지 않도록)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, isStarted]);

  // 전투 완료 후 브레인롯 데이터 새로고침 (선택적)
  // location.state에 battleCompleted 등이 올 수 있으므로 fromCancel과 분리
  useEffect(() => {
    if (location.state && !location.state.fromCancel) { // fromCancel이 아닌 다른 상태가 있을 때
      const storedBrainrots = localStorage.getItem('brainrots');
      if (storedBrainrots) {
        try {
          const parsedBrainrots = JSON.parse(storedBrainrots);
          setBrainrots(parsedBrainrots);
        } catch (error) {
          console.error("Error parsing brainrots from localStorage:", error);
        }
      }
    }
  }, [location.state, setBrainrots]);

  const handleStart = () => {
    setIsStarted(true);
    localStorage.setItem(HAS_STARTED_KEY, 'true'); // 시작 상태 저장
    setTimeout(() => setShowBrainrots(true), 500); // 애니메이션을 위해 약간의 지연 유지
  };

  // 카드 클릭 시 상세 보기 & 편집 상태 초기화
  const handleCardClick = (id: string) => {
    setSelectedBrainrotId(id);
    setIsEditing(false); // 상세 보기 열 때 편집 모드 비활성화
    setEditError(null);
    const brainrot = userBrainrots.find(c => c.id === id);
    if (brainrot) {
      setEditedName(brainrot.name);
      setEditedDescription(brainrot.description);
    }
  };

  const handleBackToList = () => {
    setSelectedBrainrotId(null);
    setIsEditing(false); // 목록으로 돌아갈 때도 비활성화
    setEditError(null);
  };

  // 수정 시작
  const handleEditClick = () => {
    const brainrot = userBrainrots.find(c => c.id === selectedBrainrotId);
    if (brainrot) {
      setEditedName(brainrot.name);
      setEditedDescription(brainrot.description);
      setIsEditing(true);
      setEditError(null);
    }
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
    // 원래 값으로 되돌릴 필요는 없음 (저장 안 하면 유지됨)
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!selectedBrainrotId) return;
    const brainrot = userBrainrots.find(c => c.id === selectedBrainrotId);
    if (!brainrot) return;

    // 유효성 검사 (간단하게)
    if (!editedName.trim() || !editedDescription.trim()) {
      setEditError(t('homePage.editValidationError')); // 번역 키 필요
      return;
    }
    
    setEditError(null);
    try {
      await updateBrainrot(selectedBrainrotId, {
        name: editedName.trim(),
        description: editedDescription.trim(),
      });
      setIsEditing(false); // 저장 후 편집 모드 종료
    } catch (error) {
      console.error("Failed to update brainrot:", error);
      setEditError(t('homePage.editSaveError')); // 번역 키 필요
    }
  };

  const canCreate = userBrainrots.length < 5;

  // 아바타 문자 생성 (이니셜)
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // 배틀 내역 클릭 핸들러 수정
  const handleBattleClick = (battle: Battle) => {
    setExpandedBattleIds(prev => {
      if (prev.includes(battle.id)) {
        return prev.filter(id => id !== battle.id); // 이미 열려있으면 닫기
      } else {
        return [...prev, battle.id]; // 닫혀있으면 열기
      }
    });
  };

  const handleBrainrotSelect = (brainrotId: string) => {
    selectBrainrot(brainrotId);
    navigate('/battle');
  };

  const handleCreateBrainrot = async (data: any) => {
    try {
      await createBrainrot(data);
      setNewBrainrotModalOpen(false);
      toast.success(t('homePage.brainrotCreated'));
    } catch (error) {
      console.error('브레인롯 생성 오류:', error);
      toast.error(t('homePage.brainrotCreateError'));
    }
  };

  const handleDeleteBrainrot = async (brainrotId: string) => {
    try {
      await deleteBrainrot(brainrotId);
      toast.success(t('homePage.brainrotDeleted'));
    } catch (error) {
      console.error('브레인롯 삭제 오류:', error);
      toast.error(t('homePage.brainrotDeleteError'));
    }
  };

  const handleUpdateBrainrot = async (data: any) => {
    try {
      if (selectedBrainrotId) {
        await updateBrainrot(selectedBrainrotId, data);
        setIsEditing(false);
        console.log(t('homePage.brainrotUpdated'));
        // toast.success(t('homePage.brainrotUpdated'));
      }
    } catch (error) {
      console.error('브레인롯 업데이트 오류:', error);
      console.log(t('homePage.brainrotUpdateError'));
      // toast.error(t('homePage.brainrotUpdateError'));
    }
  };

  const handleChallengeBrainrot = (brainrotId: string) => {
    // 먼저 현재 사용자의 브레인롯 중 첫 번째를 선택
    if (userBrainrots.length > 0) {
      selectBrainrot(userBrainrots[0].id);
      // 상대방 브레인롯 ID를 세션 스토리지에 저장하여 배틀 페이지에서 사용
      sessionStorage.setItem('opponent-brainrot-id', brainrotId);
      navigate('/battle');
    } else {
      // 선택할 브레인롯이 없을 경우 브레인롯 생성 모달 열기
      alert(t('homePage.needBrainrotToChallenge'));
      setNewBrainrotModalOpen(true);
    }
  };

  return (
    <div className={`relative max-w-4xl mx-auto px-4 flex flex-col items-center min-h-[80vh] transition-all duration-700 ease-in-out ${isStarted ? 'py-6' : 'py-16'}`}>
      {/* 헤더 섹션 */}
      <div className="relative w-full mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400 h-20 rounded-lg opacity-20"></div>
        <div className="relative flex flex-col items-center pt-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-2">
            <Swords size={26} />
          </div>
          <h1 className="text-3xl font-bold text-white mt-1 mb-1">{t('homePage.title')}</h1>
          <p className={`text-lg text-primary-300 font-medium text-center transition-all duration-700 ease-in-out transform-gpu origin-top ${isStarted ? 'max-h-0 opacity-0 mb-0 scale-90' : 'max-h-[100px] opacity-100 mb-4'}`}>
            {t('homePage.subtitle')}
          </p>
        </div>
      </div>

      {/* 안내/캐릭터 박스 */}
      <div className={`w-full rounded-xl shadow-lg border border-gray-800 overflow-hidden transition-all duration-700 ease-in-out ${isStarted ? 'max-w-4xl bg-gaming-card' : 'max-w-lg bg-gaming-card/80'}`}>
        {/* 초기 안내 화면 */}
        {!showBrainrots && (
          <div className="p-8 transition-opacity duration-500 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary-900/50">
                <BookOpen className="text-primary-400" size={22} />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('homePage.introTitle')}</h2>
            </div>
            <p className="text-base text-gray-200 mb-6 ml-12">{t('homePage.introDesc')}</p>
          
            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleStart} 
                variant="accent" 
                size="lg" 
                className="px-10 rounded-full shadow-lg transition-transform hover:scale-105"
              >
                <Swords size={20} className="mr-2" />
                {t('common.startBattle')}
              </Button>
            </div>
          </div>
        )}

        {/* 캐릭터 상세 페이지 */}
        {showBrainrots && selectedBrainrotId ? (
          (() => {
            const brainrot = userBrainrots.find(c => c.id === selectedBrainrotId);
            if (!brainrot) return null;
            const battles = getUserBattles(brainrot.id);
            const stats = brainrot.stats || { wins: 0, losses: 0, totalBattles: 0 };
            const { wins, losses } = stats;
            return (
              <div className="p-6 animate-fade-in">
                {/* 헤더: 뒤로가기, 제목, (편집 모드 아닐 때만) 아이콘 버튼 */}
                <div className="flex items-center justify-center relative mb-6">
                  <button 
                    onClick={handleBackToList} 
                    className="flex items-center text-primary-400 hover:text-primary-300 font-medium absolute left-0"
                  >
                    <ArrowLeft size={18} className="mr-1" />
                    {t('common.backToHome')}
                  </button>
                  <h2 className="text-xl font-bold text-white">{t('homePage.brainrotInfo')}</h2>
                  {!isEditing ? (
                    <div className="flex items-center gap-3 absolute right-0">
                      <button 
                        onClick={handleEditClick} 
                        className="text-gray-400 hover:text-primary-400 disabled:opacity-50 p-1.5 rounded-full hover:bg-gaming-dark transition-colors" 
                        title={t('homePage.editBrainrot')} 
                        disabled={isLoading}
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm(t('homePage.deleteConfirm', { name: brainrot.name }))) {
                            try {
                              await deleteBrainrot(brainrot.id);
                              handleBackToList(); // 삭제 후 목록으로 돌아가기
                            } catch (error) {
                              console.error("Failed to delete brainrot:", error);
                              alert(t('homePage.deleteError'));
                            }
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-50 p-1.5 rounded-full hover:bg-gaming-dark transition-colors"
                        title={t('homePage.deleteBrainrot')}
                        disabled={isLoading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : <div className="absolute right-0 w-12"></div> /* 공간 확보 */}
                </div>
                
                {/* 캐릭터 정보 / 편집 폼 */}
                <div className="bg-gaming-dark rounded-xl p-6 mb-6 shadow-md border border-gray-800 relative">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/3">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-700 shadow-md">
                            <img src={brainrot.imageUrl} alt={brainrot.name} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-4">
                          <Input 
                            label={t('brainrotForm.nameLabel')} 
                            value={editedName} 
                            onChange={(e) => setEditedName(e.target.value)} 
                            disabled={isLoading}
                            error={editError && editedName.trim() === '' ? editError : undefined} // 에러 표시
                          />
                          <Textarea 
                            label={t('brainrotForm.descLabel')} 
                            value={editedDescription} 
                            onChange={(e) => setEditedDescription(e.target.value)} 
                            rows={3}
                            disabled={isLoading}
                            error={editError && editedDescription.trim() === '' ? editError : undefined} // 에러 표시
                          />
                        </div>
                      </div>
                      {editError && <p className="text-red-400 text-sm">{editError}</p>}
                      <div className="flex justify-end gap-2">
                         <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={isLoading}>{t('common.cancel')}</Button>
                         <Button onClick={handleSaveEdit} size="sm" isLoading={isLoading}>{t('profilePage.saveButton')}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/3">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-700 shadow-md">
                          <img src={brainrot.imageUrl} alt={brainrot.name} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col mb-3">
                          <span className="text-2xl font-bold text-white mb-1">{brainrot.name}</span>
                          <div className="flex items-center gap-4 mb-2">
                            <span className="flex items-center gap-1.5 text-primary-400 font-medium">
                              <Shield size={14} />
                              <span>{t('common.elo')}: {Number(brainrot.elo) || 1000}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <BarChart2 size={14} />
                              <span>{t('common.record', { wins, losses })}</span>
                            </span>
                          </div>
                          <div className="text-gray-300 bg-gaming-dark/50 p-2 rounded-md border border-gray-800/50 mb-16">
                            {brainrot.description}
                          </div>
                          
                          {/* 배틀하기 버튼을 여기에 추가 */}
                          <div className="absolute bottom-6 right-6">
                            <Button 
                              variant="accent" 
                              onClick={() => { selectBrainrot(brainrot.id); navigate('/battle'); }} 
                              disabled={isLoading}
                              className="px-4 py-2 rounded-full shadow-md"
                            >
                              <Swords size={18} className="mr-2" />
                              {t('homePage.battleWithThisBrainrot')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 최근 배틀 내역 (편집 모드 아닐 때만) */}
                {!isEditing && (
                  <div className="bg-gaming-dark rounded-xl p-5 border border-gray-800 shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={18} className="text-primary-400" />
                      <h3 className="text-lg font-bold text-white">{t('homePage.recentBattles')}</h3>
                    </div>
                    {battles.length === 0 ? (
                      <div className="text-gray-400 text-center py-4">{t('homePage.noBattles')}</div>
                    ) : (
                      <ul className="divide-y divide-gray-700/50">
                        {battles.slice(0, 5).map((battle) => (
                          <li key={battle.id} className="py-2">
                            <div 
                              className="py-2 flex items-center justify-between hover:bg-gray-800/20 px-2 rounded-md transition-colors cursor-pointer"
                              onClick={() => handleBattleClick(battle)}
                            >
                              <span className="text-gray-200 font-medium flex items-center">
                                {expandedBattleIds.includes(battle.id) ? 
                                  <ChevronUp size={16} className="mr-2 text-gray-400" /> : 
                                  <ChevronDown size={16} className="mr-2 text-gray-400" />
                                }
                                {battle.opponentBrainrot?.name || t('homePage.opponent')}
                              </span>
                              <div className="flex items-center gap-4">
                                <span className={`font-semibold flex items-center ${battle.winnerId === brainrot.id ? 'text-green-400' : 'text-red-400'}`}>
                                  {battle.winnerId === brainrot.id ? (
                                    <>
                                      <Award size={16} className="mr-1" />
                                      {t('homePage.win')}
                                    </>
                                  ) : (
                                    <>
                                      <X size={16} className="mr-1" />
                                      {t('homePage.loss')}
                                    </>
                                  )}
                                </span>
                                <span className="text-gray-400 text-sm">
                                  {battle.createdAt instanceof Date ? battle.createdAt.toLocaleDateString() : new Date(battle.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            {/* 확장된 배틀 상세 정보 */}
                            {expandedBattleIds.includes(battle.id) && (
                              <div className="bg-gaming-dark/50 rounded-lg p-4 mb-2 mt-2 border border-gray-700/50 animate-fade-in">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  {/* 플레이어 캐릭터 */}
                                  <div className="bg-gaming-card/30 rounded-lg p-2 border border-gray-700/30">
                                    <h4 className="text-primary-400 text-sm font-medium mb-2 text-center">
                                      {t('common.yourBrainrot')}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-700">
                                        <img 
                                          src={battle.playerBrainrot?.imageUrl} 
                                          alt={battle.playerBrainrot?.name} 
                                          className="w-full h-full object-cover" 
                                        />
                                        {battle.winnerId === battle.playerBrainrotId && (
                                          <div className="absolute top-0 right-0 bg-green-500 p-0.5 rounded-bl">
                                            <Award size={12} className="text-white" />
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-bold text-white text-sm">
                                          {battle.playerBrainrot?.name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {t('common.elo')}: {battle.playerBrainrot?.elo || 1000}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 상대 캐릭터 */}
                                  <div className="bg-gaming-card/30 rounded-lg p-2 border border-gray-700/30">
                                    <h4 className="text-accent-400 text-sm font-medium mb-2 text-center">
                                      {t('common.opponent')}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-700">
                                        <img 
                                          src={battle.opponentBrainrot?.imageUrl} 
                                          alt={battle.opponentBrainrot?.name} 
                                          className="w-full h-full object-cover" 
                                        />
                                        {battle.winnerId === battle.opponentBrainrotId && (
                                          <div className="absolute top-0 right-0 bg-green-500 p-0.5 rounded-bl">
                                            <Award size={12} className="text-white" />
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-bold text-white text-sm">
                                          {battle.opponentBrainrot?.name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {t('common.elo')}: {battle.opponentBrainrot?.elo || 1000}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <div className="inline-block px-3 py-1 rounded-full bg-gaming-card border border-gray-700 text-sm">
                                    <span className="font-bold mr-1 text-white">
                                      {battle.winnerId === battle.playerBrainrotId 
                                        ? battle.playerBrainrot?.name 
                                        : battle.opponentBrainrot?.name}
                                    </span>
                                    <span className="text-gray-300">
                                      {t('common.hasWon')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })()
        ) : showBrainrots ? (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Users size={20} className="text-primary-400" />
              <h2 className="text-xl font-bold text-white">{t('homePage.myBrainrots')}</h2>
            </div>
            
            {isAuthenticated ? (
              userBrainrots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <UserPlus size={48} className="mb-4 text-gray-600" />
                  <p className="mb-6 text-center">{t('homePage.noBrainrots')}</p>
                  <Button 
                    onClick={() => setNewBrainrotModalOpen(true)} 
                    variant="primary"
                    disabled={!canCreate}
                    className="px-6 rounded-full"
                  >
                    <Plus size={18} className="mr-2" />
                    {t('homePage.createBrainrot')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    {userBrainrots.map((brainrot) => {
                      const stats = brainrot.stats || { wins: 0, losses: 0, totalBattles: 0 };
                      const { wins, losses } = stats;
                      return (
                        <div 
                          key={brainrot.id} 
                          onClick={() => handleCardClick(brainrot.id)} 
                          className="cursor-pointer bg-gaming-dark rounded-xl border border-gray-800 p-4 transition-all hover:shadow-lg hover:scale-[1.01] flex items-center"
                        >
                          <div className="relative mr-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-700">
                              <img
                                src={brainrot.imageUrl}
                                alt={brainrot.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-primary-900/80 rounded-full p-1 text-xs text-white font-bold border border-primary-400">
                              {Number(brainrot.elo) || 1000}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 w-full">
                              <span className="text-lg font-bold text-white">{brainrot.name}</span>
                              <span className="text-gray-400 text-sm">{t('common.record', { wins, losses })}</span>
                            </div>
                            <span className="text-gray-300 text-sm line-clamp-1 pr-6">{brainrot.description}</span>
                          </div>
                          
                          <ChevronRight className="ml-2 w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setNewBrainrotModalOpen(true)} 
                      variant="primary"
                      disabled={!canCreate}
                      className="px-6 py-2.5 rounded-full shadow-md"
                    >
                      {canCreate 
                        ? `${t('homePage.createBrainrot')} (${userBrainrots.length}/5)` 
                        : t('homePage.brainrotLimitReached', { count: 5 })}
                    </Button>
                  </div>
                </>
              )
            ) : (
              <div className="text-center py-12">
                <div className="bg-gaming-dark rounded-lg p-6 inline-block mb-4">
                  <UserPlus size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">{t('homePage.loginRequired')}</p>
              <Button 
                onClick={() => navigate('/auth')}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-medium shadow-md transition-all hover:shadow-lg"
              >
                    {t('common.login')}
              </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 최고 등급 브레인롯 */}
      <section className="my-12">
        <h2 className="text-2xl font-bold text-white mb-6">{t('homePage.topBrainrots')}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topBrainrots.map((brainrot) => (
            <div key={brainrot.id} className="bg-gaming-card rounded-xl overflow-hidden border border-gray-700 hover:border-accent-500 transition-all hover:shadow-lg">
              <div className="relative">
                <img src={brainrot.imageUrl} alt={brainrot.name} className="w-full h-48 object-cover" />
                {brainrot.elo >= 1100 && (
                  <div className="absolute top-0 left-0 bg-accent-600 text-white px-3 py-1 font-bold text-sm">
                    ELO {brainrot.elo}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2 text-white">{brainrot.name}</h3>
                <p className="text-gray-300 text-sm h-12 overflow-hidden line-clamp-2 mb-3">{brainrot.description}</p>
                
                {/* 전적 정보 */}
                <div className="flex justify-between text-xs text-gray-400 mb-4">
                  <span>{t('common.elo')}: <span className="text-accent-400 font-medium">{brainrot.elo}</span></span>
                  <span>{t('common.record', { wins: brainrot.stats?.wins || 0, losses: brainrot.stats?.losses || 0 })}</span>
                </div>
                
                {isAuthenticated ? (
                  brainrot.userId === user?.id ? (
                    <Button
                      onClick={() => handleBrainrotSelect(brainrot.id)}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2 transition-all hover:shadow-md"
                    >
                      {t('homePage.selectBrainrot')}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleChallengeBrainrot(brainrot.id)}
                      className="w-full bg-accent-600 hover:bg-accent-700 text-white rounded-full py-2 transition-all hover:shadow-md"
                    >
                      {t('homePage.challenge')}
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-full py-2 transition-all hover:shadow-md"
                  >
                    {t('common.loginToChallenge')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 최근 밈전쟁 */}
      <section className="my-12">
        <h2 className="text-2xl font-bold text-white mb-6">{t('homePage.recentBattles')}</h2>
        
        {recentBattles.length === 0 ? (
          <div className="text-center py-8 bg-gaming-card bg-opacity-20 rounded-lg border border-gray-700">
            <AlertCircle size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-300">{t('homePage.noRecentBattles')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentBattles.map((battle) => {
              const playerBrainrot = brainrots.find(b => b.id === battle.playerBrainrotId);
              const opponentBrainrot = brainrots.find(b => b.id === battle.opponentBrainrotId);
              const winner = brainrots.find(b => b.id === battle.winnerId);
              
              if (!playerBrainrot || !opponentBrainrot || !winner) return null;
              
              return (
                <div key={battle.id} className="bg-gaming-card rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-600">
                        <img src={playerBrainrot.imageUrl} alt={playerBrainrot.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{playerBrainrot.name}</h4>
                        <p className="text-xs text-gray-400">ELO: {playerBrainrot.elo}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400 mb-1">{formatDate(battle.createdAt)}</span>
                      <div className="bg-gaming-dark px-3 py-1 rounded-full text-xs font-bold">
                        {winner.id === playerBrainrot.id ? (
                          <span className="text-green-400">WIN</span>
                        ) : (
                          <span className="text-red-400">LOSS</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-bold text-white text-right">{opponentBrainrot.name}</h4>
                        <p className="text-xs text-gray-400 text-right">ELO: {opponentBrainrot.elo}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent-600">
                        <img src={opponentBrainrot.imageUrl} alt={opponentBrainrot.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      
      {/* 브레인롯 생성 모달 */}
      <BrainrotFormModal
        isOpen={newBrainrotModalOpen}
        onClose={() => setNewBrainrotModalOpen(false)}
        onSubmit={handleCreateBrainrot}
        title={t('homePage.createBrainrot')}
      />
      
      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (selectedBrainrotId) {
            handleDeleteBrainrot(selectedBrainrotId);
            setDeleteModalOpen(false);
          }
        }}
        title={t('homePage.deleteBrainrot')}
        message={t('homePage.deleteBrainrotConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmButtonStyle="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default HomePage;