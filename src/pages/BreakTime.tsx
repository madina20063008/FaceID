import React, { useState, useEffect } from "react";
import {
  apiService,
} from "../lib/api";

import {
  BreakTime,
  CreateBreakTimeRequest,
  UpdateBreakTimeRequest,
  User,
} from "../lib/types";

const BreakTimeManager = () => {
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>("");

  // Dialog state
  const [showAddBreakTime, setShowAddBreakTime] = useState(false);
  const [showEditBreakTime, setShowEditBreakTime] = useState<BreakTime | null>(
    null
  );
  const [newBreakTime, setNewBreakTime] = useState<CreateBreakTimeRequest>({
    name: "",
    start_time: "",
    end_time: "",
    user: undefined,
  });
  const [editBreakTime, setEditBreakTime] = useState<UpdateBreakTimeRequest>({
    name: "",
    start_time: "",
    end_time: "",
    user: undefined,
  });

  // Load break times
  const loadCurrentUserAndBreakTimes = async (userId?: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get current user
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);

      // Get break times
      const breakTimesData = await apiService.getBreakTimes(userId);
      setBreakTimes(breakTimesData);
    } catch (err: any) {
      console.error("Failed to load break times:", err);

      // Show more specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else {
        setError(err.message || "Tanaffus vaqtlarini yuklashda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };
// Add this helper function to translate time ranges to names
const getBreakTimeName = (startTime: string, endTime: string) => {
  const start = getTimeWithoutSeconds(startTime);
  const end = getTimeWithoutSeconds(endTime);
  
  // Custom logic based on your business rules
  if (start === "12:00" && end === "13:00") {
    return "Tushlik";
  } else if (start === "15:00" && end === "15:15") {
    return "Coffee break";
  }
  // Add more conditions as needed
  
  return `${start} - ${end}`; // Fallback to showing the time range
};
  // Initial load
  useEffect(() => {
    loadCurrentUserAndBreakTimes();
  }, []);

  const handleLoadUserBreakTimes = async () => {
    if (!targetUserId.trim()) {
      setError("Iltimos, foydalanuvchi ID-sini kiriting");
      return;
    }

    const userId = parseInt(targetUserId);
    if (isNaN(userId)) {
      setError("Noto'g'ri foydalanuvchi ID-si");
      return;
    }

    await loadCurrentUserAndBreakTimes(userId);
  };

  // Calculate duration
  const calculateDuration = (start: string, end: string) => {
    try {
      const startParts = start.split(":").map(Number);
      const endParts = end.split(":").map(Number);

      const startTotal = startParts[0] * 60 + startParts[1];
      const endTotal = endParts[0] * 60 + endParts[1];

      const diff = endTotal - startTotal;
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;

      if (hours > 0) {
        return `${hours} soat ${minutes} daqiqa`;
      } else {
        return `${minutes} daqiqa`;
      }
    } catch {
      return "Hisoblanmadi";
    }
  };

  // Format time for display - Show exact time (HH:MM:SS)
  const formatExactTime = (time: string) => {
    if (!time) return "--:--:--";

    // If it's ISO format, convert to time string
    if (time.includes("T")) {
      const date = new Date(time);
      return date.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }

    // Already in HH:MM:SS format, ensure it's properly formatted
    const parts = time.split(":");
    if (parts.length === 3) {
      // Already has seconds, return as is
      return time;
    } else if (parts.length === 2) {
      // Has hours and minutes, add seconds
      return `${time}:00`;
    } else if (parts.length === 1) {
      // Only hours, add minutes and seconds
      return `${time.padStart(2, "0")}:00:00`;
    }

    return time;
  };

  // Get time parts for display (HH:MM)
  const getTimeWithoutSeconds = (time: string) => {
    const exactTime = formatExactTime(time);
    return exactTime.substring(0, 5); // Returns HH:MM
  };

  const handleAddBreakTime = async () => {
    if (
      !newBreakTime.name ||
      !newBreakTime.start_time ||
      !newBreakTime.end_time
    ) {
      setError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    // Ensure time has seconds
    const startTimeWithSeconds = newBreakTime.start_time.includes(":")
      ? newBreakTime.start_time.split(":").length === 2
        ? `${newBreakTime.start_time}:00`
        : newBreakTime.start_time
      : `${newBreakTime.start_time}:00:00`;

    const endTimeWithSeconds = newBreakTime.end_time.includes(":")
      ? newBreakTime.end_time.split(":").length === 2
        ? `${newBreakTime.end_time}:00`
        : newBreakTime.end_time
      : `${newBreakTime.end_time}:00:00`;

    const formattedData: CreateBreakTimeRequest = {
      name: newBreakTime.name,
      start_time: startTimeWithSeconds,
      end_time: endTimeWithSeconds,
    };

    // If superadmin and user ID is provided
    if (currentUser?.role === "superadmin" && newBreakTime.user) {
      formattedData.user = newBreakTime.user;
    }


    try {
      await apiService.createBreakTime(formattedData);

      // Reload break times
      await loadCurrentUserAndBreakTimes();
      setShowAddBreakTime(false);
      setNewBreakTime({
        name: "",
        start_time: "",
        end_time: "",
        user: undefined,
      });
      setSuccess("Tanaffus vaqti muvaffaqiyatli yaratildi");
    } catch (err: any) {
      console.error("Tanaffus vaqti qo'shish xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Tanaffus vaqti qo'shishda xatolik");
      }
    }
  };

  const handleEditBreakTime = async () => {
    if (!showEditBreakTime) return;

    try {
      const updateData: UpdateBreakTimeRequest = {};

      // Only send changed fields
      if (editBreakTime.name && editBreakTime.name !== showEditBreakTime.name) {
        updateData.name = editBreakTime.name;
      }

      // Ensure time has seconds before comparing
      const currentStartTime = formatExactTime(showEditBreakTime.start_time);
      const newStartTime = editBreakTime.start_time
        ? editBreakTime.start_time.split(":").length === 2
          ? `${editBreakTime.start_time}:00`
          : editBreakTime.start_time
        : "";

      if (editBreakTime.start_time && newStartTime !== currentStartTime) {
        updateData.start_time = newStartTime;
      }

      const currentEndTime = formatExactTime(showEditBreakTime.end_time);
      const newEndTime = editBreakTime.end_time
        ? editBreakTime.end_time.split(":").length === 2
          ? `${editBreakTime.end_time}:00`
          : editBreakTime.end_time
        : "";

      if (editBreakTime.end_time && newEndTime !== currentEndTime) {
        updateData.end_time = newEndTime;
      }

      // If user is superadmin
      if (
        currentUser?.role === "superadmin" &&
        editBreakTime.user !== undefined
      ) {
        updateData.user = editBreakTime.user;
      }

      // If nothing changed
      if (Object.keys(updateData).length === 0) {
        setShowEditBreakTime(null);
        return;
      }


      await apiService.updateBreakTime(showEditBreakTime.id, updateData);

      // Reload break times
      await loadCurrentUserAndBreakTimes();
      setShowEditBreakTime(null);
      setEditBreakTime({
        name: "",
        start_time: "",
        end_time: "",
        user: undefined,
      });
      setSuccess("Tanaffus vaqti muvaffaqiyatli yangilandi");
    } catch (err: any) {
      console.error("Tanaffus vaqtini yangilash xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Tanaffus vaqtini yangilashda xatolik");
      }
    }
  };

  const handleDeleteBreakTime = async (id: number) => {
    if (
      !window.confirm("Haqiqatan ham ushbu tanaffus vaqtini o'chirmoqchimisiz?")
    ) {
      return;
    }

    try {
      await apiService.deleteBreakTime(id);
      // Reload break times
      await loadCurrentUserAndBreakTimes();
      setSuccess("Tanaffus vaqti muvaffaqiyatli o'chirildi");
    } catch (err: any) {
      console.error("Tanaffus vaqtini o'chirish xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Tanaffus vaqtini o'chirishda xatolik");
      }
    }
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

  const openEditModal = (breakTime: BreakTime) => {
    setShowEditBreakTime(breakTime);
    setEditBreakTime({
      name: breakTime.name,
      start_time: getTimeWithoutSeconds(breakTime.start_time), // Extract HH:MM part for input
      end_time: getTimeWithoutSeconds(breakTime.end_time),
      user: breakTime.user,
    });
  };

  // Add info section to show exact time format
  const TimeInfoBox = ({ title, time }: { title: string; time: string }) => (
    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
      <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
      <div className="font-mono text-sm text-gray-900 dark:text-white">
        {formatExactTime(time)}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Tanaffus vaqtlari yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tanaffus Vaqtlari
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Xodimlarning tanaffus vaqtlarini boshqarish
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Vaqtlar HH:MM:SS formatida ko'rsatiladi
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Superadmin: Load another user's break times */}
          {currentUser?.role === "superadmin" && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Foydalanuvchi ID-sini kiriting"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleLoadUserBreakTimes}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition whitespace-nowrap"
              >
                Foydalanuvchi Vaqtlarini Yuklash
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAddBreakTime(true)}
            className="px-6 py-3 bg-black dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition font-medium whitespace-nowrap"
          >
            + Yangi Tanaffus Vaqti
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="mt-2 text-sm text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200"
          >
            Yopish
          </button>
        </div>
      )}

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

      {/* Add Break Time Modal */}
      {showAddBreakTime && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Yangi Tanaffus Vaqti Qo'shish
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanaffus Nomi *
                  </label>
                  <input
                    type="text"
                    value={newBreakTime.name}
                    onChange={(e) =>
                      setNewBreakTime({ ...newBreakTime, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: Tushlik tanaffusi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Boshlanish Vaqti *
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={newBreakTime.start_time}
                    onChange={(e) =>
                      setNewBreakTime({
                        ...newBreakTime,
                        start_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <div className="mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Serverga yuboriladigan format:{" "}
                      {newBreakTime.start_time
                        ? `${newBreakTime.start_time}:00`
                        : "--:--:--"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tugash Vaqti *
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={newBreakTime.end_time}
                    onChange={(e) =>
                      setNewBreakTime({
                        ...newBreakTime,
                        end_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <div className="mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Serverga yuboriladigan format:{" "}
                      {newBreakTime.end_time
                        ? `${newBreakTime.end_time}:00`
                        : "--:--:--"}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Davomiylik:{" "}
                    {newBreakTime.start_time && newBreakTime.end_time
                      ? calculateDuration(
                          `${newBreakTime.start_time}:00`,
                          `${newBreakTime.end_time}:00`
                        )
                      : "Vaqt tanlang"}
                  </p>
                </div>

                {/* Superadmin: Assign to user */}
                {currentUser?.role === "superadmin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foydalanuvchi ID-siga biriktirish (ixtiyoriy)
                    </label>
                    <input
                      type="number"
                      value={newBreakTime.user || ""}
                      onChange={(e) =>
                        setNewBreakTime({
                          ...newBreakTime,
                          user: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="O'zingizning tanaffus vaqtlaringiz uchun bo'sh qoldiring"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Agar bo'sh qoldirsangiz, tanaffus vaqti o'zingizga
                      biriktiriladi
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddBreakTime(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Bekor Qilish
                </button>
                <button
                  onClick={handleAddBreakTime}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                >
                  Qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Break Time Modal */}
      {showEditBreakTime && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Tanaffus Vaqtini Tahrirlash
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanaffus Nomi
                  </label>
                  <input
                    type="text"
                    value={editBreakTime.name || ""}
                    onChange={(e) =>
                      setEditBreakTime({
                        ...editBreakTime,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Masalan: Tushlik tanaffusi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Boshlanish Vaqti
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={editBreakTime.start_time || ""}
                    onChange={(e) =>
                      setEditBreakTime({
                        ...editBreakTime,
                        start_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <TimeInfoBox
                    title="Joriy vaqt"
                    time={showEditBreakTime.start_time}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tugash Vaqti
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={editBreakTime.end_time || ""}
                    onChange={(e) =>
                      setEditBreakTime({
                        ...editBreakTime,
                        end_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <TimeInfoBox
                    title="Joriy vaqt"
                    time={showEditBreakTime.end_time}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Joriy davomiylik:{" "}
                    {calculateDuration(
                      showEditBreakTime.start_time,
                      showEditBreakTime.end_time
                    )}
                  </p>
                  {editBreakTime.start_time && editBreakTime.end_time && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Yangi davomiylik:{" "}
                      {calculateDuration(
                        `${editBreakTime.start_time}:00`,
                        `${editBreakTime.end_time}:00`
                      )}
                    </p>
                  )}
                </div>

                {/* Superadmin: Change user */}
                {currentUser?.role === "superadmin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foydalanuvchi ID-si
                    </label>
                    <input
                      type="number"
                      value={editBreakTime.user || ""}
                      onChange={(e) =>
                        setEditBreakTime({
                          ...editBreakTime,
                          user: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Joriy foydalanuvchi ID: {showEditBreakTime.user}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => handleDeleteBreakTime(showEditBreakTime.id)}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                >
                  O'chirish
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditBreakTime(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Bekor Qilish
                  </button>
                  <button
                    onClick={handleEditBreakTime}
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

      {/* Break Times List */}
      {breakTimes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-gray-400 dark:text-gray-500 mb-4 text-6xl">
            ⏱️
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Tanaffus vaqtlari topilmadi
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            {currentUser?.role === "superadmin" && !targetUserId
              ? "Hisobingizga biriktirilgan tanaffus vaqtlari yo'q. Boshlash uchun yangi tanaffus vaqti qo'shing yoki boshqa foydalanuvchi tanaffus vaqtlarini ko'rish uchun foydalanuvchi ID-sini kiriting."
              : "Bu foydalanuvchi uchun tanaffus vaqtlari topilmadi."}
          </p>
          <button
            onClick={() => setShowAddBreakTime(true)}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            + Birinchi Tanaffus Vaqti Qo'shish
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    №
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nomi
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
                {breakTimes.map((breakTime, index) => (
                  <tr
                    key={breakTime.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {breakTime.name}
                        

                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ID: {breakTime.id}
                      </div>
                      {breakTime.created_at && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Yaratilgan: {formatDate(breakTime.created_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Boshlanish:{" "}
                            {getTimeWithoutSeconds(breakTime.start_time)}
                          </div>
                          <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {formatExactTime(breakTime.start_time)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Tugash: {getTimeWithoutSeconds(breakTime.end_time)}
                          </div>
                          <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {formatExactTime(breakTime.end_time)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        {calculateDuration(
                          breakTime.start_time,
                          breakTime.end_time
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {/* This shows the exact break time name - like "tushilik" or custom name */}
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {breakTime.name || "Tanlanmagan"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {/* Optional: Show exact time range for the break */}
                        {getTimeWithoutSeconds(breakTime.start_time)} -{" "}
                        {getTimeWithoutSeconds(breakTime.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">ID:</span>{" "}
                        {breakTime.user}
                        {currentUser?.id === breakTime.user && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                            Siz
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(breakTime)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        >
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => handleDeleteBreakTime(breakTime.id)}
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

          {/* Summary */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Jami: {breakTimes.length} ta tanaffus vaqti
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentUser?.role === "superadmin" && targetUserId
                  ? `Foydalanuvchi ID: ${targetUserId}`
                  : "Hozirgi foydalanuvchi"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakTimeManager;
