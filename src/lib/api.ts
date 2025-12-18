// // lib/api.ts - COMPLETE WITH EMPLOYEE BY ID
// const BASE_URL = 'https://45.55.129.34';

// // Types
// export interface LoginRequest {
//   phone_number: string;
//   password: string;
// }

// export interface LoginResponse {
//   access: string;
//   refresh: string;
// }

// export interface RefreshTokenRequest {
//   refresh: string;
// }

// export interface RefreshTokenResponse {
//   access: string;
//   refresh?: string;
// }

// export interface User {
//   id: number;
//   full_name: string;
//   phone_number: string;
//   role: string;
//   is_active: boolean;
// }

// export interface Employee {
//   id: number;
//   employee_no: string;
//   name: string;
//   position: string;
//   phone_number: string;
//   local_face: string;
//   device?: number;
//   user_type?: string;
//   begin_time?: string;
//   end_time?: string;
//   door_right?: string;
//   employment?: string;
//   department?: number;
//   shift?: number;
//   description?: string;
//   salary?: number;
//   break_time?: number;
//   work_day?: number;
//   branch?: number;
//   fine?: number;
//   day_off?: number;
//   created_at?: string;
//   updated_at?: string;
// }

// export interface DailyAttendance {
//   date: string;
//   employees: Array<{
//     id: number;
//     employee_no: string;
//     name: string;
//     photo: string;
//     entry_time: string;
//     exit_time: string;
//     late: boolean;
//     status: 'came' | 'late' | 'absent';
//   }>;
//   stats: {
//     total: number;
//     came: number;
//     late: number;
//     absent: number;
//   };
// }

// export interface CreateEmployeeRequest {
//   device: number;
//   name: string;
//   user_type: string;
//   begin_time: string;
//   end_time: string;
//   door_right: string;
//   employment: string;
//   department: number;
//   position: string;
//   shift: number;
//   description: string;
//   phone_number: string;
//   salary: number;
//   break_time: number;
//   work_day: number;
//   branch: number;
//   fine: number;
//   day_off: number;
//   employee_no?: string
// }

// export interface PaginatedResponse<T> {
//   count: number;
//   next: string | null;
//   previous: string | null;
//   results: T[];
// }

// // API Service
// class ApiService {
//   private accessToken: string | null = null;
//   private refreshTokenString: string | null = null;
//   private readonly USER_ID = 2; // Hardcoded user_id

//   setTokens(access: string, refresh?: string) {
//     this.accessToken = access;
//     localStorage.setItem('access_token', access);
    
//     if (refresh) {
//       this.refreshTokenString = refresh;
//       localStorage.setItem('refresh_token', refresh);
//     }
//   }

//   clearTokens() {
//     this.accessToken = null;
//     this.refreshTokenString = null;
//     localStorage.removeItem('access_token');
//     localStorage.removeItem('refresh_token');
//   }

//   getAccessToken(): string | null {
//     if (!this.accessToken) {
//       this.accessToken = localStorage.getItem('access_token');
//     }
//     return this.accessToken;
//   }

//   getRefreshToken(): string | null {
//     if (!this.refreshTokenString) {
//       this.refreshTokenString = localStorage.getItem('refresh_token');
//     }
//     return this.refreshTokenString;
//   }

//   // Send phone WITH +998 prefix
//   private formatPhoneForServer(phone: string): string {
//     console.log('📱 Formatting phone for server. Original:', phone);
    
//     // Remove all non-digits
//     let cleanPhone = phone.replace(/\D/g, '');
//     console.log('Cleaned digits:', cleanPhone);
    
//     // Add + prefix and ensure it has 998
//     let formattedPhone = cleanPhone;
    
//     // Ensure it has 998 prefix
//     if (!formattedPhone.startsWith('998') && formattedPhone.length === 9) {
//       formattedPhone = '998' + formattedPhone;
//     }
    
