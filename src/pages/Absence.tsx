import React, { useState, useEffect } from 'react';
import { apiService, formatDate, formatPrice } from '../lib/api';
import { 
  AbsentEmployee, 
  AbsentEmployeesResponse,
  MonthlyReportResponse,
  Employee 
} from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../app/components/ui/dialog';
import {
  Calendar,
  Filter,
  Search,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  BarChart3,
  CalendarDays,
  User,
  Pencil,
  FileSpreadsheet,
  Landmark,
} from 'lucide-react';
import { toast } from 'sonner';

const Absence = () => {
  // State for absent employees
  const [absentData, setAbsentData] = useState<AbsentEmployeesResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for monthly report
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  
  // State for status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAbsent, setSelectedAbsent] = useState<AbsentEmployee | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  
  // Excel download state
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  
  // Add state for current branch
  const [currentBranch, setCurrentBranch] = useState<{
    id: number;
    name: string;
  } | null>(null);
  
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

  // Months data
  const months = [
    { value: '1', label: 'Yanvar' },
    { value: '2', label: 'Fevral' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Aprel' },
    { value: '5', label: 'May' },
    { value: '6', label: 'Iyun' },
    { value: '7', label: 'Iyul' },
    { value: '8', label: 'Avgust' },
    { value: '9', label: 'Sentabr' },
    { value: '10', label: 'Oktabr' },
    { value: '11', label: 'Noyabr' },
    { value: '12', label: 'Dekabr' },
  ];

  // Generate last 5 years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  // Status options
  const statusOptions = [
    { value: 'sbk', label: 'Sababli kelmadi' },
    { value: 'szk', label: 'Sababsiz kelmadi' },
  ];

  // Helper function to sort employees by name
  const sortEmployeesByName = (employees: Employee[]) => {
    return [...employees].sort((a, b) => 
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    );
  };

  // Listen for branch changes
  useEffect(() => {
    const handleBranchChange = () => {
      const branch = getCurrentBranch();
      setCurrentBranch(branch);
      
      // Reload data for the new branch
      if (monthlyReport) {
        loadMonthlyReport();
      } else {
        loadAbsentEmployees();
      }
    };

    window.addEventListener('branchChanged', handleBranchChange);
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, [monthlyReport]);

  // Load absent employees for selected date
  useEffect(() => {
    // Set current branch on initial load
    const branch = getCurrentBranch();
    setCurrentBranch(branch);
    
    if (branch) {
      loadAbsentEmployees();
    }
  }, [selectedDate]);

  // Load employees for filter dropdown
  useEffect(() => {
    const branch = getCurrentBranch();
    if (branch) {
      loadEmployees();
    }
  }, []);

  const loadAbsentEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if branch is selected
      if (!currentBranch) {
        const branch = getCurrentBranch();
        if (!branch) {
          setError('Iltimos, avval filial tanlang');
          toast.error('Iltimos, avval filial tanlang');
          setLoading(false);
          return;
        }
        setCurrentBranch(branch);
      }
      
      const data = await apiService.getAbsentEmployees(selectedDate);
      setAbsentData(data);
    } catch (err: any) {
      console.error('Failed to load absent employees:', err);
      const errorMessage = err.message || 'Kelmagan hodimlarni yuklashda xatolik';
      setError(errorMessage);
      
      // Clear data if branch not selected
      if (err.message.includes('Filial tanlanmagan')) {
        setAbsentData(null);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const branch = getCurrentBranch();
      if (!branch) {
        setError('Iltimos, avval filial tanlang');
        return;
      }
      
      const data = await apiService.getEmployees(branch.id);
      // Sort employees alphabetically
      const sortedEmployees = sortEmployeesByName(data);
      setEmployees(sortedEmployees);
    } catch (err) {
      console.error('Failed to load employees:', err);
      toast.error('Hodimlarni yuklashda xatolik');
    }
  };

  const loadMonthlyReport = async () => {
    try {
      // Check if branch is selected
      if (!currentBranch) {
        const branch = getCurrentBranch();
        if (!branch) {
          setError('Iltimos, avval filial tanlang');
          toast.error('Iltimos, avval filial tanlang');
          return;
        }
        setCurrentBranch(branch);
      }
      
      setLoading(true);
      setError(null);
      
      // Convert string values to numbers for API call
      const monthNum = parseInt(selectedMonth);
      const yearNum = parseInt(selectedYear);
      const employeeId = selectedEmployeeId ? parseInt(selectedEmployeeId) : undefined;
      
      const data = await apiService.getMonthlyReport(monthNum, yearNum, employeeId);
      setMonthlyReport(data);
      
      toast.success(`Oylik hisobot yuklandi: ${data.count} ta hodim`);
    } catch (err: any) {
      console.error('Failed to load monthly report:', err);
      const errorMessage = err.message || 'Oylik hisobotni yuklashda xatolik';
      setError(errorMessage);
      
      // Clear data if branch not selected
      if (err.message.includes('Filial tanlanmagan')) {
        setMonthlyReport(null);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh function
  const handleRefresh = () => {
    if (!currentBranch) {
      toast.error('Iltimos, avval filial tanlang');
      return;
    }
    
    if (monthlyReport) {
      loadMonthlyReport();
    } else {
      loadAbsentEmployees();
    }
  };

  // Kunlik Excel hisobotini yuklash funksiyasi
  const handleDownloadDailyExcel = async () => {
    try {
      // Check if branch is selected
      if (!currentBranch) {
        toast.error('Iltimos, avval filial tanlang');
        return;
      }

      setDownloadingExcel(true);
      toast.info('Excel hisoboti yuklanmoqda...');
      
      // Get current date for download
      const downloadDate = selectedDate;
      
      console.log('Excel hisoboti uchun sana:', downloadDate);
      
      try {
        // Excel faylni serverdan olish
        const blob = await apiService.getDailyExcelReport(downloadDate);
        
        // Faylni yuklash
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Fayl nomini yaratish
        const dateObj = new Date(downloadDate);
        const formattedDate = dateObj.toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\./g, '-');
        
        const fileName = `Kunlik_hisobot_${formattedDate}.xlsx`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        // URL ni tozalash
        window.URL.revokeObjectURL(url);
        
        toast.success(`Excel fayl "${fileName}" muvaffaqiyatli yuklandi!`);
      } catch (apiError: any) {
        console.error('API orqali Excel yuklashda xatolik:', apiError);
        
        // Agar API xato bersa, foydalanuvchiga xabar berish
        let errorMessage = 'Excel faylni yuklashda xatolik';
        
        if (apiError.message?.includes('404')) {
          errorMessage = `"${downloadDate}" sanasi uchun hisobot topilmadi`;
        } else if (apiError.message?.includes('400')) {
          errorMessage = 'Noto\'g\'ri sana formati. YYYY-MM-DD formatida kiriting';
        } else if (apiError.message?.includes('ruxsat yo\'q')) {
          errorMessage = 'Excel hisobotini olish uchun ruxsat yo\'q';
        } else if (apiError.message?.includes('Filial tanlanmagan')) {
          errorMessage = 'Filial tanlanmagan. Iltimos, avval filial tanlang.';
        }
        
        toast.error(errorMessage);
        
        // Alternative: Faylni yaratish
        createFallbackExcel();
      }
    } catch (err: any) {
      console.error('Excel yuklashda umumiy xatolik:', err);
      toast.error('Excel faylni yuklashda xatolik yuz berdi');
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Alternative fallback Excel yaratish
  const createFallbackExcel = () => {
    // Agar serverdan Excel olinmasa, client tomonida ma'lumotlarni yaratish
    if (absentData) {
      // Ma'lumotlarni CSV formatga o'tkazish
      const csvData = [];
      
      // CSV sarlavhalari
      csvData.push(['Hodim ID', 'Hodim nomi', 'Holat', 'Izoh', 'Jarima', 'Sana']);
      
      // Ma'lumotlar qatorlari (sorted alphabetically)
      const sortedEmployees = [...absentData.employees].sort((a, b) => 
        a.employee_name.localeCompare(b.employee_name, 'en', { sensitivity: 'base' })
      );
      
      sortedEmployees.forEach(emp => {
        csvData.push([
          emp.employee_id,
          emp.employee_name,
          emp.status_label,
          emp.comment || '',
          emp.fine,
          emp.date
        ]);
      });
      
      // CSV matnini yaratish
      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // CSV faylni yuklash
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `Kunlik_hisobot_${selectedDate}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // URL ni tozalash
      window.URL.revokeObjectURL(url);
      
      toast.success(`CSV fayl "${fileName}" muvaffaqiyatli yaratildi!`);
    } else {
      toast.error('Yuklash uchun ma\'lumotlar mavjud emas');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedAbsent) return;
    
    try {
      await apiService.updateAbsenceStatus({
        employee_id: selectedAbsent.employee_id,
        date: selectedAbsent.date,
        status: newStatus,
        comment: newComment
      });
      
      // Refresh the data
      loadAbsentEmployees();
      
      // Close modal and reset
      setShowStatusModal(false);
      setSelectedAbsent(null);
      setNewStatus('');
      setNewComment('');
      
      toast.success('Holat muvaffaqiyatli yangilandi');
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(err.message || 'Statusni yangilashda xatolik');
      toast.error('Statusni yangilashda xatolik');
    }
  };

  const openStatusModal = (employee: AbsentEmployee) => {
    setSelectedAbsent(employee);
    setNewStatus(employee.status);
    setNewComment(employee.comment);
    setShowStatusModal(true);
  };

  const formatDateDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sbk': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'szk': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sbk': return <AlertCircle className="h-4 w-4 mr-1" />;
      case 'szk': return <XCircle className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  const toggleEmployeeDetails = (employeeId: number) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  const calculateTotals = () => {
    if (!monthlyReport) return null;
    
    return monthlyReport.results.reduce((acc, emp) => ({
      totalEmployees: acc.totalEmployees + 1,
      totalBonus: acc.totalBonus + (emp.total_bonus || 0),
      totalPenalty: acc.totalPenalty + (emp.total_penalty || 0),
      totalNetAdjustment: acc.totalNetAdjustment + (emp.net_adjustment || 0),
      totalSzk: acc.totalSzk + emp.szk_count,
      totalSbk: acc.totalSbk + emp.sbk_count,
    }), {
      totalEmployees: 0,
      totalBonus: 0,
      totalPenalty: 0,
      totalNetAdjustment: 0,
      totalSzk: 0,
      totalSbk: 0,
    });
  };

  // Filter and sort results alphabetically
  const filteredResults = monthlyReport?.results
    .filter(emp => 
      emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toString().includes(searchQuery)
    )
    .sort((a, b) => 
      a.employee_name.localeCompare(b.employee_name, 'en', { sensitivity: 'base' })
    ) || [];

  const getMonthLabel = () => {
    const month = months.find(m => m.value === selectedMonth);
    return month ? month.label : '';
  };

  if (loading && !absentData && !monthlyReport) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Davomat Tizimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Kelmagan hodimlar va oylik hisobotlarni boshqarish
            {!currentBranch && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Filial tanlanmagan
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Kunlik Excel tugmasi faqat kunlik hisobot sahifasida */}
          {!monthlyReport && (
            <Button
              variant="outline"
              onClick={handleDownloadDailyExcel}
              disabled={downloadingExcel || !currentBranch || !absentData || absentData.employees.length === 0}
              className="gap-2"
              title={!currentBranch ? "Iltimos, filial tanlang" : ""}
            >
              {downloadingExcel ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {downloadingExcel ? 'Yuklanmoqda...' : 'Excelga yuklash'}
            </Button>
          )}
          
          <Button
            onClick={handleRefresh}
            disabled={loading || downloadingExcel || !currentBranch}
            className="gap-2"
            title={!currentBranch ? "Iltimos, filial tanlang" : ""}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Yuklanmoqda...' : 'Yangilash'}
          </Button>
        </div>
      </div>

      {/* Branch Warning */}
      {!currentBranch && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">
                Filial tanlanmagan
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Davomat ma'lumotlarini ko'rish uchun chap panel'dan filial tanlang
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && !error.includes('Filial tanlanmagan') && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Tabs - Only show if branch is selected */}
      {currentBranch && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={() => setMonthlyReport(null)}
              disabled={!currentBranch}
              className={`px-4 py-2 rounded-none border-b-2 ${
                !monthlyReport 
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent'
              }`}
            >
              Kunlik Kelmaganlar
            </Button>
            <Button
              variant="ghost"
              onClick={loadMonthlyReport}
              disabled={!currentBranch}
              className={`px-4 py-2 rounded-none border-b-2 ${
                monthlyReport 
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent'
              }`}
            >
              Oylik Hisobot
            </Button>
          </nav>
        </div>
      )}

      {/* Daily Absent Employees Section - Only show if branch is selected */}
      {!monthlyReport && currentBranch && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Kunlik Kelmagan Hodimlar
                </CardTitle>
                {absentData?.date && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDateDisplay(absentData.date)}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-38"
                  disabled={!currentBranch}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!absentData || absentData.employees.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4 text-6xl">👥</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Kelmagan hodimlar topilmadi
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {selectedDate === formatDate(new Date()) 
                    ? "Hali ish vaqti tugamagan kunlik hisobotni ish vaqti tugagandan so'ng ko'rishingiz mumkin"
                    : "Tanlangan sana uchun kelmagan hodimlar topilmadi"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">Jami Kelmaganlar</p>
                          <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                            {absentData.total}
                          </p>
                        </div>
                        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                          <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Jami Jarima</p>
                          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                            {formatPrice(absentData.employees.reduce((sum, emp) => sum + emp.fine, 0).toString())}
                          </p>
                        </div>
                        <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                          <TrendingDown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Employees Table - Sorted Alphabetically */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-900">
                      <TableRow>
                        <TableHead className="font-semibold">Hodim</TableHead>
                        <TableHead className="font-semibold">Holat</TableHead>
                        <TableHead className="font-semibold">Izoh</TableHead>
                        <TableHead className="font-semibold">Jarima</TableHead>
                        <TableHead className="font-semibold text-right">Harakatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...absentData.employees]
                        .sort((a, b) => 
                          a.employee_name.localeCompare(b.employee_name, 'en', { sensitivity: 'base' })
                        )
                        .map((employee) => (
                        <TableRow key={`${employee.employee_id}-${employee.date}`} 
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                  {employee.employee_name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {employee.employee_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  ID: {employee.employee_id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                              {getStatusIcon(employee.status)}
                              {employee.status_label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                              {employee.comment}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-red-600 dark:text-red-400">
                              {formatPrice(employee.fine.toString())}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStatusModal(employee)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              Holatni Tahrirlash
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Report Section - Only show if branch is selected */}
      {monthlyReport && currentBranch && (
        <>
          {/* Filters Card */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtrlash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Month Selector */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Oy
                  </Label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Oy tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Selector */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Yil
                  </Label>
                  <Select
                    value={selectedYear}
                    onValueChange={setSelectedYear}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Yil tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee Filter - Sorted Alphabetically */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Hodim
                  </Label>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={setSelectedEmployeeId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Hamma hodimlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Hamma hodimlar</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} (ID: {emp.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Qidirish
                  </Label>
                  <Input
                    placeholder="Hodim nomi yoki ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {calculateTotals() && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Jami Hodimlar</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {monthlyReport.count}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Jami Bonus</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                        {formatPrice(calculateTotals()!.totalBonus.toString())}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Jami Jarima</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                        {formatPrice(calculateTotals()!.totalPenalty.toString())}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                      <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Report Table - Sorted Alphabetically */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Oylik Hisobot Jadvali
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {getMonthLabel()} {selectedYear} - {filteredResults.length} ta hodim
                  </p>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Oylik Excel funksiyasi hozirda mavjud emas
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4 text-6xl">📊</div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Hisobot ma'lumotlari topilmadi
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Tanlangan davr uchun hisobot ma'lumotlari mavjud emas. 
                    Iltimos, boshqa oy yoki yilni tanlang yoki hodimlarni qo'shing.
                  </p>
                  <Button onClick={loadMonthlyReport} variant="outline">
                    Qayta yuklash
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((employee) => (
                    <div key={employee.employee_id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Employee Summary Header */}
                      <div 
                        className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => toggleEmployeeDetails(employee.employee_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                  {employee.employee_name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {employee.employee_name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {employee.employee_id}
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Ish vaqti: {employee.worked_time}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Stats */}
                            <div className="hidden md:flex items-center gap-6">
                              <div className="text-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Sababli</div>
                                <div className="font-semibold text-blue-600 dark:text-blue-400">{employee.sbk_count}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Sababsiz</div>
                                <div className="font-semibold text-red-600 dark:text-red-400">{employee.szk_count}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Net</div>
                                <div className={`font-semibold ${employee.net_adjustment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatPrice(employee.net_adjustment.toString())}
                                </div>
                              </div>
                            </div>
                            
                            {/* Expand Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1"
                            >
                              {expandedEmployee === employee.employee_id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed Content */}
                      {expandedEmployee === employee.employee_id && (
                        <div className="p-6">
                          {/* Employee Stats Cards */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-blue-700 dark:text-blue-300">Qo'shimcha Vaqt</p>
                                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 mt-1">
                                    {employee.total_overtime}
                                  </p>
                                </div>
                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Kam Ishlagan</p>
                                  <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mt-1">
                                    {employee.total_undertime}
                                  </p>
                                </div>
                                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                              </div>
                            </div>
                            
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-green-700 dark:text-green-300">Bonus</p>
                                  <p className="text-lg font-semibold text-green-900 dark:text-green-100 mt-1">
                                    {formatPrice(employee.total_bonus.toString())}
                                  </p>
                                </div>
                                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                            </div>
                            
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-red-700 dark:text-red-300">Jarima</p>
                                  <p className="text-lg font-semibold text-red-900 dark:text-red-100 mt-1">
                                    {formatPrice(employee.total_penalty.toString())}
                                  </p>
                                </div>
                                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Daily Details Table */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Kunlik Tafsilotlar ({employee.details.length} kun)
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="font-semibold">Sana</TableHead>
                                    <TableHead className="font-semibold">Holat</TableHead>
                                    <TableHead className="font-semibold">Ish Vaqti</TableHead>
                                    <TableHead className="font-semibold">Farq</TableHead>
                                    <TableHead className="font-semibold text-right">Jarima</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {employee.details.map((detail, idx) => (
                                    <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                      <TableCell className="font-medium">
                                        {new Date(detail.date).toLocaleDateString('uz-UZ', {
                                          weekday: 'short',
                                          day: 'numeric',
                                          month: 'short'
                                        })}
                                      </TableCell>
                                      <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(detail.status)}`}>
                                          {getStatusIcon(detail.status)}
                                          {detail.status_label}
                                        </span>
                                      </TableCell>
                                      <TableCell className="font-mono">{detail.worked}</TableCell>
                                      <TableCell>
                                        <span className={`font-medium ${detail.difference.startsWith('-') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                          {detail.difference}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        <span className={`${detail.penalty > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                          {formatPrice(detail.penalty.toString())}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Summary */}
          {calculateTotals() && (
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-900/10 border-gray-200 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Jami Sababsiz</p>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400 mt-1">
                      {calculateTotals()!.totalSzk} kun
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Jami Sababli</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      {calculateTotals()!.totalSbk} kun
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Jami Bonus</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1">
                      {formatPrice(calculateTotals()!.totalBonus.toString())}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sof Mavjud</p>
                    <p className={`text-lg font-semibold ${calculateTotals()!.totalNetAdjustment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mt-1`}>
                      {formatPrice(calculateTotals()!.totalNetAdjustment.toString())}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Show empty state when branch is not selected and we're not in loading state */}
      {!currentBranch && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
            <Landmark className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Filial tanlanmagan</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Davomat ma'lumotlarini ko'rish uchun iltimos, chap panel'dan filial tanlang
          </p>
        </div>
      )}

      {/* Status Update Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Holatni Yangilash
            </DialogTitle>
            <DialogDescription>
              Hodimning kelmaganlik holatini tahrirlash
            </DialogDescription>
          </DialogHeader>
          
          {selectedAbsent && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Hodim:</span> {selectedAbsent.employee_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span className="font-semibold">Sana:</span> {formatDateDisplay(selectedAbsent.date)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Yangi Holat *</Label>
                <Select
                  value={newStatus}
                  onValueChange={setNewStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Holatni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comment">Izoh</Label>
                <textarea
                  id="comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="Sababni tushuntiring..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setSelectedAbsent(null);
                setNewStatus('');
                setNewComment('');
              }}
            >
              Bekor Qilish
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!newStatus}
            >
              Yangilash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Absence;