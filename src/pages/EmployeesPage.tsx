import { useState, useEffect } from "react";
import { apiService, mockEmployees } from "../lib/api";
import {
  Employee,
  CreateEmployeeRequest,
  Shift,
  WorkDay,
  DayOff,
} from "../lib/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../app/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../app/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../app/components/ui/alert-dialog";
import { Label } from "../app/components/ui/label";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  RefreshCcw,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);

  // Add state for current branch
  const [currentBranch, setCurrentBranch] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // NEW STATE: For selectors
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [dayOffs, setDayOffs] = useState<DayOff[]>([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(false);

  // Form data for create/edit
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    name: "",
    position: "",
    phone_number: "",
    description: "",
    salary: 0,
    device_id: 1,
    user_type: "normal",
    begin_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    door_right: "1",
    employment: "",
    department: null,
    shift: null,
    break_time: null,
    work_day: null,
    branch: null,
    fine: 0,
    day_off: null,
  });

  // Get current branch from localStorage
  const getCurrentBranch = () => {
    const savedBranchId = localStorage.getItem('selected_branch_id');
    const savedBranchName = localStorage.getItem('selected_branch_name');
    
    if (savedBranchId && savedBranchName) {
      return {
        id: parseInt(savedBranchId),
        name: savedBranchName
      };
    }
    return null;
  };

  // Listen for branch changes
  useEffect(() => {
    const handleBranchChange = () => {
      const branch = getCurrentBranch();
      setCurrentBranch(branch);
      
      // Reload employees for the new branch
      if (branch) {
        fetchEmployees(branch.id);
      }
    };

    window.addEventListener('branchChanged', handleBranchChange);
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, []);

  const filteredEmployees = Array.isArray(employees)
    ? employees
        .filter(
          (emp) =>
            emp?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp?.employee_no
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            emp?.position?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        // ✅ SORT A → Z by name
        .sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "uz", {
            sensitivity: "base",
          }),
        )
    : [];

  // Fetch all employees with branch_id
  const fetchEmployees = async (branchId?: number) => {
    try {
      setIsLoading(true);
      
      // Get branch if not provided
      let targetBranchId = branchId;
      if (!targetBranchId) {
        const branch = getCurrentBranch();
        if (branch) {
          targetBranchId = branch.id;
          setCurrentBranch(branch);
        }
      }

      try {
        // Pass branch_id to API call
        const employeesData = await apiService.getEmployees(targetBranchId);

        if (Array.isArray(employeesData) && employeesData.length > 0) {
          setEmployees(employeesData);
          setUseMockData(false);
          toast.success(`Hodimlar yuklandi: ${employeesData.length} ta`);
        } else {
          setEmployees(mockEmployees);
          setUseMockData(true);
          toast.warning(
            currentBranch 
              ? `"${currentBranch.name}" filialida hodimlar topilmadi. Namuna ma'lumotlar ishlatilmoqda.`
              : "API dan ma'lumot ololmadi. Namuna ma'lumotlar ishlatilmoqda.",
          );
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        setEmployees(mockEmployees);
        setUseMockData(true);
        toast.warning(
          "API ga ulanib bo'lmadi. Namuna ma'lumotlar ishlatilmoqda.",
        );
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees(mockEmployees);
      setUseMockData(true);
      toast.warning("Xatolik yuz berdi. Namuna ma'lumotlar ishlatilmoqda.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all selectors (shifts, work_days, day_offs)
  const fetchSelectors = async () => {
    if (useMockData) return;

    try {
      setIsLoadingSelectors(true);

      // Fetch shifts
      try {
        const shiftsData = await apiService.getShifts();
        setShifts(shiftsData);
      } catch (shiftError) {
        console.error("Failed to fetch shifts:", shiftError);
        setShifts([]);
      }

      // Fetch work days
      try {
        const workDaysData = await apiService.getWorkDays();
        setWorkDays(workDaysData);
      } catch (workDayError) {
        console.error("Failed to fetch work days:", workDayError);
        setWorkDays([]);
      }

      // Fetch day offs
      try {
        const dayOffsData = await apiService.getDayOffs();
        setDayOffs(dayOffsData);
      } catch (dayOffError) {
        console.error("Failed to fetch day offs:", dayOffError);
        setDayOffs([]);
      }
    } catch (error) {
      console.error("Error fetching selectors:", error);
    } finally {
      setIsLoadingSelectors(false);
    }
  };

  // Refresh employees with sync functionality
  const handleRefresh = async () => {
    try {
      // Check if branch is selected
      if (!currentBranch) {
        toast.error("Iltimos, filial tanlang");
        return;
      }

      setIsRefreshing(true);

      if (useMockData) {
        // In mock mode, just fetch employees
        await fetchEmployees();
        toast.success("Hodimlar ro'yxati yangilandi (namuna rejim)");
      } else {
        try {
          // Step 1: Sync employees with devices
          const syncResult = await apiService.syncEmployees();

          if (syncResult.success) {
            let successMessage = `Hodimlar sinxronizatsiya qilindi`;

            // Add sync statistics to the message
            const statsMessages = [];
            if (syncResult.synced_devices > 0) {
              statsMessages.push(`${syncResult.synced_devices} ta qurilma`);
            }
            if (syncResult.added > 0) {
              statsMessages.push(
                `${syncResult.added} ta yangi hodim qo'shildi`,
              );
            }
            if (syncResult.deleted > 0) {
              statsMessages.push(`${syncResult.deleted} ta hodim o'chirildi`);
            }

            if (statsMessages.length > 0) {
              successMessage += `: ${statsMessages.join(", ")}`;
            }

            toast.success(successMessage);
          } else {
            toast.warning(
              "Sinxronizatsiya amalga oshirildi, lekin natija muvaffaqiyatli emas",
            );
          }

          // Step 2: Fetch updated employees list
          await fetchEmployees();
        } catch (syncError: any) {
          console.error("❌ Sync failed:", syncError);
          
          // Special handling for branch not selected error
          if (syncError.message.includes('Filial tanlanmagan')) {
            toast.error(syncError.message);
          } else {
            // Try to fetch employees even if sync fails
            try {
              await fetchEmployees();
              toast.warning(
                "Sinxronizatsiya amalga oshirilmadi, lekin ma'lumotlar yuklandi",
              );
            } catch (fetchError) {
              toast.error("Ikkala operatsiya ham amalga oshirilmadi");
              throw syncError; // Re-throw the original error
            }
          }
        }
      }
    } catch (error: any) {
      console.error("❌ Refresh failed:", error);

      // User-friendly error messages
      if (error.message.includes("Failed to fetch")) {
        toast.error("Internet aloqasi yo'q yoki server ishlamayapti");
      } else if (error.status === 401) {
        toast.error("Kirish huquqi yo'q. Iltimos, qaytadan kiring");
      } else if (error.status === 403) {
        toast.error("Bu amalni bajarish uchun ruxsat yo'q");
      } else {
        toast.error(error.message || "Yangilashda xatolik yuz berdi");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create new employee
  const handleCreate = async () => {
    try {
      // Format phone number if provided
      let phoneNumber = formData.phone_number;
      if (phoneNumber && phoneNumber.trim() && !phoneNumber.startsWith("+998")) {
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        if (cleanPhone.length === 9) {
          phoneNumber = "+998" + cleanPhone;
        } else if (cleanPhone.length === 12 && cleanPhone.startsWith("998")) {
          phoneNumber = "+" + cleanPhone;
        }
      }

      if (useMockData) {
        // Create mock employee
        const newEmployee: Employee = {
          id:
            employees.length > 0
              ? Math.max(...employees.map((e) => e.id)) + 1
              : 1,
          employee_no: formData.employee_no || `EMP${Date.now()}`,
          name: formData.name,
          position: formData.position || "",
          phone_number: phoneNumber || "",
          local_face:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
          description: formData.description || "",
          salary: formData.salary || 0,
          device: formData.device_id,
          shift: formData.shift,
          work_day: formData.work_day,
          day_off: formData.day_off,
        };

        setEmployees([...employees, newEmployee]);
        toast.success("Hodim qo'shildi (namuna rejim)");
      } else {
        // Set branch from current branch
        const branchData = currentBranch ? { branch: currentBranch.id } : {};
        
        // Prepare employee data - only include fields that have values
        const employeeData: CreateEmployeeRequest = {
          name: formData.name, // Only required field
          device_id: formData.device_id || 1,
          user_type: formData.user_type || "normal",
          begin_time: formData.begin_time || new Date().toISOString(),
          end_time: formData.end_time || new Date().toISOString(),
          door_right: formData.door_right || "1",
          employment: formData.employment || "",
          department: formData.department || null,
          position: formData.position || "",
          shift: formData.shift || null,
          description: formData.description || "",
          phone_number: phoneNumber || "",
          salary: formData.salary || 0,
          break_time: formData.break_time || null,
          work_day: formData.work_day || null,
          fine: formData.fine || 0,
          day_off: formData.day_off || null,
          ...branchData,
        };

        try {
          await apiService.createEmployee(employeeData);
          toast.success("Hodim muvaffaqiyatli qo'shildi");
        } catch (apiError: any) {
          console.error("❌ API create error details:", {
            message: apiError.message,
            data: apiError.data,
            status: apiError.status,
          });

          // More specific error messages
          if (apiError.message.includes("Invalid pk")) {
            toast.error(`Xato: Noto'g'ri ID (${apiError.message})`);
          } else if (apiError.status === 400) {
            toast.error(
              "Noto'g'ri ma'lumotlar. Ism maydonini to'ldiring.",
            );
          } else {
            toast.error(
              "Hodim qo'shishda xatolik: " +
                (apiError.message || "Noma'lum xatolik"),
            );
          }
          throw apiError;
        }
      }

      setIsCreateOpen(false);
      resetFormData();
      await fetchEmployees(); // Refresh list
    } catch (error: any) {
      console.error("Failed to create employee:", error);
    }
  };

  // Update employee
  const handleUpdate = async () => {
    if (!editEmployee) return;

    try {
      // Format phone number if provided
      let phoneNumber = formData.phone_number;
      if (phoneNumber && phoneNumber.trim() && !phoneNumber.startsWith("+998")) {
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        if (cleanPhone.length === 9) {
          phoneNumber = "+998" + cleanPhone;
        } else if (cleanPhone.length === 12 && cleanPhone.startsWith("998")) {
          phoneNumber = "+" + cleanPhone;
        }
      }

      if (useMockData) {
        // Update mock employee
        setEmployees(
          employees.map((emp) =>
            emp.id === editEmployee.id
              ? {
                  ...emp,
                  name: formData.name,
                  position: formData.position || emp.position,
                  phone_number: phoneNumber || emp.phone_number,
                  employee_no: formData.employee_no || emp.employee_no,
                  description: formData.description || emp.description,
                  salary: formData.salary || emp.salary,
                  shift: formData.shift || emp.shift,
                  work_day: formData.work_day || emp.work_day,
                  day_off: formData.day_off || emp.day_off,
                }
              : emp,
          ),
        );
        toast.success("Hodim yangilandi (namuna rejim)");
      } else {
        // Prepare update data - only include fields that have values
        const updateData: Partial<CreateEmployeeRequest> = {
          name: formData.name, // Only required field
          device_id: formData.device_id || editEmployee.device || 1,
          user_type: formData.user_type || editEmployee.user_type || "normal",
          begin_time: formData.begin_time || editEmployee.begin_time || new Date().toISOString(),
          end_time: formData.end_time || editEmployee.end_time || new Date().toISOString(),
          door_right: formData.door_right || editEmployee.door_right || "1",
          employment: formData.employment || editEmployee.employment || "",
          department: formData.department || editEmployee.department || null,
          position: formData.position || editEmployee.position || "",
          shift: formData.shift || editEmployee.shift || null,
          description: formData.description || editEmployee.description || "",
          phone_number: phoneNumber || editEmployee.phone_number || "",
          salary: formData.salary || editEmployee.salary || 0,
          break_time: formData.break_time || editEmployee.break_time || null,
          work_day: formData.work_day || editEmployee.work_day || null,
          branch: currentBranch?.id || editEmployee.branch || null,
          fine: formData.fine || editEmployee.fine || 0,
          day_off: formData.day_off || editEmployee.day_off || null,
        };

        await apiService.updateEmployee(editEmployee.id, updateData);
        toast.success("Hodim ma'lumotlari yangilandi");
      }

      setEditEmployee(null);
      resetFormData();
      await fetchEmployees(); // Refresh list
    } catch (error: any) {
      console.error("Failed to update employee:", error);
      toast.error(
        "Yangilashda xatolik: " + (error.message || "Noma'lum xatolik"),
      );
    }
  };

  // Delete employee
  const handleDelete = async () => {
    if (!deleteEmployee) return;

    try {
      if (useMockData) {
        // Delete mock employee
        setEmployees(employees.filter((emp) => emp.id !== deleteEmployee.id));
        toast.success("Hodim o'chirildi (namuna rejim)");
      } else {
        await apiService.deleteEmployee(deleteEmployee.id);
        toast.success("Hodim o'chirildi");
      }

      setDeleteEmployee(null);
      await fetchEmployees(); // Refresh list
    } catch (error: any) {
      console.error("Failed to delete employee:", error);
      toast.error(
        "O'chirishda xatolik: " + (error.message || "Noma'lum xatolik"),
      );
    }
  };

  // Open edit dialog
  const openEdit = (employee: Employee) => {
    try {
      setEditEmployee(employee);

      const editFormData = {
        name: employee.name || "",
        position: employee.position || "",
        phone_number: employee.phone_number || "",
        description: employee.description || "",
        salary: employee.salary || 0,
        device_id: employee.device || 1,
        user_type: employee.user_type || "normal",
        begin_time: employee.begin_time || new Date().toISOString(),
        end_time: employee.end_time || new Date().toISOString(),
        door_right: employee.door_right || "1",
        employment: employee.employment || "",
        department: employee.department || null,
        shift: employee.shift || null,
        break_time: employee.break_time || null,
        work_day: employee.work_day || null,
        branch: employee.branch || currentBranch?.id || null,
        fine: employee.fine || 0,
        day_off: employee.day_off || null,
      };

      setFormData(editFormData);
    } catch (error) {
      console.error("❌ Error in openEdit:", error);
    }
  };

  // Open view dialog
  const openView = async (employee: Employee) => {
    try {
      setIsViewLoading(true); // Set loading to true
      setViewEmployee(employee);

      if (useMockData) {
        // Use existing data for mock mode
        setIsViewLoading(false);
      } else {
        // Fetch detailed employee data from API
        try {
          const detailedEmployee = await apiService.getEmployeeById(
            employee.id,
          );
          setViewEmployee(detailedEmployee);
        } catch (error: any) {
          console.error("❌ Failed to fetch employee details:", error);
          // Keep current employee data
          toast.warning("To'liq ma'lumotlar yuklanmadi");
        } finally {
          setIsViewLoading(false); // Set loading to false when done
        }
      }
    } catch (error) {
      console.error("❌ Error in openView:", error);
      setIsViewLoading(false);
      toast.error("Hodim ma'lumotlarini ochishda xatolik");
    }
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      position: "",
      phone_number: "",
      description: "",
      salary: 0,
      device_id: 1,
      user_type: "normal",
      begin_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      door_right: "1",
      employment: "",
      department: null,
      shift: null,
      break_time: null,
      work_day: null,
      branch: currentBranch?.id || null,
      fine: 0,
      day_off: null,
    });
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (useMockData) {
      return; // Already filtered locally
    }

    try {
      setIsLoading(true);
      // Pass branch_id to search API
      const results = await apiService.searchEmployees(
        searchQuery, 
        currentBranch?.id
      );
      setEmployees(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    fetchEmployees();
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return "0 so'm";
    return amount.toLocaleString("uz-UZ") + " so'm";
  };

  // Helper function to get selector display name
  const getSelectorName = (id: number | null, list: any[]): string => {
    if (!id) return "Tanlanmagan";
    const item = list.find((item) => item.id === id);
    return item ? item.name : `ID: ${id}`;
  };

  // Initialize
  useEffect(() => {
    // Set current branch on initial load
    const branch = getCurrentBranch();
    setCurrentBranch(branch);
    
    // Fetch employees with branch_id
    fetchEmployees(branch?.id);
    fetchSelectors();
  }, []);

  // Fetch selectors when switching from mock to real mode
  useEffect(() => {
    if (!useMockData) {
      fetchSelectors();
    }
  }, [useMockData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Hodimlar</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Barcha hodimlarni boshqaring
            {useMockData && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Namuna rejim
              </span>
            )}
            {!currentBranch && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Filial tanlanmagan
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || !currentBranch}
            title={!currentBranch ? "Iltimos, filial tanlang" : ""}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Sinxronizatsiya..." : "Sinxronizatsiyalash"}
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            disabled={!currentBranch}
            title={!currentBranch ? "Hodim qo'shish uchun filial tanlang" : ""}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yangi hodim
          </Button>
        </div>
      </div>

      {/* Branch Warning */}
      {!currentBranch && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">
                Filial tanlanmagan
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Hodimlarni ko'rish va boshqarish uchun chap panel'dan filial tanlang
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Employees Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hodimlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hodim nomi, lavozimi yoki raqami..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
                disabled={!currentBranch}
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="outline"
              disabled={isLoading || !currentBranch}
            >
              Qidirish
            </Button>
            {searchQuery && (
              <Button onClick={clearSearch} variant="ghost">
                Tozalash
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-500">Hodimlar yuklanmoqda...</p>
              </div>
            ) : !currentBranch ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
                  <Landmark className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Filial tanlanmagan</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Hodimlarni ko'rish uchun iltimos, chap panel'dan filial tanlang
                </p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchQuery
                    ? "Qidiruv natijasi topilmadi"
                    : "Hodimlar topilmadi"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hodim</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Lavozim</TableHead>
                    <TableHead>Maosh</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={employee.local_face}
                              alt={employee.name}
                            />
                            <AvatarFallback>
                              {employee.name
                                ? employee.name.charAt(0).toUpperCase()
                                : "H"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium block">
                              {employee.name || "Noma'lum"}
                            </span>
                            
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.phone_number || "N/A"}</TableCell>
                      <TableCell>{employee.position || "N/A"}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(employee.salary)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openView(employee)}
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(employee)}
                            title="Tahrirlash"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteEmployee(employee)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editEmployee}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditEmployee(null);
            resetFormData();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editEmployee ? "Hodimni tahrirlash" : "Yangi hodim qo'shish"}
            </DialogTitle>
            <DialogDescription>
              {editEmployee 
                ? "Hodim ma'lumotlarini tahrirlang. Faqat ism maydoni majburiy." 
                : "Yangi hodim qo'shing. Faqat ism maydoni majburiy, boshqa maydonlar ixtiyoriy."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Ism familiya <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Alisher Karimov"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Lavozim</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="Frontend Developer"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_number">Telefon raqami</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                placeholder="+998 90 123 45 67"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salary">Maosh (so'm)</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary === 0 ? "" : formData.salary}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    salary: value === "" ? 0 : Number(value),
                  });
                }}
                placeholder="3000000"
                min="0"
              />
            </div>

            {/* Shift selector */}
            <div className="space-y-2">
              <Label htmlFor="shift">Smena</Label>
              <select
                id="shift"
                value={formData.shift || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shift: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={isLoadingSelectors}
              >
                <option value="">Smena tanlanmagan</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.start_time} - {shift.end_time})
                  </option>
                ))}
                {isLoadingSelectors && !shifts.length && (
                  <option disabled>Yuklanmoqda...</option>
                )}
              </select>
            </div>

            {/* Work Day selector */}
            <div className="space-y-2">
              <Label htmlFor="work_day">Ish kunlari</Label>
              <select
                id="work_day"
                value={formData.work_day || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    work_day: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={isLoadingSelectors}
              >
                <option value="">Ish kunlari tanlanmagan</option>
                {workDays.map((workDay) => (
                  <option key={workDay.id} value={workDay.id}>
                    {workDay.name} ({workDay.days.length} kun)
                  </option>
                ))}
                {isLoadingSelectors && !workDays.length && (
                  <option disabled>Yuklanmoqda...</option>
                )}
              </select>
            </div>

            {/* Day Off selector */}
            <div className="space-y-2">
              <Label htmlFor="day_off">Dam olish kunlari</Label>
              <select
                id="day_off"
                value={formData.day_off || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    day_off: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={isLoadingSelectors}
              >
                <option value="">Dam olish kunlari tanlanmagan</option>
                {dayOffs.map((dayOff) => (
                  <option key={dayOff.id} value={dayOff.id}>
                    {dayOff.name} ({dayOff.days.length} kun)
                  </option>
                ))}
                {isLoadingSelectors && !dayOffs.length && (
                  <option disabled>Yuklanmoqda...</option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Izoh</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Qo'shimcha ma'lumotlar..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditEmployee(null);
                resetFormData();
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={editEmployee ? handleUpdate : handleCreate}
              disabled={!formData.name.trim() || !currentBranch}
              title={!currentBranch ? "Iltimos, filial tanlang" : ""}
            >
              {editEmployee ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hodim ma'lumotlari</DialogTitle>
          </DialogHeader>

          {isViewLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">
                Hodim ma'lumotlari yuklanmoqda...
              </p>
            </div>
          ) : viewEmployee ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={viewEmployee.local_face}
                    alt={viewEmployee.name}
                  />
                  <AvatarFallback className="text-xl">
                    {viewEmployee.name
                      ? viewEmployee.name.charAt(0).toUpperCase()
                      : "H"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewEmployee.name || "Noma'lum"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {viewEmployee.position || "Lavozim ko'rsatilmagan"}
                  </p>
                  {viewEmployee.id && (
                    <p className="text-sm text-gray-500">
                      ID: {viewEmployee.id}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hodim raqami
                  </p>
                  <p className="font-medium">
                    {viewEmployee.employee_no || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Telefon raqami
                  </p>
                  <p className="font-medium">
                    {viewEmployee.phone_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Lavozim
                  </p>
                  <p className="font-medium">
                    {viewEmployee.position || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Maosh
                  </p>
                  <p className="font-medium">
                    {formatCurrency(viewEmployee.salary)}
                  </p>
                </div>

                {/* Show selector information */}
                {viewEmployee.shift && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Smena
                    </p>
                    <p className="font-medium">
                      {getSelectorName(viewEmployee.shift, shifts)}
                    </p>
                  </div>
                )}

                {viewEmployee.work_day && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ish kunlari
                    </p>
                    <p className="font-medium">
                      {getSelectorName(viewEmployee.work_day, workDays)}
                    </p>
                  </div>
                )}

                {viewEmployee.day_off && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Dam olish kunlari
                    </p>
                    <p className="font-medium">
                      {getSelectorName(viewEmployee.day_off, dayOffs)}
                    </p>
                  </div>
                )}

                {viewEmployee.branch && currentBranch && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Filial
                    </p>
                    <p className="font-medium">
                      {currentBranch.name} (ID: {viewEmployee.branch})
                    </p>
                  </div>
                )}

                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Izoh
                  </p>
                  <p className="font-medium">
                    {viewEmployee.description || "N/A"}
                  </p>
                </div>
                {viewEmployee.created_at && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Yaratilgan sana
                    </p>
                    <p className="font-medium">
                      {new Date(viewEmployee.created_at).toLocaleDateString(
                        "uz-UZ",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteEmployee}
        onOpenChange={() => setDeleteEmployee(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hodimni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteEmployee?.name || "Bu hodim"} ni o'chirishni xohlaysizmi?
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}