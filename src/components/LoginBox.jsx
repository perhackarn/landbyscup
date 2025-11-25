import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

export function LoginBox() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const user = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  };

  if (user) return null;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm max-w-md mx-auto mt-8 border border-primary-200">
      <h2 className="text-lg font-semibold mb-4 text-center text-primary-800">Logga in</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-post"
        className="border border-primary-300 p-3 w-full mb-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Lösenord"
        className="border border-primary-300 p-3 w-full mb-4 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
      <button
        onClick={handleLogin}
        className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded-lg font-medium transition-colors"
      >
        Logga in
      </button>
    </div>
  );
}