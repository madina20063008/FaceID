import React, { useState, useEffect } from "react";
import { WEEK_DAYS, apiService } from "../lib/api";
import {
  CreateDayOffRequest,
  CreateWorkDayRequest,
  DayOff,
  UpdateDayOffRequest,
  UpdateWorkDayRequest,
  User,
  WorkDay,
} from "../lib/types";

const Workday = () => {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [dayOffs, setDayOffs] = useState<DayOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>("");

  // Dialog states
  const [showAddWorkDay, setShowAddWorkDay] = useState(false);
  const [showEditWorkDay, setShowEditWorkDay] = useState<WorkDay | null>(null);
  const [showAddDayOff, setShowAddDayOff] = useState(false);
  const [showEditDayOff, setShowEditDayOff] = useState<DayOff | null>(null);

  // Form states
  const [newWorkDay, setNewWorkDay] = useState<CreateWorkDayRequest>({
    name: "",
    days: [],
  });
  const [editWorkDay, setEditWorkDay] = useState<UpdateWorkDayRequest>({
    name: "",
    days: [],
  });
  const [newDayOff, setNewDayOff] = useState<CreateDayOffRequest>({
    name: "",
    days: [],
  });
  const [editDayOff, setEditDayOff] = useState<UpdateDayOffRequest>({
    name: "",
    days: [],
  });

  // Tabs
  const [activeTab, setActiveTab] = useState<"workdays" | "dayoffs">(
    "workdays"
  );

  // Load data
  useEffect(() => {
    loadCurrentUserAndData();
  }, []);

  const loadCurrentUserAndData = async (userId?: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get current user
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);

      // Load both workdays and dayoffs
      const [workDaysData, dayOffsData] = await Promise.all([
        apiService.getWorkDays(userId),
        apiService.getDayOffs(userId),
      ]);

      setWorkDays(workDaysData);
      setDayOffs(dayOffsData);
    } catch (err: any) {
      console.error("Ma'lumotlarni yuklashda xatolik:", err);

      // Show more specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else {
        setError(err.message || "Ma'lumotlarni yuklashda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadUserData = async () => {
    if (!targetUserId.trim()) {
      setError("Iltimos, foydalanuvchi ID-sini kiriting");
      return;
    }

    const userId = parseInt(targetUserId);
    if (isNaN(userId)) {
      setError("Noto'g'ri foydalanuvchi ID-si");
      return;
    }

    await loadCurrentUserAndData(userId);
  };

  // WorkDay handlers
  const handleAddWorkDay = async () => {
    if (!newWorkDay.name || newWorkDay.days.length === 0) {
      setError("Iltimos, nom va kamida bitta kunni tanlang");
      return;
    }

    try {
      const formattedData: CreateWorkDayRequest = {
        name: newWorkDay.name,
        days: newWorkDay.days,
      };

      // If superadmin and user ID is provided
      if (currentUser?.role === "superadmin" && newWorkDay.user) {
        formattedData.user = newWorkDay.user;
      }

      console.log("📤 Ish kunlari yaratish ma'lumotlari:", formattedData);

      await apiService.createWorkDay(formattedData);

      // Reload data
      await loadCurrentUserAndData();
      setShowAddWorkDay(false);
      setNewWorkDay({
        name: "",
        days: [],
      });
      setSuccess("Ish kunlari muvaffaqiyatli yaratildi");
    } catch (err: any) {
      console.error("Ish kunlari yaratish xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Ish kunlari yaratishda xatolik");
      }
    }
  };

  const handleEditWorkDay = async () => {
    if (!showEditWorkDay) return;

    try {
      const updateData: UpdateWorkDayRequest = {};

      if (editWorkDay.name && editWorkDay.name !== showEditWorkDay.name) {
        updateData.name = editWorkDay.name;
      }

      if (editWorkDay.days && editWorkDay.days.length > 0) {
        updateData.days = editWorkDay.days;
      }

      if (
        currentUser?.role === "superadmin" &&
        editWorkDay.user !== undefined
      ) {
        updateData.user = editWorkDay.user;
      }

      console.log("✏️ Ish kunlarini yangilash ma'lumotlari:", updateData);

      await apiService.updateWorkDay(showEditWorkDay.id, updateData);

      // Reload data
      await loadCurrentUserAndData();
      setShowEditWorkDay(null);
      setEditWorkDay({
        name: "",
        days: [],
      });
      setSuccess("Ish kunlari muvaffaqiyatli yangilandi");
    } catch (err: any) {
      console.error("Ish kunlarini yangilash xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Ish kunlarini yangilashda xatolik");
      }
    }
  };

  const handleDeleteWorkDay = async (id: number) => {
    if (
      !window.confirm("Haqiqatan ham ushbu ish kunlarini o'chirmoqchimisiz?")
    ) {
      return;
    }

    try {
      await apiService.deleteWorkDay(id);
      // Reload data
      await loadCurrentUserAndData();
      setSuccess("Ish kunlari muvaffaqiyatli o'chirildi");
    } catch (err: any) {
      console.error("Ish kunlarini o'chirish xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Ish kunlarini o'chirishda xatolik");
      }
    }
  };

  // DayOff handlers
  const handleAddDayOff = async () => {
    if (!newDayOff.name || newDayOff.days.length === 0) {
      setError("Iltimos, nom va kamida bitta kunni tanlang");
      return;
    }

    try {
      const formattedData: CreateDayOffRequest = {
        name: newDayOff.name,
        days: newDayOff.days,
      };

      if (currentUser?.role === "superadmin" && newDayOff.user) {
        formattedData.user = newDayOff.user;
      }

      console.log("📤 Dam olish kunlari yaratish ma'lumotlari:", formattedData);

      await apiService.createDayOff(formattedData);

      await loadCurrentUserAndData();
      setShowAddDayOff(false);
      setNewDayOff({
        name: "",
        days: [],
      });
      setSuccess("Dam olish kunlari muvaffaqiyatli yaratildi");
    } catch (err: any) {
      console.error("Dam olish kunlari yaratish xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Dam olish kunlari yaratishda xatolik");
      }
    }
  };

  const handleEditDayOff = async () => {
    if (!showEditDayOff) return;

    try {
      const updateData: UpdateDayOffRequest = {};

      if (editDayOff.name && editDayOff.name !== showEditDayOff.name) {
        updateData.name = editDayOff.name;
      }

      if (editDayOff.days && editDayOff.days.length > 0) {
        updateData.days = editDayOff.days;
      }

      if (currentUser?.role === "superadmin" && editDayOff.user !== undefined) {
        updateData.user = editDayOff.user;
      }

      console.log("✏️ Dam olish kunlarini yangilash ma'lumotlari:", updateData);

      await apiService.updateDayOff(showEditDayOff.id, updateData);

      await loadCurrentUserAndData();
      setShowEditDayOff(null);
      setEditDayOff({
        name: "",
        days: [],
      });
      setSuccess("Dam olish kunlari muvaffaqiyatli yangilandi");
    } catch (err: any) {
      console.error("Dam olish kunlarini yangilash xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.status === 400 && err.data?.detail) {
        setError(`Xatolik: ${err.data.detail}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Dam olish kunlarini yangilashda xatolik");
      }
    }
  };

  const handleDeleteDayOff = async (id: number) => {
    if (
      !window.confirm(
        "Haqiqatan ham ushbu dam olish kunlarini o'chirmoqchimisiz?"
      )
    ) {
      return;
    }

    try {
      await apiService.deleteDayOff(id);
      await loadCurrentUserAndData();
      setSuccess("Dam olish kunlari muvaffaqiyatli o'chirildi");
    } catch (err: any) {
      console.error("Dam olish kunlarini o'chirish xatosi:", err);

      // Show specific API error
      if (err.status === 400 && err.data?.user_id) {
        setError(`Xatolik: ${err.data.user_id}`);
      } else if (err.message) {
        setError(`Xatolik: ${err.message}`);
      } else {
        setError("Dam olish kunlarini o'chirishda xatolik");
      }
    }
  };

  // Helper functions
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

  const getFullDayNames = (days: string[]): string => {
    const dayMap: Record<string, string> = {
      mon: "Dushanba",
      tue: "Seshanba",
      wed: "Chorshanba",
      thu: "Payshanba",
      fri: "Juma",
      sat: "Shanba",
      sun: "Yakshanba",
    };

    return days.map((day) => dayMap[day] || day).join(", ");
  };

  const toggleDaySelection = (
    day: string,
    currentDays: string[],
    setDays: (days: string[]) => void
  ) => {
    if (currentDays.includes(day)) {
      setDays(currentDays.filter((d) => d !== day));
    } else {
      setDays([...currentDays, day]);
    }
  };

  const openEditWorkDayModal = (workDay: WorkDay) => {
    setShowEditWorkDay(workDay);
    setEditWorkDay({
      name: workDay.name,
      days: workDay.days,
    });
  };

  const openEditDayOffModal = (dayOff: DayOff) => {
    setShowEditDayOff(dayOff);
    setEditDayOff({
      name: dayOff.name,
      days: dayOff.days,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Ma'lumotlar yuklanmoqda...
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
            Ish va Dam Olish Kunlari
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ish kunlari va dam olish kunlarini boshqarish
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Superadmin: Load another user's data */}
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
                onClick={handleLoadUserData}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition whitespace-nowrap"
              >
                Foydalanuvchi Ma'lumotlarini Yuklash
              </button>
            </div>
          )}
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

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("workdays")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "workdays"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              Ish Kunlari
              <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">
                {workDays.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("dayoffs")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dayoffs"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              Dam Olish Kunlari
              <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">
                {dayOffs.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* WorkDays Section */}
      {activeTab === "workdays" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Ish Kunlari Ro'yxati
            </h2>
            <button
              onClick={() => setShowAddWorkDay(true)}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center gap-2"
            >
              <span>+</span>
              <span>Yangi Ish Kunlari Qo'shish</span>
            </button>
          </div>

          {/* WorkDays List */}
          {workDays.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-gray-400 dark:text-gray-500 mb-4 text-6xl">
                📅
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Ish kunlari topilmadi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Birinchi ish kunlarini qo'shish uchun quyidagi tugmani bosing
              </p>
              <button
                onClick={() => setShowAddWorkDay(true)}
                className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
              >
                + Birinchi Ish Kunlari Qo'shish
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
                        Kunlar
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
                    {workDays.map((workDay, index) => (
                      <tr
                        key={workDay.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {workDay.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ID: {workDay.id}
                          </div>
                          {workDay.created_at && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Yaratilgan: {formatDate(workDay.created_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {WEEK_DAYS.map((day) => (
                              <span
                                key={day.value}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  workDay.days.includes(day.value)
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {day.label.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {getFullDayNames(workDay.days)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">ID:</span>{" "}
                            {workDay.user}
                            {currentUser?.id === workDay.user && (
                              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">
                                Siz
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditWorkDayModal(workDay)}
                              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                            >
                              Tahrirlash
                            </button>
                            <button
                              onClick={() => handleDeleteWorkDay(workDay.id)}
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

          {/* Add WorkDay Modal */}
          {showAddWorkDay && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Yangi Ish Kunlari Qo'shish
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomi *
                      </label>
                      <input
                        type="text"
                        value={newWorkDay.name}
                        onChange={(e) =>
                          setNewWorkDay({ ...newWorkDay, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Masalan: Oddiy ish haftasi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kunlar *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() =>
                              toggleDaySelection(
                                day.value,
                                newWorkDay.days,
                                (days) => setNewWorkDay({ ...newWorkDay, days })
                              )
                            }
                            className={`px-3 py-2 text-sm rounded-md transition ${
                              newWorkDay.days.includes(day.value)
                                ? "bg-blue-600 dark:bg-blue-700 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Tanlangan kunlar:{" "}
                        {getFullDayNames(newWorkDay.days) || "Hech qaysi"}
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
                          value={newWorkDay.user || ""}
                          onChange={(e) =>
                            setNewWorkDay({
                              ...newWorkDay,
                              user: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="O'zingiz uchun bo'sh qoldiring"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddWorkDay(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Bekor Qilish
                    </button>
                    <button
                      onClick={handleAddWorkDay}
                      className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                    >
                      Qo'shish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit WorkDay Modal */}
          {showEditWorkDay && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Ish Kunlarini Tahrirlash
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomi
                      </label>
                      <input
                        type="text"
                        value={editWorkDay.name || ""}
                        onChange={(e) =>
                          setEditWorkDay({
                            ...editWorkDay,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kunlar
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() =>
                              toggleDaySelection(
                                day.value,
                                editWorkDay.days || [],
                                (days) =>
                                  setEditWorkDay({ ...editWorkDay, days })
                              )
                            }
                            className={`px-3 py-2 text-sm rounded-md transition ${
                              (editWorkDay.days || []).includes(day.value)
                                ? "bg-blue-600 dark:bg-blue-700 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Joriy kunlar: {getFullDayNames(showEditWorkDay.days)}
                      </p>
                    </div>

                    {/* Superadmin: Change user */}
                    {currentUser?.role === "superadmin" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Foydalanuvchi ID-si
                        </label>
                        <input
                          type="number"
                          value={editWorkDay.user || ""}
                          onChange={(e) =>
                            setEditWorkDay({
                              ...editWorkDay,
                              user: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Joriy foydalanuvchi ID: {showEditWorkDay.user}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => handleDeleteWorkDay(showEditWorkDay.id)}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                    >
                      O'chirish
                    </button>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowEditWorkDay(null)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        Bekor Qilish
                      </button>
                      <button
                        onClick={handleEditWorkDay}
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
        </>
      )}

      {/* DayOffs Section */}
      {activeTab === "dayoffs" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dam Olish Kunlari Ro'yxati
            </h2>
            <button
              onClick={() => setShowAddDayOff(true)}
              className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition flex items-center gap-2"
            >
              <span>+</span>
              <span>Yangi Dam Olish Kunlari Qo'shish</span>
            </button>
          </div>

          {/* DayOffs List */}
          {dayOffs.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-gray-400 dark:text-gray-500 mb-4 text-6xl">
                🏖️
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Dam olish kunlari topilmadi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Birinchi dam olish kunlarini qo'shish uchun quyidagi tugmani
                bosing
              </p>
              <button
                onClick={() => setShowAddDayOff(true)}
                className="px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition"
              >
                + Birinchi Dam Olish Kunlari Qo'shish
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
                        Kunlar
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
                    {dayOffs.map((dayOff, index) => (
                      <tr
                        key={dayOff.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {dayOff.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ID: {dayOff.id}
                          </div>
                          {dayOff.created_at && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Yaratilgan: {formatDate(dayOff.created_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {WEEK_DAYS.map((day) => (
                              <span
                                key={day.value}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  dayOff.days.includes(day.value)
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {day.label.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {getFullDayNames(dayOff.days)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">ID:</span>{" "}
                            {dayOff.user}
                            {currentUser?.id === dayOff.user && (
                              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">
                                Siz
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditDayOffModal(dayOff)}
                              className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                            >
                              Tahrirlash
                            </button>
                            <button
                              onClick={() => handleDeleteDayOff(dayOff.id)}
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

          {/* Add DayOff Modal */}
          {showAddDayOff && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Yangi Dam Olish Kunlari Qo'shish
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomi *
                      </label>
                      <input
                        type="text"
                        value={newDayOff.name}
                        onChange={(e) =>
                          setNewDayOff({ ...newDayOff, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Masalan: Bayram kunlari"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kunlar *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() =>
                              toggleDaySelection(
                                day.value,
                                newDayOff.days,
                                (days) => setNewDayOff({ ...newDayOff, days })
                              )
                            }
                            className={`px-3 py-2 text-sm rounded-md transition ${
                              newDayOff.days.includes(day.value)
                                ? "bg-purple-600 dark:bg-purple-700 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Tanlangan kunlar:{" "}
                        {getFullDayNames(newDayOff.days) || "Hech qaysi"}
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
                          value={newDayOff.user || ""}
                          onChange={(e) =>
                            setNewDayOff({
                              ...newDayOff,
                              user: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="O'zingiz uchun bo'sh qoldiring"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddDayOff(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Bekor Qilish
                    </button>
                    <button
                      onClick={handleAddDayOff}
                      className="px-6 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition"
                    >
                      Qo'shish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit DayOff Modal */}
          {showEditDayOff && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Dam Olish Kunlarini Tahrirlash
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomi
                      </label>
                      <input
                        type="text"
                        value={editDayOff.name || ""}
                        onChange={(e) =>
                          setEditDayOff({ ...editDayOff, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kunlar
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() =>
                              toggleDaySelection(
                                day.value,
                                editDayOff.days || [],
                                (days) => setEditDayOff({ ...editDayOff, days })
                              )
                            }
                            className={`px-3 py-2 text-sm rounded-md transition ${
                              (editDayOff.days || []).includes(day.value)
                                ? "bg-purple-600 dark:bg-purple-700 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Joriy kunlar: {getFullDayNames(showEditDayOff.days)}
                      </p>
                    </div>

                    {/* Superadmin: Change user */}
                    {currentUser?.role === "superadmin" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Foydalanuvchi ID-si
                        </label>
                        <input
                          type="number"
                          value={editDayOff.user || ""}
                          onChange={(e) =>
                            setEditDayOff({
                              ...editDayOff,
                              user: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Joriy foydalanuvchi ID: {showEditDayOff.user}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => handleDeleteDayOff(showEditDayOff.id)}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                    >
                      O'chirish
                    </button>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowEditDayOff(null)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        Bekor Qilish
                      </button>
                      <button
                        onClick={handleEditDayOff}
                        className="px-6 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition"
                      >
                        Saqlash
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Workday;
