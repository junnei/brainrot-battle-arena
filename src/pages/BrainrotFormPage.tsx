import React from 'react';
import BrainrotForm from '../components/brainrots/BrainrotForm';
import { useBrainrots } from '../context/BrainrotContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// 브레인롯 생성에 필요한 데이터 타입 정의
interface FormData {
  name: string;
  description: string;
  imageUrl: string;
  elo?: number; // createBrainrot 함수 요구사항에 맞게 추가
}

const BrainrotFormPage: React.FC = () => {
  const context = useBrainrots();
  // non-null assertion으로 타입 에러 해결
  const { createBrainrot } = context!;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (data: FormData) => {
    // elo 값이 필수이므로 기본값 추가
    const brainrotData = {
      ...data,
      elo: 1000, // 기본값 설정
      riskLevel: 1 // 기본 위험도 설정
    };
    await createBrainrot(brainrotData);
    navigate('/', { state: { brainrotCreated: true } });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gaming-card rounded-lg shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-white">{t('brainrotForm.title')}</h2>
      <BrainrotForm onSubmit={handleSubmit} />
    </div>
  );
};

export default BrainrotFormPage; 