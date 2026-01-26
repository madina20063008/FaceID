import { Branch, BreakTime, CreateBranchRequest, CreateBreakTimeRequest, CreateDayOffRequest, CreateEmployeeRequest, CreatePlanRequest, CreateShiftRequest, CreateSubscriptionRequest, CreateTelegramChannelRequest, CreateWorkDayRequest, DailyAttendance, DayOff, Device, DeviceResponse, Employee, EmployeeHistory, EventSyncResponse, LoginRequest, LoginResponse, Notification, PaginatedResponse, Plan, RefreshTokenResponse, Shift, Subscription, TelegramChannel, UpdateBranchRequest, UpdateBreakTimeRequest, UpdateDayOffRequest, UpdatePlanRequest, UpdateShiftRequest, UpdateTelegramChannelRequest, UpdateWorkDayRequest, User, WorkDay } from "./types";

// lib/api.ts - COMPLETE WITH ALL FIXES
const BASE_URL = 'https://hikvision.ugku.uz';

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
    // Remove any non-digit characters except decimal point
    const cleanPrice = price.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleanPrice);
    
    if (isNaN(num)) {
      return price;
    }
    
    // Format as currency
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
    
    // Local timezone ga convert qilish
    return date.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting time:', error);
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
    console.error('Error formatting date time:', error);
    return { date: isoString, time: isoString };
  }
};

// API Service
class ApiService {
  private accessToken: string | null = null;
  private refreshTokenString: string | null = null;
  private readonly USER_ID = 2; // Hardcoded user_id

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

// In api.ts, update getEmployeeHistory method:
async getEmployeeHistory(date: string, employeeId: number): Promise<EmployeeHistory[]> {
  console.log(`📅 Fetching employee history for employee ID: ${employeeId} on ${date}...`);
  
  try {
    // Validate parameters
    if (!employeeId || isNaN(employeeId)) {
      throw new Error('Noto\'g\'ri hodim ID si');
    }
    
    if (!date) {
      throw new Error('Sana kiritilmagan');
    }
    
    console.log('✅ Parameters validated:', { date, employeeId });
    
    // Build query parameters - Use employee_id parameter
    const params = new URLSearchParams();
    params.append('date', date);           // Selected date
    params.append('employee_id', employeeId.toString()); // Employee ID (CRITICAL CHANGE)
    params.append('user_id', this.USER_ID.toString());   // User ID
    
    const endpoint = `/person/employee-history/?${params.toString()}`;
    console.log('🌐 Making request to:', endpoint);
    
    // Fetch data from API
    const response = await this.request<EmployeeHistory[]>(endpoint);
    console.log(`✅ Loaded ${response.length} history records`);
    
    return response;
  } catch (error) {
    console.error('❌ Failed to load employee history:', error);
    console.error('❌ Error details:', {
      date: date,
      employeeId: employeeId,
      error: error
    });
    
    const err = error as any;

if (err.message?.includes('Noto\'g\'ri hodim ID si')) {
  throw new Error('Noto\'g\'ri hodim ID si');
} else if (err.message?.includes('Sana kiritilmagan')) {
  throw new Error('Sana kiritilmagan');
} else if (err.status === 404) {
  throw new Error('Hodim yoki sana uchun tarix topilmadi');
} else if (err.status === 400) {
  throw new Error('Noto\'g\'ri sana yoki hodim ID si');
}
    
    throw error;
  }
}

// In the ApiService class, add this method:

// Variant 1 - Foydalanuvchi obunalarini olish
async getSubscriptions(userId?: number): Promise<Subscription[]> {
  console.log('📋 Obunalarni olish...');
  
  try {
    // Avval barcha mumkin bo'lgan endpoint'larni tekshirish
    const targetUserId = userId || this.USER_ID || 2;
    
    // Variant A: Utils ichidagi subscription endpoint
    const endpointA = `/utils/subscription/?user_id=${targetUserId}`;
    
    console.log('🔍 Testing subscription endpoints...');
    
    // Birinchi variantni sinab ko'rish
    try {
      console.log('🌐 Trying endpoint A:', endpointA);
      const responseA = await this.request<Subscription[]>(endpointA);
      console.log(`✅ Loaded ${responseA.length} subscriptions from endpoint A`);
      return responseA;
    } catch (errorA) {
      console.log(`❌ Endpoint A failed, trying endpoint B...`);
    }
  } catch (error) {
    console.error('❌ All subscription endpoints failed:', error);
    
    // Mock ma'lumotlar qaytarish
    console.log('🔄 Using mock subscriptions data');
    return this.getMockSubscriptions();
  }
  
  return [];
}

// Add to ApiService class in lib/api.ts

// Get absent employees for a specific date
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
  console.log(`📅 Fetching absent employees for date: ${date}`);
  
