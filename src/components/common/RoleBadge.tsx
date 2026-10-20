import React from 'react';
import { Role } from '../../types';
import { GraduationCap, Eye, Laptop } from 'lucide-react';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm', showIcon = true }) => {
  const getBadgeStyle = () => {
    switch (role) {
      case 'Lecturer':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
          icon: <GraduationCap className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Lecturer',
        };
      case 'Supervisor':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
          icon: <Eye className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Supervisor',
        };
      case 'Technical':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20',
          icon: <Laptop className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Technical',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: null,
          label: role,
        };
    }
  };

  const style = getBadgeStyle();
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style.bg} ${sizeClasses} shadow-xs select-none`}
    >
      {showIcon && style.icon}
      <span>{style.label}</span>
    </span>
  );
};
