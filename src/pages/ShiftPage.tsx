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
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>([]); // Add break times state
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
  });
  const [editShift, setEditShift] = useState<UpdateShiftRequest>({
    name: "",
    start_time: "",
    end_time: "",
    break_time: undefined,
    user: undefined,
  });

  // Smenalarni yuklash
  useEffect(() => {
    loadCurrentUserAndShifts();
    loadBreakTimes(); // Load break times
  }, []);

  const loadCurrentUserAndShifts = async (userId?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Joriy foydalanuvchini olish
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);

      // Agar userId berilgan bo'lsa, o'sha userId bilan, aks holda undefined
      const shiftsData = await apiService.getShifts(userId);
      setShifts(shiftsData);
    } catch (err: any) {
      console.error("Smenalarni yuklashda xatolik:", err);

      // API xatosini aniqroq ko'rsatish
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else {
        setError(err.message || "Smenalarni yuklashda xatolik");
      }
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
    };

    // Add break_time if selected
    if (newShift.break_time !== undefined) {
      formattedData.break_time = newShift.break_time;
    }

    // Agar foydalanuvchi superadmin bo'lsa va user ID kiritgan bo'lsa
    if (currentUser?.role === "superadmin" && newShift.user) {
      formattedData.user = newShift.user;
    }

    console.log("📤 Smena yaratish ma'lumotlari:", formattedData);

    try {
      await apiService.createShift(formattedData);

      // Smenalarni qayta yuklash
      await loadCurrentUserAndShifts();
      setShowAddShift(false);
      setNewShift({
        name: "",
        start_time: "09:00:00",
        end_time: "18:00:00",
        break_time: undefined,
        user: undefined,
      });
    } catch (err: any) {
      console.error("Smena qo'shish xatosi:", err);

      // API xatosini aniqroq ko'rsatish
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Smena qo'shishda xatolik");
      }
    }
  };

  const handleEditShift = async () => {
    if (!showEditShift) return;

    try {
      const updateData: UpdateShiftRequest = {};

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

      // Agar foydalanuvchi superadmin bo'lsa
      if (currentUser?.role === "superadmin" && editShift.user !== undefined) {
        updateData.user = editShift.user;
      }

      // Agar hech narsa o'zgartirilmagan bo'lsa
      if (Object.keys(updateData).length === 0) {
        setShowEditShift(null);
        return;
      }

      console.log("✏️ Smenani yangilash ma'lumotlari:", updateData);

      await apiService.updateShift(showEditShift.id, updateData);

      // Smenalarni qayta yuklash
      await loadCurrentUserAndShifts();
      setShowEditShift(null);
      setEditShift({
        name: "",
        start_time: "",
        end_time: "",
        break_time: undefined,
        user: undefined,
      });
    } catch (err: any) {
      console.error("Smenani yangilash xatosi:", err);

      // API xatosini aniqroq ko'rsatish
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Smenani yangilashda xatolik");
      }
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!window.confirm("Haqiqatan ham ushbu smenani o'chirmoqchimisiz?")) {
      return;
    }

    try {
      await apiService.deleteShift(id);
      // Smenalarni qayta yuklash
      await loadCurrentUserAndShifts();
    } catch (err: any) {
      console.error("Smenani o'chirish xatosi:", err);

      // API xatosini aniqroq ko'rsatish
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Smenani o'chirishda xatolik");
      }
    }
  };

  // Server uchun vaqt formatlash
  const formatTimeForServer = (time: string): string => {
    if (!time) return "00:00:00";

    // Agar ":" belgisi bo'lsa
    if (time.includes(":")) {
      const parts = time.split(":");
      if (parts.length === 1) {
        // Faqat soat: "09" -> "09:00:00"
        return `${parts[0].padStart(2, "0")}:00:00`;
      } else if (parts.length === 2) {
        // Soat va minut: "09:00" -> "09:00:00"
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
      } else {
        // To'liq format: "09:00:00"
        return time;
      }
    } else {
      // Raqam: "900" -> "09:00:00"
      const paddedTime = time.padStart(4, "0");
      return `${paddedTime.substring(0, 2)}:${paddedTime.substring(2, 4)}:00`;
    }
  };

  // Input uchun vaqt formatlash
  const formatTimeForInput = (timeString: string): string => {
    if (!timeString) return "";

    // "14:28:20" -> "14:28"
    if (timeString && timeString.length >= 5) {
      return timeString.substring(0, 5);
    }
    return timeString;
  };

  // Smena davomiyligini hisoblash (XATOLIKNI OLDINI OLISH UCHUN)
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

      // Agar tugash vaqti boshlanish vaqtidan kichik bo'lsa, keyingi kunga o'tkazamiz
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Noma'lum";
    return new Date(dateString).toLocaleString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openEditModal = (shift: Shift) => {
    setShowEditShift(shift);
    setEditShift({
      name: shift.name,
      start_time: formatTimeForInput(shift.start_time),
      end_time: formatTimeForInput(shift.end_time),
      break_time: shift.break_time,
      user: shift.user,
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
      {/* Sarlavha */}
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
          {/* Superadmin: Boshqa foydalanuvchi smenalarini yuklash */}
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

      {/* Yangi smena qo'shish modali */}
      {showAddShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Smenaga biriktiriladigan tanaffus vaqtini tanlang
                  </p>
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="O'zingizning smenalaringiz uchun bo'sh qoldiring"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Agar bo'sh qoldirsangiz, smena o'zingizga biriktiriladi
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Smena davomiyligi: {getNewShiftDuration()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Serverga yuboriladigan format:{" "}
                    {formatTimeForServer(newShift.start_time)} -{" "}
                    {formatTimeForServer(newShift.end_time)}
                  </p>
                  {newShift.break_time && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Tanaffus vaqti: {getBreakTimeName(newShift.break_time)}
                    </p>
                  )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Joriy tanaffus vaqti:{" "}
                    {getBreakTimeName(showEditShift.break_time)}
                  </p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Joriy foydalanuvchi ID: {showEditShift.user}
                    </p>
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
                  {editShift.start_time && editShift.end_time && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Yangi davomiylik:{" "}
                      {calculateDuration(
                        editShift.start_time,
                        editShift.end_time
                      )}
                    </p>
                  )}
                  {showEditShift.break_time && (
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      Tanaffus vaqti:{" "}
                      {getBreakTimeName(showEditShift.break_time)}
                    </p>
                  )}
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
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            {currentUser?.role === "superadmin" && !targetUserId
              ? "Hisobingizga biriktirilgan smenalar yo'q. Boshlash uchun yangi smena qo'shing yoki boshqa foydalanuvchi smenalarini ko'rish uchun foydalanuvchi ID-sini kiriting."
              : "Bu foydalanuvchi uchun smenalar topilmadi."}
          </p>
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
                    Tanaffus Vaqti
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
                            {apiService.formatTime(shift.start_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tugash:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {apiService.formatTime(shift.end_time)}
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
                      {shift.break_time ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {getBreakTimeName(shift.break_time)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(() => {
                              const breakTime = breakTimes.find(
                                (bt) => bt.id === shift.break_time
                              );
                              if (breakTime) {
                                return `${formatTimeForInput(
                                  breakTime.start_time
                                )} - ${formatTimeForInput(breakTime.end_time)}`;
                              }
                              return "Vaqt ko'rsatilmagan";
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full">
                          Tanlanmagan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">ID:</span> {shift.user}
                        {currentUser?.id === shift.user && (
                          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">
                            Siz
                          </span>
                        )}
                      </div>
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