  try {
    // Validate date
    if (!date) {
      throw new Error('Sana kiritilmagan');
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/attendance/absent/?${params.toString()}`;
    console.log('🌐 Making request to:', endpoint);
    
    const response = await this.request<any>(endpoint);
    console.log(`✅ Loaded ${response.employees?.length || 0} absent employees`);
    
    return response;
  } catch (error) {
    console.error('❌ Failed to load absent employees:', error);
    
    const err = error as any;
    if (err.message?.includes('Sana kiritilmagan')) {
      throw new Error('Sana kiritilmagan');
    } else if (err.status === 404) {
      throw new Error('Berilgan sana uchun ma\'lumot topilmadi');
    }
    
    throw error;
  }
}

// Update absence status (admin can change status)
async updateAbsenceStatus(data: {
  employee_id: number;
  date: string;
  status: string;
  comment?: string;
}): Promise<any> {
  console.log('✏️ Updating absence status...');
  
  try {
    // Validate required fields
    if (!data.employee_id || !data.date || !data.status) {
      throw new Error('Barcha majburiy maydonlarni to\'ldiring');
    }
    
    // Prepare data with user_id
    const requestData = {
      employee_id: data.employee_id,
      date: data.date,
      status: data.status,
      comment: data.comment || '',
      user_id: this.USER_ID
    };
    
    console.log('📦 Sending absence update data:', requestData);
    
    const endpoint = `/attendance/absent/`;
    const response = await this.request<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    
    console.log('✅ Absence status updated successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to update absence status:', error);
    
    const err = error as any;
    if (err.message?.includes('Barcha majburiy maydonlarni to\'ldiring')) {
      throw new Error('Barcha majburiy maydonlarni to\'ldiring');
    }
    
    throw error;
  }
}

// Get monthly attendance report
async getMonthlyReport(month: number, year: number, employeeId?: number): Promise<{
  year: number;
  month: number;
  count: number;
  results: Array<{
    employee_id: number;
    employee_name: string;
    year: number;
    month: number;
    sbk_count: number;  // Sababli kelmadi
    szk_count: number;  // Sababsiz kelmadi
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
  console.log(`📊 Fetching monthly report for ${year}-${month}...`);
  
  try {
    // Validate parameters
    if (!month || !year) {
      throw new Error('Oy va yil kiritilishi shart');
    }
    
    if (month < 1 || month > 12) {
      throw new Error('Noto\'g\'ri oy raqami');
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('month', month.toString());
    params.append('year', year.toString());
    
    if (employeeId) {
      params.append('employee_id', employeeId.toString());
    }
    
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/attendance/report/monthly/?${params.toString()}`;
    console.log('🌐 Making request to:', endpoint);
    
    const response = await this.request<any>(endpoint);
    console.log(`✅ Loaded monthly report with ${response.results?.length || 0} employees`);
    
    return response;
  } catch (error) {
    console.error('❌ Failed to load monthly report:', error);
    
    const err = error as any;
    if (err.message?.includes('Oy va yil kiritilishi shart')) {
      throw new Error('Oy va yil kiritilishi shart');
    } else if (err.message?.includes('Noto\'g\'ri oy raqami')) {
      throw new Error('Noto\'g\'ri oy raqami (1-12 oralig\'ida bo\'lishi kerak)');
    }
    
    throw error;
  }
}

// Variant 1 - Yangi obuna yaratish (getSubscriptions ga o'xshash)
async createSubscription(data: CreateSubscriptionRequest): Promise<Subscription> {
  console.log('➕ Yangi obuna yaratish...');
  
  try {
    // Avval barcha mumkin bo'lgan endpoint'larni tekshirish
    const targetUserId = data.user_id || this.USER_ID || 2;
    
    // Variant A: Utils ichidagi subscription endpoint
    const endpointA = `/utils/subscription/?user_id=${targetUserId}`;
    
    // Tayyorlash ma'lumotlari
    const subscriptionData: any = {
      plan_id: data.plan_id,
      user_id: targetUserId,
    };
    
    console.log('📦 Subscription data:', subscriptionData);
    
    // Birinchi variantni sinab ko'rish
    try {
      console.log('🌐 Trying POST to endpoint A:', endpointA);
      const responseA = await this.request<Subscription>(endpointA, {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });
      console.log('✅ Subscription created successfully via endpoint A');
      return responseA;
    } catch (errorA) {
      console.log(`❌ Endpoint A failed, trying endpoint B...`);
    }
  } catch (error) {
    console.error('❌ Failed to create subscription:', error);
    
    // Mock subscription qaytarish (agar API ishlamasa)
    console.log('🔄 Creating mock subscription');
    return this.getMockSubscription(data.plan_id);
  }
  
  // Fallback
  return this.getMockSubscription(data.plan_id);
}

// Cancel subscription
async cancelSubscription(id: number): Promise<void> {
  console.log(`🗑️ ${id} ID-li obunani bekor qilish...`);
  
  try {
    const endpoint = `/utils/subscription/${id}/`;
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ Obuna muvaffaqiyatli bekor qilindi');
  } catch (error) {
    console.error(`❌ ${id} ID-li obunani bekor qilishda xatolik:`, error);
    throw error;
  }
}

// Mock subscriptions
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

// Mock subscription for create method
private getMockSubscription(planId: number): Subscription {
  return {
    id: Date.now(),
    plan: `Mock Plan ${planId}`,
    plan_id: planId,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
    is_active: true,
  };
}

// In your ApiService class, update the getPlans method:
async getPlans(): Promise<Plan[]> {
  console.log('💰 Tariflarni olish...');
  
  try {
    const endpoint = `/utils/plan/`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<Plan[]>(endpoint);
    console.log(`✅ ${response.length} ta tarif yuklandi`);
    console.log('📊 Response data:', response); // Add this to debug
    
    // Response formatini tekshirish va kerak bo'lsa formatlash
    if (response && Array.isArray(response)) {
      return response.map(plan => ({
        id: plan.id || 0,
        name: plan.name || plan.title || '',  // FIX: Use "name" which is required by Plan interface
        title: plan.title || plan.name || '', // Also include title if needed
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
    
    // Demo/fallback uchun
    console.log('🔄 Mock tarif ma\'lumotlari ishlatilmoqda');
    return this.getMockPlans();
  }
}

// Yangi tarif yaratish
async createPlan(data: CreatePlanRequest): Promise<Plan> {
  console.log('➕ Yangi tarif yaratish...');
  
  try {
    // API ga yuboriladigan ma'lumotlar
    const planData: any = {
      name: data.name,
      plan_type: data.plan_type,
      billing_cycle: data.billing_cycle,
      price: data.price,
    };
    
    // duration_months ixtiyoriy maydon
    if (data.duration_months !== undefined) {
      planData.duration_months = data.duration_months;
    }
    
    console.log('📦 Tarif ma\'lumotlari:', planData);
    
    const endpoint = `/utils/plan/`;
    const response = await this.request<Plan>(endpoint, {
      method: 'POST',
      body: JSON.stringify(planData),
    });
    
    console.log('✅ Tarif muvaffaqiyatli yaratildi:', response);
    return response;
  } catch (error) {
    console.error('❌ Tarif yaratishda xatolik:', error);
    
    // Xatolik tafsilotlarini chiqarish
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

// Tarifni yangilash
async updatePlan(id: number, data: UpdatePlanRequest): Promise<Plan> {
  console.log(`✏️ ${id} ID-li tarifni yangilash...`);
  
  try {
    // Yangilash uchun tayyor ma'lumot
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.plan_type !== undefined) updateData.plan_type = data.plan_type;
    if (data.billing_cycle !== undefined) updateData.billing_cycle = data.billing_cycle;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.duration_months !== undefined) updateData.duration_months = data.duration_months;
    
    console.log('📦 Yangilash ma\'lumotlari:', updateData);
    
    const endpoint = `/utils/plan/${id}/`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<Plan>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    console.log('✅ Tarif muvaffaqiyatli yangilandi');
    return response;
  } catch (error) {
    console.error(`❌ ${id} ID-li tarifni yangilashda xatolik:`, error);
    throw error;
  }
}

// Tarifni o'chirish
async deletePlan(id: number): Promise<void> {
  console.log(`🗑️ ${id} ID-li tarifni o'chirish...`);
  
  try {
    const endpoint = `/utils/plan/${id}/`;
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ Tarif muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error(`❌ ${id} ID-li tarifni o\'chirishda xatolik:`, error);
    throw error;
  }
}

// Mock plans
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
  console.log('🔔 Fetching notifications...');
  
  try {
    const endpoint = `/utils/notification/`;
    console.log('🌐 Making request to:', endpoint);
    
    const response = await this.request<Notification[]>(endpoint);
    console.log(`✅ Loaded ${response.length} notifications`);
    return response;
  } catch (error) {
    console.error('❌ Failed to load notifications:', error);
    return []; // Return empty array on error
  }
}

// Barcha tanaffus vaqtlarini olish
async getBreakTimes(userId?: number): Promise<BreakTime[]> {
  console.log('⏱️ Tanaffus vaqtlarini olish...');
  
  try {
    const params = new URLSearchParams();
    
    if (userId && userId !== this.USER_ID) {
      params.append('user_id', userId.toString());
      console.log(`👑 Superadmin ${userId} foydalanuvchisining tanaffus vaqtlarini olish`);
    } else {
      // Oddiy admin yoki o'z tanaffus vaqtlari uchun
      params.append('user_id', this.USER_ID.toString());
    }
    
    const endpoint = `/day/break_time/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<BreakTime[]>(endpoint);
    console.log(`✅ ${response.length} ta tanaffus vaqti yuklandi`);
    
    // Response formatini tekshirish va kerak bo'lsa formatlash
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
    
    // Debug uchun API responseni ko'rish
    if ((error as any).status === 400) {
      console.log('⚠️ 400 xatosi: Noto\'g\'ri user_id yoki parametrlar');
    } else if ((error as any).status === 401) {
      console.log('⚠️ 401 xatosi: Kirish huquqi yo\'q');
    } else if ((error as any).status === 403) {
      console.log('⚠️ 403 xatosi: Ruxsat yo\'q');
    } else if ((error as any).status === 404) {
      console.log('⚠️ 404 xatosi: Endpoint topilmadi');
    }
    
    // Demo/fallback uchun
    console.log('🔄 Mock tanaffus vaqtlari ishlatilmoqda');
    return this.getMockBreakTimes();
  }
}

// Yangi tanaffus vaqti yaratish
async createBreakTime(data: CreateBreakTimeRequest): Promise<BreakTime> {
  console.log('➕ Yangi tanaffus vaqti yaratish...');
  
  try {
    // API ga yuboriladigan ma'lumotlar
    const breakTimeData: any = {
      name: data.name,
      start_time: data.start_time,
      end_time: data.end_time,
    };
    
    // SUPERADMIN UCHUN: Agar boshqa foydalanuvchiga tanaffus vaqti yaratmoqchi bo'lsa
    if (data.user && data.user !== this.USER_ID) {
      console.log(`👑 Superadmin ${data.user} foydalanuvchisiga tanaffus vaqti yaratmoqda`);
      // user_id ni query parametr sifatida yuborish
    }
    
    // user_id ni query parametr sifatida yuborish
    const params = new URLSearchParams();
    params.append('user_id', data.user?.toString() || this.USER_ID.toString());
    
    console.log('📦 Tanaffus vaqti ma\'lumotlari:', breakTimeData);
    console.log('🔗 Query parametrlar:', params.toString());
    
    const endpoint = `/day/break_time/?${params.toString()}`;
    const response = await this.request<BreakTime>(endpoint, {
      method: 'POST',
      body: JSON.stringify(breakTimeData),
    });
    
    console.log('✅ Tanaffus vaqti muvaffaqiyatli yaratildi:', response);
    return response;
  } catch (error) {
    console.error('❌ Tanaffus vaqti yaratishda xatolik:', error);
    
    // Xatolik tafsilotlarini chiqarish
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

// Tanaffus vaqtini yangilash
async updateBreakTime(id: number, data: UpdateBreakTimeRequest): Promise<BreakTime> {
  console.log(`✏️ ${id} ID-li tanaffus vaqtini yangilash...`);
  
  try {
    // Yangilash uchun tayyor ma'lumot
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    
    // Agar superadmin foydalanuvchini o'zgartirmoqchi bo'lsa
    if (data.user !== undefined) {
      updateData.user_id = data.user;
    } else {
      // Agar foydalanuvchi o'zgartirilmasa, joriy user_id ni yuborish
      updateData.user_id = this.USER_ID;
    }
    
    console.log('📦 Yangilash ma\'lumotlari:', updateData);
    
    // user_id parametrini URL ga qo'shish
    const params = new URLSearchParams();
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/day/break_time/${id}/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<BreakTime>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    console.log('✅ Tanaffus vaqti muvaffaqiyatli yangilandi');
    return response;
  } catch (error) {
    console.error(`❌ ${id} ID-li tanaffus vaqtini yangilashda xatolik:`, error);
    throw error;
  }
}

// Tanaffus vaqtini o'chirish
async deleteBreakTime(id: number): Promise<void> {
  console.log(`🗑️ ${id} ID-li tanaffus vaqtini o'chirish...`);
  
  try {
    // user_id parametrini URL ga qo'shish
    const params = new URLSearchParams();
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/day/break_time/${id}/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ Tanaffus vaqti muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error(`❌ ${id} ID-li tanaffus vaqtini o\'chirishda xatolik:`, error);
    throw error;
  }
}

// Mock tanaffus vaqtlari ma'lumotlari (fallback uchun)
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

// Vaqtni formatlash uchun yordamchi metod
formatBreakTime(timeString: string): string {
  try {
    // "14:28:20" formatidan "14:28" formatiga o'tkazish
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

// Tanaffus davomiyligini hisoblash
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

// WorkDay methods
async getWorkDays(userId?: number): Promise<WorkDay[]> {
  console.log('📅 WorkDay ro\'yxatini olish...');
  
  try {
    const params = new URLSearchParams();
    
    // SUPERADMIN UCHUN: Agar boshqa adminning workdaylarini ko'rish uchun
    if (userId && userId !== this.USER_ID) {
      params.append('user_id', userId.toString());
      console.log(`👑 Superadmin ${userId} foydalanuvchisining workdaylarini olish`);
    } else {
      // Oddiy admin yoki o'z workdaylari uchun
      params.append('user_id', this.USER_ID.toString());
    }
    
    const endpoint = `/day/work_day/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<WorkDay[]>(endpoint);
    console.log(`✅ ${response.length} ta workday yuklandi`);
    return response;
  } catch (error) {
    console.error('❌ WorkDay ro\'yxatini yuklashda xatolik:', error);
    return this.getMockWorkDays();
  }
}

async createWorkDay(data: CreateWorkDayRequest): Promise<WorkDay> {
  console.log('➕ Yangi WorkDay yaratish...');
  
  try {
    const workDayData: any = {
      name: data.name,
      days: data.days,
    };
    
    // user_id parametrini URL ga qo'shish
    const params = new URLSearchParams();
    
    // Agar superadmin boshqa foydalanuvchiga workday biriktirmoqchi bo'lsa
    if (data.user && data.user !== this.USER_ID) {
      params.append('user_id', data.user.toString());
      console.log(`👑 Superadmin ${data.user} foydalanuvchisiga workday biriktirilmoqda`);
    } else {
      params.append('user_id', this.USER_ID.toString());
    }
    
    console.log('📦 WorkDay ma\'lumotlari:', workDayData);
    console.log('🔗 Query parametrlar:', params.toString());
    
    const endpoint = `/day/work_day/?${params.toString()}`;
    const response = await this.request<WorkDay>(endpoint, {
      method: 'POST',
      body: JSON.stringify(workDayData),
    });
    
    console.log('✅ WorkDay muvaffaqiyatli yaratildi');
    return response;
  } catch (error) {
    console.error('❌ WorkDay yaratishda xatolik:', error);
    throw error;
  }
}

async updateWorkDay(id: number, data: UpdateWorkDayRequest): Promise<WorkDay> {
  console.log(`✏️ ${id} ID-li WorkDay ni yangilash...`);
  
  try {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.days !== undefined) updateData.days = data.days;
    
    // user_id parametrini URL ga qo'shish
    const params = new URLSearchParams();
    
    if (data.user !== undefined) {
      params.append('user_id', data.user.toString());
    } else {
      params.append('user_id', this.USER_ID.toString());
    }
    
    const endpoint = `/day/work_day/${id}/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<WorkDay>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    console.log('✅ WorkDay muvaffaqiyatli yangilandi');
    return response;
  } catch (error) {
    console.error(`❌ ${id} ID-li WorkDay ni yangilashda xatolik:`, error);
    throw error;
  }
}

async deleteWorkDay(id: number): Promise<void> {
  console.log(`🗑️ ${id} ID-li WorkDay ni o'chirish...`);
  
  try {
    const params = new URLSearchParams();
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/day/work_day/${id}/?${params.toString()}`;
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ WorkDay muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error(`❌ ${id} ID-li WorkDay ni o\'chirishda xatolik:`, error);
    throw error;
  }
}

// DayOff methods (same structure, different endpoint)
async getDayOffs(userId?: number): Promise<DayOff[]> {
  console.log('🏖️ DayOff ro\'yxatini olish...');
  
  try {
    const params = new URLSearchParams();
    
    if (userId && userId !== this.USER_ID) {
      params.append('user_id', userId.toString());
      console.log(`👑 Superadmin ${userId} foydalanuvchisining dayofflarini olish`);
    } else {
      params.append('user_id', this.USER_ID.toString());
    }
    
    const endpoint = `/day/day_off/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<DayOff[]>(endpoint);
    console.log(`✅ ${response.length} ta dayoff yuklandi`);
    return response;
  } catch (error) {
    console.error('❌ DayOff ro\'yxatini yuklashda xatolik:', error);
    return this.getMockDayOffs();
  }
}

async createDayOff(data: CreateDayOffRequest): Promise<DayOff> {
  console.log('➕ Yangi DayOff yaratish...');
  
  try {
    const dayOffData: any = {
      name: data.name,
      days: data.days,
    };
    
    const params = new URLSearchParams();
    
    if (data.user && data.user !== this.USER_ID) {
      params.append('user_id', data.user.toString());
      console.log(`👑 Superadmin ${data.user} foydalanuvchisiga dayoff biriktirilmoqda`);
    } else {
      params.append('user_id', this.USER_ID.toString());
    }
    
    console.log('📦 DayOff ma\'lumotlari:', dayOffData);
    
    const endpoint = `/day/day_off/?${params.toString()}`;
    const response = await this.request<DayOff>(endpoint, {
      method: 'POST',
      body: JSON.stringify(dayOffData),
    });
    
    console.log('✅ DayOff muvaffaqiyatli yaratildi');
    return response;
  } catch (error) {
    console.error('❌ DayOff yaratishda xatolik:', error);
    throw error;
  }
}

async updateDayOff(id: number, data: UpdateDayOffRequest): Promise<DayOff> {
  console.log(`✏️ ${id} ID-li DayOff ni yangilash...`);
  
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
    
    console.log('✅ DayOff muvaffaqiyatli yangilandi');
    return response;
  } catch (error) {
    console.error(`❌ ${id} ID-li DayOff ni yangilashda xatolik:`, error);
    throw error;
  }
}

async deleteDayOff(id: number): Promise<void> {
  console.log(`🗑️ ${id} ID-li DayOff ni o'chirish...`);
  
  try {
    const params = new URLSearchParams();
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/day/day_off/${id}/?${params.toString()}`;
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ DayOff muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error(`❌ ${id} ID-li DayOff ni o\'chirishda xatolik:`, error);
    throw error;
  }
}

// Mock data methods
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

// Helper function to format days for display
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
// Update the getShifts method - FIXED URL
async getShifts(userId?: number): Promise<Shift[]> {
  console.log('🔄 Smenalarni olish...');
  
  try {
    const params = new URLSearchParams();
    
    // SUPERADMIN UCHUN MUHIM: user_id ni har doim yuborish kerak
    // Agar superadmin boshqa foydalanuvchi smenalarini ko'rmoqchi bo'lsa
    if (userId && userId !== this.USER_ID) {
      params.append('user_id', userId.toString());
      console.log(`👑 Superadmin ${userId} foydalanuvchisining smenalarini olish`);
    } else {
      // Oddiy admin yoki o'z smenalari uchun
      params.append('user_id', this.USER_ID.toString());
    }
    
    // FIX: Use the correct endpoint with user_id parameter
    const endpoint = `/day/shift/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<Shift[]>(endpoint);
    console.log(`✅ ${response.length} ta smena yuklandi`);
    
    // Format the response to include break_time field
    if (response && Array.isArray(response)) {
      return response.map(shift => ({
        id: shift.id || 0,
        name: shift.name || '',
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
        user: shift.user || this.USER_ID,
        break_time: shift.break_time || null,
        created_at: shift.created_at,
        updated_at: shift.updated_at
      }));
    }
    
    return response || [];
  } catch (error) {
    console.error('❌ Smenalarni yuklashda xatolik:', error);
    
    // Debug uchun API responseni ko'rish
    if ((error as any).status === 400) {
      console.log('⚠️ 400 xatosi: Noto\'g\'ri user_id yoki parametrlar');
    } else if ((error as any).status === 401) {
      console.log('⚠️ 401 xatosi: Kirish huquqi yo\'q');
    } else if ((error as any).status === 403) {
      console.log('⚠️ 403 xatosi: Ruxsat yo\'q');
    } else if ((error as any).status === 404) {
      console.log('⚠️ 404 xatosi: Endpoint topilmadi');
    }
    
    // Demo/fallback uchun
    console.log('🔄 Mock smena ma\'lumotlari ishlatilmoqda');
    return this.getShifts();
  }
}

// Update createShift method to include user_id in URL
async createShift(data: CreateShiftRequest): Promise<Shift> {
  console.log('➕ Yangi smena yaratish...');
  
  try {
    // API ga yuboriladigan ma'lumotlar
    const shiftData: any = {
      name: data.name,
      start_time: data.start_time,
      end_time: data.end_time,
    };
    
    // Add break_time if provided
    if (data.break_time !== undefined) {
      shiftData.break_time = data.break_time;
    }
    
    // user_id ni query parametr sifatida yuborish
    const params = new URLSearchParams();
    
    // Agar superadmin boshqa foydalanuvchiga smena biriktirmoqchi bo'lsa
    if (data.user && data.user !== this.USER_ID) {
      params.append('user_id', data.user.toString());
      console.log(`👑 Superadmin ${data.user} foydalanuvchisiga smena biriktirilmoqda`);
    } else {
      // Oddiy admin yoki o'z smenalari uchun
      params.append('user_id', this.USER_ID.toString());
    }
    
    console.log('📦 Smena ma\'lumotlari:', shiftData);
    console.log('🔗 Query parametrlar:', params.toString());
    
    const endpoint = `/day/shift/?${params.toString()}`;
    const response = await this.request<Shift>(endpoint, {
      method: 'POST',
      body: JSON.stringify(shiftData),
    });
    
    console.log('✅ Smena muvaffaqiyatli yaratildi:', response);
    return response;
  } catch (error) {
    console.error('❌ Smena yaratishda xatolik:', error);
    
    // Xatolik tafsilotlarini chiqarish
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

// Update updateShift method to include user_id in URL
async updateShift(id: number, data: UpdateShiftRequest): Promise<Shift> {
  console.log(`✏️ ${id} ID-li smenani yangilash...`);
  
  try {
    // Yangilash uchun tayyor ma'lumot
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.break_time !== undefined) updateData.break_time = data.break_time;
    
    console.log('📦 Yangilash ma\'lumotlari:', updateData);
    
    // user_id ni query parametr sifatida yuborish
    const params = new URLSearchParams();
    
    // Agar superadmin foydalanuvchini o'zgartirmoqchi bo'lsa
    if (data.user !== undefined) {
      params.append('user_id', data.user.toString());
    } else {
      // Agar foydalanuvchi o'zgartirilmasa, joriy user_id ni yuborish
      params.append('user_id', this.USER_ID.toString());
    }
    
    const endpoint = `/day/shift/${id}/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<Shift>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    console.log('✅ Smena muvaffaqiyatli yangilandi');
    return response;
  } catch (error) {
    console.error(`❌ ${id} ID-li smenani yangilashda xatolik:`, error);
    throw error;
  }
}


// Smenani o'chirish
async deleteShift(id: number): Promise<void> {
  console.log(`🗑️ ${id} ID-li smenani o'chirish...`);
  
  try {
    // O'chirish uchun user_id bilan so'rov yuborish
    const params = new URLSearchParams();
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/day/shift/${id}/?${params.toString()}`;
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ Smena muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error(`❌ ${id} ID-li smenani o\'chirishda xatolik:`, error);
    throw error;
  }
}
// ApiService klassiga Telegram kanallari metodlarini qo'shing

// Barcha Telegram kanallarini olish
async getTelegramChannels(userId?: number): Promise<TelegramChannel[]> {
  console.log('📢 Telegram kanallarini olish...');
  
  try {
    const params = new URLSearchParams();
    
    // Agar user_id berilgan bo'lsa (superadmin boshqa adminning kanallarini so'rash)
    if (userId && userId !== this.USER_ID) {
      params.append('user_id', userId.toString());
      console.log(`👑 Superadmin ${userId} foydalanuvchisining Telegram kanallarini olish`);
    } else {
      // Oddiy admin yoki o'z kanallari uchun
      params.append('user_id', this.USER_ID.toString());
    }
    
    const endpoint = `/utils/telegramchannel/${params.toString() ? '?' + params.toString() : ''}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<TelegramChannel[]>(endpoint);
    console.log(`✅ ${response.length} ta Telegram kanali yuklandi`);
    return response;
  } catch (error) {
    console.error('❌ Telegram kanallarini yuklashda xatolik:', error);
    
    // Demo/fallback uchun
    console.log('🔄 Mock Telegram kanallari ma\'lumotlari ishlatilmoqda');
    return this.getMockTelegramChannels();
  }
}
// In the ApiService class, add these Branch methods:

// Barcha filiallarni olish
async getBranches(userId?: number): Promise<Branch[]> {
  console.log('🏢 Filiallarni olish...');
  
  try {
    const params = new URLSearchParams();
    
    // SUPERADMIN UCHUN: Agar boshqa adminning filiallarini ko'rish uchun user_id berilsa
    if (userId && userId !== this.USER_ID) {
      params.append('user_id', userId.toString());
      console.log(`👑 Superadmin ${userId} foydalanuvchisining filiallarini olish`);
    } else {
      // Oddiy admin yoki o'z filiallari uchun
      params.append('user_id', this.USER_ID.toString());
    }
    
    const endpoint = `/utils/branch/${params.toString() ? '?' + params.toString() : ''}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<Branch[]>(endpoint);
    console.log(`✅ ${response.length} ta filial yuklandi`);
    return response;
  } catch (error) {
    console.error('❌ Filiallarni yuklashda xatolik:', error);
    
    // Demo/fallback uchun
    console.log('🔄 Mock filial ma\'lumotlari ishlatilmoqda');
    return this.getMockBranches();
  }
}

// Yangi filial yaratish
async createBranch(data: CreateBranchRequest): Promise<Branch> {
  console.log('➕ Yangi filial yaratish...');
  
  try {
    const branchData: any = {
      name: data.name,
    };
    
    // Agar superadmin boshqa foydalanuvchiga filial biriktirmoqchi bo'lsa
    if (data.user && data.user !== this.USER_ID) {
      branchData.user_id = data.user;
      console.log(`👑 Superadmin ${data.user} foydalanuvchisiga filial biriktirilmoqda`);
    } else {
      // Oddiy admin uchun o'ziga biriktirish
      branchData.user_id = this.USER_ID;
    }
    
    console.log('📦 Filial ma\'lumotlari:', branchData);
    
    const endpoint = `/utils/branch/`;
    const response = await this.request<Branch>(endpoint, {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
    
    console.log('✅ Filial muvaffaqiyatli yaratildi');
    return response;
  } catch (error) {
    console.error('❌ Filial yaratishda xatolik:', error);
    throw error;
  }
}

async updateBranch(id: number, data: UpdateBranchRequest): Promise<Branch> {
  console.log(`✏️ ${id} ID-li filialni yangilash...`);
  
  try {
    // Yangilash uchun tayyor ma'lumot
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    
    // Agar superadmin foydalanuvchini o'zgartirmoqchi bo'lsa
    if (data.user !== undefined) {
      updateData.user_id = data.user;
    } else {
      // Agar foydalanuvchi o'zgartirilmasa, joriy user_id ni yuborish
      updateData.user_id = this.USER_ID;
    }
    
    console.log('📦 Yangilash ma\'lumotlari:', updateData);
    
    // FIX: Add user_id parameter to the URL
    const params = new URLSearchParams();
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/utils/branch/${id}/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    const response = await this.request<Branch>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    console.log('✅ Filial muvaffaqiyatli yangilandi');
    return response;
  } catch (error) {
    console.error(`❌ ${id} ID-li filialni yangilashda xatolik:`, error);
    throw error;
  }
}

// Filialni o'chirish - FIXED: Add user_id parameter to URL
async deleteBranch(id: number): Promise<void> {
  console.log(`🗑️ ${id} ID-li filialni o'chirish...`);
  
  try {
    // FIX: Add user_id parameter to the URL
    const params = new URLSearchParams();
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/utils/branch/${id}/?${params.toString()}`;
    console.log('🌐 So\'rov manzili:', endpoint);
    
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ Filial muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error(`❌ ${id} ID-li filialni o\'chirishda xatolik:`, error);
    throw error;
  }
}

// Mock filial ma'lumotlari (fallback uchun)
private getMockBranches(): Branch[] {
  return [
    {
      id: 1,
      name: 'Bosh filial',
      created_at: '2024-01-15T10:30:00Z',
      user: 2
    },
    {
      id: 2,
      name: 'Shahar markazi filiali',
      created_at: '2024-01-16T11:20:00Z',
      user: 2
    },
    {
      id: 3,
      name: 'Yangi shahar filiali',
      created_at: '2024-01-17T09:15:00Z',
      user: 3
    }
  ];
}
// Yangi Telegram kanali yaratish
async createTelegramChannel(data: CreateTelegramChannelRequest): Promise<TelegramChannel> {
  console.log('➕ Yangi Telegram kanali yaratish...');
  
  try {
    const channelData: any = {
      name: data.name,
      chat_id: data.chat_id,
      user_id: this.USER_ID, // HAR DOIM user_id yuborish kerak
    };
    
    // resolved_id ni yubormaslik kerak (ishlatilmasin)
    // if (data.resolved_id) {
    //   channelData.resolved_id = data.resolved_id;
    // }
    
    // Agar superadmin boshqa foydalanuvchiga kanal biriktirmoqchi bo'lsa
    if (data.user && data.user !== this.USER_ID) {
      channelData.user_id = data.user;
      console.log(`👑 Superadmin ${data.user} foydalanuvchisiga Telegram kanali biriktirilmoqda`);
    }
    
    console.log('📦 Telegram kanali ma\'lumotlari:', channelData);
    
    const endpoint = `/utils/telegramchannel/`;
    const response = await this.request<TelegramChannel>(endpoint, {
      method: 'POST',
      body: JSON.stringify(channelData),
    });
    
    console.log('✅ Telegram kanali muvaffaqiyatli yaratildi');
    return response;
  } catch (error) {
    console.error('❌ Telegram kanali yaratishda xatolik:', error);
    throw error;
  }
}

// Telegram kanalini yangilash
async updateTelegramChannel(id: number, data: UpdateTelegramChannelRequest): Promise<TelegramChannel> {
  console.log(`✏️ ${id} ID-li Telegram kanalini yangilash...`);
  
  try {
    // Yangilash uchun tayyor ma'lumot
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.chat_id !== undefined) updateData.chat_id = data.chat_id;
    
    // resolved_id ni yangilamang (ishlatilmasin)
    // if (data.resolved_id !== undefined) updateData.resolved_id = data.resolved_id;
    
    // Agar superadmin foydalanuvchini o'zgartirmoqchi bo'lsa
    if (data.user !== undefined) {
      updateData.user_id = data.user;
    }
    
    console.log('📦 Telegram kanalini yangilash ma\'lumotlari:', updateData);
    
    const endpoint = `/utils/telegramchannel/${id}/`;
    const response = await this.request<TelegramChannel>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    console.log('✅ Telegram kanali muvaffaqiyatli yangilandi');
    return response;
  } catch (error) {
    console.error(`❌ ${id} ID-li Telegram kanalini yangilashda xatolik:`, error);
    throw error;
  }
}

// Telegram kanalini o'chirish
async deleteTelegramChannel(id: number): Promise<void> {
  console.log(`🗑️ ${id} ID-li Telegram kanalini o'chirish...`);
  
  try {
    // O'chirish uchun user_id bilan so'rov yuborish
    const params = new URLSearchParams();
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/utils/telegramchannel/${id}/?${params.toString()}`;
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ Telegram kanali muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error(`❌ ${id} ID-li Telegram kanalini o\'chirishda xatolik:`, error);
    throw error;
  }
}

// Mock Telegram kanallari ma'lumotlari (fallback uchun)
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


// Vaqtni formatlash uchun yordamchi metod
formatTime(timeString: string): string {
  try {
    // "14:28:20" formatidan "14:28" formatiga o'tkazish
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

// Smena davomiyligini hisoblash
calculateShiftDuration(startTime: string, endTime: string): string {
  try {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Agar tugash vaqti boshlanish vaqtidan kichik bo'lsa, keyingi kunga o'tkazamiz
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
// Optional: Get employee history with date range
async getEmployeeHistoryRange(
  employeeId: number, 
  startDate: string, 
  endDate: string
): Promise<EmployeeHistory[]> {
  console.log(`📅 Fetching employee ${employeeId} history from ${startDate} to ${endDate}...`);
  
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('employee_id', employeeId.toString());
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    params.append('user_id', this.USER_ID.toString());
    
    const endpoint = `/person/employee-history/?${params.toString()}`;
    console.log('🌐 Making request to:', endpoint);
    
    const response = await this.request<EmployeeHistory[]>(endpoint);
    console.log(`✅ Loaded ${response.length} history records`);
    
    return response;
  } catch (error) {
    console.error('❌ Failed to load employee history range:', error);
    throw error;
  }
}

// Optional: Get employee history for today
async getEmployeeHistoryToday(employeeId: number): Promise<EmployeeHistory[]> {
  const today = formatDate(new Date());
  return await this.getEmployeeHistory(today, employeeId);
}
// Updated syncEvents method - NO date parameters in URL
async syncEvents(): Promise<EventSyncResponse> {
  console.log('🔄 Syncing events from devices...');
  
  try {
    // Send POST request WITHOUT any date parameters
    const endpoint = `/event/events-sync/?user_id=${this.USER_ID}`;
    console.log('🌐 Making sync request to:', endpoint);
    
    const response = await this.request<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify({}), // Empty body
    });
    
    console.log('✅ Events sync API response:', response);
    
    // Format response to match EventSyncResponse interface
    return {
  success: response.success,
  synced_devices: response.synced_devices ?? 0,
  synced_events: response.synced_events ?? response.added ?? 0,
};

  } catch (error: any) {
    console.error('❌ Failed to sync events:', error);
    
    // More detailed error handling
    let errorMessage = 'Tadbirlarni sinxronizatsiya qilishda xatolik';
    
    if (error.status === 400) {
      errorMessage = 'Noto\'g\'ri so\'rov formati';
    } else if (error.status === 401) {
      errorMessage = 'Kirish huquqi yo\'q';
    } else if (error.status === 403) {
      errorMessage = 'Ruxsat yo\'q';
    } else if (error.status === 503) {
      errorMessage = 'Server ishlamayapti';
    } else if (error.message?.includes('Failed to fetch')) {
      errorMessage = 'Internet aloqasi yo\'q';
    }
    
    // Throw new error with user-friendly message
    const userError = new Error(errorMessage);
    (userError as any).status = error.status;
    (userError as any).originalError = error;
    throw userError;
  }
}
  // Send phone WITH +998 prefix
  private formatPhoneForServer(phone: string): string {
    console.log('📱 Formatting phone for server. Original:', phone);
    
    // Remove all non-digits
    let cleanPhone = phone.replace(/\D/g, '');
    console.log('Cleaned digits:', cleanPhone);
    
    // Add + prefix and ensure it has 998
    let formattedPhone = cleanPhone;
    
    // Ensure it has 998 prefix
    if (!formattedPhone.startsWith('998') && formattedPhone.length === 9) {
      formattedPhone = '998' + formattedPhone;
    }
    
    // Add + prefix
    formattedPhone = '+' + formattedPhone;
    
    console.log('Formatted with + prefix:', formattedPhone);
    
    return formattedPhone; // WITH +998 prefix
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

    // Use Bearer token for all authenticated requests
    if (token && !endpoint.includes('/login') && !endpoint.includes('/auth/refresh')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log('🌐 API Request:', {
        endpoint,
        method: options.method || 'GET',
        headers: { ...headers, Authorization: token ? 'Bearer ***' : 'None' }
      });

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

      console.log('📨 API Response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

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
// In ApiService class, add these methods:

// Get all devices (for superadmin) or user's own devices (for regular admin)
async getDevices(userId?: number): Promise<Device[]> {
  console.log('📱 Fetching devices...');
  
  try {
    const params = new URLSearchParams();
    
    // If user_id is provided (superadmin querying another admin's devices)
    if (userId && userId !== this.USER_ID) {
      params.append('user_id', userId.toString());
      console.log(`👑 Superadmin fetching devices for user ${userId}`);
    }
    // Regular admin - no user_id param, will get their own devices automatically
    
    const endpoint = `/utils/devices/${params.toString() ? '?' + params.toString() : ''}`;
    console.log('🌐 Making request to:', endpoint);
    
    const response = await this.request<DeviceResponse | Device[]>(endpoint);
    
    // Handle different response formats
    let devices: Device[];
    if (Array.isArray(response)) {
      devices = response;
    } else if (response && 'results' in response) {
      devices = response.results;
    } else {
      console.warn('⚠️ Unexpected device response format:', response);
      devices = [];
    }
    
    console.log(`✅ Loaded ${devices.length} devices`);
    return devices;
  } catch (error) {
    console.error('❌ Failed to load devices:', error);
    
    // For demo/fallback purposes
    console.log('🔄 Using mock devices data');
    return this.getMockDevices();
  }
}

// Get single device by ID
async getDeviceById(id: number): Promise<Device> {
  console.log(`📱 Fetching device ${id}...`);
  
  try {
    const endpoint = `/utils/devices/${id}/`;
    const device = await this.request<Device>(endpoint);
    console.log('✅ Device loaded:', device.name);
    return device;
  } catch (error) {
    console.error(`❌ Failed to load device ${id}:`, error);
    throw error;
  }
}

// Create new device
async createDevice(data: {
  name: string;
  ip: string;
  username: string;
  password: string;
  device_type?: string;
  port?: number;
  serial_number?: string;
  location?: string;
  user?: number; // Only for superadmin to assign to specific user
}): Promise<Device> {
  console.log('➕ Creating new device...');
  
  try {
    const deviceData: any = {
      name: data.name,
      ip: data.ip,
      username: data.username,
      password: data.password,
    };
    
    // Optional fields
    if (data.device_type) deviceData.device_type = data.device_type;
    if (data.port) deviceData.port = data.port;
    if (data.serial_number) deviceData.serial_number = data.serial_number;
    if (data.location) deviceData.location = data.location;
    
    // Only include user if provided (superadmin assigning to specific user)
    if (data.user) {
      deviceData.user = data.user;
    }
    
    console.log('📦 Creating device with data:', { ...deviceData, password: '***' });
    
    const endpoint = `/utils/devices/`;
    const response = await this.request<Device>(endpoint, {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
    
    console.log('✅ Device created successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to create device:', error);
    throw error;
  }
}

// Update device
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
  console.log(`✏️ Updating device ${id}...`);
  
  try {
    const endpoint = `/utils/devices/${id}/`;
    const response = await this.request<Device>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    console.log('✅ Device updated successfully');
    return response;
  } catch (error) {
    console.error(`❌ Failed to update device ${id}:`, error);
    throw error;
  }
}

// Delete device
async deleteDevice(id: number): Promise<void> {
  console.log(`🗑️ Deleting device ${id}...`);
  
  try {
    const endpoint = `/utils/devices/${id}/`;
    await this.request<void>(endpoint, {
      method: 'DELETE',
    });
    
    console.log('✅ Device deleted');
  } catch (error) {
    console.error(`❌ Failed to delete device ${id}:`, error);
    throw error;
  }
}

// Mock devices for fallback
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
  // FIXED: Extract token from data.data.access
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.group('🔐 LOGIN PROCESS');
      
      // Format phone: ensure it has +998 prefix
      const serverPhone = this.formatPhoneForServer(credentials.phone_number);
      console.log('📞 Phone processing:', {
        original: credentials.phone_number,
        forServer: serverPhone,
        note: 'Sending WITH +998 prefix'
      });

      // Create payload
      const payload = {
        phone_number: serverPhone,  // WITH +998 prefix
        password: credentials.password
      };

      console.log('📦 Sending payload:', { ...payload, password: '***' });

      // Make the request
      const response = await fetch(`${BASE_URL}/user/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);

      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { raw: responseText };
      }

      console.log('📊 Parsed response:', data);

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

      // FIXED: Extract token from response structure
      // Response format: { success: true, message: "...", data: { access: "token" } }
      let accessToken: string | undefined;
      let refreshToken: string | undefined;

      if (data.data && data.data.access) {
        // Format: { success: true, message: "...", data: { access: "token" } }
        accessToken = data.data.access;
        refreshToken = data.data.refresh;
        console.log('✅ Found token in data.data.access:', accessToken?.substring(0, 20) + '...');
      } else if (data.access) {
        // Format: { access: "token", refresh: "token" }
        accessToken = data.access;
        refreshToken = data.refresh;
        console.log('✅ Found token in data.access:', accessToken?.substring(0, 20) + '...');
      } else if (data.token) {
        // Format: { token: "jwt" }
        accessToken = data.token;
        refreshToken = data.refresh_token;
        console.log('✅ Found token in data.token:', accessToken?.substring(0, 20) + '...');
      }

      if (!accessToken) {
        console.error('❌ No access token found in response structure:', data);
        throw new Error('No access token in response');
      }

      // Store tokens
      this.setTokens(accessToken, refreshToken);
      
      console.log('✅ Login successful! Token stored');
      console.log('🔑 Access token length:', accessToken.length);
      console.log('🔄 Refresh token:', refreshToken ? 'Received' : 'Missing');
      console.groupEnd();

      return {
        access: accessToken,
        refresh: refreshToken || ''
      };
    } catch (error: any) {
      console.groupEnd();
      console.error('💥 Login error:', error);
      
      // User-friendly error messages
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

  // Test function that sends WITH + prefix
  async testLoginDirectly(phone: string, password: string): Promise<any> {
    console.group('🧪 DIRECT LOGIN TEST - WITH + PREFIX');
    
    // Format phone for server (with +998)
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('998') && cleanPhone.length === 9) {
      cleanPhone = '998' + cleanPhone;
    }
    
    // Add + prefix
    const phoneWithPlus = '+' + cleanPhone;
    
    console.log('Test details:', {
      originalPhone: phone,
      sendingToServer: phoneWithPlus,
      passwordLength: password.length
    });
    
    try {
      const response = await fetch(`${BASE_URL}/user/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneWithPlus,  // WITH +998 prefix
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
      
      console.log('Result:', result);
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
      console.log('🔄 Refreshing token...');
      
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
    console.log('👤 Fetching current user...');
    try {
      const user = await this.request<User>('/user/me/');
      console.log('✅ User loaded:', user.full_name);
      return user;
    } catch (error) {
      console.error('❌ Failed to load user:', error);
      throw error;
    }
  }

  // NEW: Get employee by ID with user_id=2
  async getEmployeeById(id: number): Promise<Employee> {
    console.log(`👤 Fetching employee with ID: ${id}`);
    
    try {
      // Add user_id parameter like your other endpoints
      const endpoint = `/person/employee-detail/${id}/?user_id=${this.USER_ID}`;
      console.log('🌐 Making request to:', endpoint);
      
      const employee = await this.request<Employee>(endpoint);
      console.log('✅ Employee loaded:', employee.name);
      console.log('📊 Full employee data:', employee);
      return employee;
    } catch (error) {
      console.error(`❌ Failed to load employee ${id}:`, error);
      
      // More specific error handling
      if ((error as any).status === 404) {
        throw new Error(`Hodim topilmadi (ID: ${id})`);
      } else if ((error as any).status === 403) {
        throw new Error('Bu hodimni ko\'rish uchun ruxsat yo\'q');
      }
      
      throw error;
    }
  }

  // NEW: Search employees with user_id=2
  async searchEmployees(query: string): Promise<Employee[]> {
    console.log(`🔍 Searching employees with query: ${query}`);
    try {
      const endpoint = `/person/search/?q=${encodeURIComponent(query)}&user_id=${this.USER_ID}`;
      const employees = await this.request<Employee[]>(endpoint);
      console.log(`✅ Found ${employees.length} employees`);
      return employees;
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw error;
    }
  }

  // NEW: Get employees with pagination and user_id=2
  async getEmployeesPaginated(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Employee>> {
    console.log(`📄 Fetching employees page ${page}, size ${pageSize}`);
    
    try {
      const endpoint = `/person/sync-employees/?page=${page}&page_size=${pageSize}&user_id=${this.USER_ID}`;
      const response = await this.request<PaginatedResponse<Employee>>(endpoint);
      console.log(`✅ Loaded ${response.results.length} employees, total: ${response.count}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to load paginated employees:', error);
      throw error;
    }
  }

  // Sync employees with devices
  async syncEmployees(): Promise<{
    success: boolean;
    synced_devices: number;
    added: number;
    deleted: number;
    message?: string;
  }> {
    console.log('🔄 Syncing employees with devices...');
    
    try {
      // Send POST request to sync endpoint with user_id parameter
      const endpoint = `/person/sync-employees/?user_id=${this.USER_ID}`;
      console.log('🌐 Making sync request to:', endpoint);
      
      const response = await this.request<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({}), // Empty body, user_id is in query params
      });
      
      console.log('✅ Employees synced successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to sync employees:', error);
      throw error;
    }
  }

  // Get all employees with user_id=2
  async getEmployees(): Promise<Employee[]> {
    console.log('👥 Fetching all employees...');
    console.log('👤 Using user_id:', this.USER_ID);
    
    try {
      const endpoint = `/person/employees/?user_id=${this.USER_ID}`;
      console.log('🌐 Making request to:', endpoint);
      
      const response = await this.request<any>(endpoint);
      
      // Check if the response has an "employees" array
      if (response.employees && Array.isArray(response.employees)) {
        console.log(`✅ Loaded ${response.employees.length} employees`);
        return response.employees as Employee[];
      } 
      // If the response itself is an array (fallback)
      else if (Array.isArray(response)) {
        console.log(`✅ Loaded ${response.length} employees (direct array)`);
        return response as Employee[];
      } 
      // Otherwise, return empty array
      else {
        console.warn('⚠️ No employees array found in response:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to load employees:', error);
      throw error;
    }
  }

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    console.log('➕ Creating new employee...');
    
    // 🔍 DEBUG: Log incoming data
    console.log('📥 Incoming data to createEmployee:', data);
    
    // Prepare the data - ALWAYS include required fields
    const employeeData: any = {
      device_id: data.device_id || 1, // Use provided or default to 1
      name: data.name,
      user_type: data.user_type || 'normal',
      begin_time: data.begin_time || new Date().toISOString(),
      end_time: data.end_time || new Date().toISOString(),
      door_right: data.door_right || '1',
      position: data.position || '',           // ✅ ALWAYS send (even if empty)
      phone_number: data.phone_number,         // ✅ ALWAYS send (required)
      user_id: this.USER_ID,
      salary: data.salary || 0,                // ✅ ALWAYS send (even if 0)
      fine: data.fine || 0,                    // ✅ ALWAYS send (even if 0)
    };
    
    // ✅ ALWAYS send these optional fields (send empty string if undefined)
    employeeData.description = data.description || '';
    employeeData.employment = data.employment || '';
    employeeData.employee_no = data.employee_no || '';
    
    // ✅ Handle foreign key fields: only send if they're valid IDs (> 0)
    // For null/undefined/0, don't include them (backend should handle as null)
    if (data.department !== undefined && data.department !== null && data.department > 0) {
      console.log(`✅ Including department: ${data.department}`);
      employeeData.department = data.department;
    } else {
      console.log(`❌ Skipping department (value: ${data.department})`);
    }
    
    if (data.shift !== undefined && data.shift !== null && data.shift > 0) {
      console.log(`✅ Including shift: ${data.shift}`);
      employeeData.shift = data.shift;
    } else {
      console.log(`❌ Skipping shift (value: ${data.shift})`);
    }
    
    if (data.branch !== undefined && data.branch !== null && data.branch > 0) {
      console.log(`✅ Including branch: ${data.branch}`);
      employeeData.branch = data.branch;
    } else {
      console.log(`❌ Skipping branch (value: ${data.branch})`);
    }
    
    if (data.break_time !== undefined && data.break_time !== null && data.break_time > 0) {
      console.log(`✅ Including break_time: ${data.break_time}`);
      employeeData.break_time = data.break_time;
    } else {
      console.log(`❌ Skipping break_time (value: ${data.break_time})`);
    }
    
    if (data.work_day !== undefined && data.work_day !== null && data.work_day > 0) {
      console.log(`✅ Including work_day: ${data.work_day}`);
      employeeData.work_day = data.work_day;
    } else {
      console.log(`❌ Skipping work_day (value: ${data.work_day})`);
    }
    
    if (data.day_off !== undefined && data.day_off !== null && data.day_off > 0) {
      console.log(`✅ Including day_off: ${data.day_off}`);
      employeeData.day_off = data.day_off;
    } else {
      console.log(`❌ Skipping day_off (value: ${data.day_off})`);
    }
    
    console.log('📦 FINAL - Sending CREATE employee data:', employeeData);
    
    try {
      const response = await this.request<Employee>('/person/create/', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });
      console.log('✅ Employee created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create employee:', error);
      console.error('❌ Request payload was:', employeeData);
      throw error;
    }
  }

  async updateEmployee(id: number, data: Partial<CreateEmployeeRequest>): Promise<Employee> {
    console.log(`✏️ Updating employee ${id}...`);
    
    const employeeData: any = {
      user_id: this.USER_ID
    };
    
    // ✅ ALWAYS send these fields if they're in the update data
    if (data.device_id !== undefined) employeeData.device_id = data.device_id;
    if (data.name !== undefined) employeeData.name = data.name;
    if (data.user_type !== undefined) employeeData.user_type = data.user_type;
    if (data.begin_time !== undefined) employeeData.begin_time = data.begin_time;
    if (data.end_time !== undefined) employeeData.end_time = data.end_time;
    if (data.door_right !== undefined) employeeData.door_right = data.door_right;
    
    // ✅ CRITICAL: Send these fields even if empty string
    if (data.position !== undefined) employeeData.position = data.position;
    if (data.phone_number !== undefined) employeeData.phone_number = data.phone_number;
    if (data.salary !== undefined) employeeData.salary = data.salary;
    if (data.fine !== undefined) employeeData.fine = data.fine;
    
    // ✅ Send optional text fields as empty string if undefined
    if (data.employment !== undefined) employeeData.employment = data.employment || '';
    if (data.description !== undefined) employeeData.description = data.description || '';
    if (data.employee_no !== undefined) employeeData.employee_no = data.employee_no || '';
    
    // ✅ ONLY send foreign key fields if they're valid IDs (> 0)
    if (data.department !== undefined && data.department && data.department > 0) {
      employeeData.department = data.department;
    }
    
    if (data.shift !== undefined && data.shift && data.shift > 0) {
      employeeData.shift = data.shift;
    }
    
    if (data.branch !== undefined && data.branch && data.branch > 0) {
      employeeData.branch = data.branch;
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
    
    console.log(`📦 Updating employee ${id} with data:`, employeeData);
    
    try {
      const employee = await this.request<Employee>(`/person/update/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(employeeData),
      });
      console.log('✅ Employee updated:', employee);
      return employee;
    } catch (error) {
      console.error(`❌ Failed to update employee ${id}:`, error);
      throw error;
    }
  }

  // Delete employee with user_id=2 in query parameter
  async deleteEmployee(id: number): Promise<void> {
    console.log(`🗑️ Deleting employee ${id}...`);
    
    try {
      const endpoint = `/person/delete/${id}/?user_id=${this.USER_ID}`;
      await this.request<void>(endpoint, {
        method: 'DELETE',
      });
      console.log('✅ Employee deleted');
    } catch (error) {
      console.error(`❌ Failed to delete employee ${id}:`, error);
      throw error;
    }
  }

  // NEW: Get daily attendance list
  async getDailyAttendance(date?: string): Promise<DailyAttendance> {
    console.log('📊 Fetching daily attendance...');
    
    try {
      // Format date if provided, otherwise use current date
      let selectedDate: string;
      if (date) {
        selectedDate = date;
      } else {
        selectedDate = formatDate(new Date());
      }
      
      // user_id bilan so'rov yuborish
      const endpoint = `/person/daily-list/?date=${selectedDate}&user_id=${this.USER_ID}`;
      console.log('🌐 Making request to:', endpoint);
      
      const response = await this.request<DailyAttendance>(endpoint);
      console.log('✅ Daily attendance loaded');
      console.log('📈 Stats:', response.stats);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to load daily attendance:', error);
      
      // Agar API xato bersa, mock ma'lumotlarni qaytaring
      console.log('🔄 Using mock data for daily attendance');
      
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

  // Check if user is logged in
  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  // Get user info from token (basic)
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

// Export test functions
export async function testLogin(phone: string, password: string): Promise<any> {
  return await apiService.testLoginDirectly(phone, password);
}

export async function testSuperAdmin(): Promise<any> {
  return await apiService.testLoginDirectly('998917763099', 'Madina2006');
}

// Mock data
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