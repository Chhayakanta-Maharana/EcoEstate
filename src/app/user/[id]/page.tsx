'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EstateWorkspace from '@/components/EstateWorkspace';

export default function UserEstatePage() {
  const router = useRouter();
  const params = useParams();
  const { currentUser, organizations, selectOrganization } = useAuth();
  const orgId = params?.id as string;

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'SUPERADMIN' && currentUser.organizationId && currentUser.organizationId !== orgId) {
      // Forbidden: regular user cannot access another institution's route
      router.replace(`/user/${currentUser.organizationId}`);
    } else if (orgId) {
      selectOrganization(orgId);
    }
  }, [currentUser, orgId, router, selectOrganization]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <span className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <EstateWorkspace orgId={orgId} />;
}
