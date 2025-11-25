import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { TargetIcon } from './icons';

export function Header() {
  const user = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <header className="w-full py-4 bg-primary-800 shadow-sm sticky top-0 z-10 border-b border-primary-700">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        <h1 className="text-lg md:text-2xl font-semibold text-white tracking-tight flex items-center gap-2 md:gap-3">
          <TargetIcon className="w-7 h-7 md:w-8 md:h-8 text-amber-400" />
          Landbys Cup
        </h1>
        <div className="text-primary-200 text-sm">
          {user ? (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
              <span className="text-primary-200 text-xs sm:text-sm truncate">
                {user.email || user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md font-medium text-sm transition-colors flex-shrink-0"
              >
                Logga ut
              </button>
            </div>
          ) : (
            <span className="text-primary-300 text-sm">Ej inloggad</span>
          )}
        </div>
      </div>
    </header>
  );
}