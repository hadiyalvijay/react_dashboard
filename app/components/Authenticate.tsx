'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

const Authenticate = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', { email, password, redirect: false });
    
    if (result?.error) {
      console.error('Sign-in error:', result.error);
      setError(result.error === 'CredentialsSignin' ? 'Invalid credentials.' : 'An unexpected error occurred.');
    } else {
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign In</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default Authenticate; 