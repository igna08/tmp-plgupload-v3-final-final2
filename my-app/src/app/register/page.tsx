"use client";

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:8000/api';

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          full_name: fullName,
          email: email,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccessMessage('Registration successful! Please proceed to login.');
      // Optionally, clear form or redirect after a delay
      // router.push('/login');
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map((item: any) => item.msg).join(', '));
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // AppLayout handles centering for /register path
    <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-radiusLarge">
      <h1 className="text-2xl font-bold text-center text-neutralDarker">
        Create your Account
      </h1>

      {successMessage && !error && (
        <div className="p-3 bg-green-50 border border-shopifyGreen rounded-radiusSmall text-center">
          <p className="text-sm text-shopifyGreen">{successMessage}</p>
          <Link href="/login" className="mt-2 inline-block">
            <Button variant="primary" size="small">Go to Login</Button>
          </Link>
        </div>
      )}

      {error && (
        <p className="text-sm text-accentRed text-center bg-red-50 p-2 rounded-radiusSmall">
          {error}
        </p>
      )}

      {!successMessage && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-neutralDark mb-1">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Full Name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutralDark mb-1">
              Email
            </label>
            <Input
              id="emailReg" // Changed id to avoid conflict with login potentially
              name="email"
              type="email"
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
              id="passwordReg" // Changed id
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
              size="large"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
      )}

      <div className="text-sm text-center text-neutralTextSecondary">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-shopifyGreen hover:text-green-700">
          Login here
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