//     // Add + prefix
//     formattedPhone = '+' + formattedPhone;
    
//     console.log('Formatted with + prefix:', formattedPhone);
    
//     return formattedPhone; // WITH +998 prefix
//   }

//   private async request<T>(
//     endpoint: string,
//     options: RequestInit = {}
//   ): Promise<T> {
//     const token = this.getAccessToken();
    
//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//       ...options.headers,
//     };

//     // Use Bearer token for all authenticated requests
//     if (token && !endpoint.includes('/login') && !endpoint.includes('/auth/refresh')) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }

//     try {
//       console.log('🌐 API Request:', {
//         endpoint,
//         method: options.method || 'GET',
//         headers: { ...headers, Authorization: token ? 'Bearer ***' : 'None' }
//       });

//       const response = await fetch(`${BASE_URL}${endpoint}`, {
//         ...options,
//         headers,
//         mode: 'cors',
//       });

//       const responseText = await response.text();
//       let data: any;
//       try {
//         data = responseText ? JSON.parse(responseText) : {};
//       } catch {
//         data = { raw: responseText };
//       }

//       console.log('📨 API Response:', {
//         status: response.status,
//         statusText: response.statusText,
//         data
//       });

//       if (!response.ok) {
//         let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
//         if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
//           errorMessage = data.non_field_errors[0];
//         } else if (data.detail) {
//           errorMessage = data.detail;
//         } else if (data.message) {
//           errorMessage = data.message;
//         } else if (data.error) {
//           errorMessage = data.error;
//         }

//         const error = new Error(errorMessage);
//         (error as any).status = response.status;
//         (error as any).data = data;
//         throw error;
//       }

//       return data as T;
//     } catch (error) {
//       console.error('💥 API Error:', error);
//       throw error;
//     }
//   }

//   // FIXED: Extract token from data.data.access
//   async login(credentials: LoginRequest): Promise<LoginResponse> {
//     try {
//       console.group('🔐 LOGIN PROCESS');
      
//       // Format phone: ensure it has +998 prefix
//       const serverPhone = this.formatPhoneForServer(credentials.phone_number);
//       console.log('📞 Phone processing:', {
//         original: credentials.phone_number,
//         forServer: serverPhone,
//         note: 'Sending WITH +998 prefix'
//       });

//       // Create payload
//       const payload = {
//         phone_number: serverPhone,  // WITH +998 prefix
//         password: credentials.password
//       };

//       console.log('📦 Sending payload:', { ...payload, password: '***' });

//       // Make the request
//       const response = await fetch(`${BASE_URL}/user/login/`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       const responseText = await response.text();
//       console.log('📄 Raw response:', responseText);

//       let data: any;
//       try {
//         data = responseText ? JSON.parse(responseText) : {};
//       } catch {
//         data = { raw: responseText };
//       }

//       console.log('📊 Parsed response:', data);

//       if (!response.ok) {
//         console.error('❌ Login failed:', {
//           status: response.status,
//           data
//         });

//         let errorMessage = 'Login failed';
//         if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
//           errorMessage = data.non_field_errors[0];
//         } else if (data.message) {
//           errorMessage = data.message;
//         } else if (data.error) {
//           errorMessage = data.error;
//         }

//         throw new Error(errorMessage);
//       }

//       // FIXED: Extract token from response structure
//       // Response format: { success: true, message: "...", data: { access: "token" } }
//       let accessToken: string | undefined;
//       let refreshToken: string | undefined;

//       if (data.data && data.data.access) {
//         // Format: { success: true, message: "...", data: { access: "token" } }
//         accessToken = data.data.access;
//         refreshToken = data.data.refresh;
//         console.log('✅ Found token in data.data.access:', accessToken?.substring(0, 20) + '...');
//       } else if (data.access) {
//         // Format: { access: "token", refresh: "token" }
//         accessToken = data.access;
//         refreshToken = data.refresh;
//         console.log('✅ Found token in data.access:', accessToken?.substring(0, 20) + '...');
//       } else if (data.token) {
//         // Format: { token: "jwt" }
//         accessToken = data.token;
//         refreshToken = data.refresh_token;
//         console.log('✅ Found token in data.token:', accessToken?.substring(0, 20) + '...');
//       }

