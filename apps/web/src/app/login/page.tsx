'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(email.trim(), password);
      if (user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/mentor/dashboard');
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-md">
          <GraduationCap className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">
          Project Review Hub
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-lg border-slate-200/90">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the submission & review portal
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Quick Fill Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-2">Assessment Quick Fill:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCredentials('mentor@projecthub.local', 'MentorPassword123!')}
                className="p-2 rounded border border-slate-200 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-medium text-indigo-600">Lead Mentor</div>
                <div className="text-[10px] text-slate-400">mentor@projecthub.local</div>
              </button>
              <button
                type="button"
                onClick={() => setCredentials('student@projecthub.local', 'StudentPassword123!')}
                className="p-2 rounded border border-slate-200 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-medium text-indigo-600">Demo Student</div>
                <div className="text-[10px] text-slate-400">student@projecthub.local</div>
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 text-sm text-slate-500 pt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="ml-1 text-indigo-600 hover:underline font-medium">
            Sign up as Student
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
