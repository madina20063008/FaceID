// lib/api.ts - COMPLETE WITH ALL FIXES
const BASE_URL = 'https://45.55.129.34';

// Types
export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

export interface User {
  id: number;
  full_name: string;
  phone_number: string;
  role: string;
  is_active: boolean;
}

export interface Employee {
  id: number;
  employee_no: string;
  name: string;
  position: string;
  phone_number: string;
  local_face: string;
  device?: number;
  user_type?: string;
  begin_time?: string;
  end_time?: string;
  door_right?: string;
  employment?: string;
  department?: number | null;    // ✅ Add null
  shift?: number | null;         // ✅ Add null
  description?: string;
  salary?: number;
  break_time?: number | null;    // ✅ Add null
  work_day?: number | null;      // ✅ Add null
  branch?: number | null;        // ✅ Add null
  fine?: number;
  day_off?: number | null;       // ✅ Add null
  created_at?: string;
  updated_at?: string;
}

export interface DailyAttendance {
  date: string;
  employees: Array<{
    id: number;
    employee_no: string;
    name: string;
    kirish: string | null;
    chiqish: string | null;
    late: string;  // "0:00" formatida
    face: string;  // URL
  }>;
  stats: {
    total: number;
    came: number;
    late: number;
    absent: number;
  };
}

export interface CreateEmployeeRequest {
  device_id?: number;
  name: string;
  user_type?: string;
  begin_time?: string;
  end_time?: string;
  door_right?: string;
  employment?: string;
  department?: number | null;    // ✅ Add null
  position: string;
  shift?: number | null;         // ✅ Add null
  description?: string;
  phone_number: string;
  salary?: number;
  break_time?: number | null;    // ✅ Add null
  work_day?: number | null;      // ✅ Add null
  branch?: number | null;        // ✅ Add null
  fine?: number;
  day_off?: number | null;       // ✅ Add null
  employee_no?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
export interface EventSyncResponse {
  success: boolean;
  synced_devices: number;
  synced_events: number;
  from_date?: string;
  to_date?: string;
  message?: string;
  error?: string;
}

// Helper function to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

// Mock daily attendance (for fallback)
export const mockDailyAttendance: DailyAttendance = {
  date: formatDate(new Date()),
  employees: [
    {
      id: 1,
      employee_no: 'EMP001',
      name: 'Alisher Karimov',
      kirish: '09:00',
      chiqish: '18:00',
      late: '0:00',
      face: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    {
      id: 2,
      employee_no: 'EMP002',
      name: 'Dilnoza Umarova',
      kirish: null,
      chiqish: null,
      late: '0:00',
      face: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
  ],
  stats: {
    total: 10,
    came: 1,
    late: 0,
    absent: 9,
  },
};