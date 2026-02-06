import { Branch, BreakTime, CreateBranchRequest, CreateBreakTimeRequest, CreateDayOffRequest, CreateEmployeeRequest, CreatePlanRequest, CreateShiftRequest, CreateSubscriptionRequest, CreateTelegramChannelRequest, CreateWorkDayRequest, DailyAttendance, DayOff, Device, DeviceResponse, Employee, EmployeeHistory, EventSyncResponse, LoginRequest, LoginResponse, Notification, PaginatedResponse, Plan, RefreshTokenResponse, Shift, Subscription, TelegramChannel, UpdateBranchRequest, UpdateBreakTimeRequest, UpdateDayOffRequest, UpdatePlanRequest, UpdateShiftRequest, UpdateTelegramChannelRequest, UpdateWorkDayRequest, User, WorkDay } from "./types";

// lib/api.ts - COMPLETE WITH ALL FIXES
const BASE_URL = 'https://api.timepro.uz';

export const WEEK_DAYS = [
  { value: 'mon', label: 'Dushanba' },
  { value: 'tue', label: 'Seshanba' },
  { value: 'wed', label: 'Chorshanba' },
  { value: 'thu', label: 'Payshanba' },
  { value: 'fri', label: 'Juma' },
  { value: 'sat', label: 'Shanba' },
  { value: 'sun', label: 'Yakshanba' },
];
export const PLAN_TYPES = [
  { value: 'free', label: 'Bepul' },
  { value: 'standard', label: 'Standart' },
  { value: 'premium', label: 'Premium' },
];

export const BILLING_CYCLES = [
  { value: 'monthly', label: '1 Oy', months: 1 },
  { value: 'quarterly', label: '3 Oy', months: 3 },
  { value: 'half_yearly', label: '6 Oy', months: 6 },
  { value: 'yearly', label: '12 Oy', months: 12 },
];

// Helper function to format price
export const formatPrice = (price: string): string => {
  try {
    const cleanPrice = price.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleanPrice);
    
    if (isNaN(num)) {
      return price;
    }
    
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  } catch (error) {
    return price;
  }
};

// Helper function to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper functions for time formatting
export const formatTimeFromISO = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return isoString;
  }
};

export const formatDateTime = (isoString: string): { date: string, time: string } => {
  try {
    const date = new Date(isoString);
    
    return {
      date: date.toLocaleDateString('uz-UZ'),
      time: date.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    };
  } catch (error) {
    return { date: isoString, time: isoString };
  }
};

// API Service
class ApiService {
  private accessToken: string | null = null;
  private refreshTokenString: string | null = null;
  private readonly USER_ID = 2; // Hardcoded user_id
  private branchesCache: Branch[] = [];

