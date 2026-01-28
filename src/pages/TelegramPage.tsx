import React, { useState, useEffect } from 'react';
import { 
  apiService,
} from '../lib/api';
import { 
  TelegramChannel, 
  CreateTelegramChannelRequest,
  UpdateTelegramChannelRequest,
  User,
  Device
} from '../lib/types';

const TelegramChannelPage = () => {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showEditChannel, setShowEditChannel] = useState<TelegramChannel | null>(null);
  const [newChannel, setNewChannel] = useState<CreateTelegramChannelRequest>({
    name: '',
    chat_id: '',
    resolved_id: '',
    device: undefined,
    user: undefined,
    branch: undefined
  });
  const [editChannel, setEditChannel] = useState<UpdateTelegramChannelRequest>({
    name: '',
    chat_id: '',
    resolved_id: '',
    device: undefined,
    user: undefined,
    branch: undefined
  });

  // Telegram kanallarini yuklash
  useEffect(() => {
    loadCurrentUserAndChannels();
    loadDevices(); // Load devices for dropdown
  }, []);

  const loadCurrentUserAndChannels = async (userId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Joriy foydalanuvchini olish
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);
      
      // Telegram kanallarini olish
      const channelsData = await apiService.getTelegramChannels(userId);
      setChannels(channelsData);
    } catch (err: any) {
      console.error('Telegram kanallarini yuklashda xatolik:', err);
      
      // API xatosini aniqroq ko'rsatish
      if (err.message?.includes('Filial tanlanmagan')) {
        setError('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      } else if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else {
        setError(err.message || 'Telegram kanallarini yuklashda xatolik');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const devicesData = await apiService.getDevices();
      setDevices(devicesData);
    } catch (err) {
      console.error('Qurilmalarni yuklashda xatolik:', err);
    }
  };

  const handleLoadUserChannels = async () => {
    if (!targetUserId.trim()) {
      setError('Iltimos, foydalanuvchi ID-sini kiriting');
      return;
    }
    
    const userId = parseInt(targetUserId);
    if (isNaN(userId)) {
      setError('Noto\'g\'ri foydalanuvchi ID-si');
      return;
    }
    
    await loadCurrentUserAndChannels(userId);
  };

  const handleAddChannel = async () => {
    if (!newChannel.name || !newChannel.chat_id) {
      setError('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    
    // Get current branch from localStorage
    const branchId = localStorage.getItem('selected_branch_id');
    if (!branchId) {
      setError('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      return;
    }
    
    const formattedData: CreateTelegramChannelRequest = {
      name: newChannel.name,
      chat_id: newChannel.chat_id,
      device: newChannel.device,
      branch: parseInt(branchId), // Add current branch
    };
    
    // Agar foydalanuvchi superadmin bo'lsa va user ID kiritgan bo'lsa
    if (currentUser?.role === 'superadmin' && newChannel.user) {
      formattedData.user = newChannel.user;
    }
    
    try {
      await apiService.createTelegramChannel(formattedData);
      
      // Kanallarni qayta yuklash
      await loadCurrentUserAndChannels();
      setShowAddChannel(false);
      setNewChannel({
        name: '',
        chat_id: '',
        resolved_id: '',
        device: undefined,
        user: undefined,
        branch: undefined
      });
    } catch (err: any) {
      console.error("Telegram kanali qo'shish xatosi:", err);
      
      // API xatosini aniqroq ko'rsatish
      if (err.message?.includes('Filial tanlanmagan')) {
        setError('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      } else if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Telegram kanali qo'shishda xatolik");
      }
    }
  };

  const handleEditChannel = async () => {
    if (!showEditChannel) return;
    
    try {
      const updateData: UpdateTelegramChannelRequest = {};
      
      // Faqat o'zgartirilgan maydonlarni yuborish
      if (editChannel.name && editChannel.name !== showEditChannel.name) {
        updateData.name = editChannel.name;
      }
      
      if (editChannel.chat_id && editChannel.chat_id !== showEditChannel.chat_id) {
        updateData.chat_id = editChannel.chat_id;
      }
      
      // device ni yangilash
      if (editChannel.device !== undefined && editChannel.device !== showEditChannel.device) {
        updateData.device = editChannel.device;
      }
      
      // Agar foydalanuvchi superadmin bo'lsa
      if (currentUser?.role === 'superadmin' && editChannel.user !== undefined) {
        updateData.user = editChannel.user;
      }
      
      // Agar hech narsa o'zgartirilmagan bo'lsa
      if (Object.keys(updateData).length === 0) {
        setShowEditChannel(null);
        return;
      }
      
      await apiService.updateTelegramChannel(showEditChannel.id, updateData);
      
      // Kanallarni qayta yuklash
      await loadCurrentUserAndChannels();
      setShowEditChannel(null);
      setEditChannel({
        name: '',
        chat_id: '',
        resolved_id: '',
        device: undefined,
        user: undefined,
        branch: undefined
      });
    } catch (err: any) {
      console.error('Telegram kanalini yangilash xatosi:', err);
      
      // API xatosini aniqroq ko'rsatish
      if (err.message?.includes('Filial tanlanmagan')) {
        setError('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      } else if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError('Telegram kanalini yangilashda xatolik');
      }
    }
  };

  const handleDeleteChannel = async (id: number) => {
    if (!window.confirm('Haqiqatan ham ushbu Telegram kanalini o\'chirmoqchimisiz?')) {
      return;
    }
    
    try {
      await apiService.deleteTelegramChannel(id);
      // Kanallarni qayta yuklash
      await loadCurrentUserAndChannels();
    } catch (err: any) {
      console.error('Telegram kanalini o\'chirish xatosi:', err);
      
      // API xatosini aniqroq ko'rsatish
      if (err.message?.includes('Filial tanlanmagan')) {
        setError('Filial tanlanmagan. Iltimos, avval filial tanlang.');
      } else if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError('Telegram kanalini o\'chirishda xatolik');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Noma\'lum';
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openEditModal = (channel: TelegramChannel) => {
    setShowEditChannel(channel);
    setEditChannel({
      name: channel.name,
      chat_id: channel.chat_id,
      resolved_id: channel.resolved_id,
      device: channel.device,
      user: channel.user,
      branch: channel.branch
    });
  };

  // Chat ID ni formatlash (username yoki ID uchun)
  const formatChatId = (chatId: string): string => {
    if (chatId.startsWith('@')) {
      return chatId; // Username
    } else if (chatId.startsWith('-100')) {
      return `ID: ${chatId}`; // Grup ID
    }
    return chatId;
  };

  // Qurilmani nomini olish
  const getDeviceName = (deviceId?: number): string => {
    if (!deviceId) return 'Qurilma tanlanmagan';
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name || `Qurilma ${deviceId}` : `Qurilma ${deviceId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Telegram kanallari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sarlavha */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Telegram Kanallari</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Xabarnomalar va yangiliklar uchun Telegram kanallarini boshqarish
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Superadmin: Boshqa foydalanuvchi kanallarini yuklash */}
          {currentUser?.role === 'superadmin' && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Foydalanuvchi ID-sini kiriting"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleLoadUserChannels}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition whitespace-nowrap"
              >
                Foydalanuvchi Kanallarini Yuklash
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowAddChannel(true)}
            className="px-6 py-3 bg-black dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition font-medium whitespace-nowrap"
          >
            + Yangi Kanal Qo'shish
          </button>
        </div>
      </div>

      {/* Xato xabari */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
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

      {/* Yangi kanal qo'shish modali */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Yangi Telegram Kanal Qo'shish
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kanal Nomi *
                  </label>
                  <input
                    type="text"
                    value={newChannel.name}
                    onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: Xodimlar kanali"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chat ID yoki Username *
                  </label>
                  <input
                    type="text"
                    value={newChannel.chat_id}
                    onChange={(e) => setNewChannel({...newChannel, chat_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: @company_staff yoki https://t.me/+ARu2NbBo4"
                  />
                </div>
                
                {/* Device selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Qurilmani tanlash (ixtiyoriy)
                  </label>
                  <select
                    value={newChannel.device || ''}
                    onChange={(e) => setNewChannel({
                      ...newChannel, 
                      device: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Qurilma tanlanmagan</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name} (ID: {device.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ushbu qurilma bilan bog'langan hodimlar bu kanalga xabarlar yuboradi
                  </p>
                </div>
                
                {/* Superadmin uchun: Foydalanuvchiga biriktirish */}
                {currentUser?.role === 'superadmin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foydalanuvchi ID-siga biriktirish (ixtiyoriy)
                    </label>
                    <input
                      type="number"
                      value={newChannel.user || ''}
                      onChange={(e) => setNewChannel({
                        ...newChannel, 
                        user: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="O'zingizning kanallaringiz uchun bo'sh qoldiring"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Agar bo'sh qoldirsangiz, kanal o'zingizga biriktiriladi
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddChannel(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Bekor Qilish
                </button>
                <button
                  onClick={handleAddChannel}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                >
                  Qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanalni tahrirlash modali */}
      {showEditChannel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Telegram Kanalini Tahrirlash
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kanal Nomi
                  </label>
                  <input
                    type="text"
                    value={editChannel.name || ''}
                    onChange={(e) => setEditChannel({...editChannel, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: Xodimlar kanali"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chat ID yoki Username
                  </label>
                  <input
                    type="text"
                    value={editChannel.chat_id || ''}
                    onChange={(e) => setEditChannel({...editChannel, chat_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: @company_staff yoki -100123456789"
                  />
                </div>
                
                {/* Device selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Qurilma
                  </label>
                  <select
                    value={editChannel.device || ''}
                    onChange={(e) => setEditChannel({
                      ...editChannel, 
                      device: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Qurilma tanlanmagan</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name} (ID: {device.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Joriy: {getDeviceName(showEditChannel.device)}
                  </p>
                </div>
                
                {/* Superadmin uchun: Foydalanuvchini o'zgartirish */}
                {currentUser?.role === 'superadmin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foydalanuvchi ID-si
                    </label>
                    <input
                      type="number"
                      value={editChannel.user || ''}
                      onChange={(e) => setEditChannel({
                        ...editChannel, 
                        user: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Joriy foydalanuvchi ID: {showEditChannel.user}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => handleDeleteChannel(showEditChannel.id)}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                >
                  O'chirish
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditChannel(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Bekor Qilish
                  </button>
                  <button
                    onClick={handleEditChannel}
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanallar ro'yxati */}
      {channels.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-gray-400 dark:text-gray-500 mb-4 text-6xl">📢</div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Telegram kanallari topilmadi
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            {currentUser?.role === 'superadmin' && !targetUserId
              ? 'Hisobingizga biriktirilgan Telegram kanallari yo\'q. Boshlash uchun yangi kanal qo\'shing yoki boshqa foydalanuvchi kanallarini ko\'rish uchun foydalanuvchi ID-sini kiriting.'
              : 'Bu foydalanuvchi uchun Telegram kanallari topilmadi.'}
          </p>
          <button
            onClick={() => setShowAddChannel(true)}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            + Birinchi Kanal Qo'shish
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Kanal Nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chat ID / Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Qurilma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Foydalanuvchi
                  </th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Harakatlar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {channels.map((channel) => (
                  <tr key={channel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{channel.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ID: {channel.id}
                      </div>
                      {channel.created_at && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Yaratilgan: {formatDate(channel.created_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-900 dark:text-white">
                        {formatChatId(channel.chat_id)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {channel.chat_id.startsWith('@') ? 'Username' : 'Chat ID'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getDeviceName(channel.device)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">ID:</span> {channel.user}
                        {currentUser?.id === channel.user && (
                          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">
                            Siz
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(channel)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        >
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => handleDeleteChannel(channel.id)}
                          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                        >
                          O'chirish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


export default TelegramChannelPage;