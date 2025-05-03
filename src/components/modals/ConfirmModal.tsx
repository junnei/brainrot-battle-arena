import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: string;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonStyle = 'bg-primary-600 hover:bg-primary-700',
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 bg-gaming-card rounded-lg shadow-lg animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-gaming-light">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-300 mb-6">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="order-2 sm:order-1"
              disabled={isLoading}
            >
              {cancelText || t('common.cancel')}
            </Button>
            <Button
              onClick={onConfirm}
              className={`order-1 sm:order-2 ${confirmButtonStyle}`}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {confirmText || t('common.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
