import React, { useState, useEffect } from 'react';
import { 
  Device, 
  apiService,
  User 
} from '../lib/api';

const DevicesPage = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '',
    username: '',
    password: '',
    device_type: 'camera',
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
    } catch (err: any) {
      console.error('Qurilmalarni yuklashda xatolik:', err);
      setError(err.message || 'Qurilmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadUserDevices = async () => {
    if (!targetUserId.trim()) {
      setError('Iltimos, foydalanuvchi ID-sini kiriting');
      return;
    }
    
    const userId = parseInt(targetUserId);
    if (isNaN(userId)) {
      setError('Noto\'g\'ri foydalanuvchi ID-si');
      return;
    }
    
    await loadCurrentUserAndDevices(userId);
  };

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.ip || !newDevice.username || !newDevice.password) {
      setError('Iltimos, barcha majburiy maydonlarni to\'ldiring');
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
    } catch (err: any) {
      setError(err.message || 'Qurilma qo\'shishda xatolik');
    }
  };

  const handleDeleteDevice = async (id: number) => {
    if (!window.confirm('Haqiqatan ham ushbu qurilmani o\'chirmoqchimisiz?')) {
      return;
    }
    
    try {
      await apiService.deleteDevice(id);
      // Qurilmalarni qayta yuklash
      await loadCurrentUserAndDevices();
    } catch (err: any) {
      setError(err.message || 'Qurilmani o\'chirishda xatolik');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Qurilmalar yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sarlavha */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Qurilmalar</h1>
          <p className="text-gray-600 mt-2">
            Kuzatuv qurilmalari va kameralarni boshqarish
            {currentUser && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                {currentUser.role === 'superadmin' ? 'Superadmin' : 'Admin'}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-4">
          {/* Superadmin: Boshqa foydalanuvchi qurilmalarini yuklash */}
          {currentUser?.role === 'superadmin' && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Foydalanuvchi ID-sini kiriting"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleLoadUserDevices}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Foydalanuvchi Qurilmalarini Yuklash
              </button>
            </div>
          )}
        
        </div>
      </div>

      {/* Xato xabari */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Qurilma qo'shish formasi */}
      {showAddDevice && (
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Yangi Qurilma Qo'shish</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qurilma Nomi *
              </label>
              <input
                type="text"
                value={newDevice.name}
                onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masalan: Asosiy Kirish Kamera"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Manzil *
              </label>
              <input
                type="text"
                value={newDevice.ip}
                onChange={(e) => setNewDevice({...newDevice, ip: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masalan: 192.168.1.100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foydalanuvchi Nomi *
              </label>
              <input
                type="text"
                value={newDevice.username}
                onChange={(e) => setNewDevice({...newDevice, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masalan: admin"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parol *
              </label>
              <input
                type="password"
                value={newDevice.password}
                onChange={(e) => setNewDevice({...newDevice, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Qurilma paroli"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qurilma Turi
              </label>
              <select
                value={newDevice.device_type}
                onChange={(e) => setNewDevice({...newDevice, device_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="camera">Kamera</option>
                <option value="nvr">NVR</option>
                <option value="dvr">DVR</option>
                <option value="access_control">Kirish Nazorati</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                value={newDevice.port}
                onChange={(e) => setNewDevice({...newDevice, port: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masalan: 8000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joylashuv
              </label>
              <input
                type="text"
                value={newDevice.location}
                onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masalan: Asosiy Kirish"
              />
            </div>
            
            {/* Faqat superadmin uchun: Belgilangan foydalanuvchiga biriktirish */}
            {currentUser?.role === 'superadmin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foydalanuvchi ID-siga biriktirish (ixtiyoriy)
                </label>
                <input
                  type="number"
                  value={newDevice.user}
                  onChange={(e) => setNewDevice({...newDevice, user: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="O'zingizning qurilmalaringiz uchun bo'sh qoldiring"
                />
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowAddDevice(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Bekor Qilish
            </button>
            <button
              onClick={handleAddDevice}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Qurilma Qo'shish
            </button>
          </div>
        </div>
      )}

      {/* Qurilmalar ro'yxati */}
      {devices.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <div className="text-gray-400 mb-4 text-6xl">📱</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Qurilmalar topilmadi</h3>
          <p className="text-gray-600 mb-6">Boshlash uchun birinchi qurilmangizni qo'shing</p>
          <button
            onClick={() => setShowAddDevice(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Birinchi Qurilma Qo'shish
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qurilma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP & Port
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kirish Ma'lumotlari
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holati
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yaratilgan
                  </th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{device.name}</div>
                        <div className="text-sm text-gray-500">
                          {device.device_type || 'Kamera'} • {device.location || 'Joylashuv kiritilmagan'}
                        </div>
                        {device.serial_number && (
                          <div className="text-xs text-gray-400 mt-1">
                            SN: {device.serial_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{device.ip}</div>
                      <div className="text-sm text-gray-500">Port: {device.port || 80}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium">Foydalanuvchi:</span> {device.username}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Parol:</span> ••••••••
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(device.status)}`}>
                        {getStatusText(device.status)}
                      </span>
                      {device.last_sync && (
                        <div className="text-xs text-gray-500 mt-1">
                          So'ngi sinxronizatsiya: {formatDate(device.last_sync)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(device.created_at)}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Xulosa */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {devices.length} ta qurilma ko'rsatilmoqda
                {currentUser?.role === 'superadmin' && targetUserId && (
                  <span className="ml-2">foydalanuvchi ID-si: {targetUserId} uchun</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadCurrentUserAndDevices()}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Yangilash
                </button>
                {currentUser?.role === 'superadmin' && (
                  <button
                    onClick={() => {
                      setTargetUserId('');
                      loadCurrentUserAndDevices();
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Mening Qurilmalarimni Ko'rsatish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesPage;