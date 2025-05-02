import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';

type Language = {
  code: string;
  name: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // 현재 언어 코드 확인 및 콘솔에 출력
  useEffect(() => {
    console.log('Current language:', i18n.language);
  }, [i18n.language]);
  
  const currentLang = LANGUAGES.find(lang => lang.code === i18n.language.split('-')[0]) || LANGUAGES[0];
  
  // 언어 변경 핸들러
  const handleChangeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fixed top-3 right-3 z-50">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`
          flex items-center justify-center w-10 h-10 
          text-white rounded-full transition-all duration-200 
          hover:bg-primary-600/80 ${isOpen ? 'bg-primary-600/80' : 'bg-transparent'} 
          shadow-sm hover:shadow-lg
        `}
        aria-label="언어 선택"
      >
        <Globe size={20} className="text-white" strokeWidth={2} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-gaming-card rounded-md shadow-xl overflow-hidden w-36 border border-gray-700 animate-fade-in">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={(e) => {
                e.stopPropagation();
                handleChangeLanguage(lang.code);
              }}
              className="flex items-center justify-between w-full px-3 py-1.5 text-left hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{lang.flag}</span>
                <span className="font-medium text-sm text-white">{lang.name}</span>
              </div>
              {lang.code === i18n.language.split('-')[0] && (
                <Check size={14} className="text-primary-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 