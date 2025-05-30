"use client";

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error: authError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      router.push('/schools'); // Redirect to a protected page, e.g., /schools or /dashboard
    }
  };

  return (
    // The AppLayout component handles the centering for /login path
    <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-radiusLarge">
      <h1 className="text-2xl font-bold text-center text-neutralDarker">
        Login to your Account
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutralDark mb-1">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email" // API expects 'username' but usually email is used as username
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutralDark mb-1">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>

        {authError && (
          <p className="text-sm text-accentRed text-center bg-red-50 p-2 rounded-radiusSmall">
            {authError}
          </p>
        )}

        <div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
            size="large"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </form>
      {/* Optional: Links for password reset or sign up */}
      {/* <div className="text-sm text-center">
        <a href="#" className="font-medium text-shopifyGreen hover:text-green-700">
          Forgot your password?
        </a>
      </div> */}
    </div>
  );
};

export default LoginPage;
