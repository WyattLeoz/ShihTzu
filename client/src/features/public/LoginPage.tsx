import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: 'responder2@demo.sg',
      password: 'Demo1234!',
    },
  });

  const onSubmit = (data: { email: string; password: string }) => {
    login(data.email, data.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md bg-white border border-paper-border rounded-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-ink mb-2">QuickAid</h1>
          <p className="text-sm text-ink-muted">Emergency Triage Command Platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input
              {...register('email', { required: true })}
              type="email"
              className="w-full px-4 py-2 border border-paper-border rounded-sm
                text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-navy
              "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              {...register('password', { required: true })}
              type="password"
              className="w-full px-4 py-2 border border-paper-border rounded-sm
                text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-navy
              "
            />
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-paper-border">
          <p className="text-xs text-ink-muted text-center mb-3">Demo accounts:</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">Citizen:</span>
              <span className="font-mono">citizen2@demo.sg / Demo1234!</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Responder:</span>
              <span className="font-mono">responder2@demo.sg / Demo1234!</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Supervisor:</span>
              <span className="font-mono">supervisor2@demo.sg / Demo1234!</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Admin:</span>
              <span className="font-mono">admin2@demo.sg / Demo1234!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}