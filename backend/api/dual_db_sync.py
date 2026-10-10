"""
EcoEstate India • Dual-Database Synchronization Engine (SQLite Local + NeonDB Cloud)
=====================================================================================
Synchronizes records bi-directionally between:
  1. 'default': High-performance local SQLite (zero-latency, < 1ms response)
  2. 'neondb': National Cloud Hub on NeonDB PostgreSQL (AWS Ohio)

Ensures that:
  - Local queries are instantaneous with zero lag.
  - Remote cloud always receives updates in non-blocking background threads.
  - Accounts created in NeonDB or SQLite can seamlessly authenticate on either.
"""

import threading
import logging
from django.db import connections

logger = logging.getLogger(__name__)


def is_neondb_configured():
    return 'neondb' in connections.databases


def async_replicate_organization_to_neondb(org_data):
    """
    Replicates created/updated organization from SQLite to NeonDB asynchronously.
    """
    def _worker():
        if not is_neondb_configured():
            return
        try:
            from .models import Organization
            # Match by assigned_admin_email or name in NeonDB
            email = org_data.get('assigned_admin_email', '').strip().lower()
            name = org_data.get('name', '').strip()

            existing = None
            if email:
                existing = Organization.objects.using('neondb').filter(assigned_admin_email__iexact=email).first()
            if not existing and name:
                existing = Organization.objects.using('neondb').filter(name__iexact=name).first()

            if existing:
                for k, v in org_data.items():
                    if k != 'id' and hasattr(existing, k) and v is not None:
                        setattr(existing, k, v)
                existing.save(using='neondb')
                logger.info(f"[DUAL_DB] Updated organization '{name}' in NeonDB.")
            else:
                create_kwargs = {k: v for k, v in org_data.items() if k != 'id'}
                Organization.objects.using('neondb').create(**create_kwargs)
                logger.info(f"[DUAL_DB] Created new organization '{name}' in NeonDB.")
        except Exception as e:
            logger.warning(f"[DUAL_DB] Failed to replicate organization to NeonDB: {e}")

    threading.Thread(target=_worker, daemon=True).start()


def async_replicate_staff_to_neondb(staff_data):
    """
    Replicates created/updated StaffMember from SQLite to NeonDB asynchronously.
    """
    def _worker():
        if not is_neondb_configured():
            return
        try:
            from .models import StaffMember, Organization
            email = staff_data.get('email', '').strip().lower()
            if not email:
                return

            # Resolve target organization in NeonDB if possible
            target_org = None
            org_id = staff_data.get('organization_id')
            if org_id:
                target_org = Organization.objects.using('neondb').filter(id=org_id).first()
            if not target_org and staff_data.get('organization_name'):
                target_org = Organization.objects.using('neondb').filter(name__icontains=staff_data['organization_name']).first()
            if not target_org:
                target_org = Organization.objects.using('neondb').first()

            existing = StaffMember.objects.using('neondb').filter(email__iexact=email).first()
            if existing:
                existing.name = staff_data.get('name', existing.name)
                existing.role = staff_data.get('role', existing.role)
                if staff_data.get('password'):
                    existing.password = staff_data['password']
                if target_org:
                    existing.organization = target_org
                existing.save(using='neondb')
                logger.info(f"[DUAL_DB] Updated staff '{email}' in NeonDB.")
            else:
                StaffMember.objects.using('neondb').create(
                    name=staff_data.get('name', 'Staff Member'),
                    email=email,
                    role=staff_data.get('role', 'ORG_ADMIN'),
                    password=staff_data.get('password', 'estate@2026'),
                    title=staff_data.get('title', 'Estate Staff'),
                    organization=target_org,
                    status=staff_data.get('status', 'Active')
                )
                logger.info(f"[DUAL_DB] Replicated staff '{email}' to NeonDB.")
        except Exception as e:
            logger.warning(f"[DUAL_DB] Failed to replicate staff to NeonDB: {e}")

    threading.Thread(target=_worker, daemon=True).start()


def sync_cloud_accounts_to_local_sqlite():
    """
    Bi-directional synchronizer run on startup / background to pull any cloud
    NeonDB organizations and staff members into local SQLite so login works
    instantly on both.
    """
    if not is_neondb_configured():
        return
    try:
        from .models import Organization, StaffMember

        # 1. Pull Organizations from NeonDB into SQLite
        cloud_orgs = Organization.objects.using('neondb').all()
        for co in cloud_orgs:
            local_match = None
            if co.assigned_admin_email:
                local_match = Organization.objects.filter(assigned_admin_email__iexact=co.assigned_admin_email).first()
            if not local_match:
                local_match = Organization.objects.filter(name__iexact=co.name).first()

            if not local_match:
                Organization.objects.create(
                    name=co.name,
                    facility_type=co.facility_type,
                    category_label=co.category_label,
                    city=co.city,
                    state=co.state,
                    area_sqft=co.area_sqft,
                    occupancy_current=co.occupancy_current,
                    occupancy_max=co.occupancy_max,
                    assigned_admin_name=co.assigned_admin_name,
                    assigned_admin_email=co.assigned_admin_email,
                    assigned_password=co.assigned_password or 'estate@2026',
                    iot_gateway_ip=co.iot_gateway_ip,
                    sustainability_score=co.sustainability_score,
                    carbon_target_reduction_pct=co.carbon_target_reduction_pct,
                    description=co.description
                )

        # 2. Pull StaffMembers from NeonDB into SQLite
        cloud_staff = StaffMember.objects.using('neondb').all()
        for cs in cloud_staff:
            if not cs.email:
                continue
            local_staff = StaffMember.objects.filter(email__iexact=cs.email).first()
            if not local_staff:
                # Match local organization
                local_org = None
                if cs.organization:
                    local_org = Organization.objects.filter(name__icontains=cs.organization.name).first()
                if not local_org:
                    local_org = Organization.objects.first()

                StaffMember.objects.create(
                    name=cs.name,
                    email=cs.email.strip().lower(),
                    role=cs.role,
                    title=cs.title or f"{cs.role} - Staff",
                    password=cs.password or 'estate@2026',
                    organization=local_org,
                    status=cs.status or 'Active'
                )

        print("[DUAL_DB] Successfully bi-directionally synchronized SQLite and NeonDB.")
    except Exception as e:
        print(f"[DUAL_DB_SYNC_NOTICE] Cloud sync notice: {e}")
