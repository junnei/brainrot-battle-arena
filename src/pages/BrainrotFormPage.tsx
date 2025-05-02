import React from 'react';
import BrainrotForm from '../components/brainrots/BrainrotForm';
import { useBrainrots } from '../context/BrainrotContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BrainrotFormPage: React.FC = () => {
  const { createBrainrot, isLoading } = useBrainrots();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (data: any) => {
    await createBrainrot(data);
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