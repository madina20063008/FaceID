// API Configuration and Service Layer
const BASE_URL = 'https://hikvision.pythonanywhere.com';

// Types
export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access: string;
  };
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
  device: number;
  name: string;
  user_type: string;
  begin_time: string;
  end_time: string;
  door_right: string;
  employment: string;
  department: number;
  position: string;
  shift: number;
  description: string;
  phone_number: string;
  salary: number;
  break_time: number;
  work_day: number;
  branch: number;
  fine: number;
  day_off: number;
}

// API Service
class ApiService {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('access_token', token);
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  clearAccessToken() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !endpoint.includes('/login')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.status === 401 && !endpoint.includes('/login')) {
        // Token expired, try to refresh
        await this.refreshToken();
        // Retry original request
        return this.request<T>(endpoint, options);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/user/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken(): Promise<{ access: string }> {
    const response = await this.request<{ access: string }>('/user/auth/refresh/', {
      method: 'POST',
    });
    this.setAccessToken(response.access);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/user/me/');
  }

  // Employee endpoints
  async getEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>('/person/sync-employees/');
  }

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    return this.request<Employee>('/person/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: number, data: Partial<CreateEmployeeRequest>): Promise<Employee> {
    return this.request<Employee>(`/person/update/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: number): Promise<void> {
    return this.request<void>(`/person/delete/${id}/`, {
      method: 'DELETE',
    });
  }

  // Daily attendance
  async getDailyAttendance(date: string): Promise<DailyAttendance> {
    return this.request<DailyAttendance>(`/person/daily-list/${date}`);
  }
}

export const apiService = new ApiService();

// Mock data for demonstration
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
  {
    id: 3,
    employee_no: 'EMP003',
    name: 'Sardor Abdullayev',
    position: 'Project Manager',
    phone_number: '+998901234569',
    local_face: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  },
];

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
      status: 'came',
    },
    {
      id: 2,
      employee_no: 'EMP002',
      name: 'Dilnoza Umarova',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      entry_time: '',
      exit_time: '',
      late: false,
      status: 'absent',
    },
  ],
  stats: {
    total: 10,
    came: 1,
    late: 0,
    absent: 9,
  },
};
