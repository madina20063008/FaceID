import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Avatar, AvatarFallback } from '../app/components/ui/avatar';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';
import { 
  Building2, 
  Phone, 
  Shield, 
  LogOut, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  Clock,
  Crown,
  TrendingUp,
  Bell,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Progress } from '../app/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';
import { Notification } from '../lib/types';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  // Load notifications
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Mock data for testing
      setNotifications([
        {
          id: 1,
          user: user.id,
          text: 'Profil yangilandi: Sizning ma\'lumotlaringiz muvaffaqiyatli saqlandi',
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          is_read: false
        },
        {
          id: 2,
          user: user.id,
          text: 'Obuna eslatmasi: Sizning obunangiz 5 kundan keyin tugaydi',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          is_read: true
        },
        {
          id: 3,
          user: user.id,
          text: 'Xavfsizlik: Hisobingizga yangi qurilmadan kirish aniqlandi',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          is_read: false
        },
        {
          id: 4,
          user: user.id,
          text: 'Hodim qo\'shildi: Ali Karimov hodimlar ro\'yxatiga qo\'shildi',
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          is_read: true
        },
        {
          id: 5,
          user: user.id,
          text: 'To\'lov muvaffaqiyatli: Obuna uchun to\'lov qabul qilindi',
          created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
          is_read: true
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead(user.id);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format notification date
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} daqiqa oldin`;
    } else if (diffHours < 24) {
      return `${diffHours} soat oldin`;
    } else if (diffDays < 7) {
      return `${diffDays} kun oldin`;
    } else {
      return date.toLocaleDateString('uz-UZ', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Calculate subscription progress
  const calculateSubscriptionProgress = () => {
    if (!user.subscription) return 0;
    
    const start = new Date(user.subscription.start_date).getTime();
    const end = new Date(user.subscription.end_date).getTime();
    const now = new Date().getTime();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.round((elapsed / total) * 100));
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    switch(user.role) {
      case 'a': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'm': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get subscription badge color
  const getSubscriptionBadgeColor = () => {
    switch(user.subscription?.plan_type) {
      case 'plus': return 'from-blue-500 to-indigo-600';
      case 'premium': return 'from-purple-500 to-pink-600';
      case 'enterprise': return 'from-amber-500 to-orange-600';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  // Handle subscription button click
  const handleSubscriptionClick = () => {
    navigate('/plans');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Profil
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Shaxsiy ma'lumotlar va hisob sozlamalari
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">TimePay CRM</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardContent className="pt-8">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-40 w-40 border-4 border-white dark:border-gray-800 shadow-xl">
                      <AvatarFallback className="text-5xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2">
                      <div className={`p-3 rounded-full shadow-lg ${getRoleBadgeColor()}`}>
                        <Crown className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h2 className="text-2xl font-bold">{user.full_name}</h2>
                    <Badge className={`mt-2 px-4 py-1.5 text-sm font-semibold ${getRoleBadgeColor()} border-0`}>
                      {user.role === 'a' ? 'Administrator' : user.role === 'm' ? 'Menejer' : 'Foydalanuvchi'}
                    </Badge>
                  </div>

                  

                  <div className="w-full mt-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Hisob holati</p>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <p className="font-semibold">
                              {user.is_active ? 'Faol' : 'Nofaol'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Aloqa ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Telefon raqami</p>
                      <p className="text-lg font-bold">{user.phone_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Holati</p>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <p className="text-lg font-bold">
                          {user.is_active ? 'Faol' : 'Nofaol'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Card - ALL NOTIFICATIONS DISPLAYED HERE */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Barcha Xabarnomalar
                  </CardTitle>
                  
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                      Xabarnomalar yo'q
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Yangi xabarnomalar kelganda bu yerda ko'rinadi
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-xl border transition-all ${
                          notification.is_read 
                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              notification.is_read 
                                ? 'bg-gray-100 dark:bg-gray-700' 
                                : 'bg-blue-100 dark:bg-blue-800'
                            }`}>
                              <AlertCircle className={`h-4 w-4 ${
                                notification.is_read 
                                  ? 'text-gray-600 dark:text-gray-400' 
                                  : 'text-blue-600 dark:text-blue-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${
                                notification.is_read 
                                  ? 'text-gray-700 dark:text-gray-300' 
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {notification.text}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatNotificationDate(notification.created_at)}
                                </span>
                                {!notification.is_read && (
                                  <Badge variant="secondary" className="text-xs">
                                    Yangi
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                         
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Information */}
            {user.subscription && (
              <>
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${getSubscriptionBadgeColor()}`}></div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Obuna tafsilotlari
                      </CardTitle>
                      <Badge variant="outline" className="text-sm font-semibold">
                        {user.subscription.billing_cycle === 'monthly' ? '💳 Oylik' : '📅 Yillik'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Reja nomi</p>
                            <p className="text-xl font-bold">{user.subscription.plan_title}</p>
                          </div>
                        </div>
                        <Badge 
                          className={`${user.subscription.is_paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}
                        >
                          {user.subscription.is_paid ? '✅ To\'langan' : '❌ To\'lanmagan'}
                        </Badge>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Boshlanish vaqti</p>
                            <p className="font-semibold">{formatDate(user.subscription.start_date)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tugash vaqti</p>
                            <p className="font-semibold">{formatDate(user.subscription.end_date)}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Qolgan muddat</span>
                            <span className="font-semibold">
                              {user.subscription.remaining_days} kun
                            </span>
                          </div>
                          <Progress 
                            value={calculateSubscriptionProgress()} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Status Card */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${user.subscription.is_active ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                          {user.subscription.is_active ? (
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Obuna holati</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            {user.subscription.is_active 
                              ? 'Sizning obunangiz faol holatda' 
                              : 'Sizning obunangiz faol emas'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant={user.subscription.is_active ? "outline" : "default"}
                        className="whitespace-nowrap"
                        onClick={handleSubscriptionClick}
                      >
                        {user.subscription.is_active ? 'Obunani yangilash' : 'Obuna sotib olish'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Actions Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Hisob sozlamalari</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Tizimdan chiqish yoki boshqa amallarni bajarish
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={logout}
                    className="shadow-lg hover:shadow-xl transition-all"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Tizimdan chiqish
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}