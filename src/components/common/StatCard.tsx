import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  valueColor?: string; // e.g. 'text-[#3A683D]' or 'text-[#DC2626]'
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  valueColor = 'text-[#1B2F1C]',
  className = ''
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#C7D2BA] p-5 shadow-2xs flex flex-col justify-between min-h-[106px] transition-all duration-150 ${className}`}
    >
      <span className="text-[13.5px] font-medium text-[#52604C]">
        {title}
      </span>
      <span className={`text-[32px] font-bold leading-none tracking-tight ${valueColor}`}>
        {value}
      </span>
    </div>
  );
};
