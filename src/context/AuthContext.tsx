'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, Role, EquipmentItem } from '@/types';
import { DjangoApi } from '@/services/api';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'EMAIL_SENT' | 'ROLE_ASSIGNED' | 'ESTATE_CREATED' | 'ALERT' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  targetRole?: Role | 'ALL';
}

export type DataSourceType = 'loading' | 'backend' | 'mock';

interface AuthContextType {
  currentUser: User | null;
  isAuthReady: boolean;
  activeOrg: Organization | null;
  organizations: Organization[];
  users: User[];
  isSuperAdmin: boolean;
  isSimulatingIoT: boolean;
  dataSource: DataSourceType;
  toggleIoTSimulation: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { password?: string }) => void;
  selectOrganization: (orgId: string) => void;
  createOrganization: (org: Omit<Organization, 'id' | 'iotStatus' | 'lastPing' | 'sustainabilityScore'>) => Organization;
  updateOrganization: (orgId: string, data: Partial<Organization>) => void;
  sendCredentialsEmail: (orgId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteOrganization: (id: string) => void;
  addUser: (userData: Omit<User, 'id'>) => User;
  updateUserRole: (userId: string, newRole: Role) => void;
  updateUserStatus: (userId: string, newStatus: 'Active' | 'Inactive') => void;
  deleteUser: (userId: string) => void;
  equipmentList: EquipmentItem[];
  addEquipment: (item: Omit<EquipmentItem, 'id'>) => void;
  importEquipmentBatch: (items: Omit<EquipmentItem, 'id'>[]) => void;
  deleteEquipment: (id: string) => void;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Restore current user from localStorage if available
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('ecoestate-current-user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    setIsAuthReady(true);
  }, []);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ecoestate-active-org-id') || '';
    }
    return '';
  });

  const [isSimulatingIoT, setIsSimulatingIoT] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<DataSourceType>('loading');
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);

  // Live Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const updateProfile = (data: Partial<User> & { password?: string }) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        ...(data.name ? { name: data.name } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.password ? { password: data.password } : {}),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecoestate-current-user', JSON.stringify(updated));
        if (data.password) {
          localStorage.setItem('ecoestate-user-password', data.password);
        }
        if (prev.role === 'SUPERADMIN' || prev.id === 'user-superadmin') {
          const prevConfig = JSON.parse(localStorage.getItem('ecoestate-superadmin-config') || '{}');
          localStorage.setItem('ecoestate-superadmin-config', JSON.stringify({
            ...prevConfig,
            name: data.name || updated.name,
            email: data.email || updated.email,
            title: data.title || updated.title,
            ...(data.password ? { password: data.password } : {}),
          }));
        }
      }
      return updated;
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser?.id ? { ...u, ...data } : u))
    );

    // Sync SuperAdmin credentials with Django backend
    if (currentUser?.role === 'SUPERADMIN' || currentUser?.id === 'user-superadmin') {
      DjangoApi.updateSuperAdminProfile({
        name: data.name,
        email: data.email,
        title: data.title,
        ...(data.password ? { password: data.password } : {}),
      }).catch((err) => console.warn('Could not update SuperAdmin in Django backend:', err));
    } else if (currentUser?.id) {
      // Sync with NeonDB if user has database ID
      const cleanId = currentUser.id.replace('user-', '').replace('staff-', '');
      if (/^\d+$/.test(cleanId)) {
        DjangoApi.updateStaffMember(cleanId, {
          name: data.name,
          email: data.email,
          title: data.title,
          ...(data.password ? { password: data.password } : {}),
        }).catch((err) => console.warn('Could not update staff in NeonDB:', err));
      }
    }

    // If current user is ORG_ADMIN or associated with an organization, update organization's assigned admin credentials
    const targetOrgId = currentUser?.organizationId || activeOrgId;
    if (targetOrgId) {
      const cleanTarget = targetOrgId.replace('org-', '');
      if (data.password && typeof window !== 'undefined') {
        localStorage.setItem(`ecoestate-org-pass-${cleanTarget}`, data.password);
        localStorage.setItem(`ecoestate-org-pass-${targetOrgId}`, data.password);
        localStorage.setItem('ecoestate-user-password', data.password);
      }
      setOrganizations((prev) =>
        prev.map((o) => {
          const cleanO = o.id.replace('org-', '');
          if (o.id === targetOrgId || cleanO === cleanTarget) {
            return {
              ...o,
              assignedAdminName: data.name || o.assignedAdminName,
              assignedAdminEmail: data.email || o.assignedAdminEmail,
              assignedPassword: data.password || o.assignedPassword,
            };
          }
          return o;
        })
      );

      // Persist password & admin details to NeonDB Organization
      const cleanOrgId = targetOrgId.replace('org-', '');
      if (/^\d+$/.test(cleanOrgId)) {
        DjangoApi.updateOrganization(cleanOrgId, {
          ...(data.name ? { assigned_admin_name: data.name } : {}),
          ...(data.email ? { assigned_admin_email: data.email } : {}),
          ...(data.password ? { assigned_password: data.password } : {}),
        }).catch((err) => console.warn('Could not update organization credentials in NeonDB:', err));
      }
    }

    addNotification({
      title: 'Profile Updated',
      message: `Account settings updated for ${data.name || currentUser?.name || 'Administrator'}.`,
      type: 'SYSTEM',
      targetRole: currentUser?.role || 'ALL',
    });
  };

  // Helper to map backend organization record to frontend Organization
  const mapBackendOrg = (o: any): Organization => {
    const orgIdStr = `org-${o.id}`;
    const cleanId = String(o.id);
    const localPass = typeof window !== 'undefined'
      ? (localStorage.getItem(`ecoestate-org-pass-${cleanId}`) || localStorage.getItem(`ecoestate-org-pass-${orgIdStr}`))
      : null;

    return {
      id: orgIdStr,
      name: o.name,
      type: o.facility_type,
      categoryLabel: o.category_label || 'Institutional Campus',
      city: o.city,
      state: o.state,
      areaSqFt: o.area_sqft || 1000000,
      occupancyCurrent: o.occupancy_current || 5000,
      occupancyMax: o.occupancy_max || 10000,
      assignedAdminName: o.assigned_admin_name || 'Assigned Admin',
      assignedAdminEmail: o.assigned_admin_email,
      assignedPassword: localPass || o.assigned_password || 'estate@2026',
      iotGatewayIp: o.iot_gateway_ip || '192.168.1.1',
      iotStatus: o.iot_status || 'ONLINE',
      lastPing: 'Live sync 1s ago',
      sustainabilityScore: o.sustainability_score || 85,
      carbonTargetReductionPct: o.carbon_target_reduction_pct || 25,
      description: o.description || `${o.name} facility managed by EcoEstate IoT Grid.`,
      campusImageUrl: o.campus_image_url || '',
      campusNodesJson: o.campus_nodes_json || '',
    };
  };


  // Fetch real organizations, staff members & equipment directly from NeonDB PostgreSQL backend
  const refreshBackendData = async () => {
    try {
      const [backendOrgs, backendStaff, backendEquip] = await Promise.all([
        DjangoApi.getOrganizations(),
        DjangoApi.getStaffMembers(),
        DjangoApi.getEquipment(),
      ]);

      if (Array.isArray(backendEquip) && backendEquip.length > 0) {
        setEquipmentList(
          backendEquip.map((eq: any) => ({
            id: eq.equipment_code || `EQ-${eq.id}`,
            name: eq.name,
            category: eq.category,
            location: eq.location,
            status: eq.status || 'Operational',
            healthScore: eq.health_score || 95,
            powerRatingKw: eq.power_rating_kw || 50,
            runtimeHoursToday: eq.runtime_hours_today || 14,
            vibrationMmPerSec: eq.vibration_mm_per_sec || 1.2,
            operatingTempC: eq.operating_temp_c || 45,
            lastCalibrated: eq.last_calibrated || '2026-09-15',
            nextServiceDate: eq.next_service_date || '2026-12-15',
            dataSource: eq.data_source || 'IoT LAN/WiFi',
          }))
        );
      }

      if (Array.isArray(backendOrgs) && backendOrgs.length > 0) {
        const mappedOrgs = backendOrgs.map(mapBackendOrg);
        setOrganizations(mappedOrgs);
        setDataSource('backend');

        // Standard SuperAdmin user
        let superAdminName = 'Alex Carter';
        let superAdminEmail = 'superadmin@ecoestate.gov.in';
        let superAdminTitle = 'National Director & Chief Administrator';
        if (typeof window !== 'undefined') {
          try {
            const saCfg = JSON.parse(localStorage.getItem('ecoestate-superadmin-config') || '{}');
            if (saCfg.name) superAdminName = saCfg.name;
            if (saCfg.email) superAdminEmail = saCfg.email.toLowerCase();
            if (saCfg.title) superAdminTitle = saCfg.title;
          } catch (e) {}
        }

        const superAdminUser: User = {
          id: 'user-superadmin',
          name: superAdminName,
          email: superAdminEmail,
          role: 'SUPERADMIN',
          organizationId: 'all',
          organizationName: 'National Platform',
          title: superAdminTitle,
          status: 'Active',
          lastActive: 'Live now',
        };

        const staffMap = new Map<string, User>();
        staffMap.set(superAdminEmail.toLowerCase(), superAdminUser);
        staffMap.set('superadmin@ecoestate.gov.in', superAdminUser);

        // Add all assigned admins from organizations in NeonDB
        for (const org of mappedOrgs) {
          if (org.assignedAdminEmail) {
            const emailKey = org.assignedAdminEmail.toLowerCase();
            if (emailKey === superAdminEmail.toLowerCase() || emailKey === 'superadmin@ecoestate.gov.in') {
              continue;
            }
            staffMap.set(emailKey, {
              id: `user-org-${org.id.replace('org-', '')}`,
              name: org.assignedAdminName || 'Estate Administrator',
              email: org.assignedAdminEmail,
              role: 'ORG_ADMIN',
              organizationId: org.id,
              organizationName: org.name,
              title: `Estate Administrator - ${org.name}`,
              status: 'Active',
              lastActive: 'Connected to NeonDB',
            });
          }
        }

        // Add all staff members from NeonDB StaffMember table
        for (const s of (backendStaff || [])) {
          if (s.email) {
            const emailKey = s.email.toLowerCase();
            if (emailKey === superAdminEmail.toLowerCase() || emailKey === 'superadmin@ecoestate.gov.in') {
              continue;
            }
            const matchingOrg = mappedOrgs.find(
              (o) =>
                o.id === `org-${s.organization_id || s.organization}` ||
                o.id === String(s.organization)
            );
            staffMap.set(emailKey, {
              id: `user-${s.id}`,
              name: s.name,
              email: s.email,
              role: s.role as Role,
              organizationId: matchingOrg ? matchingOrg.id : `org-${s.organization_id || s.organization || 1}`,
              organizationName: matchingOrg ? matchingOrg.name : 'Estate',
              title: s.title || `${s.role} - Estate Management`,
              status: (s.status as 'Active' | 'Inactive') || 'Active',
              lastActive: s.last_active || 'Connected to NeonDB',
            });
          }
        }

        const allRealUsers = Array.from(staffMap.values());
        setUsers(allRealUsers);

        // If no activeOrgId yet, pick the first
        if (!activeOrgId && mappedOrgs.length > 0) {
          setActiveOrgId(mappedOrgs[0].id);
        }
      }
    } catch (err) {
      console.warn('Database fetch status:', err);
      setDataSource('backend');
    }
  };

  useEffect(() => {
    refreshBackendData();
  }, []);

  // Persist currentUser in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUser) {
        localStorage.setItem('ecoestate-current-user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ecoestate-current-user');
      }
    }
  }, [currentUser]);

  // Persist activeOrgId in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && activeOrgId) {
      localStorage.setItem('ecoestate-active-org-id', activeOrgId);
    }
  }, [activeOrgId]);

  // Sync activeOrgId with assigned user's organization to prevent cross-tenant leak
  useEffect(() => {
    if (currentUser && currentUser.role !== 'SUPERADMIN' && currentUser.organizationId) {
      const cleanTarget = currentUser.organizationId.replace('org-', '');
      const cleanCurrent = (activeOrgId || '').replace('org-', '');
      if (cleanCurrent !== cleanTarget) {
        setActiveOrgId(currentUser.organizationId);
      }
    }
  }, [currentUser, activeOrgId]);

  const cleanActive = (activeOrgId || '').replace('org-', '');
  const activeOrg =
    organizations.find(
      (o) =>
        o.id === activeOrgId ||
        o.id === `org-${cleanActive}` ||
        o.id.replace('org-', '') === cleanActive
    ) ||
    organizations[0] ||
    null;
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  // Strict, Database-Backed Authentication
  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; redirectUrl?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Password is required to access your estate workspace.' };
    }

    // 1. Authenticate with Django / NeonDB PostgreSQL backend
    try {
      const backendRes = await DjangoApi.login(cleanEmail, cleanPassword);
      if (backendRes.success && backendRes.user) {
        const authenticatedUser: User = {
          id: backendRes.user.id,
          name: backendRes.user.name,
          email: backendRes.user.email,
          role: backendRes.user.role as Role,
          organizationId: backendRes.user.organizationId,
          organizationName: backendRes.user.organizationName,
          title: backendRes.user.title,
          status: backendRes.user.status || 'Active',
          lastActive: 'Connected just now',
        };

        setCurrentUser(authenticatedUser);
        if (authenticatedUser.organizationId) {
          setActiveOrgId(authenticatedUser.organizationId);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('ecoestate-current-user', JSON.stringify(authenticatedUser));
          if (authenticatedUser.organizationId) {
            localStorage.setItem('ecoestate-active-org-id', authenticatedUser.organizationId);
          }
        }

        return {
          success: true,
          redirectUrl: backendRes.redirect_url || (authenticatedUser.role === 'SUPERADMIN' ? '/admin/dashboard' : `/user/${authenticatedUser.organizationId}`),
        };
      } else {
        return { success: false, error: backendRes.error || 'Access Denied: Invalid credentials.' };
      }
    } catch (apiErr) {
      return { success: false, error: 'Database Connection Error: Unable to verify credentials with backend.' };
    }
  };

  const sendCredentialsEmail = async (
    orgId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const org = organizations.find((o) => o.id === orgId || o.id === `org-${orgId}`);
    return await DjangoApi.sendCredentialsEmail(orgId, org ? {
      name: org.name,
      facility_type: org.type,
      assigned_admin_name: org.assignedAdminName,
      assigned_admin_email: org.assignedAdminEmail,
      assigned_password: org.assignedPassword,
      id: Number(org.id.replace('org-', '')),
    } as any : undefined);
  };


  const logout = () => {
    setCurrentUser(null);
  };

  const selectOrganization = (orgId: string) => {
    const cleanReq = orgId.replace('org-', '');
    // Regular users can NEVER switch away from their assigned institution
    if (currentUser && currentUser.role !== 'SUPERADMIN' && currentUser.organizationId) {
      const cleanUserOrg = currentUser.organizationId.replace('org-', '');
      if (cleanUserOrg !== cleanReq) {
        console.warn(`Access Denied: User is assigned to ${currentUser.organizationId} and cannot switch to ${orgId}`);
        return;
      }
    }
    const match = organizations.find(
      (o) => o.id === orgId || o.id === `org-${cleanReq}` || o.id.replace('org-', '') === cleanReq
    );
    if (match) {
      setActiveOrgId(match.id);
    } else {
      setActiveOrgId(orgId);
    }
  };

  const toggleIoTSimulation = () => {
    setIsSimulatingIoT((prev) => !prev);
  };

  const createOrganization = (
    orgData: Omit<Organization, 'id' | 'iotStatus' | 'lastPing' | 'sustainabilityScore'>
  ): Organization => {
    const newOrgId = `org-${Date.now()}`;
    const newOrg: Organization = {
      ...orgData,
      id: newOrgId,
      iotStatus: 'ONLINE',
      lastPing: 'Connected just now',
      sustainabilityScore: Math.floor(Math.random() * 12) + 82, // 82 - 94
    };

    setOrganizations((prev) => [newOrg, ...prev]);

    // Register assigned admin directly in users state so they immediately appear in User Directory
    if (newOrg.assignedAdminEmail) {
      const assignedUser: User = {
        id: `user-${newOrgId}`,
        name: newOrg.assignedAdminName || `Admin of ${newOrg.name}`,
        email: newOrg.assignedAdminEmail,
        role: 'ORG_ADMIN',
        organizationId: newOrgId,
        organizationName: newOrg.name,
        title: `Estate Administrator - ${newOrg.name}`,
        status: 'Active',
        lastActive: 'Provisioned just now',
      };
      setUsers((prev) => {
        const exists = prev.some((u) => u.email.toLowerCase() === newOrg.assignedAdminEmail.toLowerCase());
        return exists ? prev : [assignedUser, ...prev];
      });
    }

    // Trigger notification
    addNotification({
      title: 'Estate Provisioned & Admin Onboarded',
      message: `Onboarding credentials dispatched to ${newOrg.assignedAdminEmail} for ${newOrg.name}.`,
      type: 'EMAIL_SENT',
      targetRole: 'SUPERADMIN',
    });

    // Send to Django backend & NeonDB in background and re-sync
    DjangoApi.createOrganization({
      name: newOrg.name,
      facility_type: newOrg.type,
      category_label: newOrg.categoryLabel,
      city: newOrg.city,
      state: newOrg.state,
      area_sqft: newOrg.areaSqFt,
      occupancy_current: newOrg.occupancyCurrent,
      occupancy_max: newOrg.occupancyMax,
      assigned_admin_name: newOrg.assignedAdminName,
      assigned_admin_email: newOrg.assignedAdminEmail,
      assigned_password: newOrg.assignedPassword,
      iot_gateway_ip: newOrg.iotGatewayIp,
      iot_status: 'ONLINE',
      sustainability_score: newOrg.sustainabilityScore,
      carbon_target_reduction_pct: newOrg.carbonTargetReductionPct,
      description: newOrg.description,
    }).then((createdBackendOrg) => {
      refreshBackendData();
      if (createdBackendOrg?.id) {
        DjangoApi.sendCredentialsEmail(createdBackendOrg.id).catch(() => {});
      }
    });

    return newOrg;
  };

  const updateOrganization = (orgId: string, data: Partial<Organization>) => {
    const cleanReq = orgId.replace('org-', '');
    if (data.assignedPassword && typeof window !== 'undefined') {
      localStorage.setItem(`ecoestate-org-pass-${cleanReq}`, data.assignedPassword);
      localStorage.setItem(`ecoestate-org-pass-${orgId}`, data.assignedPassword);
      localStorage.setItem('ecoestate-user-password', data.assignedPassword);
    }
    setOrganizations((prev) =>
      prev.map((o) => {
        const cleanO = o.id.replace('org-', '');
        if (o.id === orgId || cleanO === cleanReq) {
          return { ...o, ...data };
        }
        return o;
      })
    );

    // If assigned admin details updated, sync corresponding user in users list
    if (data.assignedAdminEmail || data.assignedAdminName) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.organizationId === orgId && u.role === 'ORG_ADMIN') {
            return {
              ...u,
              name: data.assignedAdminName || u.name,
              email: data.assignedAdminEmail || u.email,
            };
          }
          return u;
        })
      );
    }

    // Persist to NeonDB via DjangoApi
    const cleanId = orgId.replace('org-', '');
    if (/^\d+$/.test(cleanId)) {
      DjangoApi.updateOrganization(cleanId, {
        name: data.name,
        facility_type: data.type,
        city: data.city,
        state: data.state,
        assigned_admin_name: data.assignedAdminName,
        assigned_admin_email: data.assignedAdminEmail,
        assigned_password: data.assignedPassword,
        iot_gateway_ip: data.iotGatewayIp,
        description: data.description,
      }).then((res) => {
        if (res) refreshBackendData();
      }).catch(() => {});
    }

    // If assigned admin changed, dispatch credentials email and add notification
    if (data.assignedAdminEmail) {
      DjangoApi.sendCredentialsEmail(cleanId).catch(() => {});
      addNotification({
        title: 'Estate Admin Updated & Credentials Sent',
        message: `Updated administrator email for estate. Credentials dispatched to ${data.assignedAdminEmail}.`,
        type: 'EMAIL_SENT',
        targetRole: 'SUPERADMIN',
      });
    }
  };

  const deleteOrganization = (id: string) => {
    setOrganizations((prev) => prev.filter((o) => o.id !== id));
    setUsers((prev) => prev.filter((u) => u.organizationId !== id));
    if (activeOrgId === id && organizations.length > 1) {
      const remaining = organizations.filter((o) => o.id !== id);
      setActiveOrgId(remaining[0].id);
    }
    const cleanId = id.replace('org-', '');
    if (/^\d+$/.test(cleanId)) {
      DjangoApi.deleteOrganization(cleanId);
    }
  };

  // Full User Management CRUD synced with NeonDB PostgreSQL
  const addUser = (userData: Omit<User, 'id'>): User => {
    const rawOrgId = userData.organizationId || activeOrg?.id || '1';
    const cleanOrgId = rawOrgId.replace('org-', '');
    const numericOrgId = /^\d+$/.test(cleanOrgId) ? parseInt(cleanOrgId, 10) : 1;

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      status: userData.status || 'Active',
      lastActive: 'Just registered',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [newUser, ...prev]);

    // Persist to NeonDB StaffMember table
    DjangoApi.createStaffMember({
      organization: numericOrgId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      title: userData.title || `${userData.role} - Staff`,
      status: userData.status || 'Active',
      password: (userData as any).password || 'estate@2026',
    }).then(() => refreshBackendData());

    return newUser;
  };

  const updateUserRole = (userId: string, newRole: Role) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
    const cleanId = userId.replace('user-', '');
    if (/^\d+$/.test(cleanId)) {
      DjangoApi.updateStaffMember(cleanId, { role: newRole });
    }
  };

  const updateUserStatus = (userId: string, newStatus: 'Active' | 'Inactive') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    const cleanId = userId.replace('user-', '');
    if (/^\d+$/.test(cleanId)) {
      DjangoApi.updateStaffMember(cleanId, { status: newStatus });
    }
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    const cleanId = userId.replace('user-', '');
    if (/^\d+$/.test(cleanId)) {
      DjangoApi.deleteStaffMember(cleanId);
    }
  };

  const addEquipment = (item: Omit<EquipmentItem, 'id'>) => {
    const rawOrgId = activeOrg?.id || '1';
    const cleanOrgId = rawOrgId.replace('org-', '');
    const numericOrgId = /^\d+$/.test(cleanOrgId) ? parseInt(cleanOrgId, 10) : 1;

    const newItem: EquipmentItem = {
      ...item,
      id: `EQ-MANUAL-${Math.floor(100 + Math.random() * 900)}`,
    };
    setEquipmentList((prev) => [newItem, ...prev]);

    // Persist to NeonDB
    DjangoApi.createEquipment({
      organization: numericOrgId,
      equipment_code: newItem.id,
      name: item.name,
      category: item.category,
      location: item.location,
      power_rating_kw: item.powerRatingKw || 50,
      operating_temp_c: item.operatingTempC || 40,
      vibration_mm_per_sec: item.vibrationMmPerSec || 1.0,
      health_score: item.healthScore || 95,
      status: item.status || 'Operational',
    }).catch((err) => console.warn('Could not persist equipment to NeonDB:', err));
  };

  const importEquipmentBatch = (items: Omit<EquipmentItem, 'id'>[]) => {
    const rawOrgId = activeOrg?.id || '1';
    const cleanOrgId = rawOrgId.replace('org-', '');
    const numericOrgId = /^\d+$/.test(cleanOrgId) ? parseInt(cleanOrgId, 10) : 1;

    const newItems: EquipmentItem[] = items.map((it, idx) => ({
      ...it,
      id: `EQ-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
    }));
    setEquipmentList((prev) => [...newItems, ...prev]);

    // Persist batch to NeonDB
    DjangoApi.batchImportEquipment(numericOrgId, newItems).catch((err) =>
      console.warn('Could not persist batch equipment to NeonDB:', err)
    );
  };

  const deleteEquipment = (id: string) => {
    setEquipmentList((prev) => prev.filter((e) => e.id !== id));
    DjangoApi.deleteEquipment(id).catch((err) =>
      console.warn('Could not delete equipment from NeonDB:', err)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthReady,
        activeOrg,
        organizations,
        users,
        isSuperAdmin,
        isSimulatingIoT,
        dataSource,
        toggleIoTSimulation,
        login,
        logout,
        selectOrganization,
        createOrganization,
        updateOrganization,
        sendCredentialsEmail,
        deleteOrganization,
        addUser,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        updateProfile,
        equipmentList,
        addEquipment,
        importEquipmentBatch,
        deleteEquipment,
        notifications,
        unreadNotificationCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
