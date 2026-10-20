import React from 'react';
import { Compass, Plus, RefreshCw, Car } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No RouteMates available yet.',
  description = 'There are no active rides matching your search criteria at this moment. You can be the first to publish this route or try adjusting your filters.',
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 max-w-lg mx-auto my-6 transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-indigo-400/10 dark:bg-indigo-400/20 border border-indigo-400/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-4 shadow-sm">
        {icon || <Compass className="w-8 h-8 animate-pulse" />}
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-display">
        {title}
      </h3>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed max-w-sm">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {actionText}
          </button>
        )}

        {secondaryActionText && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};
