import React, { useState, useEffect } from "react";
import {
  apiService,
} from "../lib/api";

import {
  Shift,
  CreateShiftRequest,
  UpdateShiftRequest,
  BreakTime,
  User,
} from "../lib/types";

const ShiftPage = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [showAddShift, setShowAddShift] = useState(false);
  const [showEditShift, setShowEditShift] = useState<Shift | null>(null);
  const [newShift, setNewShift] = useState<CreateShiftRequest>({
    name: "",
    start_time: "09:00:00",
    end_time: "18:00:00",
    break_time: undefined,
    user: undefined,
    approved_late_min: 0,
  });
  const [editShift, setEditShift] = useState<UpdateShiftRequest>({
    name: "",
    start_time: "",
    end_time: "",
    break_time: undefined,
    user: undefined,
    approved_late_min: undefined,
  });

  // Smenalarni yuklash
  useEffect(() => {
    loadCurrentUserAndShifts();
    loadBreakTimes();
  }, []);

  const loadCurrentUserAndShifts = async (userId?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Joriy foydalanuvchini olish
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);

      // DEBUG: Tekshirish
      console.log("Loading shifts for userId:", userId || "current user");
      
      const shiftsData = await apiService.getShifts(userId);
      
      // DEBUG: API dan qaytgan ma'lumot
      console.log("API dan qaytgan shiftsData:", shiftsData);
      if (shiftsData.length > 0) {
        console.log("Birinchi smenaning approved_late_min:", shiftsData[0].approved_late_min);
      }
      
      setShifts(shiftsData);
    } catch (err: any) {
      console.error("Smenalarni yuklashda xatolik:", err);
      setError(err.message || "Smenalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const loadBreakTimes = async () => {
    try {
      const breakTimesData = await apiService.getBreakTimes();
      setBreakTimes(breakTimesData);
    } catch (err: any) {
      console.error("Tanaffus vaqtlarini yuklashda xatolik:", err);
    }
  };

  const handleLoadUserShifts = async () => {
    if (!targetUserId.trim()) {
      setError("Iltimos, foydalanuvchi ID-sini kiriting");
      return;
    }

    const userId = parseInt(targetUserId);
    if (isNaN(userId)) {
      setError("Noto'g'ri foydalanuvchi ID-si");
      return;
    }

    await loadCurrentUserAndShifts(userId);
  };

  const handleAddShift = async () => {
    if (!newShift.name || !newShift.start_time || !newShift.end_time) {
      setError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    // Vaqt formatini tekshirish va to'ldirish
    const formattedData: CreateShiftRequest = {
      name: newShift.name,
      start_time: formatTimeForServer(newShift.start_time),
      end_time: formatTimeForServer(newShift.end_time),
      approved_late_min: newShift.approved_late_min || 0,
    };

    // DEBUG: Serverga yuborilayotgan ma'lumot
    console.log("Serverga yuborilayotgan ma'lumot:", formattedData);

    // Add break_time if selected
    if (newShift.break_time !== undefined) {
      formattedData.break_time = newShift.break_time;
    }

    // Agar foydalanuvchi superadmin bo'lsa va user ID kiritgan bo'lsa
    if (currentUser?.role === "superadmin" && newShift.user) {
      formattedData.user = newShift.user;
    }

    try {
      const createdShift = await apiService.createShift(formattedData);
      
      // DEBUG: Serverdan qaytgan javob
      console.log("Serverdan qaytgan javob:", createdShift);
      console.log("Yaratilgan smenaning approved_late_min:", createdShift.approved_late_min);

      // Smenalarni qayta yuklash
      await loadCurrentUserAndShifts();
      setShowAddShift(false);
      setNewShift({
        name: "",
        start_time: "09:00:00",
        end_time: "18:00:00",
        break_time: undefined,
        user: undefined,
        approved_late_min: 0,
      });
    } catch (err: any) {
      console.error("Smena qo'shish xatosi:", err);
      setError(err.message || "Smena qo'shishda xatolik");
    }
  };

  const handleEditShift = async () => {
    if (!showEditShift) return;

    try {
      const updateData: UpdateShiftRequest = {};
      
      // DEBUG: Edit holati
      console.log("showEditShift:", showEditShift);
      console.log("editShift:", editShift);
      console.log("approved_late_min qiymati:", editShift.approved_late_min);

      // Faqat o'zgartirilgan maydonlarni yuborish
      if (editShift.name && editShift.name !== showEditShift.name) {
        updateData.name = editShift.name;
      }

      if (
        editShift.start_time &&
        formatTimeForServer(editShift.start_time) !== showEditShift.start_time
      ) {
        updateData.start_time = formatTimeForServer(editShift.start_time);
      }

      if (
        editShift.end_time &&
        formatTimeForServer(editShift.end_time) !== showEditShift.end_time
      ) {
        updateData.end_time = formatTimeForServer(editShift.end_time);
      }

      // Add break_time update
      if (
        editShift.break_time !== undefined &&
        editShift.break_time !== showEditShift.break_time
      ) {
        updateData.break_time = editShift.break_time;
      }

      // Add approved_late_min update - MUXIM!
      // Null yoki 0 bo'lishi mumkin, shuning uchun to'g'ri tekshirish kerak
      if (editShift.approved_late_min !== undefined) {
        updateData.approved_late_min = editShift.approved_late_min;
      }

      // Agar foydalanuvchi superadmin bo'lsa
      if (currentUser?.role === "superadmin" && editShift.user !== undefined) {
        updateData.user = editShift.user;
      }

      // Agar hech narsa o'zgartirilmagan bo'lsa
      if (Object.keys(updateData).length === 0) {
        setShowEditShift(null);
        return;
      }

      // DEBUG: Serverga yuborilayotgan yangilash ma'lumotlari
      console.log("Serverga yuborilayotgan updateData:", updateData);

      const updatedShift = await apiService.updateShift(showEditShift.id, updateData);
      
      // DEBUG: Yangilangan smena ma'lumotlari
      console.log("Yangilangan smena:", updatedShift);
      console.log("Yangilangan approved_late_min:", updatedShift.approved_late_min);

      // Smenalarni qayta yuklash
      await loadCurrentUserAndShifts();
      setShowEditShift(null);
      setEditShift({
        name: "",
        start_time: "",
        end_time: "",
        break_time: undefined,
        user: undefined,
        approved_late_min: undefined,
      });
    } catch (err: any) {
      console.error("Smenani yangilash xatosi:", err);
      setError(err.message || "Smenani yangilashda xatolik");
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!window.confirm("Haqiqatan ham ushbu smenani o'chirmoqchimisiz?")) {
      return;
    }

    try {
      await apiService.deleteShift(id);
      await loadCurrentUserAndShifts();
    } catch (err: any) {
      console.error("Smenani o'chirish xatosi:", err);
      setError(err.message || "Smenani o'chirishda xatolik");
    }
  };

  // Server uchun vaqt formatlash
  const formatTimeForServer = (time: string): string => {
    if (!time) return "00:00:00";

    if (time.includes(":")) {
      const parts = time.split(":");
      if (parts.length === 1) {
        return `${parts[0].padStart(2, "0")}:00:00`;
      } else if (parts.length === 2) {
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
      } else {
        return time;
      }
    } else {
      const paddedTime = time.padStart(4, "0");
      return `${paddedTime.substring(0, 2)}:${paddedTime.substring(2, 4)}:00`;
    }
  };

  // Input uchun vaqt formatlash
  const formatTimeForInput = (timeString: string): string => {
    if (!timeString) return "";

    if (timeString && timeString.length >= 5) {
      return timeString.substring(0, 5);
    }
    return timeString;
  };

  // Smena davomiyligini hisoblash
  const calculateDuration = (startTime: string, endTime: string): string => {
    try {
      const start = formatTimeForServer(startTime);
      const end = formatTimeForServer(endTime);

      const startParts = start.split(":").map(Number);
      const endParts = end.split(":").map(Number);

      if (startParts.length < 3 || endParts.length < 3) {
        return "Format xatosi";
      }

      let startHours = startParts[0];
      let startMinutes = startParts[1];
      let endHours = endParts[0];
      let endMinutes = endParts[1];

      if (
        endHours < startHours ||
        (endHours === startHours && endMinutes < startMinutes)
      ) {
        endHours += 24;
      }

      const totalMinutes =
        endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${hours} soat ${minutes} daqiqa`;
    } catch (error) {
      console.error("Davomiylik hisoblashda xatolik:", error);
      return "Hisoblanmadi";
    }
  };

  // Yangi smenaning davomiyligini hisoblash
  const getNewShiftDuration = () => {
    return calculateDuration(newShift.start_time, newShift.end_time);
  };

  // Helper to get break time name by ID
  const getBreakTimeName = (breakTimeId: number | null): string => {
    if (!breakTimeId) return "Tanlanmagan";
    const breakTime = breakTimes.find((bt) => bt.id === breakTimeId);
    return breakTime ? breakTime.name : "Tanlanmagan";
  };

  const openEditModal = (shift: Shift) => {
    // DEBUG: Tanlangan smena ma'lumotlari
    console.log("Tanlangan smena:", shift);
    console.log("Tanlangan smenaning approved_late_min:", shift.approved_late_min);
    
    setShowEditShift(shift);
    setEditShift({
      name: shift.name,
      start_time: formatTimeForInput(shift.start_time),
      end_time: formatTimeForInput(shift.end_time),
      break_time: shift.break_time,
      user: shift.user,
      approved_late_min: shift.approved_late_min !== undefined ? shift.approved_late_min : 0,
    });
  };

  // Vaqt input o'zgartirganda
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setNewShift({
      ...newShift,
      start_time: time + ":00",
    });
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setNewShift({
      ...newShift,
      end_time: time + ":00",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Smenalar yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Smena Boshqaruvi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ish smenalari va vaqt jadvallarini boshqarish
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {currentUser?.role === "superadmin" && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Foydalanuvchi ID-sini kiriting"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleLoadUserShifts}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition whitespace-nowrap"
              >
                Foydalanuvchi Smenalarini Yuklash
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAddShift(true)}
            className="px-6 py-3 bg-black dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition font-medium whitespace-nowrap"
          >
            + Yangi Smena Qo'shish
          </button>
        </div>
      </div>

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

      {/* Yangi smena qo'shish modali */}
      {showAddShift && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Yangi Smena Qo'shish
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Smena Nomi *
                  </label>
                  <input
                    type="text"
                    value={newShift.name}
                    onChange={(e) =>
                      setNewShift({ ...newShift, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: Kunduzgi smena"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Boshlanish Vaqti *
                    </label>
                    <input
                      type="time"
                      value={newShift.start_time.substring(0, 5)}
                      onChange={handleStartTimeChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tanlangan: {newShift.start_time}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tugash Vaqti *
                    </label>
                    <input
                      type="time"
                      value={newShift.end_time.substring(0, 5)}
                      onChange={handleEndTimeChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tanlangan: {newShift.end_time}
                    </p>
                  </div>
                </div>

                {/* Approved Late Minutes field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ruxsat Etilgan Kechikish (daqiqa)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="0"
                    step="1"
                    value={newShift.approved_late_min}
                    onChange={(e) =>
                      setNewShift({
                        ...newShift,
                        approved_late_min: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ishchilarning necha daqiqa kech kelishi ruxsat etilgan. 
                    Masalan: 15 (ishchi 8:00 smenada, 8:15 gacha kelishi mumkin)
                  </p>
                </div>

                {/* Tanaffus vaqtini tanlash */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanaffus Vaqti (ixtiyoriy)
                  </label>
                  <select
                    value={newShift.break_time || ""}
                    onChange={(e) =>
                      setNewShift({
                        ...newShift,
                        break_time: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Tanlanmagan</option>
                    {breakTimes.map((breakTime) => (
                      <option key={breakTime.id} value={breakTime.id}>
                        {breakTime.name} ({breakTime.start_time.substring(0, 5)}{" "}
                        - {breakTime.end_time.substring(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Superadmin uchun: Foydalanuvchiga biriktirish */}
                {currentUser?.role === "superadmin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foydalanuvchi ID-siga biriktirish (ixtiyoriy)
                    </label>
                    <input
                      type="number"
                      value={newShift.user || ""}
                      onChange={(e) =>
                        setNewShift({
                          ...newShift,
                          user: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="O'zingizning smenalaringiz uchun bo'sh qoldiring"
                    />
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Smena davomiyligi: {getNewShiftDuration()}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Ruxsat etilgan kechikish: {newShift.approved_late_min || 0} daqiqa
                  </p>
                  
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddShift(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Bekor Qilish
                </button>
                <button
                  onClick={handleAddShift}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                >
                  Qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smenani tahrirlash modali */}
      {showEditShift && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Smenani Tahrirlash
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Smena Nomi
                  </label>
                  <input
                    type="text"
                    value={editShift.name || ""}
                    onChange={(e) =>
                      setEditShift({ ...editShift, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Masalan: Kunduzgi smena"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Boshlanish Vaqti
                    </label>
                    <input
                      type="time"
                      value={editShift.start_time?.substring(0, 5) || ""}
                      onChange={(e) =>
                        setEditShift({
                          ...editShift,
                          start_time: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tugash Vaqti
                    </label>
                    <input
                      type="time"
                      value={editShift.end_time?.substring(0, 5) || ""}
                      onChange={(e) =>
                        setEditShift({ ...editShift, end_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Approved Late Minutes field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ruxsat Etilgan Kechikish (daqiqa)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="0"
                    step="1"
                    value={editShift.approved_late_min !== undefined ? editShift.approved_late_min : (showEditShift.approved_late_min)}
                    onChange={(e) =>
                      setEditShift({
                        ...editShift,
                        approved_late_min: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Joriy qiymat: {showEditShift.approved_late_min || 0} daqiqa
                  </p>
                </div>

                {/* Tanaffus vaqtini yangilash */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanaffus Vaqti
                  </label>
                  <select
                    value={editShift.break_time || ""}
                    onChange={(e) =>
                      setEditShift({
                        ...editShift,
                        break_time: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Tanlanmagan</option>
                    {breakTimes.map((breakTime) => (
                      <option key={breakTime.id} value={breakTime.id}>
                        {breakTime.name} ({breakTime.start_time.substring(0, 5)}{" "}
                        - {breakTime.end_time.substring(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Superadmin uchun: Foydalanuvchini o'zgartirish */}
                {currentUser?.role === "superadmin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foydalanuvchi ID-si
                    </label>
                    <input
                      type="number"
                      value={editShift.user || ""}
                      onChange={(e) =>
                        setEditShift({
                          ...editShift,
                          user: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Joriy davomiylik:{" "}
                    {calculateDuration(
                      showEditShift.start_time,
                      showEditShift.end_time
                    )}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Ruxsat etilgan kechikish: {showEditShift.approved_late_min || 0} daqiqa
                  </p>
                  
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => handleDeleteShift(showEditShift.id)}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                >
                  O'chirish
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditShift(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Bekor Qilish
                  </button>
                  <button
                    onClick={handleEditShift}
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

      {/* Smenalar ro'yxati */}
      {shifts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-gray-400 dark:text-gray-500 mb-4 text-6xl">
            🕐
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Smenalar topilmadi
          </h3>
          <button
            onClick={() => setShowAddShift(true)}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            + Birinchi Smenani Qo'shish
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Smena Nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vaqt Jadvali
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Davomiylik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ruxsat Etilgan Kechikish
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tanaffus Vaqti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Harakatlar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {shifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {shift.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ID: {shift.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Boshlanish:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatTimeForInput(shift.start_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tugash:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatTimeForInput(shift.end_time)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                        {calculateDuration(shift.start_time, shift.end_time)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {shift.approved_late_min && shift.approved_late_min > 0 ? (
                        <div className="space-y-1">
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-medium rounded-full">
                            {shift.approved_late_min} daqiqa
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeForInput(shift.start_time)} dan {shift.approved_late_min} daqiqa keyingacha
                          </div>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full">
                          Ruxsat etilmagan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {shift.break_time ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {getBreakTimeName(shift.break_time)}
                          </div>
                          {(() => {
                            const breakTime = breakTimes.find(
                              (bt) => bt.id === shift.break_time
                            );
                            if (breakTime) {
                              return (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimeForInput(breakTime.start_time)} -{" "}
                                  {formatTimeForInput(breakTime.end_time)}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full">
                          Tanlanmagan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(shift)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        >
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
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

export default ShiftPage;