//       if (!accessToken) {
//         console.error('❌ No access token found in response structure:', data);
//         throw new Error('No access token in response');
//       }

//       // Store tokens
//       this.setTokens(accessToken, refreshToken);
      
//       console.log('✅ Login successful! Token stored');
//       console.log('🔑 Access token length:', accessToken.length);
//       console.log('🔄 Refresh token:', refreshToken ? 'Received' : 'Missing');
//       console.groupEnd();

//       return {
//         access: accessToken,
//         refresh: refreshToken || ''
//       };
//     } catch (error: any) {
//       console.groupEnd();
//       console.error('💥 Login error:', error);
      
//       // User-friendly error messages
//       let userMessage = error.message;
      
//       if (error.message.includes('Invalid phone number or password')) {
//         userMessage = 'Telefon raqami yoki parol noto\'g\'ri';
//       } else if (error.status === 400) {
//         userMessage = 'Noto\'g\'ri ma\'lumotlar kiritildi';
//       } else if (error.message.includes('Failed to fetch')) {
//         userMessage = 'Internet aloqasi yo\'q yoki server ishlamayapti';
//       } else if (error.message.includes('No access token')) {
//         userMessage = 'Serverdan token olinmadi. Admin bilan bog\'laning.';
//       }
      
//       throw new Error(userMessage);
//     }
//   }

//   async refreshAccessToken(): Promise<RefreshTokenResponse> {
//     const refreshToken = this.getRefreshToken();
    
//     if (!refreshToken) {
//       throw new Error('No refresh token');
//     }

//     try {
//       console.log('🔄 Refreshing token...');
      
//       const response = await this.request<RefreshTokenResponse>('/user/auth/refresh/', {
//         method: 'POST',
//         body: JSON.stringify({ refresh: refreshToken }),
//       });

//       if (response.access) {
//         this.setTokens(response.access, response.refresh);
//         return response;
//       }
      
//       throw new Error('Invalid refresh response');
//     } catch (error) {
//       console.error('Token refresh failed:', error);
//       this.clearTokens();
//       throw error;
//     }
//   }

//   async getCurrentUser(): Promise<User> {
//     console.log('👤 Fetching current user...');
//     try {
//       const user = await this.request<User>('/user/me/');
//       console.log('✅ User loaded:', user.full_name);
//       return user;
//     } catch (error) {
//       console.error('❌ Failed to load user:', error);
//       throw error;
//     }
//   }

//   // NEW: Get employee by ID
//   async getEmployeeById(id: number): Promise<Employee> {
//     console.log(`👤 Fetching employee with ID: ${id}`);
//     try {
//       const employee = await this.request<Employee>(`/person/get/${id}/`);
//       console.log('✅ Employee loaded:', employee.name);
//       return employee;
//     } catch (error) {
//       console.error(`❌ Failed to load employee ${id}:`, error);
//       throw error;
//     }
//   }

//   // NEW: Search employees with user_id=2
//   async searchEmployees(query: string): Promise<Employee[]> {
//     console.log(`🔍 Searching employees with query: ${query}`);
//     try {
//       const endpoint = `/person/search/?q=${encodeURIComponent(query)}&user_id=${this.USER_ID}`;
//       const employees = await this.request<Employee[]>(endpoint);
//       console.log(`✅ Found ${employees.length} employees`);
//       return employees;
//     } catch (error) {
//       console.error('❌ Search failed:', error);
//       throw error;
//     }
//   }

//   // NEW: Get employees with pagination and user_id=2
//   async getEmployeesPaginated(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Employee>> {
//     console.log(`📄 Fetching employees page ${page}, size ${pageSize}`);
    
