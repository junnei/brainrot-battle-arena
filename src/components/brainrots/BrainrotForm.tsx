import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { useBrainrots } from '../../context/BrainrotContext';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Brainrot } from '../../types';

interface FormErrors {
  name?: string;
  description?: string;
  imageUrl?: string;
}

interface BrainrotFormProps {
  onSubmit: (data: any) => void;
  initialData?: Brainrot;
}

const BrainrotForm: React.FC<BrainrotFormProps> = ({ onSubmit, initialData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 최대 글자 수 제한
  const MAX_NAME_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 300;

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setImageUrl(initialData.imageUrl);
      setImagePreview(initialData.imageUrl);
    }
  }, [initialData]);

  // Handle name change with length validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (newName.length <= MAX_NAME_LENGTH) {
      setName(newName);
      // 오류 제거
      if (formErrors.name && newName.trim() !== '') {
        setFormErrors(prev => ({ ...prev, name: undefined }));
      }
    }
  };

  // Handle description change with length validation
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    if (newDescription.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(newDescription);
      // 오류 제거
      if (formErrors.description && newDescription.trim() !== '') {
        setFormErrors(prev => ({ ...prev, description: undefined }));
      }
    }
  };

  // Handle form validation
  const validateForm = () => {
    let isValid = true;
    const errors: FormErrors = {};

    if (!name.trim()) {
      errors.name = t('brainrotForm.errorName');
      isValid = false;
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.name = t('brainrotForm.errorNameLength');
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = t('brainrotForm.errorDesc');
      isValid = false;
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = t('brainrotForm.errorDescLength');
      isValid = false;
    }

    if (!imageUrl) {
      errors.imageUrl = t('brainrotForm.errorImageFileRequired');
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset errors
    setFormErrors({});
    setSubmitError(null);

    // Validation
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call the onSubmit callback with form data
      await onSubmit({
        name,
        description,
        imageUrl,
        ...(initialData && { id: initialData.id }),
      });
      
    } catch (err) {
      console.error('Failed to submit brainrot form:', err);
      setSubmitError(t('brainrotForm.errorSubmit'));
    } finally {
      setIsLoading(false);
    }
  };

  // Process the selected/dropped file
  const processFile = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageUrl(base64String);
        setImagePreview(base64String);
        setFormErrors(prev => ({ ...prev, imageUrl: undefined }));
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImageUrl('');
      setImagePreview('');
      if (file) {
        setFormErrors(prev => ({ ...prev, imageUrl: t('brainrotForm.errorImageFileType') }));
      }
    }
  };

  // Handle image file selection via input click
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0] || null);
  };

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file || null);
    // Clear the dataTransfer buffer
    if (e.dataTransfer.items) {
        e.dataTransfer.items.clear();
    } else {
        e.dataTransfer.clearData();
    }
  };

  // Clear image selection
  const clearImageSelection = () => {
    setImageUrl('');
    setImagePreview('');
    setSelectedFile(null);
    const fileInput = document.getElementById('brainrot-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    setFormErrors(prev => ({ ...prev, imageUrl: undefined }));
  };

  return (
    <div className="w-full">
      {submitError && (
        <div className="bg-accent-600/20 border border-accent-600 text-accent-100 px-4 py-3 rounded mb-4">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Input
            label={t('brainrotForm.nameLabel')}
            placeholder={t('brainrotForm.namePlaceholder')}
            value={name}
            onChange={handleNameChange}
            error={formErrors.name}
            fullWidth
            required
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${name.length > MAX_NAME_LENGTH ? 'text-red-400' : 'text-gray-400'}`}>
              {name.length}/{MAX_NAME_LENGTH}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <Textarea
            label={t('brainrotForm.descLabel')}
            placeholder={t('brainrotForm.descPlaceholder')}
            value={description}
            onChange={handleDescriptionChange}
            error={formErrors.description}
            fullWidth
            required
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH ? 'text-red-400' : 'text-gray-400'}`}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-200 mb-1">
            {t('brainrotForm.imageLabel')}
          </label>
          
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-grow">
              <label 
                htmlFor="brainrot-image-upload" 
                className={`
                  flex flex-col items-center justify-center w-full h-32 border-2 border-dashed 
                  rounded-lg cursor-pointer
                  ${isDragging 
                    ? 'border-primary-400 bg-primary-900/30' 
                    : 'border-gray-600 hover:border-primary-500 bg-gaming-dark hover:bg-gaming-dark/80'
                  }
                  transition-all
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  id="brainrot-image-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
                
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="text-gray-400 mb-1" size={24} />
                  <p className="text-sm text-gray-300">
                    {t('brainrotForm.dragDropInstruction')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('brainrotForm.fileTypeInstruction')}
                  </p>
                </div>
              </label>
              
              {formErrors.imageUrl && (
                <p className="mt-1 text-sm text-red-400">{formErrors.imageUrl}</p>
              )}
            </div>
            
            {imagePreview && (
              <div className="relative">
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-700">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearImageSelection}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  title={t('brainrotForm.removeImage')}
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {initialData 
              ? t('brainrotForm.updateButtonText')
              : t('brainrotForm.submitButtonText')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BrainrotForm;