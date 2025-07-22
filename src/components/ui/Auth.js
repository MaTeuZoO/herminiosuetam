import React, { useState } from 'react';
import { signIn, signUp } from '../../api/supabaseService'; // Importando do nosso novo serviço

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuthAction = async (action) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error } = action === 'login' 
        ? await signIn({ email, password })
        : await signUp({ email, password });

      if (error) {
        throw error;
      }
      
      if (action === 'signup') {
        setMessage('Cadastro realizado! Verifique seu email para confirmar.');
      }
      // O login vai ser tratado pelo onAuthStateChange no App.js
    } catch (error) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-zinc-50">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white border rounded-lg shadow-sm border-zinc-200">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-zinc-800">SunIst</h1>
            <p className="mt-2 text-zinc-500">Faça login ou crie sua conta</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
            <input id="email" className="w-full px-3 py-2 mt-1 border rounded-md border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-400" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
           <div>
            <label htmlFor="password"  className="text-sm font-medium text-zinc-700">Senha</label>
            <input id="password" className="w-full px-3 py-2 mt-1 border rounded-md border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-400" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          {message && <p className="text-sm text-center text-green-500">{message}</p>}
          <div className="flex flex-col gap-2 pt-2">
            <button onClick={() => handleAuthAction('login')} disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
             <button onClick={() => handleAuthAction('signup')} disabled={loading} className="w-full px-4 py-2 font-semibold text-violet-600 bg-violet-100 rounded-md hover:bg-violet-200/60 disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