//     try {
//       const endpoint = `/person/sync-employees/?page=${page}&page_size=${pageSize}&user_id=${this.USER_ID}`;
//       const response = await this.request<PaginatedResponse<Employee>>(endpoint);
//       console.log(`✅ Loaded ${response.results.length} employees, total: ${response.count}`);
//       return response;
//     } catch (error) {
//       console.error('❌ Failed to load paginated employees:', error);
//       throw error;
//     }
//   }

//   // Get all employees with user_id=2 (EXACTLY as in the documentation)
//   // In the ApiService class in lib/api.ts, update the getEmployees method:

// // Get all employees with user_id=2
// async getEmployees(): Promise<Employee[]> {
//   console.log('👥 Fetching all employees...');
//   console.log('👤 Using user_id:', this.USER_ID);
  
//   try {
//     // Try without trailing slash first (as shown in docs)
//     const endpoint = `/person/sync-employees?user_id=${this.USER_ID}`;
//     console.log('🌐 Making request to:', endpoint);
    
//     // The API returns an object with an "employees" property
//     const response = await this.request<any>(endpoint);
    
//     // Check if the response has an "employees" array
//     if (response.employees && Array.isArray(response.employees)) {
//       console.log(`✅ Loaded ${response.employees.length} employees`);
//       return response.employees as Employee[];
//     } 
//     // If the response itself is an array (fallback)
//     else if (Array.isArray(response)) {
//       console.log(`✅ Loaded ${response.length} employees (direct array)`);
//       return response as Employee[];
//     } 
//     // If we have a results array (pagination)
//     else if (response.results && Array.isArray(response.results)) {
//       console.log(`✅ Loaded ${response.results.length} employees (pagination results)`);
//       return response.results as Employee[];
//     }
//     // Otherwise, return empty array
//     else {
//       console.warn('⚠️ No employees array found in response:', response);
//       return [];
//     }
//   } catch (error) {
//     console.error('❌ Failed to load employees (no trailing slash):', error);
    
//     // If it fails, try with trailing slash
//     console.log('🔄 Retrying with trailing slash...');
//     try {
//       const endpoint = `/person/sync-employees/?user_id=${this.USER_ID}`;
//       const response = await this.request<any>(endpoint);
      
//       // Check if the response has an "employees" array
//       if (response.employees && Array.isArray(response.employees)) {
//         console.log(`✅ Loaded ${response.employees.length} employees on retry`);
//         return response.employees as Employee[];
//       } 
//       // If the response itself is an array (fallback)
//       else if (Array.isArray(response)) {
//         console.log(`✅ Loaded ${response.length} employees (direct array on retry)`);
//         return response as Employee[];
//       } 
//       // Otherwise, return empty array
//       else {
//         console.warn('⚠️ No employees array found in response on retry:', response);
//         return [];
//       }
//     } catch (retryError) {
//       console.error('❌ Retry also failed:', retryError);
//       throw retryError;
//     }
//   }
// }

//   // NEW: Get employee sync by ID with user_id=2
//   async getEmployeeSyncById(id: number): Promise<Employee> {
//     console.log(`👤 Fetching employee sync with ID: ${id}`);
    
//     try {
//       const endpoint = `/person/sync-employee/${id}/?user_id=${this.USER_ID}`;
//       const employee = await this.request<Employee>(endpoint);
//       console.log('✅ Employee sync loaded:', employee.name);
//       return employee;
//     } catch (error) {
//       console.error(`❌ Failed to load employee sync ${id}:`, error);
//       throw error;
//     }
//   }

//   // Create employee with user_id=2 in request body
//   async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
//     console.log('➕ Creating new employee...');
    
//     const employeeData = { 
//       ...data,
//       user_id: this.USER_ID // Add user_id=2 to the request body
//     };
    
