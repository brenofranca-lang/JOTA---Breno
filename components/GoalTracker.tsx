
import React from 'react';

interface GoalTrackerProps {
  label: string;
  current: number;
  goal: number;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ label, current, goal }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm font-medium text-slate-300">{current} / {goal}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-4">
        <div
          className="bg-green-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
       <div className="text-right text-xs font-bold text-green-400 mt-1">{percentage.toFixed(1)}% Atingido</div>
    </div>
  );
};
