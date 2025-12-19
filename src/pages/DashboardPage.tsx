import { useState, useEffect } from 'react';
import { apiService, DailyAttendance, formatDate, EventSyncResponse } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../app/components/ui/avatar';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../app/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../app/components/ui/select';
import { 
  Users, UserCheck, Clock, UserX, Calendar, Search, RefreshCw,
  AlertCircle, Database, Download, ArrowDownUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function DashboardPage() {
  // Format today's date as YYYY-MM-DD
  const formattedToday = formatDate(new Date());
  
  const [selectedDate, setSelectedDate] = useState(formattedToday);
  const [attendance, setAttendance] = useState<DailyAttendance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // Load attendance data
  const loadAttendance = async (date?: string) => {
    try {
      setIsLoading(true);
      console.log('📊 Loading attendance for date:', date || selectedDate);
      
      const dateToLoad = date || selectedDate;
      
      try {
        const attendanceData = await apiService.getDailyAttendance(dateToLoad);
        setAttendance(attendanceData);
        
        // Check if using mock data
        if (attendanceData.employees.length > 0 && 
            attendanceData.employees[0]?.employee_no?.startsWith('EMP')) {
          setUseMockData(true);
        } else {
          setUseMockData(false);
        }
        
        toast.success(`Davomat ma'lumotlari yuklandi: ${attendanceData.stats.came} ta kelgan`);
      } catch (apiError) {
        console.error('API error:', apiError);
        toast.warning("API dan ma'lumot ololmadi. Namuna ma'lumotlar ishlatilmoqda.");
      }
    } catch (error) {
      console.error('❌ Failed to load attendance:', error);
      toast.error('Davomat ma\'lumotlarini yuklab bo\'lmadi');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 REFRESH WITH SYNC FUNCTIONALITY (exactly like EmployeesPage)
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 Starting refresh process...');

      if (useMockData) {
        // In mock mode, just fetch attendance
        await loadAttendance(selectedDate);
        toast.success("Davomat ma'lumotlari yangilandi (namuna rejim)");
      } else {
        try {
          console.log('🔄 Syncing events with devices...');

          // Step 1: Sync events with devices (TODAY only)
          const syncResult = await apiService.syncEvents(
            selectedDate, // fromDate = selectedDate
            selectedDate  // toDate = selectedDate
          );
          console.log('✅ Sync result:', syncResult);

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
              "Sinxronizatsiya amalga oshirildi, lekin natija muvaffaqiyatli emas"
            );
          }

          // Step 2: Fetch updated attendance list
          console.log('📥 Fetching updated attendance data...');
          await loadAttendance(selectedDate);
        } catch (syncError: any) {
          console.error('❌ Sync failed:', syncError);

          // Try to fetch attendance even if sync fails
          console.log('🔄 Attempting to fetch attendance without sync...');
          try {
            await loadAttendance(selectedDate);
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
      console.error('❌ Refresh failed:', error);

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
    loadAttendance(date);
  };

  // Filter employees based on status
  const getFilteredEmployees = () => {
    if (!attendance) return [];

    return attendance.employees.filter((emp) => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_no.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'came') return emp.kirish !== null;
        if (statusFilter === 'late') {
          return emp.late !== '0:00' && emp.late !== '0';
        }
        if (statusFilter === 'absent') return emp.kirish === null;
        return true;
      })();

      return matchesSearch && matchesStatus;
    });
  };

  const filteredEmployees = getFilteredEmployees();

  // Calculate stats
  const stats = attendance ? [
    {
      title: 'Jami hodimlar',
      value: attendance.stats.total,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Kelganlar',
      value: attendance.stats.came,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Kechikkanlar',
      value: attendance.stats.late,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Kelmaganlar',
      value: attendance.stats.absent,
      icon: UserX,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ] : [];

  // Get status badge
  const getStatusBadge = (employee: DailyAttendance['employees'][0]) => {
    if (employee.kirish === null) {
      return <Badge variant="secondary">Kelmadi</Badge>;
    } else if (employee.late !== '0:00' && employee.late !== '0') {
      return <Badge variant="destructive">Kechikdi</Badge>;
    } else {
      return <Badge variant="default">Keldi</Badge>;
    }
  };

  // Format time display
  const formatTime = (time: string | null) => {
    if (!time) return <span className="text-gray-400">—</span>;
    return <span className="font-medium">{time}</span>;
  };

  // Initial load
  useEffect(() => {
    loadAttendance(selectedDate);
  }, []);

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
          <Button
            variant="outline"
            onClick={() => {
              // Open sync modal for custom date range
              toast.info("Boshqa sana oralig'i uchun iltimos, sana tanlang");
            }}
            title="Boshqa sanalar uchun tadbirlarni yuklash"
          >
            <Download className="mr-2 h-4 w-4" />
            Qurilmalardan yuklash
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
                      <p className={`text-3xl font-bold mt-1 ${stat.textColor}`}>
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
                  {isRefreshing ? "Tadbirlar sinxronizatsiya qilinmoqda..." : "Davomat ma'lumotlari yuklanmoqda..."}
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
                  {searchQuery || statusFilter !== 'all'
                    ? "Qidiruv natijasi topilmadi"
                    : "Bu sana uchun davomat ma'lumotlari topilmadi"}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button 
                    variant="outline"
                    onClick={handleRefresh}
                    className="mt-2"
                    disabled={isRefreshing}
                  >
                    <ArrowDownUp className="mr-2 h-4 w-4" />
                    Qurilmalardan tadbirlarni yuklash
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hodim</TableHead>
                    <TableHead>Raqami</TableHead>
                    <TableHead>Kirish</TableHead>
                    <TableHead>Chiqish</TableHead>
                    <TableHead>Kechikish</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={employee.face} 
                              alt={employee.name}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';
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
                            {employee.id && (
                              <span className="text-xs text-gray-500">
                                ID: {employee.id}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {employee.employee_no}
                      </TableCell>
                      <TableCell>
                        {formatTime(employee.kirish)}
                      </TableCell>
                      <TableCell>
                        {formatTime(employee.chiqish)}
                      </TableCell>
                      <TableCell className={employee.late !== '0:00' && employee.late !== '0' ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {employee.late}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(employee)}
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
              Sana: {selectedDate}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}