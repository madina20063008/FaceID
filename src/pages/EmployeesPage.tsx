import { useState, useEffect } from "react";
import {
  apiService,
  Employee,
  CreateEmployeeRequest,
  mockEmployees,
} from "../lib/api";
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

  // Form data for create/edit
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    name: "",
    position: "",
    phone_number: "",
    // ❌ Remove employee_no from initial state
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

  // Filter employees locally for search
  const filteredEmployees = Array.isArray(employees)
    ? employees.filter(
        (emp) =>
          emp?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp?.employee_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp?.position?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Fetching employees...");

      try {
        const employeesData = await apiService.getEmployees();

        if (Array.isArray(employeesData) && employeesData.length > 0) {
          setEmployees(employeesData);
          setUseMockData(false);
          toast.success(`Hodimlar yuklandi: ${employeesData.length} ta`);
        } else {
          setEmployees(mockEmployees);
          setUseMockData(true);
          toast.warning(
            "API dan ma'lumot ololmadi. Namuna ma'lumotlar ishlatilmoqda."
          );
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        setEmployees(mockEmployees);
        setUseMockData(true);
        toast.warning(
          "API ga ulanib bo'lmadi. Namuna ma'lumotlar ishlatilmoqda."
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

  // Refresh employees with sync functionality
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log("🔄 Starting refresh process...");

      if (useMockData) {
        // In mock mode, just fetch employees
        await fetchEmployees();
        toast.success("Hodimlar ro'yxati yangilandi (namuna rejim)");
      } else {
        try {
          console.log("🔄 Syncing employees with devices...");

          // Step 1: Sync employees with devices
          const syncResult = await apiService.syncEmployees();
          console.log("✅ Sync result:", syncResult);

          if (syncResult.success) {
            let successMessage = `Hodimlar sinxronizatsiya qilindi`;

            // Add sync statistics to the message
            const statsMessages = [];
            if (syncResult.synced_devices > 0) {
              statsMessages.push(`${syncResult.synced_devices} ta qurilma`);
            }
            if (syncResult.added > 0) {
              statsMessages.push(
                `${syncResult.added} ta yangi hodim qo'shildi`
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
              "Sinxronizatsiya amalga oshirildi, lekin natija muvaffaqiyatli emas"
            );
          }

          // Step 2: Fetch updated employees list
          console.log("📥 Fetching updated employees list...");
          await fetchEmployees();
        } catch (syncError: any) {
          console.error("❌ Sync failed:", syncError);

          // Try to fetch employees even if sync fails
          console.log("🔄 Attempting to fetch employees without sync...");
          try {
            await fetchEmployees();
            toast.warning(
              "Sinxronizatsiya amalga oshirilmadi, lekin ma'lumotlar yuklandi"
            );
          } catch (fetchError) {
            toast.error("Ikkala operatsiya ham amalga oshirilmadi");
            throw syncError; // Re-throw the original error
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
        toast.error("Yangilashda xatolik yuz berdi");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create new employee
  const handleCreate = async () => {
    try {
      // Format phone number
      let phoneNumber = formData.phone_number;
      if (phoneNumber && !phoneNumber.startsWith("+998")) {
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
          position: formData.position,
          phone_number: phoneNumber,
          local_face:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
          description: formData.description,
          salary: formData.salary,
          device: formData.device_id,
        };

        setEmployees([...employees, newEmployee]);
        toast.success("Hodim qo'shildi (namuna rejim)");
      } else {
        // Prepare employee data - DO NOT include employee_no
        const employeeData: CreateEmployeeRequest = {
          device_id: formData.device_id,
          name: formData.name,
          user_type: formData.user_type,
          begin_time: formData.begin_time,
          end_time: formData.end_time,
          door_right: formData.door_right,
          employment: formData.employment || "", // Ensure empty string, not undefined
          department: formData.department,
          position: formData.position || "", // Ensure empty string, not undefined
          shift: formData.shift,
          description: formData.description || "", // Ensure empty string, not undefined
          phone_number: phoneNumber,
          salary: formData.salary || 0, // Ensure 0 if undefined
          break_time: formData.break_time,
          work_day: formData.work_day,
          branch: formData.branch,
          fine: formData.fine || 0, // Ensure 0 if undefined
          day_off: formData.day_off,
          // ❌ DO NOT include employee_no - API will generate it
        };

        // 🔍 DEBUG: Log what we're sending
        console.log("🔍 DEBUG - Creating employee with data:", {
          position: employeeData.position,
          phone_number: employeeData.phone_number,
          salary: employeeData.salary,
          description: employeeData.description,
          department: employeeData.department,
          shift: employeeData.shift,
          branch: employeeData.branch,
          fullData: employeeData,
        });

        console.log("➕ Creating employee (NO employee_no):", employeeData);

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
              "Noto'g'ri ma'lumotlar. Barcha majburiy maydonlarni to'ldiring."
            );
          } else {
            toast.error(
              "Hodim qo'shishda xatolik: " +
                (apiError.message || "Noma'lum xatolik")
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
      // Don't show toast here since we already showed it in the API error catch
    }
  };

  // Update employee
  const handleUpdate = async () => {
    if (!editEmployee) return;

    try {
      // Format phone number
      let phoneNumber = formData.phone_number;
      if (phoneNumber && !phoneNumber.startsWith("+998")) {
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
                  position: formData.position,
                  phone_number: phoneNumber,
                  employee_no: formData.employee_no || emp.employee_no,
                  description: formData.description,
                  salary: formData.salary,
                }
              : emp
          )
        );
        toast.success("Hodim yangilandi (namuna rejim)");
      } else {
        // Prepare update data - DO NOT include employee_no
        const updateData: Partial<CreateEmployeeRequest> = {
          device_id: formData.device_id,
          name: formData.name,
          user_type: formData.user_type,
          begin_time: formData.begin_time,
          end_time: formData.end_time,
          door_right: formData.door_right,
          employment: formData.employment || "",
          department: formData.department,
          position: formData.position || "",
          shift: formData.shift,
          description: formData.description || "",
          phone_number: phoneNumber,
          salary: formData.salary || 0,
          break_time: formData.break_time,
          work_day: formData.work_day,
          branch: formData.branch,
          fine: formData.fine || 0,
          day_off: formData.day_off,
          // ❌ DO NOT include employee_no in updates
        };

        console.log(
          `✏️ Updating employee ${editEmployee.id} (NO employee_no):`,
          updateData
        );
        await apiService.updateEmployee(editEmployee.id, updateData);
        toast.success("Hodim ma'lumotlari yangilandi");
      }

      setEditEmployee(null);
      resetFormData();
      await fetchEmployees(); // Refresh list
    } catch (error: any) {
      console.error("Failed to update employee:", error);
      toast.error(
        "Yangilashda xatolik: " + (error.message || "Noma'lum xatolik")
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
        console.log(`🗑️ Deleting employee ${deleteEmployee.id}...`);
        await apiService.deleteEmployee(deleteEmployee.id);
        toast.success("Hodim o'chirildi");
      }

      setDeleteEmployee(null);
      await fetchEmployees(); // Refresh list
    } catch (error: any) {
      console.error("Failed to delete employee:", error);
      toast.error(
        "O'chirishda xatolik: " + (error.message || "Noma'lum xatolik")
      );
    }
  };

  // Open edit dialog
  const openEdit = (employee: Employee) => {
    console.log("🔧 openEdit function called");
    console.log("👤 Employee object received:", employee);

    try {
      setEditEmployee(employee);

      const editFormData = {
        name: employee.name || "",
        position: employee.position || "",
        phone_number: employee.phone_number || "",
        // ❌ Don't load employee_no into form for editing
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
        branch: employee.branch || null,
        fine: employee.fine || 0,
        day_off: employee.day_off || null,
      };

      setFormData(editFormData);

      // 🔍 DEBUG: Log what we're loading for edit
      console.log("🔍 DEBUG - Loading employee for edit:", {
        name: employee.name,
        position: employee.position,
        salary: employee.salary,
        description: employee.description,
        department: employee.department,
        shift: employee.shift,
        branch: employee.branch,
        id: employee.id,
        employee_no: employee.employee_no, // Still show in console but not in form
      });

      console.log("📋 Form data set to:", editFormData);
      console.log("✅ Edit dialog should open now");
    } catch (error) {
      console.error("❌ Error in openEdit:", error);
    }
  };

  // Open view dialog
const openView = async (employee: Employee) => {
  try {
    console.log("👁️ Opening view for employee ID:", employee.id);
    
    setIsViewLoading(true); // Set loading to true
    setViewEmployee(employee);
    
    if (useMockData) {
      // Use existing data for mock mode
      console.log("📊 Using mock data for view");
      setIsViewLoading(false);
    } else {
      // Fetch detailed employee data from API
      console.log(`📡 Fetching detailed data for employee ${employee.id}`);
      
      try {
        const detailedEmployee = await apiService.getEmployeeById(
          employee.id
        );
        console.log("✅ Detailed employee data loaded");
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
      // ❌ Remove employee_no from reset
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
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (useMockData) {
      return; // Already filtered locally
    }

    try {
      setIsLoading(true);
      const results = await apiService.searchEmployees(searchQuery);
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

  // Initialize
  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hodimlar</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Barcha hodimlarni boshqaring
            {useMockData && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Namuna rejim
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Sinxronizatsiya..." : "Sinxronizatsiyalash"}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi hodim
          </Button>
        </div>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hodimlar ro'yxati</CardTitle>
          <div className="text-sm text-gray-500">
            {isLoading ? "Yuklanmoqda..." : `Jami: ${employees.length} ta`}
          </div>
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
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="outline"
              disabled={isLoading}
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
                    <TableHead>Raqami</TableHead>
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
                            {employee.id && (
                              <span className="text-xs text-gray-500">
                                ID: {employee.id}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.employee_no || "N/A"}</TableCell>
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
                            onClick={() => {
                              console.log(
                                "✏️ Edit button clicked for employee:",
                                employee.name,
                                employee.id
                              );
                              openEdit(employee);
                            }}
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
              Hodim ma'lumotlarini kiriting
              {useMockData && " (namuna rejim)"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ism familiya *</Label>
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
            {/* ❌ REMOVE employee_no input field entirely */}
            <div className="space-y-2">
              <Label htmlFor="position">Lavozim *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="Frontend Developer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Telefon raqami *</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                placeholder="+998 90 123 45 67"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Maosh (so'm)</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salary: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="3000000"
                min="0"
              />
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
              disabled={
                !formData.name || !formData.position || !formData.phone_number
              }
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
        <p className="mt-2 text-gray-500">Hodim ma'lumotlari yuklanmoqda...</p>
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
              {viewEmployee.position || "N/A"}
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
                  "uz-UZ"
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
