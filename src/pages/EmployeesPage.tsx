import { useState, useEffect } from 'react';
import { mockEmployees, Employee } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../app/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../app/components/ui/alert-dialog';
import { Label } from '../app/components/ui/label';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone_number: '',
    employee_no: '',
  });

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    const newEmployee: Employee = {
      id: Date.now(),
      ...formData,
      local_face: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    };
    setEmployees([...employees, newEmployee]);
    setIsCreateOpen(false);
    setFormData({ name: '', position: '', phone_number: '', employee_no: '' });
    toast.success('Hodim muvaffaqiyatli qo\'shildi');
  };

  const handleUpdate = () => {
    if (!editEmployee) return;
    setEmployees(employees.map(emp =>
      emp.id === editEmployee.id ? { ...editEmployee, ...formData } : emp
    ));
    setEditEmployee(null);
    setFormData({ name: '', position: '', phone_number: '', employee_no: '' });
    toast.success('Hodim ma\'lumotlari yangilandi');
  };

  const handleDelete = () => {
    if (!deleteEmployee) return;
    setEmployees(employees.filter(emp => emp.id !== deleteEmployee.id));
    setDeleteEmployee(null);
    toast.success('Hodim o\'chirildi');
  };

  const openEdit = (employee: Employee) => {
    setEditEmployee(employee);
    setFormData({
      name: employee.name,
      position: employee.position,
      phone_number: employee.phone_number,
      employee_no: employee.employee_no,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hodimlar</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Barcha hodimlarni boshqaring
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi hodim
        </Button>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hodimlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Hodim nomi, lavozimi yoki raqami..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hodim</TableHead>
                  <TableHead>Raqami</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Hodimlar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.local_face} alt={employee.name} />
                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.employee_no}</TableCell>
                      <TableCell>{employee.phone_number}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewEmployee(employee)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteEmployee(employee)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editEmployee} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditEmployee(null);
          setFormData({ name: '', position: '', phone_number: '', employee_no: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editEmployee ? 'Hodimni tahrirlash' : 'Yangi hodim qo\'shish'}
            </DialogTitle>
            <DialogDescription>
              Hodim ma'lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ism familiya</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Alisher Karimov"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_no">Hodim raqami</Label>
              <Input
                id="employee_no"
                value={formData.employee_no}
                onChange={(e) => setFormData({ ...formData, employee_no: e.target.value })}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Lavozim</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Frontend Developer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Telefon raqami</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditEmployee(null);
                setFormData({ name: '', position: '', phone_number: '', employee_no: '' });
              }}
            >
              Bekor qilish
            </Button>
            <Button onClick={editEmployee ? handleUpdate : handleCreate}>
              {editEmployee ? 'Saqlash' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hodim ma'lumotlari</DialogTitle>
          </DialogHeader>
          {viewEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={viewEmployee.local_face} alt={viewEmployee.name} />
                  <AvatarFallback className="text-xl">{viewEmployee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{viewEmployee.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{viewEmployee.position}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hodim raqami</p>
                  <p className="font-medium">{viewEmployee.employee_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Telefon raqami</p>
                  <p className="font-medium">{viewEmployee.phone_number}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEmployee} onOpenChange={() => setDeleteEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hodimni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteEmployee?.name} ni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}