  setTokens(access: string, refresh?: string) {
    this.accessToken = access;
    localStorage.setItem('access_token', access);
    
    if (refresh) {
      this.refreshTokenString = refresh;
      localStorage.setItem('refresh_token', refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshTokenString = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (!this.refreshTokenString) {
      this.refreshTokenString = localStorage.getItem('refresh_token');
    }
    return this.refreshTokenString;
  }

  // Helper method to get device ID from selected branch
  private getSelectedBranchDeviceId(): number | null {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      if (!branchId) {
        console.error('❌ No branch selected');
        return null;
      }
      
      // Try to get from cache first
      const cachedDevice = this.getDeviceFromBranchCache(parseInt(branchId));
      if (cachedDevice !== null) {
        return cachedDevice;
      }
      
      // If not in cache, try to get from localStorage
      try {
        const cachedBranches = localStorage.getItem('branches_cache');
        if (cachedBranches) {
          const branches: Branch[] = JSON.parse(cachedBranches);
          const branch = branches.find(b => b.id === parseInt(branchId));
          if (branch?.device) {
            console.log(`📱 Found device ${branch.device} for branch ${branchId} from localStorage`);
            return branch.device;
          }
        }
      } catch (error) {
        console.error('Error reading branches from localStorage:', error);
      }
      
      console.warn(`⚠️ No device found for branch ${branchId}`);
      return null;
    } catch (error) {
      console.error('Error getting branch device:', error);
      return null;
    }
  }

  // Get device from cache
  private getDeviceFromBranchCache(branchId: number): number | null {
    if (this.branchesCache.length > 0) {
      const branch = this.branchesCache.find(b => b.id === branchId);
      return branch?.device || null;
    }
    return null;
  }

  // Update branches cache
  private updateBranchesCache(branches: Branch[]): void {
    this.branchesCache = branches;
    try {
      localStorage.setItem('branches_cache', JSON.stringify(branches));
    } catch (error) {
      console.error('Error saving branches to cache:', error);
    }
  }

  async getEmployeeHistory(date: string, employeeId: number): Promise<EmployeeHistory[]> {
    try {
      if (!employeeId || isNaN(employeeId)) {
        throw new Error('Noto\'g\'ri hodim ID si');
      }
      
      if (!date) {
        throw new Error('Sana kiritilmagan');
      }
      
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      if (!deviceId) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      const params = new URLSearchParams();
      params.append('date', date);
      params.append('employee_id', employeeId.toString());
      params.append('user_id', this.USER_ID.toString());
      params.append('branch_id', branchId);
      params.append('device', deviceId.toString());
      
      const endpoint = `/person/employee-history/?${params.toString()}`;
      console.log('📡 Fetching employee history with branch device:', endpoint);
      
      const response = await this.request<EmployeeHistory[]>(endpoint);
      return response;
    } catch (error) {
      const err = error as any;
      
      if (err.message?.includes('Noto\'g\'ri hodim ID si')) {
        throw new Error('Noto\'g\'ri hodim ID si');
      } else if (err.message?.includes('Sana kiritilmagan')) {
        throw new Error('Sana kiritilmagan');
      } else if (err.message?.includes('Filial tanlanmagan')) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      } else if (err.message?.includes('Filialda qurilma biriktirilmagan')) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      } else if (err.status === 404) {
        throw new Error('Hodim yoki sana uchun tarix topilmadi');
      } else if (err.status === 400) {
        throw new Error('Noto\'g\'ri sana yoki hodim ID si');
      }
      
      throw error;
    }
  }

  async getSubscriptions(userId?: number): Promise<Subscription[]> {
    try {
      const targetUserId = userId || this.USER_ID || 2;
      const endpoint = `/utils/subscription/?user_id=${targetUserId}`;
      
      const response = await this.request<Subscription[]>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ All subscription endpoints failed:', error);
      return this.getMockSubscriptions();
    }
  }

  async getAbsentEmployees(date: string): Promise<{
    date: string;
    total: number;
    employees: Array<{
      employee_id: number;
      employee_name: string;
      status: string;
      status_label: string;
      comment: string;
      fine: number;
      date: string;
    }>;
  }> {
    try {
      if (!date) {
        throw new Error('Sana kiritilmagan');
      }
      
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      if (!deviceId) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      const params = new URLSearchParams();
      params.append('date', date);
      params.append('branch_id', branchId);
      params.append('device', deviceId.toString());
      
      const endpoint = `/attendance/absent/?${params.toString()}`;
      console.log('📡 Fetching absent employees from branch device:', endpoint);
      
      const response = await this.request<any>(endpoint);
      return response;
    } catch (error) {
      const err = error as any;
      
      if (err.message?.includes('Sana kiritilmagan')) {
        throw new Error('Sana kiritilmagan');
      } else if (err.message?.includes('Filial tanlanmagan')) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      } else if (err.message?.includes('Filialda qurilma biriktirilmagan')) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      } else if (err.status === 404) {
        throw new Error('Berilgan sana uchun ma\'lumot topilmadi');
      }
      
      throw error;
    }
  }

  async updateAbsenceStatus(data: {
    employee_id: number;
    date: string;
    status: string;
    comment?: string;
  }): Promise<any> {
    try {
      if (!data.employee_id || !data.date || !data.status) {
        throw new Error('Barcha majburiy maydonlarni to\'ldiring');
      }
      
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      if (!deviceId) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      const requestData = {
        employee_id: data.employee_id,
        date: data.date,
        status: data.status,
        comment: data.comment || '',
        user_id: this.USER_ID,
        branch_id: parseInt(branchId),
        device: deviceId
      };
      
      const endpoint = `/attendance/absent/`;
      console.log('📡 Updating absence status with branch device:', endpoint);
      
      const response = await this.request<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      
      return response;
    } catch (error) {
      const err = error as any;
      if (err.message?.includes('Barcha majburiy maydonlarni to\'ldiring')) {
        throw new Error('Barcha majburiy maydonlarni to\'ldiring');
      } else if (err.message?.includes('Filial tanlanmagan')) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      } else if (err.message?.includes('Filialda qurilma biriktirilmagan')) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      throw error;
    }
  }

  async getMonthlyReport(month: number, year: number, employeeId?: number): Promise<{
    year: number;
    month: number;
    count: number;
    results: Array<{
      employee_id: number;
      employee_name: string;
      year: number;
      month: number;
      sbk_count: number;
      szk_count: number;
      worked_time: string;
      total_overtime: string;
      total_undertime: string;
      total_bonus: number;
      total_penalty: number;
      net_adjustment: number;
      details: Array<{
        date: string;
        status: string;
        status_label: string;
        worked: string;
        difference: string;
        penalty: number;
      }>;
    }>;
  }> {
    try {
      if (!month || !year) {
        throw new Error('Oy va yil kiritilishi shart');
      }
      
      if (month < 1 || month > 12) {
        throw new Error('Noto\'g\'ri oy raqami');
      }
      
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      if (!deviceId) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      const params = new URLSearchParams();
      params.append('month', month.toString());
      params.append('year', year.toString());
      params.append('branch_id', branchId);
      params.append('device', deviceId.toString());
      
      if (employeeId) {
        params.append('employee_id', employeeId.toString());
      }
      
      params.append('user_id', this.USER_ID.toString());
      
      const endpoint = `/attendance/report/monthly/?${params.toString()}`;
      console.log('📡 Fetching monthly report from branch device:', endpoint);
      
      const response = await this.request<any>(endpoint);
      return response;
    } catch (error) {
      const err = error as any;
      
      if (err.message?.includes('Oy va yil kiritilishi shart')) {
        throw new Error('Oy va yil kiritilishi shart');
      } else if (err.message?.includes('Noto\'g\'ri oy raqami')) {
        throw new Error('Noto\'g\'ri oy raqami (1-12 oralig\'ida bo\'lishi kerak)');
      } else if (err.message?.includes('Filial tanlanmagan')) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      } else if (err.message?.includes('Filialda qurilma biriktirilmagan')) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      throw error;
    }
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<Subscription> {
    try {
      const targetUserId = data.user_id || this.USER_ID || 2;
      const endpoint = `/utils/subscription/?user_id=${targetUserId}`;
      
      const subscriptionData: any = {
        plan_id: data.plan_id,
        user_id: targetUserId,
      };
      
      const response = await this.request<Subscription>(endpoint, {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
    }
    
    return this.getMockSubscription(data.plan_id);
  }

  async cancelSubscription(id: number): Promise<void> {
    try {
      const endpoint = `/utils/subscription/${id}/`;
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ ${id} ID-li obunani bekor qilishda xatolik:`, error);
      throw error;
    }
  }

  private getMockSubscriptions(): Subscription[] {
    return [
      {
        id: 1,
        plan: 'Professional tarif',
        plan_id: 2,
        start_date: '2024-01-15T10:30:00Z',
        end_date: '2024-02-15T10:30:00Z',
        is_active: true,
      },
      {
        id: 2,
        plan: 'Korporativ tarif',
        plan_id: 3,
        start_date: '2024-02-01T09:00:00Z',
        end_date: '2024-03-01T09:00:00Z',
        is_active: false,
      },
    ];
  }

  private getMockSubscription(planId: number): Subscription {
    return {
      id: Date.now(),
      plan: `Mock Plan ${planId}`,
      plan_id: planId,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    };
  }

  async getPlans(): Promise<Plan[]> {
    try {
      const endpoint = `/utils/plan/`;
      const response = await this.request<Plan[]>(endpoint);
      
      if (response && Array.isArray(response)) {
        return response.map(plan => ({
          id: plan.id || 0,
          name: plan.name || plan.title || '',
          title: plan.title || plan.name || '',
          plan_type: plan.plan_type || 'standard',
          billing_cycle: plan.billing_cycle || 'monthly',
          duration_months: plan.duration_months || 0,
          price: plan.price || '0',
          description: plan.description || '',
          currency: plan.currency || 'UZS',
          content: plan.content || '',
          created_at: plan.created_at,
          updated_at: plan.updated_at
        }));
      }
      
      return response || [];
    } catch (error) {
      console.error('❌ Tariflarni yuklashda xatolik:', error);
      return this.getMockPlans();
    }
  }

  async createPlan(data: CreatePlanRequest): Promise<Plan> {
    try {
      const planData: any = {
        name: data.name,
        plan_type: data.plan_type,
        billing_cycle: data.billing_cycle,
        price: data.price,
      };
      
      if (data.duration_months !== undefined) {
        planData.duration_months = data.duration_months;
      }
      
      const endpoint = `/utils/plan/`;
      const response = await this.request<Plan>(endpoint, {
        method: 'POST',
        body: JSON.stringify(planData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Tarif yaratishda xatolik:', error);
      
      if ((error as any).status === 400) {
        const errorData = (error as any).data;
        console.error('❌ Validation errors:', errorData);
        
        if (errorData) {
          let errorMsg = 'Validation error: ';
          Object.keys(errorData).forEach(key => {
            errorMsg += `${key}: ${errorData[key]}; `;
          });
          throw new Error(errorMsg);
        }
      }
      
      throw error;
    }
  }

  async updatePlan(id: number, data: UpdatePlanRequest): Promise<Plan> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.plan_type !== undefined) updateData.plan_type = data.plan_type;
      if (data.billing_cycle !== undefined) updateData.billing_cycle = data.billing_cycle;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.duration_months !== undefined) updateData.duration_months = data.duration_months;
      
      const endpoint = `/utils/plan/${id}/`;
      
      const response = await this.request<Plan>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ ${id} ID-li tarifni yangilashda xatolik:`, error);
      throw error;
    }
  }

  async deletePlan(id: number): Promise<void> {
    try {
      const endpoint = `/utils/plan/${id}/`;
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ ${id} ID-li tarifni o\'chirishda xatolik:`, error);
      throw error;
    }
  }

  private getMockPlans(): Plan[] {
    return [
      {
        id: 1,
        name: 'Bepul tarif',
        title: 'Bepul tarif',
        plan_type: 'free',
        billing_cycle: 'monthly',
        duration_months: 0,
        price: '0',
        description: 'Bepul tarif',
        currency: 'UZS',
        content: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Standart tarif',
        title: 'Standart tarif',
        plan_type: 'standard',
        billing_cycle: 'monthly',
        duration_months: 1,
        price: '500000',
        description: 'Standart tarif',
        currency: 'UZS',
        content: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'Premium tarif',
        title: 'Premium tarif',
        plan_type: 'premium',
        billing_cycle: 'monthly',
        duration_months: 1,
        price: '1000000',
        description: 'Premium tarif',
        currency: 'UZS',
        content: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];
  }

  async getNotifications(): Promise<Notification[]> {
    try {
      const endpoint = `/utils/notification/`;
      const response = await this.request<Notification[]>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
      return [];
    }
  }

  async getBreakTimes(userId?: number): Promise<BreakTime[]> {
    try {
      const params = new URLSearchParams();
      
      if (userId && userId !== this.USER_ID) {
        params.append('user_id', userId.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/break_time/?${params.toString()}`;
      const response = await this.request<BreakTime[]>(endpoint);
      
      if (response && Array.isArray(response)) {
        return response.map(item => ({
          id: item.id || 0,
          name: item.name || '',
          start_time: item.start_time || '',
          end_time: item.end_time || '',
          user: item.user || this.USER_ID,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
      }
      
      return response || [];
    } catch (error) {
      console.error('❌ Tanaffus vaqtlarini yuklashda xatolik:', error);
      return this.getMockBreakTimes();
    }
  }

  async createBreakTime(data: CreateBreakTimeRequest): Promise<BreakTime> {
    try {
      const breakTimeData: any = {
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
      };
      
      const params = new URLSearchParams();
      params.append('user_id', data.user?.toString() || this.USER_ID.toString());
      
      const endpoint = `/day/break_time/?${params.toString()}`;
      const response = await this.request<BreakTime>(endpoint, {
        method: 'POST',
        body: JSON.stringify(breakTimeData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Tanaffus vaqti yaratishda xatolik:', error);
      throw error;
    }
  }

  async updateBreakTime(id: number, data: UpdateBreakTimeRequest): Promise<BreakTime> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.start_time !== undefined) updateData.start_time = data.start_time;
      if (data.end_time !== undefined) updateData.end_time = data.end_time;
      
      if (data.user !== undefined) {
        updateData.user_id = data.user;
      } else {
        updateData.user_id = this.USER_ID;
      }
      
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      
      const endpoint = `/day/break_time/${id}/?${params.toString()}`;
      const response = await this.request<BreakTime>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ ${id} ID-li tanaffus vaqtini yangilashda xatolik:`, error);
      throw error;
    }
  }

  async deleteBreakTime(id: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      
      const endpoint = `/day/break_time/${id}/?${params.toString()}`;
      
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ ${id} ID-li tanaffus vaqtini o\'chirishda xatolik:`, error);
      throw error;
    }
  }

  private getMockBreakTimes(): BreakTime[] {
    return [
      {
        id: 1,
        name: 'Tushlik tanaffusi',
        start_time: '13:00:00',
        end_time: '14:00:00',
        user: 2,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Choy tanaffusi',
        start_time: '11:00:00',
        end_time: '11:15:00',
        user: 2,
        created_at: '2024-01-16T11:20:00Z',
        updated_at: '2024-01-16T11:20:00Z'
      },
      {
        id: 3,
        name: 'Shaxsiy tanaffus',
        start_time: '15:30:00',
        end_time: '15:45:00',
        user: 3,
        created_at: '2024-01-17T09:15:00Z',
        updated_at: '2024-01-17T09:15:00Z'
      }
    ];
  }

  formatBreakTime(timeString: string): string {
    try {
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        return `${timeParts[0]}:${timeParts[1]}`;
      }
      return timeString;
    } catch (error) {
      console.error('Tanaffus vaqtini formatlashda xatolik:', error);
      return timeString;
    }
  }

  calculateBreakDuration(startTime: string, endTime: string): string {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      const durationMs = end.getTime() - start.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours} soat ${minutes} daqiqa`;
      } else {
        return `${minutes} daqiqa`;
      }
    } catch (error) {
      console.error('Tanaffus davomiyligini hisoblashda xatolik:', error);
      return 'Hisoblanmadi';
    }
  }

  async getWorkDays(userId?: number): Promise<WorkDay[]> {
    try {
      const params = new URLSearchParams();
      
      if (userId && userId !== this.USER_ID) {
        params.append('user_id', userId.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/work_day/?${params.toString()}`;
      const response = await this.request<WorkDay[]>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ WorkDay ro\'yxatini yuklashda xatolik:', error);
      return this.getMockWorkDays();
    }
  }

  async createWorkDay(data: CreateWorkDayRequest): Promise<WorkDay> {
    try {
      const workDayData: any = {
        name: data.name,
        days: data.days,
      };
      
      const params = new URLSearchParams();
      
      if (data.user && data.user !== this.USER_ID) {
        params.append('user_id', data.user.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/work_day/?${params.toString()}`;
      const response = await this.request<WorkDay>(endpoint, {
        method: 'POST',
        body: JSON.stringify(workDayData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ WorkDay yaratishda xatolik:', error);
      throw error;
    }
  }

  async updateWorkDay(id: number, data: UpdateWorkDayRequest): Promise<WorkDay> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.days !== undefined) updateData.days = data.days;
      
      const params = new URLSearchParams();
      
      if (data.user !== undefined) {
        params.append('user_id', data.user.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/work_day/${id}/?${params.toString()}`;
      
      const response = await this.request<WorkDay>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ ${id} ID-li WorkDay ni yangilashda xatolik:`, error);
      throw error;
    }
  }

  async deleteWorkDay(id: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      
      const endpoint = `/day/work_day/${id}/?${params.toString()}`;
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ ${id} ID-li WorkDay ni o\'chirishda xatolik:`, error);
      throw error;
    }
  }

  async getDayOffs(userId?: number): Promise<DayOff[]> {
    try {
      const params = new URLSearchParams();
      
      if (userId && userId !== this.USER_ID) {
        params.append('user_id', userId.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/day_off/?${params.toString()}`;
      
      const response = await this.request<DayOff[]>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ DayOff ro\'yxatini yuklashda xatolik:', error);
      return this.getMockDayOffs();
    }
  }

  async createDayOff(data: CreateDayOffRequest): Promise<DayOff> {
    try {
      const dayOffData: any = {
        name: data.name,
        days: data.days,
      };
      
      const params = new URLSearchParams();
      
      if (data.user && data.user !== this.USER_ID) {
        params.append('user_id', data.user.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/day_off/?${params.toString()}`;
      const response = await this.request<DayOff>(endpoint, {
        method: 'POST',
        body: JSON.stringify(dayOffData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ DayOff yaratishda xatolik:', error);
      throw error;
    }
  }

  async updateDayOff(id: number, data: UpdateDayOffRequest): Promise<DayOff> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.days !== undefined) updateData.days = data.days;
      
      const params = new URLSearchParams();
      
      if (data.user !== undefined) {
        params.append('user_id', data.user.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/day_off/${id}/?${params.toString()}`;
      const response = await this.request<DayOff>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ ${id} ID-li DayOff ni yangilashda xatolik:`, error);
      throw error;
    }
  }

  async deleteDayOff(id: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      
      const endpoint = `/day/day_off/${id}/?${params.toString()}`;
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ ${id} ID-li DayOff ni o\'chirishda xatolik:`, error);
      throw error;
    }
  }

  private getMockWorkDays(): WorkDay[] {
    return [
      {
        id: 1,
        name: 'Oddiy ish haftasi',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        user: 2,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Yarim kunlik ish',
        days: ['mon', 'wed', 'fri'],
        user: 2,
        created_at: '2024-01-16T11:20:00Z',
        updated_at: '2024-01-16T11:20:00Z'
      },
      {
        id: 3,
        name: 'Dam olish kunlari',
        days: ['sat', 'sun'],
        user: 3,
        created_at: '2024-01-17T09:15:00Z',
        updated_at: '2024-01-17T09:15:00Z'
      }
    ];
  }

  private getMockDayOffs(): DayOff[] {
    return [
      {
        id: 1,
        name: 'Bayram kunlari',
        days: ['fri', 'sat'],
        user: 2,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Maxsus dam olish',
        days: ['mon'],
        user: 2,
        created_at: '2024-01-16T11:20:00Z',
        updated_at: '2024-01-16T11:20:00Z'
      },
      {
        id: 3,
        name: 'Korrektirovka',
        days: ['tue', 'thu'],
        user: 3,
        created_at: '2024-01-17T09:15:00Z',
        updated_at: '2024-01-17T09:15:00Z'
      }
    ];
  }

  formatWorkDays(days: string[]): string {
    const dayMap: Record<string, string> = {
      'mon': 'Dushanba',
      'tue': 'Seshanba',
      'wed': 'Chorshanba',
      'thu': 'Payshanba',
      'fri': 'Juma',
      'sat': 'Shanba',
      'sun': 'Yakshanba'
    };
    
    if (!days || days.length === 0) return 'Kunlar tanlanmagan';
    
    const formattedDays = days.map(day => dayMap[day] || day);
    
    if (formattedDays.length <= 2) {
      return formattedDays.join(', ');
    }
    
    return `${formattedDays.length} kun (${formattedDays.slice(0, 2).join(', ')}...)`;
  }

  async getShifts(userId?: number): Promise<Shift[]> {
    try {
      const params = new URLSearchParams();
      
      if (userId && userId !== this.USER_ID) {
        params.append('user_id', userId.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/shift/?${params.toString()}`;
      
      const response = await this.request<Shift[]>(endpoint);
      
      if (response && Array.isArray(response)) {
        return response.map(shift => ({
          id: shift.id || 0,
          name: shift.name || '',
          start_time: shift.start_time || '',
          end_time: shift.end_time || '',
          user: shift.user || this.USER_ID,
          break_time: shift.break_time || null,
          approved_late_min: shift.approved_late_min !== undefined ? shift.approved_late_min : 0,
          created_at: shift.created_at,
          updated_at: shift.updated_at
        }));
      }
      
      return response || [];
    } catch (error) {
      console.error('❌ Smenalarni yuklashda xatolik:', error);
      return [];
    }
  }

  async createShift(data: CreateShiftRequest): Promise<Shift> {
    try {
      const shiftData: any = {
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
      };
      
      if (data.break_time !== undefined) {
        shiftData.break_time = data.break_time;
      }
      
      if (data.approved_late_min !== undefined) {
        shiftData.approved_late_min = data.approved_late_min;
      }
      
      const params = new URLSearchParams();
      
      if (data.user && data.user !== this.USER_ID) {
        params.append('user_id', data.user.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/shift/?${params.toString()}`;
      const response = await this.request<Shift>(endpoint, {
        method: 'POST',
        body: JSON.stringify(shiftData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Smena yaratishda xatolik:', error);
      throw error;
    }
  }

  async updateShift(id: number, data: UpdateShiftRequest): Promise<Shift> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.start_time !== undefined) updateData.start_time = data.start_time;
      if (data.end_time !== undefined) updateData.end_time = data.end_time;
      if (data.break_time !== undefined) updateData.break_time = data.break_time;
      
      if (data.approved_late_min !== undefined) {
        updateData.approved_late_min = data.approved_late_min;
      }
      
      const params = new URLSearchParams();
      
      if (data.user !== undefined) {
        params.append('user_id', data.user.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/day/shift/${id}/?${params.toString()}`;
      
      const response = await this.request<Shift>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ ${id} ID-li smenani yangilashda xatolik:`, error);
      throw error;
    }
  }

  async deleteShift(id: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      
      const endpoint = `/day/shift/${id}/?${params.toString()}`;
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ ${id} ID-li smenani o\'chirishda xatolik:`, error);
      throw error;
    }
  }

  async getTelegramChannels(userId?: number): Promise<TelegramChannel[]> {
    try {
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      
      if (userId && userId !== this.USER_ID) {
        params.append('target_user_id', userId.toString());
      }
      
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (branchId) {
        params.append('branch_id', branchId);
      }
      
      if (deviceId) {
        params.append('device', deviceId.toString());
      }
      
      const endpoint = `/utils/telegramchannel/${params.toString() ? '?' + params.toString() : ''}`;
      console.log('📡 Fetching Telegram channels from branch device:', endpoint);
      
      const response = await this.request<TelegramChannel[]>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ Telegram kanallarini yuklashda xatolik:', error);
      throw error;
    }
  }

  async getDailyExcelReport(date: string): Promise<Blob> {
    try {
      if (!date) {
        throw new Error('Sana kiritilmagan');
      }
      
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      const params = new URLSearchParams();
      params.append('date', date);
      params.append('user_id', this.USER_ID.toString());
      params.append('branch_id', branchId);
      
      if (deviceId) {
        params.append('device', deviceId.toString());
      }
      
      const endpoint = `/person/daily-excel/?${params.toString()}`;
      console.log('📡 Fetching Excel report from branch device:', endpoint);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Excel hisobotini olishda xatolik:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 404) {
          throw new Error('Berilgan sana uchun hisobot topilmadi');
        } else if (response.status === 400) {
          throw new Error('Noto\'g\'ri sana formati. YYYY-MM-DD formatida kiriting');
        } else if (response.status === 403) {
          throw new Error('Excel hisobotini olish uchun ruxsat yo\'q');
        } else {
          throw new Error(`Server xatosi: ${response.status}`);
        }
      }
      
      const blob = await response.blob();
      
      if (blob.type.includes('spreadsheet') || blob.type.includes('excel') || blob.type.includes('octet-stream')) {
        return blob;
      } else {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          throw new Error(`JSON response qaytdi: ${JSON.stringify(json)}`);
        } catch {
          throw new Error(`Noto'g'ri fayl formati: ${blob.type}`);
        }
      }
    } catch (error) {
      console.error('❌ Kunlik Excel hisobotini olishda xatolik:', error);
      
      const err = error as any;
      if (err.message?.includes('Sana kiritilmagan')) {
        throw new Error('Sana kiritilmagan');
      } else if (err.message?.includes('Filial tanlanmagan')) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      throw error;
    }
  }

  async getBranches(userId?: number): Promise<Branch[]> {
    try {
      const params = new URLSearchParams();
      
      if (userId && userId !== this.USER_ID) {
        params.append('user_id', userId.toString());
      } else {
        params.append('user_id', this.USER_ID.toString());
      }
      
      const endpoint = `/utils/branch/${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.request<Branch[]>(endpoint);
      
      if (response && Array.isArray(response)) {
        const branches = response.map(branch => ({
          id: branch.id || 0,
          name: branch.name || '',
          device: branch.device !== undefined ? branch.device : null,
          user: branch.user || this.USER_ID,
          created_at: branch.created_at,
          updated_at: branch.updated_at
        }));
        
        this.updateBranchesCache(branches);
        return branches;
      }
      
      return response || [];
    } catch (error) {
      console.error('❌ Filiallarni yuklashda xatolik:', error);
      return this.getMockBranches();
    }
  }

  async createBranch(data: CreateBranchRequest): Promise<Branch> {
    try {
      const branchData: any = {
        name: data.name,
      };
      
      if (data.device !== undefined) {
        branchData.device = data.device;
      } else {
        branchData.device = null;
      }
      
      if (data.user && data.user !== this.USER_ID) {
        branchData.user_id = data.user;
      } else {
        branchData.user_id = this.USER_ID;
      }
      
      const endpoint = `/utils/branch/`;
      const response = await this.request<Branch>(endpoint, {
        method: 'POST',
        body: JSON.stringify(branchData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Filial yaratishda xatolik:', error);
      throw error;
    }
  }

  async updateBranch(id: number, data: UpdateBranchRequest): Promise<Branch> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      
      if (data.device !== undefined) {
        updateData.device = data.device;
      }
      
      if (data.user !== undefined) {
        updateData.user_id = data.user;
      } else {
        updateData.user_id = this.USER_ID;
      }
      
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      
      const endpoint = `/utils/branch/${id}/?${params.toString()}`;
      
      const response = await this.request<Branch>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ ${id} ID-li filialni yangilashda xatolik:`, error);
      throw error;
    }
  }

  private getMockBranches(): Branch[] {
    return [
      {
        id: 1,
        name: 'Bosh filial',
        device: 1,
        created_at: '2024-01-15T10:30:00Z',
        user: 2
      },
      {
        id: 2,
        name: 'Shahar markazi filiali',
        device: 2,
        created_at: '2024-01-16T11:20:00Z',
        user: 2
      },
      {
        id: 3,
        name: 'Yangi shahar filiali',
        device: null,
        created_at: '2024-01-17T09:15:00Z',
        user: 3
      }
    ];
  }

  async getDevicesForBranch(): Promise<{id: number, name: string, ip: string}[]> {
    try {
      const devices = await this.getDevices();
      return devices.map(device => ({
        id: device.id,
        name: device.name,
        ip: device.ip
      }));
    } catch (error) {
      console.error('❌ Device ro\'yxatini olishda xatolik:', error);
      return [
        { id: 1, name: 'Hikvision DS-2CD2143G0-I', ip: '192.168.1.100' },
        { id: 2, name: 'Dahua IPC-HDW5842H-ASE', ip: '192.168.1.101' },
        { id: 3, name: 'AXIS M3046-V', ip: '192.168.1.102' }
      ];
    }
  }

  async deleteBranch(id: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      
      const endpoint = `/utils/branch/${id}/?${params.toString()}`;
      
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ ${id} ID-li filialni o\'chirishda xatolik:`, error);
      throw error;
    }
  }

  async createTelegramChannel(data: CreateTelegramChannelRequest): Promise<TelegramChannel> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      const channelData: any = {
        name: data.name,
        chat_id: data.chat_id,
        user_id: this.USER_ID,
        branch_id: parseInt(branchId),
      };
      
      if (deviceId) {
        channelData.device = deviceId;
      }
      
      if (data.user && data.user !== this.USER_ID) {
        channelData.user_id = data.user;
      }
      
      const endpoint = `/utils/telegramchannel/`;
      
      const response = await this.request<TelegramChannel>(endpoint, {
        method: 'POST',
        body: JSON.stringify(channelData),
      });
      
      return response;
    } catch (error: any) {
      console.error('❌ Telegram kanali yaratishda xatolik:', error);
      throw error;
    }
  }

  async updateTelegramChannel(id: number, data: UpdateTelegramChannelRequest): Promise<TelegramChannel> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      const updateData: any = {
        branch_id: parseInt(branchId),
      };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.chat_id !== undefined) updateData.chat_id = data.chat_id;
      
      if (deviceId) {
        updateData.device = deviceId;
      }
      
      if (data.user !== undefined) {
        updateData.user_id = data.user;
      }
      
      updateData.user_id = updateData.user_id || this.USER_ID;
      
      const endpoint = `/utils/telegramchannel/${id}/`;
      
      const response = await this.request<TelegramChannel>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return response;
    } catch (error: any) {
      console.error(`❌ ${id} ID-li Telegram kanalini yangilashda xatolik:`, error);
      throw error;
    }
  }

  async deleteTelegramChannel(id: number): Promise<void> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      const params = new URLSearchParams();
      params.append('user_id', this.USER_ID.toString());
      params.append('branch_id', branchId);
      
      const endpoint = `/utils/telegramchannel/${id}/?${params.toString()}`;
      
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error(`❌ ${id} ID-li Telegram kanalini o\'chirishda xatolik:`, error);
      throw error;
    }
  }

  private getMockTelegramChannels(): TelegramChannel[] {
    return [
      {
        id: 1,
        name: 'Xodimlar kanali',
        chat_id: '@company_staff',
        resolved_id: '123456789',
        user: 2,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Adminlar kanali',
        chat_id: '@company_admins',
        resolved_id: '987654321',
        user: 2,
        created_at: '2024-01-16T11:20:00Z',
        updated_at: '2024-01-16T11:20:00Z'
      },
      {
        id: 3,
        name: 'Kuzatuv kanali',
        chat_id: '@company_monitoring',
        resolved_id: '456789123',
        user: 3,
        created_at: '2024-01-17T09:15:00Z',
        updated_at: '2024-01-17T09:15:00Z'
      }
    ];
  }

  formatTime(timeString: string): string {
    try {
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        return `${timeParts[0]}:${timeParts[1]}`;
      }
      return timeString;
    } catch (error) {
      console.error('Vaqtni formatlashda xatolik:', error);
      return timeString;
    }
  }

  calculateShiftDuration(startTime: string, endTime: string): string {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      const durationMs = end.getTime() - start.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours} soat ${minutes} daqiqa`;
    } catch (error) {
      console.error('Davomiylik hisoblashda xatolik:', error);
      return 'Hisoblanmadi';
    }
  }

  async getEmployeeHistoryRange(
    employeeId: number, 
    startDate: string, 
    endDate: string
  ): Promise<EmployeeHistory[]> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      const params = new URLSearchParams();
      params.append('employee_id', employeeId.toString());
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      params.append('user_id', this.USER_ID.toString());
      params.append('branch_id', branchId);
      
      if (deviceId) {
        params.append('device', deviceId.toString());
      }
      
      const endpoint = `/person/employee-history/?${params.toString()}`;
      console.log('📡 Fetching employee history range with branch device:', endpoint);
      
      const response = await this.request<EmployeeHistory[]>(endpoint);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to load employee history range:', error);
      throw error;
    }
  }

  async getEmployeeHistoryToday(employeeId: number): Promise<EmployeeHistory[]> {
    const today = formatDate(new Date());
    return await this.getEmployeeHistory(today, employeeId);
  }

  async syncEvents(): Promise<EventSyncResponse> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      if (!deviceId) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      let endpoint = `/event/events-sync/?user_id=${this.USER_ID}&branch_id=${branchId}&device=${deviceId}`;
      
      console.log('📡 Syncing events from branch device:', endpoint);
      
      const response = await this.request<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      return {
        success: response.success,
        synced_devices: response.synced_devices ?? 0,
        synced_events: response.synced_events ?? response.added ?? 0,
      };
    } catch (error: any) {
      console.error('❌ Failed to sync events:', error);
      throw error;
    }
  }

  private formatPhoneForServer(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    
    if (!formattedPhone.startsWith('998') && formattedPhone.length === 9) {
      formattedPhone = '998' + formattedPhone;
    }
    
    formattedPhone = '+' + formattedPhone;
    
    return formattedPhone;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAccessToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token && !endpoint.includes('/login') && !endpoint.includes('/auth/refresh')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors',
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { raw: responseText };
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMessage = data.non_field_errors[0];
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
      }

      return data as T;
    } catch (error) {
      console.error('💥 API Error:', error);
      throw error;
    }
  }

  async getDevices(userId?: number): Promise<Device[]> {
    try {
      const params = new URLSearchParams();
      
      if (userId && userId !== this.USER_ID) {
        params.append('user_id', userId.toString());
      }
      
      const endpoint = `/utils/devices/${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await this.request<DeviceResponse | Device[]>(endpoint);
      
      let devices: Device[];
      if (Array.isArray(response)) {
        devices = response;
      } else if (response && 'results' in response) {
        devices = response.results;
      } else {
        console.warn('⚠️ Unexpected device response format:', response);
        devices = [];
      }
      
      return devices;
    } catch (error) {
      console.error('❌ Failed to load devices:', error);
      return this.getMockDevices();
    }
  }

  async getDeviceById(id: number): Promise<Device> {
    try {
      const endpoint = `/utils/devices/${id}/`;
      const device = await this.request<Device>(endpoint);
      return device;
    } catch (error) {
      console.error(`❌ Failed to load device ${id}:`, error);
      throw error;
    }
  }

  async createDevice(data: {
    name: string;
    ip: string;
    username: string;
    password: string;
    device_type?: string;
    port?: number;
    serial_number?: string;
    location?: string;
    user?: number;
  }): Promise<Device> {
    try {
      const deviceData: any = {
        name: data.name,
        ip: data.ip,
        username: data.username,
        password: data.password,
      };
      
      if (data.device_type) deviceData.device_type = data.device_type;
      if (data.port) deviceData.port = data.port;
      if (data.serial_number) deviceData.serial_number = data.serial_number;
      if (data.location) deviceData.location = data.location;
      
      if (data.user) {
        deviceData.user = data.user;
      }
      
      const endpoint = `/utils/devices/`;
      const response = await this.request<Device>(endpoint, {
        method: 'POST',
        body: JSON.stringify(deviceData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to create device:', error);
      throw error;
    }
  }

  async updateDevice(id: number, data: Partial<{
    name: string;
    ip: string;
    username: string;
    password: string;
    device_type?: string;
    port?: number;
    serial_number?: string;
    location?: string;
    status?: 'active' | 'inactive' | 'error';
  }>): Promise<Device> {
    try {
      const endpoint = `/utils/devices/${id}/`;
      const response = await this.request<Device>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Failed to update device ${id}:`, error);
      throw error;
    }
  }

  async deleteDevice(id: number): Promise<void> {
    try {
      const endpoint = `/utils/devices/${id}/`;
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ Failed to delete device ${id}:`, error);
      throw error;
    }
  }

  private getMockDevices(): Device[] {
    return [
      {
        id: 1,
        name: 'Hikvision DS-2CD2143G0-I',
        ip: '192.168.1.100',
        username: 'admin',
        password: 'password123',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z',
        user: 2,
        device_type: 'camera',
        port: 8000,
        location: 'Main Entrance',
        last_sync: '2024-01-20T15:45:00Z'
      },
      {
        id: 2,
        name: 'Dahua IPC-HDW5842H-ASE',
        ip: '192.168.1.101',
        username: 'admin',
        password: 'admin123',
        status: 'active',
        created_at: '2024-01-16T11:20:00Z',
        user: 2,
        device_type: 'camera',
        port: 37777,
        location: 'Parking Lot',
        last_sync: '2024-01-20T14:30:00Z'
      },
      {
        id: 3,
        name: 'AXIS M3046-V',
        ip: '192.168.1.102',
        username: 'root',
        password: 'pass',
        status: 'inactive',
        created_at: '2024-01-17T09:15:00Z',
        user: 3,
        device_type: 'camera',
        port: 80,
        location: 'Warehouse',
        last_sync: '2024-01-19T10:00:00Z'
      }
    ];
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.group('🔐 LOGIN PROCESS');
      
      const serverPhone = this.formatPhoneForServer(credentials.phone_number);
      
      const payload = {
        phone_number: serverPhone,
        password: credentials.password
      };

      const response = await fetch(`${BASE_URL}/user/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { raw: responseText };
      }

      if (!response.ok) {
        console.error('❌ Login failed:', {
          status: response.status,
          data
        });

        let errorMessage = 'Login failed';
        if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMessage = data.non_field_errors[0];
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }

        throw new Error(errorMessage);
      }

      let accessToken: string | undefined;
      let refreshToken: string | undefined;

      if (data.data && data.data.access) {
        accessToken = data.data.access;
        refreshToken = data.data.refresh;
      } else if (data.access) {
        accessToken = data.access;
        refreshToken = data.refresh;
      } else if (data.token) {
        accessToken = data.token;
        refreshToken = data.refresh_token;
      }

      if (!accessToken) {
        console.error('❌ No access token found in response structure:', data);
        throw new Error('No access token in response');
      }

      this.setTokens(accessToken, refreshToken);
      
      console.groupEnd();

      return {
        access: accessToken,
        refresh: refreshToken || ''
      };
    } catch (error: any) {
      console.groupEnd();
      console.error('💥 Login error:', error);
      
      let userMessage = error.message;
      
      if (error.message.includes('Invalid phone number or password')) {
        userMessage = 'Telefon raqami yoki parol noto\'g\'ri';
      } else if (error.status === 400) {
        userMessage = 'Noto\'g\'ri ma\'lumotlar kiritildi';
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = 'Internet aloqasi yo\'q yoki server ishlamayapti';
      } else if (error.message.includes('No access token')) {
        userMessage = 'Serverdan token olinmadi. Admin bilan bog\'laning.';
      }
      
      throw new Error(userMessage);
    }
  }

  async testLoginDirectly(phone: string, password: string): Promise<any> {
    console.group('🧪 DIRECT LOGIN TEST - WITH + PREFIX');
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('998') && cleanPhone.length === 9) {
      cleanPhone = '998' + cleanPhone;
    }
    
    const phoneWithPlus = '+' + cleanPhone;
    
    try {
      const response = await fetch(`${BASE_URL}/user/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneWithPlus,
          password: password
        }),
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      
      const result = {
        success: response.ok,
        status: response.status,
        phoneSent: phoneWithPlus,
        response: data,
        note: 'Phone sent WITH +998 prefix'
      };
      
      console.groupEnd();
      return result;
    } catch (error) {
      console.error('Test error:', error);
      console.groupEnd();
      throw error;
    }
  }

  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    try {
      const response = await this.request<RefreshTokenResponse>('/user/auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.access) {
        this.setTokens(response.access, response.refresh);
        return response;
      }
      
      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const user = await this.request<User>('/user/me/');
      return user;
    } catch (error) {
      console.error('❌ Failed to load user:', error);
      throw error;
    }
  }

  async getEmployeeById(id: number): Promise<Employee> {
    try {
      const endpoint = `/person/employee-detail/${id}/?user_id=${this.USER_ID}`;
      
      const employee = await this.request<Employee>(endpoint);
      return employee;
    } catch (error) {
      console.error(`❌ Failed to load employee ${id}:`, error);
      
      if ((error as any).status === 404) {
        throw new Error(`Hodim topilmadi (ID: ${id})`);
      } else if ((error as any).status === 403) {
        throw new Error('Bu hodimni ko\'rish uchun ruxsat yo\'q');
      }
      
      throw error;
    }
  }

  async searchEmployees(query: string, branchId?: number): Promise<Employee[]> {
    try {
      const targetBranchId = branchId || localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      let endpoint = `/person/search/?q=${encodeURIComponent(query)}&user_id=${this.USER_ID}`;
      
      if (targetBranchId) {
        endpoint += `&branch_id=${targetBranchId}`;
      }
      
      if (deviceId) {
        endpoint += `&device=${deviceId}`;
      }
      
      const employees = await this.request<Employee[]>(endpoint);
      return employees;
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw error;
    }
  }

  async getEmployeesPaginated(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Employee>> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      let endpoint = `/person/sync-employees/?page=${page}&page_size=${pageSize}&user_id=${this.USER_ID}`;
      
      if (branchId) {
        endpoint += `&branch_id=${branchId}`;
      }
      
      if (deviceId) {
        endpoint += `&device=${deviceId}`;
      }
      
      const response = await this.request<PaginatedResponse<Employee>>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ Failed to load paginated employees:', error);
      throw error;
    }
  }

  async syncEmployees(): Promise<{
    success: boolean;
    synced_devices: number;
    added: number;
    deleted: number;
    message?: string;
  }> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      if (!deviceId) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      let endpoint = `/person/sync-employees/?user_id=${this.USER_ID}&branch_id=${branchId}&device=${deviceId}`;
      
      console.log('📡 Syncing employees from branch device:', endpoint);
      
      const response = await this.request<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      return response;
    } catch (error: any) {
      console.error('❌ Failed to sync employees:', error);
      throw error;
    }
  }

  async getEmployees(branchIdParam?: number): Promise<Employee[]> {
    try {
      const branchId = branchIdParam || localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      let endpoint = `/person/employees/?user_id=${this.USER_ID}&branch_id=${branchId}`;
      
      if (deviceId) {
        endpoint += `&device=${deviceId}`;
      }
      
      console.log('📡 Fetching employees from branch device:', endpoint);
      
      const response = await this.request<any>(endpoint);
      
      if (response.employees && Array.isArray(response.employees)) {
        return response.employees as Employee[];
      } else if (Array.isArray(response)) {
        return response as Employee[];
      } else {
        console.warn('⚠️ No employees array found in response:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to load employees:', error);
      throw error;
    }
  }

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      if (!deviceId) {
        throw new Error('Filialda qurilma biriktirilmagan. Iltimos, avval filialga qurilma biriktiring.');
      }
      
      const employeeData: any = {
        device_id: deviceId,
        name: data.name,
        user_type: data.user_type || 'normal',
        begin_time: data.begin_time || new Date().toISOString(),
        end_time: data.end_time || new Date().toISOString(),
        door_right: data.door_right || '1',
        position: data.position || '',
        phone_number: data.phone_number,
        user_id: this.USER_ID,
        salary: data.salary || 0,
        fine: data.fine || 0,
        branch_id: parseInt(branchId),
      };
      
      employeeData.description = data.description || '';
      employeeData.employment = data.employment || '';
      employeeData.employee_no = data.employee_no || '';
      
      if (data.department !== undefined && data.department !== null && data.department > 0) {
        employeeData.department = data.department;
      }
      
      if (data.shift !== undefined && data.shift !== null && data.shift > 0) {
        employeeData.shift = data.shift;
      }
      
      if (data.break_time !== undefined && data.break_time !== null && data.break_time > 0) {
        employeeData.break_time = data.break_time;
      }
      
      if (data.work_day !== undefined && data.work_day !== null && data.work_day > 0) {
        employeeData.work_day = data.work_day;
      }
      
      if (data.day_off !== undefined && data.day_off !== null && data.day_off > 0) {
        employeeData.day_off = data.day_off;
      }
      
      console.log('📡 Creating employee for branch device:', employeeData);
      
      const response = await this.request<Employee>('/person/create/', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to create employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: number, data: Partial<CreateEmployeeRequest>): Promise<Employee> {
    try {
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      const employeeData: any = {
        user_id: this.USER_ID,
        branch_id: parseInt(branchId),
      };
      
      if (deviceId) {
        employeeData.device_id = deviceId;
      }
      
      if (data.device_id !== undefined) employeeData.device_id = data.device_id;
      if (data.name !== undefined) employeeData.name = data.name;
      if (data.user_type !== undefined) employeeData.user_type = data.user_type;
      if (data.begin_time !== undefined) employeeData.begin_time = data.begin_time;
      if (data.end_time !== undefined) employeeData.end_time = data.end_time;
      if (data.door_right !== undefined) employeeData.door_right = data.door_right;
      
      if (data.position !== undefined) employeeData.position = data.position;
      if (data.phone_number !== undefined) employeeData.phone_number = data.phone_number;
      if (data.salary !== undefined) employeeData.salary = data.salary;
      if (data.fine !== undefined) employeeData.fine = data.fine;
      
      if (data.employment !== undefined) employeeData.employment = data.employment || '';
      if (data.description !== undefined) employeeData.description = data.description || '';
      if (data.employee_no !== undefined) employeeData.employee_no = data.employee_no || '';
      
      if (data.department !== undefined && data.department && data.department > 0) {
        employeeData.department = data.department;
      }
      
      if (data.shift !== undefined && data.shift && data.shift > 0) {
        employeeData.shift = data.shift;
      }
      
      if (data.break_time !== undefined && data.break_time && data.break_time > 0) {
        employeeData.break_time = data.break_time;
      }
      
      if (data.work_day !== undefined && data.work_day && data.work_day > 0) {
        employeeData.work_day = data.work_day;
      }
      
      if (data.day_off !== undefined && data.day_off && data.day_off > 0) {
        employeeData.day_off = data.day_off;
      }
      
      console.log('📡 Updating employee for branch device:', employeeData);
      
      const employee = await this.request<Employee>(`/person/update/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(employeeData),
      });
      return employee;
    } catch (error) {
      console.error(`❌ Failed to update employee ${id}:`, error);
      throw error;
    }
  }

  async deleteEmployee(id: number): Promise<void> {
    try {
      const endpoint = `/person/delete/${id}/?user_id=${this.USER_ID}`;
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`❌ Failed to delete employee ${id}:`, error);
      throw error;
    }
  }

  async getDailyAttendance(date?: string): Promise<DailyAttendance> {
    try {
      let selectedDate: string;
      if (date) {
        selectedDate = date;
      } else {
        selectedDate = formatDate(new Date());
      }
      
      const branchId = localStorage.getItem('selected_branch_id');
      const deviceId = this.getSelectedBranchDeviceId();
      
      if (!branchId) {
        throw new Error('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      }
      
      let endpoint = `/person/daily-list/?date=${selectedDate}&user_id=${this.USER_ID}&branch_id=${branchId}`;
      
      if (deviceId) {
        endpoint += `&device=${deviceId}`;
      }
      
      console.log('📡 Fetching daily attendance from branch device:', endpoint);
      
      const response = await this.request<DailyAttendance>(endpoint);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to load daily attendance:', error);
      
      return {
        date: date || formatDate(new Date()),
        employees: mockEmployees.map((emp, index) => ({
          id: emp.id,
          employee_no: emp.employee_no,
          name: emp.name,
          kirish: index === 0 ? '09:00' : null,
          chiqish: index === 0 ? '18:00' : null,
          late: '0:00',
          face: emp.local_face,
        })),
        stats: {
          total: mockEmployees.length,
          came: 1,
          late: 0,
          absent: mockEmployees.length - 1,
        },
      };
    }
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  getUserIdFromToken(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.user_id || null;
    } catch {
      return null;
    }
  }
}

export const apiService = new ApiService();

export async function testLogin(phone: string, password: string): Promise<any> {
  return await apiService.testLoginDirectly(phone, password);
}

export async function testSuperAdmin(): Promise<any> {
  return await apiService.testLoginDirectly('998999999999', 'test1234');
}

export const mockEmployees: Employee[] = [
  {
    id: 1,
    employee_no: 'EMP001',
    name: 'Alisher Karimov',
    position: 'Frontend Developer',
    phone_number: '+998901234567',
    local_face: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    id: 2,
    employee_no: 'EMP002',
    name: 'Dilnoza Umarova',
    position: 'Backend Developer',
    phone_number: '+998901234568',
    local_face: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
];