//     try {
//       const employee = await this.request<Employee>('/person/create/', {
//         method: 'POST',
//         body: JSON.stringify(employeeData),
//       });
//       console.log('✅ Employee created:', employee.name);
//       return employee;
//     } catch (error) {
//       console.error('❌ Failed to create employee:', error);
//       throw error;
//     }
//   }

//   // Update employee with user_id=2 in request body
//   async updateEmployee(id: number, data: Partial<CreateEmployeeRequest>): Promise<Employee> {
//     console.log(`✏️ Updating employee ${id}...`);
    
//     const employeeData = { 
//       ...data,
//       user_id: this.USER_ID // Add user_id=2 to the request body
//     };
    
//     try {
//       const employee = await this.request<Employee>(`/person/update/${id}/`, {
//         method: 'PUT',
//         body: JSON.stringify(employeeData),
//       });
//       console.log('✅ Employee updated:', employee.name);
//       return employee;
//     } catch (error) {
//       console.error(`❌ Failed to update employee ${id}:`, error);
//       throw error;
//     }
//   }

//   // Delete employee with user_id=2 in query parameter
//   async deleteEmployee(id: number): Promise<void> {
//     console.log(`🗑️ Deleting employee ${id}...`);
    
//     try {
//       const endpoint = `/person/delete/${id}/?user_id=${this.USER_ID}`;
//       await this.request<void>(endpoint, {
//         method: 'DELETE',
//       });
//       console.log('✅ Employee deleted');
//     } catch (error) {
//       console.error(`❌ Failed to delete employee ${id}:`, error);
//       throw error;
//     }
//   }

//   // Daily attendance with user_id=2
//   async getDailyAttendance(date: string): Promise<DailyAttendance> {
//     console.log(`📅 Fetching daily attendance for ${date}...`);
    
//     try {
//       const endpoint = `/person/daily-list/${date}?user_id=${this.USER_ID}`;
//       const attendance = await this.request<DailyAttendance>(endpoint);
//       console.log('✅ Attendance loaded:', attendance.stats);
//       return attendance;
//     } catch (error) {
//       console.error('❌ Failed to load attendance:', error);
//       throw error;
//     }
//   }

//   // Test function that sends WITH + prefix
//   async testLoginDirectly(phone: string, password: string): Promise<any> {
//     console.group('🧪 DIRECT LOGIN TEST - WITH + PREFIX');
    
//     // Format phone for server (with +998)
//     let cleanPhone = phone.replace(/\D/g, '');
//     if (!cleanPhone.startsWith('998') && cleanPhone.length === 9) {
//       cleanPhone = '998' + cleanPhone;
//     }
    
//     // Add + prefix
//     const phoneWithPlus = '+' + cleanPhone;
    
//     console.log('Test details:', {
//       originalPhone: phone,
//       sendingToServer: phoneWithPlus,
//       passwordLength: password.length
//     });
    
//     try {
//       const response = await fetch(`${BASE_URL}/user/login/`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           phone_number: phoneWithPlus,  // WITH +998 prefix
//           password: password
//         }),
//       });
      
//       const text = await response.text();
//       let data;
//       try {
//         data = JSON.parse(text);
//       } catch {
//         data = { raw: text };
//       }
      
//       const result = {
//         success: response.ok,
//         status: response.status,
//         phoneSent: phoneWithPlus,
//         response: data,
//         note: 'Phone sent WITH +998 prefix'
//       };
      
//       console.log('Result:', result);
//       console.groupEnd();
//       return result;
//     } catch (error) {
//       console.error('Test error:', error);
//       console.groupEnd();
//       throw error;
//     }
//   }

//   // Alternative test: try different formats
//   async testAllPhoneFormats(phone: string, password: string): Promise<any[]> {
//     console.group('🧪 TESTING ALL PHONE FORMATS');
    
