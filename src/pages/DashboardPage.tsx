import { useState, useEffect } from "react";
import { apiService, formatDate } from "../lib/api";
import { DailyAttendance, EmployeeHistory } from "../lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import { Input } from "../app/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../app/components/ui/avatar";
import { Badge } from "../app/components/ui/badge";
import { Button } from "../app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Calendar,
  Search,
  RefreshCw,
  AlertCircle,
  Database,
  Download,
  History,
  Filter,
  DoorOpen,
  DoorClosed,
  X,
  Clock4,
  User,
  ArrowLeft,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// Helper function to format time from ISO string
const formatTimeFromISO = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return isoString;
  }
};

export function DashboardPage() {
  // Format today's date as YYYY-MM-DD
  const formattedToday = formatDate(new Date());

  const [selectedDate, setSelectedDate] = useState(formattedToday);
  const [attendance, setAttendance] = useState<DailyAttendance | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // Employee History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const [selectedEmployeeNo, setSelectedEmployeeNo] = useState<string>("");
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>("all"); // 'all', 'kirish', 'chiqish'

  // Debug: Check employee data structure
  useEffect(() => {
    if (attendance && attendance.employees.length > 0) {
      console.log("🔍 Employee data structure check:");
      console.log("First employee:", attendance.employees[0]);
      console.log(
        "All employee IDs:",
        attendance.employees.map((emp) => ({
          id: emp.id,
          employee_no: emp.employee_no,
          name: emp.name,
          hasId: !!emp.id,
          hasEmployeeNo: !!emp.employee_no,
        })),
      );
    }
  }, [attendance]);

  // Load attendance data
  const loadAttendance = async (date?: string) => {
    try {
      setIsLoading(true);
      console.log("📊 Loading attendance for date:", date || selectedDate);

      const dateToLoad = date || selectedDate;

      try {
        const attendanceData = await apiService.getDailyAttendance(dateToLoad);
        setAttendance(attendanceData);

        // Check if using mock data
        if (
          attendanceData.employees.length > 0 &&
          attendanceData.employees[0]?.employee_no?.startsWith("EMP")
        ) {
          setUseMockData(true);
        } else {
          setUseMockData(false);
        }

        toast.success(
          `Davomat ma'lumotlari yuklandi: ${attendanceData.stats.came} ta kelgan`,
        );
      } catch (apiError) {
        console.error("API error:", apiError);
        toast.warning(
          "API dan ma'lumot ololmadi. Namuna ma'lumotlar ishlatilmoqda.",
        );
      }
    } catch (error) {
      console.error("❌ Failed to load attendance:", error);
      toast.error("Davomat ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeeHistory = async (employee: any) => {
    try {
      console.log("🔍 Starting to load employee history...");
      console.log("📋 Employee object received:", employee);

      // ✅ Use employee.employee_id (this is 9 in your data)
      const employeeId = employee?.employee_id;

      // Validate employee ID
      if (!employeeId || isNaN(employeeId)) {
        console.error("❌ Invalid employee ID:", employeeId);
        console.error("❌ Full employee object:", employee);
        toast.error(`Hodim ID si noto'g'ri: ${employeeId}`);
        return;
      }

      console.log("✅ Valid employee ID found:", {
        employee_id: employeeId,
        name: employee.name,
        employee_no: employee.employee_no,
        type: typeof employeeId,
      });

      setIsLoadingHistory(true);
      setSelectedEmployeeId(employeeId);
      setSelectedEmployeeName(employee.name || "Noma'lum hodim");
      setSelectedEmployeeNo(employee.employee_no || "");
      setShowHistoryModal(true);

      console.log(
        `📅 Loading history for employee ID ${employeeId} on ${selectedDate}`,
      );

      // Call the API with employee.employee_id (e.g., 9)
      const history = await apiService.getEmployeeHistory(
        selectedDate,
        employeeId,
      );
      console.log("📊 Employee history API response:", history);

      setEmployeeHistory(history);

      toast.success(
        `${employee.name}ning kunlik tarixi yuklandi: ${history.length} ta tadbir`,
      );
    } catch (error: any) {
      console.error("❌ Failed to load employee history:", error);

      // More specific error messages
      let errorMessage = "Hodim tarixini yuklab bo'lmadi";

      if (error.message?.includes("Noto'g'ri hodim ID si")) {
        errorMessage = "Noto'g'ri hodim ID si";
      } else if (error.message?.includes("Sana kiritilmagan")) {
        errorMessage = "Sana kiritilmagan";
      } else if (error.status === 404) {
        errorMessage = "Ushbu sana uchun hodim tarixi topilmadi";
      } else if (error.status === 400) {
        errorMessage = "Noto'g'ri so'rov parametrlari";
      } else if (error.message?.includes("Cannot read properties")) {
        errorMessage = "Hodim ma'lumotlarida xatolik";
      } else if (error.message?.includes("Network Error")) {
        errorMessage = "Internet aloqasi yo'q";
      }

      toast.error(errorMessage);
      setEmployeeHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const testEmployeeHistoryAPI = async () => {
    const testDate = selectedDate;
    // Use employee_id from your data
    const testEmployeeId = attendance?.employees[0]?.employee_id || 9;
    const testEmployeeName = attendance?.employees[0]?.name || "Islom";

    console.log("🧪 Testing employee history API...");
    console.log("📅 Test date:", testDate);
    console.log("👤 Test employee:", {
      employee_id: testEmployeeId,
      name: testEmployeeName,
    });

    try {
      const response = await fetch(
        `https://hikvision.ugku.uz/person/employee-history/?date=${testDate}&employee_id=${testEmployeeId}&user_id=2`,
        {
          headers: {
            Authorization: `Bearer ${apiService.getAccessToken()}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      console.log("🔧 Raw API response status:", response.status);
      const text = await response.text();
      console.log("🔧 Raw API response text:", text);

      if (response.ok) {
        const data = JSON.parse(text);
        console.log("✅ API test successful:", data);
        toast.success(
          `${testEmployeeName} uchun ${data.length} ta tadbir topildi`,
        );
      } else {
        console.error("❌ API error:", response.status, text);
        toast.error(`API xatosi: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ API test failed:", error);
      toast.error("API test amalga oshirilmadi");
    }
  };

  // Close history modal
  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedEmployeeId(null);
    setSelectedEmployeeName("");
    setSelectedEmployeeNo("");
    setEmployeeHistory([]);
    setHistoryFilter("all");
  };

  // Filter employee history based on label_name
  const getFilteredHistory = () => {
    if (historyFilter === "all") return employeeHistory;

    return employeeHistory.filter((record) => {
      const label = record.label_name.toLowerCase();
      if (historyFilter === "kirish") {
        return (
          label.includes("kirish") ||
          label.includes("keldi") ||
          label.includes("enter") ||
          label.includes("in")
        );
      }
      if (historyFilter === "chiqish") {
        return (
          label.includes("chiqish") ||
          label.includes("ketdi") ||
          label.includes("exit") ||
          label.includes("out")
        );
      }
      return true;
    });
  };

  // Extract kirish and chiqish times from history
  const getEmployeeTimesFromHistory = (history: EmployeeHistory[]) => {
    let kirish = null;
    let chiqish = null;
    let kirishEvents: EmployeeHistory[] = [];
    let chiqishEvents: EmployeeHistory[] = [];

    // Sort by time first
    const sortedHistory = [...history].sort(
      (a, b) =>
        new Date(a.event_time).getTime() - new Date(b.event_time).getTime(),
    );

    sortedHistory.forEach((record) => {
      const label = record.label_name.toLowerCase();

      // Identify kirish events
      if (
        label.includes("kirish") ||
        label.includes("keldi") ||
        label.includes("enter") ||
        label.includes("in")
      ) {
        kirishEvents.push(record);
      }

      // Identify chiqish events
      if (
        label.includes("chiqish") ||
        label.includes("ketdi") ||
        label.includes("exit") ||
        label.includes("out")
      ) {
        chiqishEvents.push(record);
      }
    });

    // Get earliest kirish
    if (kirishEvents.length > 0) {
      const earliestKirish = kirishEvents.sort(
        (a, b) =>
          new Date(a.event_time).getTime() - new Date(b.event_time).getTime(),
      )[0];
      kirish = formatTimeFromISO(earliestKirish.event_time);
    }

    // Get latest chiqish
    if (chiqishEvents.length > 0) {
      const latestChiqish = chiqishEvents.sort(
        (a, b) =>
          new Date(b.event_time).getTime() - new Date(a.event_time).getTime(),
      )[0];
      chiqish = formatTimeFromISO(latestChiqish.event_time);
    }

    return { kirish, chiqish, kirishEvents, chiqishEvents };
  };

  // 🔄 REFRESH WITH SYNC FUNCTIONALITY
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log("🔄 Starting refresh process...");

      if (useMockData) {
        // In mock mode, just fetch attendance
        await loadAttendance(selectedDate);
        toast.success("Davomat ma'lumotlari yangilandi (namuna rejim)");
      } else {
        try {
          console.log("🔄 Syncing events with devices...");

          // Step 1: Sync events with devices
          const syncResult = await apiService.syncEvents();
          console.log("✅ Sync result:", syncResult);

          if (syncResult.success) {
            let successMessage = `Tadbirlar sinxronizatsiya qilindi`;

            // Add sync statistics to the message
            const statsMessages = [];
            if (syncResult.synced_devices > 0) {
              statsMessages.push(`${syncResult.synced_devices} ta qurilma`);
            }
            if (syncResult.synced_events > 0) {
              statsMessages.push(`${syncResult.synced_events} ta yangi tadbir`);
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

          // Step 2: Fetch updated attendance list
          console.log("📥 Fetching updated attendance data...");
          await loadAttendance(selectedDate);
        } catch (syncError: any) {
          console.error("❌ Sync failed:", syncError);

          // Try to fetch attendance even if sync fails
          console.log("🔄 Attempting to fetch attendance without sync...");
          try {
            await loadAttendance(selectedDate);
            toast.warning(
              "Sinxronizatsiya amalga oshirilmadi, lekin ma'lumotlar yuklandi",
            );
          } catch (fetchError) {
            toast.error("Ikkala operatsiya ham amalga oshirilmadi");
            throw syncError;
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

  // Date change handler
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (showHistoryModal) {
      closeHistoryModal();
    }
    loadAttendance(date);
  };

  // Filter employees based on status
  const getFilteredEmployees = () => {
    if (!attendance) return [];

    return attendance.employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_no.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = (() => {
        if (statusFilter === "all") return true;
        if (statusFilter === "came") return emp.kirish !== null;
        if (statusFilter === "late") {
          return emp.late !== "0:00" && emp.late !== "0";
        }
        if (statusFilter === "absent") return emp.kirish === null;
        return true;
      })();

      return matchesSearch && matchesStatus;
    });
  };

  const filteredEmployees = getFilteredEmployees();

  // Calculate stats
  const stats = attendance
    ? [
        {
          title: "Jami hodimlar",
          value: attendance.stats.total,
          icon: Users,
          color: "bg-blue-500",
          textColor: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
          title: "Kelganlar",
          value: attendance.stats.came,
          icon: UserCheck,
          color: "bg-green-500",
          textColor: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-900/20",
        },
        {
          title: "Kechikkanlar",
          value: attendance.stats.late,
          icon: Clock,
          color: "bg-yellow-500",
          textColor: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        },
        {
          title: "Kelmaganlar",
          value: attendance.stats.absent,
          icon: UserX,
          color: "bg-red-500",
          textColor: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
        },
      ]
    : [];

  // Get status badge
  const getStatusBadge = (employee: DailyAttendance["employees"][0]) => {
    if (employee.kirish === null) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Kelmadi
        </Badge>
      );
    } else if (employee.late !== "0:00" && employee.late !== "0") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Kechikdi
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Keldi
        </Badge>
      );
    }
  };

  // Replace the existing formatTime function with this:
  const formatTime = (time: string | null) => {
    if (!time) return <span className="text-gray-400">—</span>;

    try {
      // Check if it's an ISO string (contains T or is a date string)
      if (time.includes("T") || time.includes("-")) {
        // It's an ISO date string
        const date = new Date(time);
        const hours = date.getHours().toString();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return <span className="font-medium">{`${hours}:${minutes}`}</span>;
      } else {
        // It's already a time string, try to extract hours and minutes
        // Handle various time formats
        const timeStr = time.trim();

        // Match HH:MM pattern (e.g., "08:30", "14:25:00")
        const match = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = match[2];
          // Remove leading zero if present (e.g., "08" becomes "8")
          const formattedHours = hours.toString();
          return (
            <span className="font-medium">{`${formattedHours}:${minutes}`}</span>
          );
        }

        // Fallback: return the original time
        return <span className="font-medium">{time}</span>;
      }
    } catch (error) {
      console.error("Error formatting time:", error, time);
      return <span className="font-medium">{time}</span>;
    }
  };

  // Format time for history table
  const formatHistoryTimeDisplay = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </span>
          <span className="text-xs text-gray-500">
            {date.toLocaleDateString("uz-UZ")}
          </span>
        </div>
      );
    } catch (error) {
      return <span className="text-gray-400">—</span>;
    }
  };

  // Initial load
  useEffect(() => {
    loadAttendance(selectedDate);
  }, []);

  const filteredHistory = getFilteredHistory();
  const timesFromHistory = getEmployeeTimesFromHistory(employeeHistory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Kunlik davomat ma'lumotlari
            {useMockData && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Namuna rejim
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Sinxronizatsiya..." : "Sinxronizatsiyalash"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p
                        className={`text-3xl font-bold mt-1 ${stat.textColor}`}
                      >
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.textColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Hodimlar davomati</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full sm:w-auto"
                  disabled={isLoading || isRefreshing}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hodim nomi yoki raqami..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={isLoading || isRefreshing}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              disabled={isLoading || isRefreshing}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hammasi</SelectItem>
                <SelectItem value="came">Kelganlar</SelectItem>
                <SelectItem value="late">Kechikkanlar</SelectItem>
                <SelectItem value="absent">Kelmaganlar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            {isLoading || isRefreshing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-500">
                  {isRefreshing
                    ? "Tadbirlar sinxronizatsiya qilinmoqda..."
                    : "Davomat ma'lumotlari yuklanmoqda..."}
                </p>
              </div>
            ) : !attendance ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Ma'lumotlar topilmadi</p>
                <Button
                  variant="outline"
                  onClick={() => loadAttendance(selectedDate)}
                  className="mt-2"
                  disabled={isRefreshing}
                >
                  Qayta yuklash
                </Button>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== "all"
                    ? "Qidiruv natijasi topilmadi"
                    : "Bu sana uchun davomat ma'lumotlari topilmadi"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hodim</TableHead>
                    <TableHead>Kirish</TableHead>
                    <TableHead>Chiqish</TableHead>
                    <TableHead>Kechikish</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee, index) => (
                    <TableRow key={employee.employee_no || index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={employee.face}
                              alt={employee.name}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop";
                              }}
                            />
                            <AvatarFallback>
                              {employee.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium block">
                              {employee.name}
                            </span>
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span>ID: {employee.employee_id}</span>{" "}
                              
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{formatTime(employee.kirish)}</TableCell>
                      <TableCell>{formatTime(employee.chiqish)}</TableCell>
                      <TableCell
                        className={
                          employee.late !== "0:00" && employee.late !== "0"
                            ? "text-red-600 font-medium"
                            : "text-green-600"
                        }
                      >
                        {employee.late}
                      </TableCell>
                      <TableCell>{getStatusBadge(employee)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadEmployeeHistory(employee)}
                          disabled={isLoadingHistory}
                          title={`${employee.name}ning kunlik tarixini ko'rish`}
                          className="whitespace-nowrap"
                        >
                          {isLoadingHistory &&
                          selectedEmployeeId === employee.employee_id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <History className="h-4 w-4 mr-2" />
                          )}
                          Tarixni ko'rish
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Data source info */}
          <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              <span>
                {useMockData
                  ? "Namuna ma'lumotlar ishlatilmoqda"
                  : "Ma'lumotlar bazasidan yuklandi"}
              </span>
            </div>
            <div className="text-xs">
              Sana: {selectedDate} • {filteredEmployees.length} ta hodim
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee History Modal - Full Screen */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-background">
                <div className="h-full flex flex-col">
                  {/* Modal Header */}
                  <div className="border-b px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeHistoryModal}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <History className="h-6 w-6" />
                          Hodim Tarixi
                        </h2>
                        <p className="text-gray-500 flex items-center gap-2 mt-1">
                          <User className="h-4 w-4" />
                          {selectedEmployeeName} • {selectedEmployeeNo} •{" "}
                          {selectedDate}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeHistoryModal}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-auto p-6">
                    {isLoadingHistory ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-lg">Hodim tarixi yuklanmoqda...</p>
                        <p className="text-gray-500 mt-2">
                          {selectedEmployeeName} uchun {selectedDate} sanasi
                          tarixi olinmoqda
                        </p>
                      </div>
                    ) : (
                      <div className="max-w-6xl mx-auto space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Jami Tadbirlar
                                  </p>
                                  <p className="text-3xl font-bold mt-1">
                                    {employeeHistory.length}
                                  </p>
                                </div>
                                <div className="p-3 rounded-full bg-blue-50">
                                  <Clock4 className="h-6 w-6 text-blue-600" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Kirish Vaqti
                                  </p>
                                  <p className="text-2xl font-bold mt-1">
                                    {timesFromHistory.kirish || "—"}
                                  </p>
                                </div>
                                <div className="p-3 rounded-full bg-green-50">
                                  <DoorOpen className="h-6 w-6 text-green-600" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Chiqish Vaqti
                                  </p>
                                  <p className="text-2xl font-bold mt-1">
                                    {timesFromHistory.chiqish || "—"}
                                  </p>
                                </div>
                                <div className="p-3 rounded-full bg-red-50">
                                  <DoorClosed className="h-6 w-6 text-red-600" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Tadbirlar Ro'yxati
                            </h3>
                            <p className="text-gray-500">
                              Filtr natijasi: {filteredHistory.length} ta tadbir
                            </p>
                          </div>
                          <Select
                            value={historyFilter}
                            onValueChange={setHistoryFilter}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Tadbir turi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                Barcha tadbirlar
                              </SelectItem>
                              <SelectItem value="kirish">
                                Kirishlar (
                                {timesFromHistory.kirishEvents?.length || 0})
                              </SelectItem>
                              <SelectItem value="chiqish">
                                Chiqishlar (
                                {timesFromHistory.chiqishEvents?.length || 0})
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Events Table */}
                        {filteredHistory.length === 0 ? (
                          <div className="text-center py-12 border rounded-lg">
                            <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">
                              {historyFilter !== "all"
                                ? `Ushbu turdagi tadbirlar topilmadi`
                                : `${selectedEmployeeName} uchun ${selectedDate} sanasida tadbirlar topilmadi`}
                            </p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-20">#</TableHead>
                                  <TableHead>Tadbir Nomi</TableHead>
                                  <TableHead>Vaqti</TableHead>
                                  <TableHead>Sana</TableHead>
                                  <TableHead>Turi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredHistory.map((record, index) => (
                                  <TableRow key={record.id}>
                                    <TableCell className="font-medium">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-medium">
                                        {record.label_name}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {formatHistoryTimeDisplay(
                                        record.event_time,
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {new Date(
                                        record.event_time,
                                      ).toLocaleDateString("uz-UZ")}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          record.label_name
                                            .toLowerCase()
                                            .includes("kirish")
                                            ? "default"
                                            : record.label_name
                                                  .toLowerCase()
                                                  .includes("chiqish")
                                              ? "destructive"
                                              : "secondary"
                                        }
                                      >
                                        {record.label_name
                                          .toLowerCase()
                                          .includes("kirish")
                                          ? "Kirish"
                                          : record.label_name
                                                .toLowerCase()
                                                .includes("chiqish")
                                            ? "Chiqish"
                                            : "Boshqa"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
