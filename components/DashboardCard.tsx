
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, subValue, icon, className = '' }) => {
  return (
    <div className={`bg-slate-800 p-6 rounded-lg shadow-lg flex items-center space-x-4 transition-transform hover:scale-105 ${className}`}>
      <div className="bg-slate-700 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subValue && <p className="text-xs text-slate-300">{subValue}</p>}
      </div>
    </div>
  );
};
