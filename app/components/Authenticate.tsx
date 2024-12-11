'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';

const Authenticate = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter(); // useRouter to redirect after successful login

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Debugging: Log the email and password values
    console.log('Email:', email);
    console.log('Password:', password);

    const result = await signIn('credentials', { email, password, redirect: false });

    // Debugging: Log the result from the sign-in process
    console.log('Sign-in result:', result);

    if (result?.error) {
      console.error('Sign-in error:', result.error);
      setError(result.error === 'CredentialsSignin' ? 'Invalid credentials.' : 'An unexpected error occurred.');
    } else {
      setError('');
      router.push('/dashboard'); // Redirect to a protected page after successful login
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
