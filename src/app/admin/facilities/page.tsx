'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SuperAdminPortal from '@/components/SuperAdminPortal';

export default function AdminFacilitiesPage() {
  const router = useRouter();
  const { currentUser, isAuthReady } = useAuth();

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.push('/login');
    }
  }, [isAuthReady, currentUser, router]);

  if (!isAuthReady || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <span className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SuperAdminPortal
      initialTab="facilities"
      onNavigateTab={(tab) => {
        router.push(`/admin/${tab}`);
      }}
      onNavigateToOrg={(orgId) => {
        router.push(`/user/${orgId}`);
      }}
    />
  );
}
