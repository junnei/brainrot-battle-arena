import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBrainrots } from '../context/BrainrotContext';
import BrainrotCard from '../components/brainrots/BrainrotCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useTranslation } from 'react-i18next';
import { User, Mail, Edit2, Save, X, LogOut, Shield, Award, BarChart2 } from 'lucide-react';

// 메시지 상태를 위한 타입 정의
type MessageType = {
  text: string;
  type: 'success' | 'error' | null;
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout, updateUser, isLoading } = useAuth();
  const { userBrainrots, getUserBattles, selectBrainrot } = useBrainrots();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [message, setMessage] = useState<MessageType>({ text: '', type: null });
  const inputRef = useRef<HTMLInputElement>(null);

  const userBattles = user ? getUserBattles(user.id) : [];
  const totalBattles = userBattles.length;
  
  // 닉네임 유효성 검사 함수
  const validateUsername = (value: string) => {
    if (value.length > 12) {
      return { isValid: false, error: t('profilePage.validation.maxLength') };
    }
    // 영문, 숫자, 한글만 허용 (정규식)
    if (!/^[a-zA-Z0-9가-힣]+$/.test(value)) {
      return { isValid: false, error: t('profilePage.validation.invalidBrainrots') };
    }
    return { isValid: true, error: null };
  };
  
  // 모든 사용자 브레인롯 ID 목록 생성
  const userBrainrotIds = userBrainrots.map(brainrot => brainrot.id);
  
  // 사용자 브레인롯 중 하나가 이긴 경우를 승리로 계산
  const wins = userBattles.filter(battle => 
    userBrainrotIds.includes(battle.winnerId)
  ).length;
  
  const losses = totalBattles - wins;
  const winRate = totalBattles > 0 ? ((wins / totalBattles) * 100).toFixed(1) : '0.0';

  // 사용자 이름이 변경될 때 입력 필드 업데이트
  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  // 편집 모드로 전환될 때 자동으로 입력 필드에 포커스
  useEffect(() => {
    if (isEditingUsername && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingUsername]);

  // 메시지가 표시되면 3초 후에 자동으로 사라지게 함
  useEffect(() => {
    if (message.text && message.type) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 사용자 정보가 로딩 중일 때 타임아웃 설정
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isLoading) {
      timer = setTimeout(() => {
        console.log('프로필 페이지 로딩 타임아웃, 홈으로 리다이렉트');
        navigate('/');
      }, 8000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, navigate]);

  const handleUsernameChange = async () => {
    if (!user || newUsername.trim() === user.username) {
      setIsEditingUsername(false);
      return;
    }
    
    const trimmedUsername = newUsername.trim();
    
    // 유효성 검사 수행
    const validation = validateUsername(trimmedUsername);
    if (!validation.isValid) {
      setMessage({ text: validation.error || '', type: 'error' });
      return;
    }
    
    // 메시지 초기화
    setMessage({ text: '', type: null });
    
    try {
      await updateUser({ username: trimmedUsername });
      setMessage({ text: t('profilePage.usernameUpdateSuccess'), type: 'success' });
      setIsEditingUsername(false);
    } catch (err) {
      console.error("Username update failed:", err);
      setMessage({ text: t('profilePage.usernameUpdateError'), type: 'error' });
    }
  };

  // 아바타 문자 생성 (이니셜)
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (!user) {
    // 사용자가 없는 경우 (예: 로그아웃 직후) 홈으로 리디렉션하거나 로딩 표시
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 섹션 */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400 h-20 rounded-lg opacity-20"></div>
        <div className="relative flex flex-col items-center pt-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-2 border-gaming-dark">
            {getInitials(user.username)}
          </div>
          <h1 className="text-2xl font-bold text-white mt-3 mb-1">{t('profilePage.title')}</h1>
        </div>
      </div>
      
      {/* 통계 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gaming-card rounded-lg shadow-md p-4 flex flex-col items-center transition-transform hover:scale-105">
          <Award className="text-primary-400 mb-2" size={24} />
          <span className="text-gray-300 text-sm">{t('homePage.win')}</span>
          <span className="text-2xl font-bold text-white">{wins}</span>
        </div>
        
        <div className="bg-gaming-card rounded-lg shadow-md p-4 flex flex-col items-center transition-transform hover:scale-105">
          <BarChart2 className="text-primary-400 mb-2" size={24} />
          <span className="text-gray-300 text-sm">{t('homePage.loss')}</span>
          <span className="text-2xl font-bold text-white">{losses}</span>
        </div>
        
        <div className="bg-gaming-card rounded-lg shadow-md p-4 flex flex-col items-center transition-transform hover:scale-105">
          <Shield className="text-primary-400 mb-2" size={24} />
          <span className="text-gray-300 text-sm">Win Rate</span>
          <span className="text-2xl font-bold text-white">{winRate}%</span>
        </div>
      </div>
      
      {/* 프로필 정보 섹션 */}
      <div className="bg-gaming-card rounded-lg shadow-lg p-6 mb-8 border border-gray-800">
        <h2 className="text-xl font-semibold text-primary-400 mb-6 flex items-center">
          <User size={20} className="mr-2" />
          {t('profilePage.greeting', { username: user.username })}
        </h2>
        
        <div className="space-y-5">
          {/* 이메일 정보 */}
          <div className="flex items-center border-b border-gray-700 pb-4">
            <div className="bg-primary-900/50 p-2 rounded-full mr-3">
              <Mail size={18} className="text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t('profilePage.emailLabel')}</p>
              <p className="text-white">{user.email}</p>
            </div>
          </div>
          
          {/* 사용자 ID 정보 */}
          <div className="flex items-center border-b border-gray-700 pb-4">
            <div className="bg-primary-900/50 p-2 rounded-full mr-3">
              <Shield size={18} className="text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t('profilePage.userIdLabel')}</p>
              <p className="text-white flex items-center">
                <span className="bg-primary-900/70 px-3 py-1 rounded-md font-mono">{user.user_id || '-'}</span>
                {user.user_id && (
                  <button 
                    className="ml-2 text-primary-400 hover:text-primary-300 text-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(String(user.user_id));
                      setMessage({ text: t('profilePage.userIdCopied'), type: 'success' });
                    }}
                  >
                    {t('profilePage.copyId')}
                  </button>
                )}
              </p>
            </div>
          </div>
          
          {/* 닉네임 변경 */}
          <div className="border-b border-gray-700 pb-4">
            <div className="flex items-center mb-2">
              <div className="bg-primary-900/50 p-2 rounded-full mr-3">
                <User size={18} className="text-primary-400" />
              </div>
              <p className="text-sm text-gray-400">{t('profilePage.usernameLabel')}</p>
            </div>

            <div className="ml-11">
              {isEditingUsername ? (
                <>
                  {/* Input and Buttons Row - Maintain consistent height */}
                  <div className="flex items-center justify-between gap-2 h-9">
                    <div className="flex-grow"> {/* Use flex-grow for input */}
                      <input
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder={t('profilePage.usernamePlaceholder')}
                        disabled={isLoading}
                        ref={inputRef}
                        className="bg-gaming-card text-white rounded-md shadow-sm 
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          border-gray-600 px-4 h-9 w-full box-border"
                      />
                    </div>
                    {/* Button Group - Fixed width */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={handleUsernameChange}
                        size="sm"
                        isLoading={isLoading}
                        className="h-9 min-w-[80px] box-border" // Keep height and min-width
                      >
                        <Save size={16} className="mr-1" />
                        {t('profilePage.saveButton')}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingUsername(false);
                          setNewUsername(user.username);
                          setMessage({ text: '', type: null });
                        }}
                        size="sm"
                        variant="outline"
                        className="h-9 min-w-[80px] box-border" // Keep height and min-width
                      >
                        <X size={16} className="mr-1" />
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                  {/* Message area */}
                  {message.text && message.type && (
                    <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {message.text}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between h-9"> {/* Keep height consistent */}
                  <span className="text-white">{user.username}</span>
                  <Button
                    onClick={() => setIsEditingUsername(true)}
                    size="sm"
                    variant="ghost"
                    className="text-primary-400 hover:text-primary-300 h-9 box-border border border-transparent"
                  >
                    <Edit2 size={14} className="mr-1" />
                    {t('profilePage.editButton')}
                  </Button>
                </div>
                  {/* Message area - Also show in non-editing mode */}
                  {message.text && message.type && (
                    <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {message.text}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 로그아웃 */}
      <div className="flex justify-center mt-8">
        <Button 
          variant="accent"
          onClick={() => {
            // 로딩 상태는 이미 isLoading에 의존
            try {
              // 완전한 로그아웃을 위한 처리
              // Promise로 래핑하여 then 사용 가능하게 함
              Promise.resolve(logout())
                .then(() => {
                  // 로그아웃 후 URL 파라미터를 제거한 채로 홈페이지로 이동
                  // hard reload를 위해 window.location.href 사용
                  window.location.href = '/';
                })
                .catch((error: Error) => {
                  console.error('로그아웃 실패:', error);
                  // 실패해도 홈으로 이동
                  window.location.href = '/';
                });
            } catch (error) {
              console.error('로그아웃 처리 오류:', error);
              window.location.href = '/';
            }
          }}
          isLoading={isLoading}
          className="bg-red-600/80 hover:bg-red-800 border-none text-white/90 transition-colors px-8 py-2 rounded-full shadow-sm"
        >
          <LogOut size={18} className="mr-2" />
          {t('profilePage.logoutButton')}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;