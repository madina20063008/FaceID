import React, { useState, useEffect } from 'react';
import { 
  apiService,
} from '../lib/api';
import { 
  Branch, 
  CreateBranchRequest,
  UpdateBranchRequest,
  User 
} from '../lib/types';

const FilialPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showEditBranch, setShowEditBranch] = useState<Branch | null>(null);
  const [newBranch, setNewBranch] = useState<CreateBranchRequest>({
    name: '',
    user: undefined
  });
  const [editBranch, setEditBranch] = useState<UpdateBranchRequest>({
    name: '',
    user: undefined
  });

  // Filiallarni yuklash
  useEffect(() => {
    loadCurrentUserAndBranches();
  }, []);

  const loadCurrentUserAndBranches = async (userId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Joriy foydalanuvchini olish
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);
      
      // Filiallarni olish
      const branchesData = await apiService.getBranches(userId);
      setBranches(branchesData);
    } catch (err: any) {
      console.error('Filiallarni yuklashda xatolik:', err);
      
      // API xatosini aniqroq ko'rsatish
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else {
        setError(err.message || 'Filiallarni yuklashda xatolik');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadUserBranches = async () => {
    if (!targetUserId.trim()) {
      setError('Iltimos, foydalanuvchi ID-sini kiriting');
      return;
    }
    
    const userId = parseInt(targetUserId);
    if (isNaN(userId)) {
      setError('Noto\'g\'ri foydalanuvchi ID-si');
      return;
    }
    
    await loadCurrentUserAndBranches(userId);
  };

  const handleAddBranch = async () => {
    if (!newBranch.name) {
      setError('Iltimos, filial nomini kiriting');
      return;
    }
    
    const formattedData: CreateBranchRequest = {
      name: newBranch.name,
    };
    
    // Agar foydalanuvchi superadmin bo'lsa va user ID kiritgan bo'lsa
    if (currentUser?.role === 'superadmin' && newBranch.user) {
      formattedData.user = newBranch.user;
    }
    
    
    try {
      await apiService.createBranch(formattedData);
      
      // Filiallarni qayta yuklash
      await loadCurrentUserAndBranches();
      setShowAddBranch(false);
      setNewBranch({
        name: '',
        user: undefined
      });
    } catch (err: any) {
      console.error('Filial qo\'shish xatosi:', err);
      
      // API xatosini aniqroq ko'rsatish
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError('Filial qo\'shishda xatolik');
      }
    }
  };

  const handleEditBranch = async () => {
    if (!showEditBranch) return;
    
    try {
      const updateData: UpdateBranchRequest = {};
      
      // Faqat o'zgartirilgan maydonlarni yuborish
      if (editBranch.name && editBranch.name !== showEditBranch.name) {
        updateData.name = editBranch.name;
      }
      
      // Agar foydalanuvchi superadmin bo'lsa
      if (currentUser?.role === 'superadmin' && editBranch.user !== undefined) {
        updateData.user = editBranch.user;
      }
      
      // Agar hech narsa o'zgartirilmagan bo'lsa
      if (Object.keys(updateData).length === 0) {
        setShowEditBranch(null);
        return;
      }
      
      await apiService.updateBranch(showEditBranch.id, updateData);
      
      // Filiallarni qayta yuklash
      await loadCurrentUserAndBranches();
      setShowEditBranch(null);
      setEditBranch({
        name: '',
        user: undefined
      });
    } catch (err: any) {
      console.error('Filialni yangilash xatosi:', err);
      
      // API xatosini aniqroq ko'rsatish
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError('Filialni yangilashda xatolik');
      }
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!window.confirm('Haqiqatan ham ushbu filialni o\'chirmoqchimisiz?')) {
      return;
    }
    
    try {
      await apiService.deleteBranch(id);
      // Filiallarni qayta yuklash
      await loadCurrentUserAndBranches();
    } catch (err: any) {
      console.error('Filialni o\'chirish xatosi:', err);
      
      // API xatosini aniqroq ko'rsatish
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError('Filialni o\'chirishda xatolik');
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

  const openEditModal = (branch: Branch) => {
    setShowEditBranch(branch);
    setEditBranch({
      name: branch.name,
      user: branch.user
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Filiallar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sarlavha */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Filiallar Boshqaruvi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Tashkilot filiallarini boshqarish
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Superadmin: Boshqa foydalanuvchi filiallarini yuklash */}
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
                onClick={handleLoadUserBranches}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition whitespace-nowrap"
              >
                Foydalanuvchi Filiallarini Yuklash
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowAddBranch(true)}
            className="px-6 py-3 bg-black dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition font-medium whitespace-nowrap"
          >
            + Yangi Filial Qo'shish
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

      {/* Yangi filial qo'shish modali */}
      {showAddBranch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Yangi Filial Qo'shish
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filial Nomi *
                  </label>
                  <input
                    type="text"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: Bosh filial"
                  />
                </div>
                
                {/* Superadmin uchun: Foydalanuvchiga biriktirish */}
                {currentUser?.role === 'superadmin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foydalanuvchi ID-siga biriktirish (ixtiyoriy)
                    </label>
                    <input
                      type="number"
                      value={newBranch.user || ''}
                      onChange={(e) => setNewBranch({
                        ...newBranch, 
                        user: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="O'zingizning filiallaringiz uchun bo'sh qoldiring"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Agar bo'sh qoldirsangiz, filial o'zingizga biriktiriladi
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddBranch(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Bekor Qilish
                </button>
                <button
                  onClick={handleAddBranch}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                >
                  Qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filialni tahrirlash modali */}
      {showEditBranch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Filialni Tahrirlash
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filial Nomi
                  </label>
                  <input
                    type="text"
                    value={editBranch.name || ''}
                    onChange={(e) => setEditBranch({...editBranch, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: Bosh filial"
                  />
                </div>
                
                {/* Superadmin uchun: Foydalanuvchini o'zgartirish */}
                {currentUser?.role === 'superadmin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foydalanuvchi ID-si
                    </label>
                    <input
                      type="number"
                      value={editBranch.user || ''}
                      onChange={(e) => setEditBranch({
                        ...editBranch, 
                        user: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Joriy foydalanuvchi ID: {showEditBranch.user}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => handleDeleteBranch(showEditBranch.id)}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                >
                  O'chirish
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditBranch(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Bekor Qilish
                  </button>
                  <button
                    onClick={handleEditBranch}
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

      {/* Filiallar ro'yxati */}
      {branches.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-gray-400 dark:text-gray-500 mb-4 text-6xl">🏢</div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Filiallar topilmadi
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            {currentUser?.role === 'superadmin' && !targetUserId
              ? 'Hisobingizga biriktirilgan filiallar yo\'q. Boshlash uchun yangi filial qo\'shing yoki boshqa foydalanuvchi filiallarini ko\'rish uchun foydalanuvchi ID-sini kiriting.'
              : 'Bu foydalanuvchi uchun filiallar topilmadi.'}
          </p>
          <button
            onClick={() => setShowAddBranch(true)}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            + Birinchi Filial Qo'shish
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Filial Nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Yaratilgan sana
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
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{branch.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ID: {branch.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(branch.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">ID:</span> {branch.user}
                        {currentUser?.id === branch.user && (
                          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">
                            Siz
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(branch)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        >
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
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

export default FilialPage;