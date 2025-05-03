import React from 'react';
import { X } from 'lucide-react';
import BrainrotForm from './BrainrotForm';
import { Brainrot } from '../../types';

interface FormData {
  name: string;
  description: string;
  imageUrl: string;
  id?: string;
}

interface BrainrotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  title: string;
  brainrot?: Brainrot;
}

const BrainrotFormModal: React.FC<BrainrotFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  brainrot
}) => {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl mx-4 bg-gaming-card rounded-lg shadow-lg animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-gaming-light">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <BrainrotForm
            onSubmit={onSubmit}
            initialData={brainrot}
          />
        </div>
      </div>
    </div>
  );
};

export default BrainrotFormModal; 