import React from 'react';

export function TabBtn({ active, onClick, icon, children }) {
  return (
    <button
      className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 border ${
        active
          ? "bg-primary-700 text-white border-primary-700 shadow-sm"
          : "bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 hover:border-primary-300"
      }`}
      onClick={onClick}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </button>
  );
}