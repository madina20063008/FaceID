import React, { useState, useEffect } from 'react';
import { 
  Device, 
  apiService,
  User 
} from '../lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";
import { Badge } from "../app/components/ui/badge";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  Activity,
  Server,
  MapPin,
  Calendar,
  User as UserIcon,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState<Device | null>(null);
  const [showDeleteDevice, setShowDeleteDevice] = useState<Device | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [useMockData, setUseMockData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '',
    username: '',
    password: '',
    device_type: 'camera' as 'camera' | 'nvr' | 'dvr' | 'access_control',
    port: 8000,
    location: '',
    user: ''
  });

  const [editDevice, setEditDevice] = useState({
    name: '',
    ip: '',
    username: '',
    password: '',
    device_type: 'camera' as 'camera' | 'nvr' | 'dvr' | 'access_control',
    port: 8000,
    location: '',
    user: ''
  });

  // Qurilmalarni yuklash
  useEffect(() => {
    loadCurrentUserAndDevices();
  }, []);

  const loadCurrentUserAndDevices = async (userId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Joriy foydalanuvchini olish
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);
      
      // Qurilmalarni olish
      const devicesData = await apiService.getDevices(userId);
      setDevices(devicesData);
      setUseMockData(false);
      toast.success(`Qurilmalar yuklandi: ${devicesData.length} ta`);
    } catch (err: any) {
      console.error('Qurilmalarni yuklashda xatolik:', err);
      setError(err.message || 'Qurilmalarni yuklashda xatolik');
      setUseMockData(true);
      toast.warning("API dan ma'lumot ololmadi. Namuna ma'lumotlar ishlatilmoqda.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadUserDevices = async () => {
    if (!targetUserId.trim()) {
      toast.error('Iltimos, foydalanuvchi ID-sini kiriting');
      return;
    }
    
    const userId = parseInt(targetUserId);
    if (isNaN(userId)) {
      toast.error('Noto\'g\'ri foydalanuvchi ID-si');
      return;
    }
    
    await loadCurrentUserAndDevices(userId);
  };

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.ip || !newDevice.username || !newDevice.password) {
      toast.error('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    
    try {
      const deviceData: any = {
        name: newDevice.name,
        ip: newDevice.ip,
        username: newDevice.username,
        password: newDevice.password,
        device_type: newDevice.device_type,
        port: newDevice.port,
        location: newDevice.location,
      };
      
      // Agar foydalanuvchi maydoni to'ldirilgan va joriy foydalanuvchi superadmin bo'lsa
      if (newDevice.user && currentUser?.role === 'superadmin') {
        deviceData.user = parseInt(newDevice.user);
      }
      
      await apiService.createDevice(deviceData);
      
      // Qurilmalarni qayta yuklash
      await loadCurrentUserAndDevices();
      setShowAddDevice(false);
      setNewDevice({
        name: '',
        ip: '',
        username: '',
        password: '',
        device_type: 'camera',
        port: 8000,
        location: '',
        user: ''
      });
      toast.success('Qurilma muvaffaqiyatli qo\'shildi');
    } catch (err: any) {
      console.error('Qurilma qo\'shish xatosi:', err);
      toast.error('Qurilma qo\'shishda xatolik: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  const handleEditDevice = async () => {
    if (!showEditDevice) return;
    
    try {
      const updateData: any = {};
      
      if (editDevice.name !== showEditDevice.name) updateData.name = editDevice.name;
      if (editDevice.ip !== showEditDevice.ip) updateData.ip = editDevice.ip;
      if (editDevice.username !== showEditDevice.username) updateData.username = editDevice.username;
      if (editDevice.password) updateData.password = editDevice.password;
      if (editDevice.device_type !== showEditDevice.device_type) updateData.device_type = editDevice.device_type;
      if (editDevice.port !== showEditDevice.port) updateData.port = editDevice.port;
      if (editDevice.location !== showEditDevice.location) updateData.location = editDevice.location;
      
      // Agar superadmin bo'lsa va foydalanuvchi o'zgartirilgan bo'lsa
      if (currentUser?.role === 'superadmin' && editDevice.user && parseInt(editDevice.user) !== showEditDevice.user) {
        updateData.user = parseInt(editDevice.user);
      }
      
      if (Object.keys(updateData).length === 0) {
        setShowEditDevice(null);
        return;
      }
      
      await apiService.updateDevice(showEditDevice.id, updateData);
      
      // Qurilmalarni qayta yuklash
      await loadCurrentUserAndDevices();
      setShowEditDevice(null);
      setEditDevice({
        name: '',
        ip: '',
        username: '',
        password: '',
        device_type: 'camera',
        port: 8000,
        location: '',
        user: ''
      });
      toast.success('Qurilma muvaffaqiyatli yangilandi');
    } catch (err: any) {
      console.error('Qurilmani yangilash xatosi:', err);
      toast.error('Qurilmani yangilashda xatolik: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  const handleDeleteDevice = async () => {
    if (!showDeleteDevice) return;
    
    try {
      await apiService.deleteDevice(showDeleteDevice.id);
      // Qurilmalarni qayta yuklash
      await loadCurrentUserAndDevices();
      setShowDeleteDevice(null);
      toast.success('Qurilma muvaffaqiyatli o\'chirildi');
    } catch (err: any) {
      console.error('Qurilmani o\'chirish xatosi:', err);
      toast.error('Qurilmani o\'chirishda xatolik: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-3 w-3 mr-1" />;
      case 'inactive': return <Server className="h-3 w-3 mr-1" />;
      case 'error': return <AlertCircle className="h-3 w-3 mr-1" />;
      default: return <Server className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Faol';
      case 'inactive': return 'Nofaol';
      case 'error': return 'Xatolik';
      default: return status;
    }
  };

  const getDeviceTypeText = (type?: string) => {
    if (!type) return 'Kamera';
    switch (type.toLowerCase()) {
      case 'camera': return 'Kamera';
      case 'nvr': return 'NVR';
      case 'dvr': return 'DVR';
      case 'access_control': return 'Kirish Nazorati';
      default: return type;
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadCurrentUserAndDevices();
      toast.success('Qurilmalar ro\'yxati yangilandi');
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Yangilashda xatolik yuz berdi');
    } finally {
      setIsRefreshing(false);
    }
  };

  const openEditModal = (device: Device) => {
    setShowEditDevice(device);
    setEditDevice({
      name: device.name,
      ip: device.ip,
      username: device.username,
      password: '',
      device_type: (device.device_type as any) || 'camera',
      port: device.port || 8000,
      location: device.location || '',
      user: device.user.toString()
    });
  };

  // Filter devices for search
  const filteredDevices = devices.filter(
    (device) =>
      device?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device?.ip?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device?.device_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = () => {
    // Already filtered locally
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Qurilmalar</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Kuzatuv qurilmalari va kameralarni boshqarish
            {currentUser && (
              <Badge variant="outline" className="ml-2">
                {currentUser.role === 'superadmin' ? 'Superadmin' : 'Admin'}
              </Badge>
            )}
            {useMockData && (
              <Badge variant="secondary" className="ml-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Namuna rejim
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Superadmin: Boshqa foydalanuvchi qurilmalarini yuklash */}
          {currentUser?.role === 'superadmin' && (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Foydalanuvchi ID-sini kiriting"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full sm:w-48"
              />
              <Button
                onClick={handleLoadUserDevices}
                variant="outline"
                className="whitespace-nowrap"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Qurilmalarni Yuklash
              </Button>
            </div>
          )}
          
          
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Qurilma nomi, IP manzili yoki joylashuvi bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="outline"
              disabled={loading}
            >
              Qidirish
            </Button>
            {searchQuery && (
              <Button onClick={clearSearch} variant="ghost">
                Tozalash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Qurilmalar ro'yxati</CardTitle>
            <CardDescription>
              {loading ? "Yuklanmoqda..." : `Jami: ${devices.length} ta qurilma`}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {filteredDevices.length} ta topildi
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Qurilmalar yuklanmoqda...</p>
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? "Qidiruv natijasi topilmadi" : "Qurilmalar topilmadi"}
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setShowAddDevice(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Birinchi Qurilma Qo'shish
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Qurilma</TableHead>
                    <TableHead>IP & Port</TableHead>
                    <TableHead>Kirish Ma'lumotlari</TableHead>
                    <TableHead>Holati</TableHead>
                    <TableHead>Yaratilgan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{device.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getDeviceTypeText(device.device_type)}
                              </Badge>
                              {device.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {device.location}
                                </span>
                              )}
                            </div>
                          </div>
                          {device.serial_number && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              SN: {device.serial_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm text-gray-900 dark:text-gray-100">{device.ip}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Port: {device.port || 80}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">User:</span>
                            <span className="ml-1">{device.username}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="font-medium">Pass:</span>
                            <span className="ml-1">••••••••</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={`inline-flex items-center w-fit ${getStatusColor(device.status)}`}>
                            {getStatusIcon(device.status)}
                            {getStatusText(device.status)}
                          </Badge>
                          {device.last_sync && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              So'ngi sinxronizatsiya: {formatDate(device.last_sync)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {formatDate(device.created_at)}
                      </TableCell>
                     
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yangi Qurilma Qo'shish</DialogTitle>
            <DialogDescription>
              Yangi kuzatuv qurilmasini qo'shish uchun ma'lumotlarni kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Qurilma Nomi *</Label>
              <Input
                id="name"
                value={newDevice.name}
                onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                placeholder="Masalan: Asosiy Kirish Kamera"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ip">IP Manzil *</Label>
              <Input
                id="ip"
                value={newDevice.ip}
                onChange={(e) => setNewDevice({...newDevice, ip: e.target.value})}
                placeholder="Masalan: 192.168.1.100"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Foydalanuvchi Nomi *</Label>
              <Input
                id="username"
                value={newDevice.username}
                onChange={(e) => setNewDevice({...newDevice, username: e.target.value})}
                placeholder="Masalan: admin"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Parol *</Label>
              <Input
                id="password"
                type="password"
                value={newDevice.password}
                onChange={(e) => setNewDevice({...newDevice, password: e.target.value})}
                placeholder="Qurilma paroli"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="device_type">Qurilma Turi</Label>
              <Select
                value={newDevice.device_type}
                onValueChange={(value: any) => setNewDevice({...newDevice, device_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Qurilma turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camera">Kamera</SelectItem>
                  <SelectItem value="nvr">NVR</SelectItem>
                  <SelectItem value="dvr">DVR</SelectItem>
                  <SelectItem value="access_control">Kirish Nazorati</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={newDevice.port}
                onChange={(e) => setNewDevice({...newDevice, port: parseInt(e.target.value)})}
                placeholder="Masalan: 8000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Joylashuv</Label>
              <Input
                id="location"
                value={newDevice.location}
                onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                placeholder="Masalan: Asosiy Kirish"
              />
            </div>
            
            {/* Faqat superadmin uchun: Belgilangan foydalanuvchiga biriktirish */}
            {currentUser?.role === 'superadmin' && (
              <div className="space-y-2">
                <Label htmlFor="user">Foydalanuvchi ID-siga biriktirish (ixtiyoriy)</Label>
                <Input
                  id="user"
                  type="number"
                  value={newDevice.user}
                  onChange={(e) => setNewDevice({...newDevice, user: e.target.value})}
                  placeholder="O'zingizning qurilmalaringiz uchun bo'sh qoldiring"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDevice(false)}
            >
              Bekor Qilish
            </Button>
            <Button
              onClick={handleAddDevice}
              disabled={!newDevice.name || !newDevice.ip || !newDevice.username || !newDevice.password}
            >
              Qurilma Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={!!showEditDevice} onOpenChange={() => setShowEditDevice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Qurilmani Tahrirlash</DialogTitle>
            <DialogDescription>
              Qurilma ma'lumotlarini yangilash
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Qurilma Nomi</Label>
              <Input
                id="edit-name"
                value={editDevice.name}
                onChange={(e) => setEditDevice({...editDevice, name: e.target.value})}
                placeholder="Masalan: Asosiy Kirish Kamera"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-ip">IP Manzil</Label>
              <Input
                id="edit-ip"
                value={editDevice.ip}
                onChange={(e) => setEditDevice({...editDevice, ip: e.target.value})}
                placeholder="Masalan: 192.168.1.100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-username">Foydalanuvchi Nomi</Label>
              <Input
                id="edit-username"
                value={editDevice.username}
                onChange={(e) => setEditDevice({...editDevice, username: e.target.value})}
                placeholder="Masalan: admin"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-password">Parol (yangilash uchun)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editDevice.password}
                onChange={(e) => setEditDevice({...editDevice, password: e.target.value})}
                placeholder="Agar o'zgartirmoqchi bo'lsangiz kiriting"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-device_type">Qurilma Turi</Label>
              <Select
                value={editDevice.device_type}
                onValueChange={(value: any) => setEditDevice({...editDevice, device_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Qurilma turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camera">Kamera</SelectItem>
                  <SelectItem value="nvr">NVR</SelectItem>
                  <SelectItem value="dvr">DVR</SelectItem>
                  <SelectItem value="access_control">Kirish Nazorati</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-port">Port</Label>
              <Input
                id="edit-port"
                type="number"
                value={editDevice.port}
                onChange={(e) => setEditDevice({...editDevice, port: parseInt(e.target.value)})}
                placeholder="Masalan: 8000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location">Joylashuv</Label>
              <Input
                id="edit-location"
                value={editDevice.location}
                onChange={(e) => setEditDevice({...editDevice, location: e.target.value})}
                placeholder="Masalan: Asosiy Kirish"
              />
            </div>
            
            {/* Faqat superadmin uchun: Foydalanuvchini o'zgartirish */}
            {currentUser?.role === 'superadmin' && (
              <div className="space-y-2">
                <Label htmlFor="edit-user">Foydalanuvchi ID-si</Label>
                <Input
                  id="edit-user"
                  type="number"
                  value={editDevice.user}
                  onChange={(e) => setEditDevice({...editDevice, user: e.target.value})}
                  placeholder="Joriy foydalanuvchi ID-si"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDevice(null)}
            >
              Bekor Qilish
            </Button>
            <Button
              onClick={handleEditDevice}
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDevice} onOpenChange={() => setShowDeleteDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Qurilmani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {showDeleteDevice?.name || "Bu qurilma"} ni o'chirishni xohlaysizmi?
              Bu amalni qaytarib bo'lmaydi va qurilma ma'lumotlari butunlay o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDevice}
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