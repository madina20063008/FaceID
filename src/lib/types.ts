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
  subscription: any;
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

// In api.ts, update the interface to match the actual API response
export interface DailyAttendance {
  date: string;
  employees: Array<{
    id?: number;
    employee_id?: number; // ✅ Changed from 'id' to 'employee_id'
    employee_no: string;
    name: string;
    kirish: string | null;
    chiqish: string | null;
    late: string;
    face: string;
    position: string;
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

export interface EmployeeHistory {
    id: number,
    event_time: string,
    label_name: string
}

// In api.ts, add Device interface after other interfaces
export interface Device {
  id: number;
  name: string;
  ip: string;
  username: string;
  password: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  user: number; // user ID who owns this device
  device_type?: string;
  port?: number;
  serial_number?: string;
  location?: string;
  last_sync?: string;
}

export interface DeviceResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Device[];
}


// Telegram kanallari uchun interfeyslar
export interface TelegramChannel {
  id: number;
  name: string;
  chat_id: string;
  resolved_id: string;
  user: number; // user ID who owns this channel
  created_at?: string;
  updated_at?: string;
}

export interface CreateTelegramChannelRequest {
  name: string;
  chat_id: string;
  resolved_id?: string; // Optional, ishlatilmasin
  user?: number; // Only for superadmin to assign to specific user
}

export interface UpdateTelegramChannelRequest {
  name?: string;
  chat_id?: string;
  resolved_id?: string; // Optional, ishlatilmasin
  user?: number;
}

// Add these Branch interfaces near your other interfaces
export interface Branch {
  id: number;
  name: string;
  created_at: string;
  device?: any;
  updated_at?: string;
  user: number; // user ID who owns this branch
}

export interface CreateBranchRequest {
  name: string;
  device?: any;
  user?: number; // Only for superadmin to assign to specific user
}

export interface UpdateBranchRequest {
  name?: string;
  user?: number;
  device?: any;
}

// Add these interfaces near other interfaces in api.ts
export interface BreakTime {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  user: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBreakTimeRequest {
  name: string;
  start_time: string;
  end_time: string;
  user?: number; // Only for superadmin to assign to specific user
}

export interface UpdateBreakTimeRequest {
  name?: string;
  start_time?: string;
  end_time?: string;
  user?: number;
}

// Update the Shift interface to include break_time
export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  user: number; // user ID who owns this shift
  break_time: number | null; // Add this field - can be null
  created_at?: string;
  updated_at?: string;
  approved_late_min: number;
}

export interface CreateShiftRequest {
  name: string;
  start_time: string;
  end_time: string;
  break_time?: number | null; // Add this optional field
  user?: number;
  approved_late_min: number; // Only for superadmin to assign to specific user
}

export interface UpdateShiftRequest {
  name?: string;
  start_time?: string;
  end_time?: string;
  break_time?: number | null; // Add this optional field
  user?: number;
  approved_late_min: any;
}

 // WorkDay (Ish kunlari) interfaces
export interface WorkDay {
  id: number;
  name: string;
  days: string[]; // ['mon', 'tue', 'wed', etc.]
  user: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWorkDayRequest {
  name: string;
  days: string[];
  user?: number; // Only for superadmin to assign to specific user
}

export interface UpdateWorkDayRequest {
  name?: string;
  days?: string[];
  user?: number;
}

// DayOff (Dam olish kunlari) interfaces - same structure as WorkDay
export interface DayOff {
  id: number;
  name: string;
  days: string[]; // ['mon', 'tue', 'wed', etc.]
  user: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDayOffRequest {
  name: string;
  days: string[];
  user?: number; // Only for superadmin to assign to specific user
}

export interface UpdateDayOffRequest {
  name?: string;
  days?: string[];
  user?: number;
}

// Tariflar uchun interfeyslar
export interface Plan {
  id: number;
  name: string;
  plan_type: 'standard' | 'premium' | 'free';
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  duration_months: number;
  price: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePlanRequest {
  name: string;
  plan_type: 'standard' | 'premium' | 'free';
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  price: string;
  duration_months?: number;
}
// Add this interface near other interfaces in api.ts
export interface Notification {
  id: number;
  user: number;
  text: string;
  created_at: string;
  is_read: boolean;

}

export interface NotificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}
// Update the Plan interface to match API response
export interface Plan {
  id: number;
  title: string;
  plan_type: 'free' | 'standard' | 'premium';
  billing_cycle: "monthly" | "quarterly" | "yearly";
  duration_months: number;
  price: string;
  description?: string;
  currency?: string;
  content?: string;
  features?: string[];
  is_popular?: boolean;
}

export interface Subscription {
  id: number;
  plan: string; // Plan title
  plan_id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface CreateSubscriptionRequest {
  plan_id: number;
  user_id?: number; // Only for superadmin
}

// Update PLAN_TYPES and BILLING_CYCLES

export interface MarkAsReadRequest {
  notification_ids: number[];
}
export interface UpdatePlanRequest {
  name?: string;
  plan_type?: 'free' | 'standard' | 'premium' ;
  billing_cycle?: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  price?: string;
  duration_months?: number;
}
// Week days constants for display

// Add to types.ts

// Absent employee type
export interface AbsentEmployee {
  employee_id: number;
  employee_name: string;
  status: string;
  status_label: string;
  comment: string;
  fine: number;
  date: string;
}

// Absent employees response
export interface AbsentEmployeesResponse {
  date: string;
  total: number;
  employees: AbsentEmployee[];
}

// Update absence status request
export interface UpdateAbsenceRequest {
  employee_id: number;
  date: string;
  status: string;
  comment?: string;
}

// Monthly report detail item
export interface MonthlyReportDetail {
  date: string;
  status: string;
  status_label: string;
  worked: string;
  difference: string;
  penalty: number;
}

// Monthly report employee data
export interface MonthlyReportEmployee {
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
  details: MonthlyReportDetail[];
}

// Monthly report response
export interface MonthlyReportResponse {
  year: number;
  month: number;
  count: number;
  results: MonthlyReportEmployee[];
}