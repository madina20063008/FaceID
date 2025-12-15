import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Avatar, AvatarFallback } from '../app/components/ui/avatar';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';
import { Building2, User, Phone, Shield, LogOut } from 'lucide-react';

export function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Foydalanuvchi ma'lumotlari
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">TimePay CRM</CardTitle>
              <p className="text-gray-500 dark:text-gray-400">
                FaceID Attendance & Payroll System
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-3xl bg-blue-600 text-white">
                {user.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-semibold">{user.full_name}</h3>
                <Badge className="mt-2">{user.role}</Badge>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Telefon</p>
                    <p className="font-medium">{user.phone_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
                    <p className="font-medium">#{user.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Holat</p>
                    <p className="font-medium">
                      {user.is_active ? 'Faol' : 'Faol emas'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Tizimdan chiqish
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}