//     const cleanPhone = phone.replace(/\D/g, '');
//     const formats = [
//       { format: 'With + prefix', phone: '+' + cleanPhone },
//       { format: 'Without + prefix', phone: cleanPhone },
//       { format: 'With +998 prefix', phone: '+' + (cleanPhone.startsWith('998') ? cleanPhone : '998' + cleanPhone) },
//       { format: 'Without 998 prefix', phone: cleanPhone.startsWith('998') ? cleanPhone.substring(3) : cleanPhone },
//     ];
    
//     const results = [];
    
//     for (const { format, phone: testPhone } of formats) {
//       console.log(`\nTesting: ${format} - ${testPhone}`);
      
//       try {
//         const response = await fetch(`${BASE_URL}/user/login/`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             phone_number: testPhone,
//             password: password
//           }),
//         });
        
//         const text = await response.text();
//         let data;
//         try {
//           data = JSON.parse(text);
//         } catch {
//           data = { raw: text };
//         }
        
//         const result = {
//           format,
//           phoneSent: testPhone,
//           success: response.ok,
//           status: response.status,
//           response: data
//         };
        
//         console.log('Result:', result);
//         results.push(result);
        
//         if (response.ok) {
//           console.log(`✅ SUCCESS with format: ${format}`);
//           break;
//         }
//       } catch (error: any) {
//         console.error(`Error with format ${format}:`, error);
//         results.push({ format, phone: testPhone, error: error.message });
//       }
//     }
    
//     console.log('\n📊 All results:', results);
//     console.groupEnd();
//     return results;
//   }

//   // Check if user is logged in
//   isLoggedIn(): boolean {
//     const token = this.getAccessToken();
//     return !!token;
//   }

//   // Get user info from token (basic)
//   getUserIdFromToken(): number | null {
//     const token = this.getAccessToken();
//     if (!token) return null;
    
//     try {
//       // JWT tokens are in format: header.payload.signature
//       const payload = token.split('.')[1];
//       const decoded = JSON.parse(atob(payload));
//       return decoded.user_id || null;
//     } catch {
//       return null;
//     }
//   }

//   // Get device list (for employee creation) with user_id=2
//   async getDevices(): Promise<any[]> {
//     console.log('📱 Fetching devices...');
    
//     try {
//       const endpoint = `/device/list/?user_id=${this.USER_ID}`;
//       const devices = await this.request<any[]>(endpoint);
//       console.log(`✅ Loaded ${devices.length} devices`);
//       return devices;
//     } catch (error) {
//       console.error('❌ Failed to load devices:', error);
//       throw error;
//     }
//   }

//   // Get departments list with user_id=2
//   async getDepartments(): Promise<any[]> {
//     console.log('🏢 Fetching departments...');
    
//     try {
//       const endpoint = `/department/list/?user_id=${this.USER_ID}`;
//       const departments = await this.request<any[]>(endpoint);
//       console.log(`✅ Loaded ${departments.length} departments`);
//       return departments;
//     } catch (error) {
//       console.error('❌ Failed to load departments:', error);
//       throw error;
//     }
//   }

//   // Get branches list with user_id=2
//   async getBranches(): Promise<any[]> {
//     console.log('🏛️ Fetching branches...');
    
//     try {
//       const endpoint = `/branch/list/?user_id=${this.USER_ID}`;
//       const branches = await this.request<any[]>(endpoint);
//       console.log(`✅ Loaded ${branches.length} branches`);
//       return branches;
//     } catch (error) {
//       console.error('❌ Failed to load branches:', error);
//       throw error;
//     }
//   }

//   // Get shifts list with user_id=2
//   async getShifts(): Promise<any[]> {
//     console.log('🕒 Fetching shifts...');
    
//     try {
//       const endpoint = `/shift/list/?user_id=${this.USER_ID}`;
//       const shifts = await this.request<any[]>(endpoint);
//       console.log(`✅ Loaded ${shifts.length} shifts`);
//       return shifts;
//     } catch (error) {
//       console.error('❌ Failed to load shifts:', error);
//       throw error;
//     }
//   }
// }

