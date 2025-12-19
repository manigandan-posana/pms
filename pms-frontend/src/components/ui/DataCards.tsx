import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  variant?: 'green' | 'blue' | 'orange' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon = 'pi-chart-bar',
  variant = 'green' 
}) => {
  const variantClasses = {
    green: 'text-[var(--color-stat-card-green)]',
    blue: 'text-[var(--color-stat-card-blue)]',
    orange: 'text-[var(--color-stat-card-orange)]',
    indigo: 'text-[var(--color-stat-card-indigo)]'
  };

  const iconBgClasses = {
    green: 'bg-[var(--color-stat-card-green-icon-bg)]',
    blue: 'bg-[var(--color-stat-card-blue-icon-bg)]',
    orange: 'bg-[var(--color-stat-card-orange-icon-bg)]',
    indigo: 'bg-[var(--color-stat-card-indigo-icon-bg)]'
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg ${iconBgClasses[variant]} flex items-center justify-center`}>
          <i className={`pi ${icon} text-xl ${variantClasses[variant]}`}></i>
        </div>
        <div className="flex-1">
          <div className="text-[0.7rem] uppercase tracking-wide" style={{ color: 'var(--color-stat-card-subtitle-color)' }}>
            {title}
          </div>
          <div className={`text-2xl font-bold ${variantClasses[variant]}`}>
            {value}
          </div>
          {subtitle && (
            <div className="text-[0.65rem] text-slate-500 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, children, action }) => {
  return (
    <div className="">
      <div className="section-header">
        <span>{title}</span>
        {action && <div>{action}</div>}
      </div>
      <div className="mt-2">
        {children}
      </div>
    </div>
  );
};

interface DataRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  tooltip?: string;
}

export const DataRow: React.FC<DataRowProps> = ({ label, value, highlight, tooltip }) => {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-600 text-sm">{label}</span>
      <span 
        className={`text-sm font-semibold ${highlight ? 'data-highlight' : 'text-slate-900'}`}
        {...(tooltip && { 'data-tooltip': tooltip })}
      >
        {value}
      </span>
    </div>
  );
};
