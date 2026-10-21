import React from 'react';
import { Role, normalizeRole } from '../../types';
import { GraduationCap, Eye, Laptop, Wallet, Wrench, Printer } from 'lucide-react';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm', showIcon = true }) => {
  const normalizedRole = normalizeRole(role) || role;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  const getBadgeStyle = () => {
    switch (normalizedRole) {
      case 'محاضر':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
          icon: <GraduationCap className={iconSize} />,
          label: 'محاضر',
        };
      case 'مشرف فنى':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
          icon: <Eye className={iconSize} />,
          label: 'مشرف فنى',
        };
      case 'تقنى/ادارى':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20',
          icon: <Laptop className={iconSize} />,
          label: 'تقنى/ادارى',
        };
      case 'مسؤل مالى':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20',
          icon: <Wallet className={iconSize} />,
          label: 'مسؤل مالى',
        };
      case 'فنى اجهزة':
        return {
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-1 ring-cyan-500/20',
          icon: <Wrench className={iconSize} />,
          label: 'فنى اجهزة',
        };
      case 'تصوير وطباعة':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20',
          icon: <Printer className={iconSize} />,
          label: 'تصوير وطباعة',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: null,
          label: normalizedRole,
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
