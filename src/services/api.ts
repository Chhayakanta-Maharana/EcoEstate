const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

export interface BackendOrg {
  id: number;
  name: string;
  facility_type: 'HOSPITAL' | 'COLLEGE' | 'PSU' | 'INDUSTRY' | 'MUNICIPAL';
  category_label: string;
  city: string;
  state: string;
  area_sqft: number;
  occupancy_current: number;
  occupancy_max: number;
  assigned_admin_name: string;
  assigned_admin_email: string;
  assigned_password?: string;
  iot_gateway_ip: string;
  iot_status: string;
  sustainability_score: number;
  carbon_target_reduction_pct: number;
  description: string;
}

export const DjangoApi = {
  // Fetch all organizations from NeonDB
  async getOrganizations(): Promise<BackendOrg[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/organizations/`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch from Django');
      return await res.json();
    } catch (err) {
      console.warn('Django API not reachable, using local client state', err);
      return [];
    }
  },

  // Create organization in NeonDB
  async createOrganization(data: Partial<BackendOrg>): Promise<BackendOrg | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/organizations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create in Django');
      return await res.json();
    } catch (err) {
      console.error('Error creating in Django NeonDB:', err);
      return null;
    }
  },

  // Predict Energy Load via Python AI Engine
  async predictEnergy(baseLoadKw: number, tempC: number, occupancy: number, maxOcc: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/predict/energy-load/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_load_kw: baseLoadKw,
          temperature_c: tempC,
          occupancy,
          max_occupancy: maxOcc,
        }),
      });
      return await res.json();
    } catch (err) {
      console.warn('Fallback ML forecast', err);
      return null;
    }
  },

  // What-If Climate & Operational Resilience Simulation
  async simulateWhatIf(
    facilityType: string,
    solarDrop: number,
    occSurge: number,
    heatwaveC: number,
    waterCut: number,
    hvacHours: number = 0,
    wasteTuesday: boolean = false
  ) {
    try {
      const res = await fetch(`${API_BASE_URL}/predict/scenario-simulate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facility_type: facilityType,
          solar_drop_pct: solarDrop,
          occupancy_surge_pct: occSurge,
          heatwave_c: heatwaveC,
          water_cut_pct: waterCut,
          hvac_hours_reduced: hvacHours,
          waste_tuesday_shift: wasteTuesday,
        }),
      });
      return await res.json();
    } catch (err) {
      console.warn('Fallback scenario engine', err);
      return null;
    }
  },

  // Batch CSV Import into NeonDB
  async batchImportEquipment(orgId: number | string, items: any[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/equipment/batch-import/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          items,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error('Batch import error', err);
      return null;
    }
  },

  // Dual-Channel IoT Gateway (LAN & WiFi)
  async getIoTStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/iot/status/`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch IoT status');
      return await res.json();
    } catch (err) {
      // Fallback local status
      return {
        lan_channel: {
          status: 'ONLINE',
          channel_name: 'Ethernet RJ45 / Industrial Modbus-TCP',
          interface: 'eth0 / Physical 1000BASE-T',
          gateway_ip: '192.168.1.50',
          protocols: ['Modbus-TCP (Port 502)', 'HTTP/REST (Port 8000)'],
          active_wired_nodes: 12,
          packet_rate_per_min: 1420,
          latency_ms: 1.8,
        },
        wifi_channel: {
          status: 'ONLINE',
          channel_name: 'Wireless Mesh 802.11 b/g/n (ESP32 Grid)',
          interface: 'wlan0 / 2.4 GHz Access Point',
          ssid: 'EcoEstate_IoT_Grid',
          active_wireless_nodes: 28,
          avg_rssi_dbm: -56,
          protocols: ['HTTP POST (Port 8000)', 'MQTT'],
          packet_rate_per_min: 3450,
        },
        system_summary: {
          dual_mode_active: true,
          total_nodes_online: 40,
        }
      };
    }
  },

  async getIoTPackets(limit = 25, source?: string) {
    try {
      const url = new URL(`${API_BASE_URL}/iot/packets/`);
      url.searchParams.set('limit', String(limit));
      if (source) url.searchParams.set('source', source);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch packets');
      return await res.json();
    } catch (err) {
      return { count: 0, packets: [] };
    }
  },

  async ingestIoTPacket(packetData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/iot/ingest/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packetData),
      });
      return await res.json();
    } catch (err) {
      console.error('IoT Ingest error', err);
      return null;
    }
  },

  async simulateIoTPacket(
    source: 'LAN' | 'WIFI',
    sensor_type: string,
    protocol?: string,
    is_anomaly?: boolean
  ) {
    try {
      const res = await fetch(`${API_BASE_URL}/iot/simulate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, sensor_type, protocol, is_anomaly }),
      });
      return await res.json();
    } catch (err) {
      console.error('IoT Simulation error', err);
      return null;
    }
  },

  // Real-Time NeonDB SuperAdmin Analytics & Tenant Directory
  async getRealtimeAdminAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/realtime/`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch realtime analytics');
      return await res.json();
    } catch (err) {
      console.warn('Realtime analytics fallback to local state', err);
      return null;
    }
  },

  // Strict Database-Backed Login
  async login(email: string, password: string): Promise<{ success: boolean; user?: any; redirect_url?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }
      return data;
    } catch (err: any) {
      console.error('Login network error', err);
      return { success: false, error: 'Cannot connect to authentication server. Please ensure backend is running.' };
    }
  },

  // Update organization in NeonDB
  async updateOrganization(orgId: string | number, data: Partial<BackendOrg>): Promise<BackendOrg | null> {
    try {
      const cleanId = String(orgId).replace('org-', '');
      const res = await fetch(`${API_BASE_URL}/organizations/${cleanId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update organization in Django');
      return await res.json();
    } catch (err) {
      console.error('Error updating organization in Django NeonDB:', err);
      return null;
    }
  },

  // Trigger sending credentials email to assigned admin
  async sendCredentialsEmail(orgId: string | number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const cleanId = String(orgId).replace('org-', '');
      const res = await fetch(`${API_BASE_URL}/organizations/${cleanId}/send-credentials/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send credentials email' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Telemetry APIs (NeonDB PostgreSQL)
  async getAqiTelemetry(orgId?: string): Promise<any> {
    try {
      const url = new URL(`${API_BASE_URL}/aqi/`);
      if (orgId) url.searchParams.set('org_id', orgId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch AQI');
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      console.warn('AQI fetch error', err);
      return null;
    }
  },

  async getWaterTelemetry(orgId?: string): Promise<any> {
    try {
      const url = new URL(`${API_BASE_URL}/water/`);
      if (orgId) url.searchParams.set('org_id', orgId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch Water telemetry');
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      console.warn('Water fetch error', err);
      return null;
    }
  },

  async getEnergyTelemetry(orgId?: string): Promise<any> {
    try {
      const url = new URL(`${API_BASE_URL}/energy/`);
      if (orgId) url.searchParams.set('org_id', orgId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch Energy telemetry');
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      console.warn('Energy fetch error', err);
      return null;
    }
  },

  async getParkingTelemetry(orgId?: string): Promise<any> {
    try {
      const url = new URL(`${API_BASE_URL}/parking/`);
      if (orgId) url.searchParams.set('org_id', orgId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch Parking telemetry');
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      console.warn('Parking fetch error', err);
      return null;
    }
  },

  async getDustbins(orgId?: string): Promise<any[]> {
    try {
      const url = new URL(`${API_BASE_URL}/dustbins/`);
      if (orgId) url.searchParams.set('org_id', orgId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch Dustbins');
      return await res.json();
    } catch (err) {
      console.warn('Dustbins fetch error', err);
      return [];
    }
  },

  async getEquipment(orgId?: string): Promise<any[]> {
    try {
      const url = new URL(`${API_BASE_URL}/equipment/`);
      if (orgId) url.searchParams.set('org_id', orgId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch Equipment');
      return await res.json();
    } catch (err) {
      console.warn('Equipment fetch error', err);
      return [];
    }
  },

  async getRecommendations(orgId?: string): Promise<any[]> {
    try {
      const url = new URL(`${API_BASE_URL}/recommendations/`);
      if (orgId) url.searchParams.set('org_id', orgId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch Recommendations');
      return await res.json();
    } catch (err) {
      console.warn('Recommendations fetch error', err);
      return [];
    }
  },

  // Staff Members Management (NeonDB PostgreSQL)
  async getStaffMembers(orgId?: string): Promise<any[]> {
    try {
      const url = new URL(`${API_BASE_URL}/staff/`);
      if (orgId) url.searchParams.set('org_id', orgId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch staff');
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch staff from backend', err);
      return [];
    }
  },

  async createStaffMember(staffData: any): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/staff/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      if (!res.ok) throw new Error('Failed to create staff');
      return await res.json();
    } catch (err) {
      console.error('Failed to create staff', err);
      return null;
    }
  },

  async updateStaffMember(id: string | number, data: any): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update staff');
      return await res.json();
    } catch (err) {
      console.error('Failed to update staff', err);
      return null;
    }
  },

  async deleteStaffMember(id: string | number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${id}/`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to delete staff', err);
      return false;
    }
  },

  // Explainable AI (XAI) SHAP Root-Cause Diagnostic APIs
  async getShapSensorAnomalies(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/sensor-anomalies/`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch SHAP anomalies');
      return await res.json();
    } catch (err) {
      console.warn('Fallback to client-side SHAP evaluation', err);
      return null;
    }
  },

  async explainSensorWithShap(
    category: string,
    telemetry: Record<string, number>,
    sensor_id?: string,
    sensor_name?: string
  ): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/shap-explain/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, telemetry, sensor_id, sensor_name }),
      });
      if (!res.ok) throw new Error('Failed to compute SHAP explanation');
      return await res.json();
    } catch (err) {
      console.error('SHAP API error', err);
      return null;
    }
  },

  // Role Assignment & Credentials Email Dispatch API
  async assignUserRoleAndNotify(data: {
    user_name: string;
    user_email: string;
    role: string;
    role_label: string;
    organization_id?: string;
    organization_name?: string;
    password?: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/assign-role/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.error('Role assignment email dispatch error', err);
      return { success: false, error: String(err) };
    }
  },

  // Password Recovery Endpoints
  async requestPasswordReset(email: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await res.json();
    } catch (err) {
      console.error('Forgot password API error', err);
      return { error: 'Network error communicating with authentication server.' };
    }
  },

  async confirmPasswordReset(email: string, token: string, new_password: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, new_password }),
      });
      return await res.json();
    } catch (err) {
      console.error('Reset password API error', err);
      return { error: 'Network error communicating with authentication server.' };
    }
  },
};


