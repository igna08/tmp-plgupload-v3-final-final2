"use client"; // For useSearchParams and useState

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:8000/api';

// Suspense Boundary for useSearchParams
const InvitationRegistrationPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationTokenFromQuery = searchParams.get('token');

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (invitationTokenFromQuery) {
      setInvitationToken(invitationTokenFromQuery);
    } else {
      setError("Invitation token is missing or invalid. Please use the link provided in your invitation.");
    }
  }, [invitationTokenFromQuery]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!invitationToken) {
      setError("Invitation token is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await axios.post(
        `${API_BASE_URL}/auth/register/invitation`,
        {
          full_name: fullName,
          password: password,
          invitation_token: invitationToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccessMessage('Registration successful! You can now log in with your new credentials.');
      // Optionally, clear form or redirect after a delay
      // router.push('/login');
    } catch (err: any) {
      console.error('Invitation registration failed:', err);
      if (err.response?.data?.detail) {
         if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map((item: any) => item.msg).join(', '));
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('An unexpected error occurred. Please try again or check your invitation link.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!invitationTokenFromQuery && !error) {
    // Still waiting for searchParams or initial effect, or no token was ever provided
    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-radiusLarge text-center">
            <p className="text-neutralDark">Loading invitation details...</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-radiusLarge">
      <h1 className="text-2xl font-bold text-center text-neutralDarker">
        Complete Your Registration
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

      {!successMessage && invitationToken && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="invitationToken" className="block text-sm font-medium text-neutralDark mb-1">
              Invitation Token
            </label>
            <Input
              id="invitationToken"
              name="invitationToken"
              type="text"
              value={invitationToken || ''}
              disabled // Token is from URL, not user-editable
              className="bg-neutralLighter"
            />
          </div>

          <div>
            <label htmlFor="fullNameInv" className="block text-sm font-medium text-neutralDark mb-1">
              Full Name
            </label>
            <Input
              id="fullNameInv"
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
            <label htmlFor="passwordInv" className="block text-sm font-medium text-neutralDark mb-1">
              Password
            </label>
            <Input
              id="passwordInv"
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
              disabled={isLoading || !invitationToken}
              size="large"
            >
              {isLoading ? 'Completing Registration...' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      )}
      {!successMessage && (
         <div className="text-sm text-center text-neutralTextSecondary mt-4">
            <Link href="/login" className="font-medium text-shopifyGreen hover:text-green-700">
            Already registered? Login
            </Link>
        </div>
      )}
    </div>
  );
};


// Create a wrapper component that uses Suspense
const InvitationPageWrapper: React.FC = () => {
  return (
    <Suspense fallback={<div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-radiusLarge text-center"><p className="text-neutralDark">Loading...</p></div>}>
      <InvitationRegistrationPageContent />
    </Suspense>
  );
}

export default InvitationPageWrapper;
