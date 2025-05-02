import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
  isInteractive?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  isSelected = false,
  isInteractive = false,
}) => {
  const cardClasses = `
    bg-gaming-card rounded-lg shadow-md overflow-hidden
    ${isInteractive ? 'hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${isSelected ? 'ring-2 ring-primary-500' : ''}
    ${className}
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-700 ${className}`}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-gray-700 ${className}`}>
    {children}
  </div>
);

export default Card;