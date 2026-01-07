import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from '../app/components/ui/button';
import { Avatar, AvatarFallback } from '../app/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../app/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Building2,
  ScanFace,
  Shuffle,
  MessageCircleMore,
  Landmark,
  Timer,
  CalendarDays,
  SquareChartGantt,
  Bell,
  UserRoundX,
} from 'lucide-react';
import { apiService } from '../lib/api';
// Import qilish
import { Notification } from '../lib/types';

interface LayoutProps {
  children: ReactNode;
}

// Agar hali ham muammo bo'lsa, type yaratamiz
type AppNotification = Notification;

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // State uchun aniq type
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Bosh sahifa', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Hodimlar', href: '/employees', icon: Users },
    { name: 'Qurilmalar', href: '/devices', icon: ScanFace },
    { name: 'Smenalar', href: '/shifts', icon: Shuffle },
    { name: 'Telegram', href: '/telegram', icon: MessageCircleMore },
    { name: 'Filial', href: '/filial', icon: Landmark },
    { name: 'Tanaffus', href: '/break', icon: Timer },
    { name: 'Ish kunlari', href: '/workday', icon: CalendarDays },
    { name: 'Tariflar', href: '/plans', icon: SquareChartGantt },
    { name: 'Kelmaganlar', href: '/absence', icon: UserRoundX },
    { name: 'Profil', href: '/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Load notifications
  useEffect(() => {
    loadNotifications();
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      
      // Response'ni qayta ishlash
      const notificationsData = (response as any).map((item: any) => ({
        id: item.id,
        user: item.user,
        text: item.text,
        created_at: item.created_at,
        is_read: item.is_read || false
      })) as AppNotification[];
      
      console.log('📥 Loaded notifications:', notificationsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Mock data for testing
      const mockData: AppNotification[] = [
        {
          id: 1,
          user: 123,
          text: "Test xabarnoma",
          created_at: new Date().toISOString(),
          is_read: false
        }
      ];
      setNotifications(mockData);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">TimePay</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">CRM System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-sm">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-600 text-white">
                  {user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.full_name || 'Foydalanuvchi'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role || 'Admin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {/* Custom Notification Dropdown */}
              <div className="relative" ref={notificationRef}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => {
                    console.log('Bell clicked, current state:', notificationOpen);
                    setNotificationOpen(!notificationOpen);
                  }}
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
                
                {/* Dropdown panel - Responsive for mobile */}
                {notificationOpen && (
                  <div className="fixed inset-0 lg:absolute lg:inset-auto lg:right-0 lg:mt-2 lg:w-96 w-full lg:max-h-[80vh] h-[25vh] lg:h-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 lg:rounded-lg shadow-lg z-50 overflow-y-auto">
                    {/* Header with close button - visible on mobile */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 lg:hidden">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Xabarnomalar
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setNotificationOpen(false)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Main content */}
                    <div className="lg:p-0">
                      <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Xabarnomalar ({notifications.length})
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadNotifications()}
                            className="h-8 px-2 text-xs"
                          >
                            Yangilash
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNotificationOpen(false)}
                            className="h-8 px-2 text-xs"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 lg:py-16 text-center text-gray-500">
                          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-lg">Xabarnomalar yo'q</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Yangi xabarnomalar kelganda bu yerda ko'rinadi
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => loadNotifications()}
                            className="mt-4"
                          >
                            Yangilash
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer active:bg-gray-100 dark:active:bg-gray-600"
                              onClick={() => {
                                console.log('Clicked notification:', notification);
                                // Handle notification click
                                // On mobile, you might want to close after clicking
                                if (window.innerWidth < 1024) {
                                  setNotificationOpen(false);
                                }
                              }}
                            >
                              <p className="text-sm lg:text-base font-medium text-gray-900 dark:text-gray-100">
                                {notification.text}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">
                                  {formatDate(notification.created_at)}
                                </p>
                                {user?.role === 'superadmin' && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                    ID: {notification.user}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Mobile footer with close button */}
                    <div className="lg:hidden p-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        onClick={() => setNotificationOpen(false)}
                        className="w-full"
                      >
                        Yopish
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mening hisobim</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}