// export const apiService = new ApiService();

// // Export test functions
// export async function testLogin(phone: string, password: string): Promise<any> {
//   return await apiService.testLoginDirectly(phone, password);
// }

// export async function testSuperAdmin(): Promise<any> {
//   return await apiService.testLoginDirectly('998917763099', 'Madina2006');
// }

// export async function testAllFormats(phone: string, password: string): Promise<any[]> {
//   return await apiService.testAllPhoneFormats(phone, password);
// }

// // Quick test function
// export async function quickTest(): Promise<any> {
//   console.group('🚀 QUICK TEST');
//   console.log('Testing superadmin login...');
  
//   try {
//     const result = await testSuperAdmin();
//     console.log('Result:', result);
//     console.groupEnd();
//     return result;
//   } catch (error) {
//     console.error('Quick test failed:', error);
//     console.groupEnd();
//     throw error;
//   }
// }

// // Mock data
// export const mockEmployees: Employee[] = [
//   {
//     id: 1,
//     employee_no: 'EMP001',
//     name: 'Alisher Karimov',
//     position: 'Frontend Developer',
//     phone_number: '+998901234567',
//     local_face: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
//   },
//   {
//     id: 2,
//     employee_no: 'EMP002',
//     name: 'Dilnoza Umarova',
//     position: 'Backend Developer',
//     phone_number: '+998901234568',
//     local_face: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
//   },
//   {
//     id: 3,
//     employee_no: 'EMP003',
//     name: 'Sardor Abdullayev',
//     position: 'Project Manager',
//     phone_number: '+998901234569',
//     local_face: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
//   },
// ];

// export const mockDailyAttendance: DailyAttendance = {
//   date: '2025-12-15',
//   employees: [
//     {
//       id: 1,
//       employee_no: 'EMP001',
//       name: 'Alisher Karimov',
//       photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
//       entry_time: '09:00',
//       exit_time: '18:00',
//       late: false,
//       status: 'came',
//     },
//     {
//       id: 2,
//       employee_no: 'EMP002',
//       name: 'Dilnoza Umarova',
//       photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
//       entry_time: '',
//       exit_time: '',
//       late: false,
//       status: 'absent',
//     },
//   ],
//   stats: {
//     total: 10,
//     came: 1,
//     late: 0,
//     absent: 9,
//   },
// };


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
    photo: string;
    entry_time: string;
    exit_time: string;
    late: boolean;
    status: 'came' | 'late' | 'absent';
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
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
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

  // NEW: Get employee by ID
  async getEmployeeById(id: number): Promise<Employee> {
    console.log(`👤 Fetching employee with ID: ${id}`);
    try {
      const employee = await this.request<Employee>(`/person/get/${id}/`);
      console.log('✅ Employee loaded:', employee.name);
      return employee;
    } catch (error) {
      console.error(`❌ Failed to load employee ${id}:`, error);
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

  // Get all employees with user_id=2
  async getEmployees(): Promise<Employee[]> {
    console.log('👥 Fetching all employees...');
    console.log('👤 Using user_id:', this.USER_ID);
    
    try {
      const endpoint = `/person/sync-employees/?user_id=${this.USER_ID}`;
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


// Add this at the end of your lib/api.ts file (before the closing brace):

export const mockDailyAttendance: DailyAttendance = {
  date: '2025-12-15',
  employees: [
    {
      id: 1,
      employee_no: 'EMP001',
      name: 'Alisher Karimov',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      entry_time: '09:00',
      exit_time: '18:00',
      late: false,
      status: 'came' as 'came',
    },
    {
      id: 2,
      employee_no: 'EMP002',
      name: 'Dilnoza Umarova',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      entry_time: '',
      exit_time: '',
      late: false,
      status: 'absent' as 'absent',
    },
  ],
  stats: {
    total: 10,
    came: 1,
    late: 0,
    absent: 9,
  },
};