// pages/LoginPage.tsx - COMPLETE CORRECTED VERSION
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import {
  Building2,
  Moon,
  Sun,
  AlertCircle,
  Loader2,
  Info,
  Bug,
  TestTube,
} from "lucide-react";
import { useTheme } from "next-themes";
import { testLogin, testSuperAdmin } from "../lib/api";

export function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTestResult(null);
    setIsSubmitting(true);

    if (!phoneNumber.trim()) {
      setError("Iltimos, telefon raqamini kiriting");
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setError("Iltimos, parolni kiriting");
      setIsSubmitting(false);
      return;
    }

    // Clean phone number - remove all non-digits
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");

    // Validate phone number has at least 9 digits
    if (cleanedPhoneNumber.length < 9) {
      setError("Telefon raqami kamida 9 raqamdan iborat bo'lishi kerak");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 4) {
      setError("Parol kamida 4 ta belgidan iborat bo'lishi kerak");
      setIsSubmitting(false);
      return;
    }

    try {
      // Send full phone number, API will ensure it has 998 prefix
      await login({
        phone_number: cleanedPhoneNumber,
        password,
      });
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    if (!phoneNumber.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await testLogin(phoneNumber.replace(/\D/g, ""), password);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuperAdminTest = async () => {
    setIsSubmitting(true);
    try {
      const result = await testSuperAdmin();
      setTestResult(result);
      setPhoneNumber("+998 77 777 77 77");
      setPassword("Madina2006");
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualTest = async () => {
    if (!phoneNumber.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      // Test with 998 prefix
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const phoneWith998 = cleanPhone.startsWith("998")
        ? cleanPhone
        : "998" + cleanPhone;

      console.log("🧪 Manual test - Sending WITH 998 prefix:", phoneWith998);

      const response = await fetch("http://185.191.141.213/user/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneWith998, // WITH 998 prefix
          password: password,
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      const result = {
        success: response.ok,
        status: response.status,
        phoneSent: phoneWith998,
        response: data,
        note: "Manually sent WITH 998 prefix",
      };

      setTestResult(result);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    // Format as +998 XX XXX XX XX
    if (value.startsWith("998")) {
      const rest = value.substring(3);
      if (rest.length > 0) {
        const match = rest.match(/^(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (match) {
          const formatted =
            `+998 ${match[1] ? match[1] : ""}${match[2] ? " " + match[2] : ""}${match[3] ? " " + match[3] : ""}${match[4] ? " " + match[4] : ""}`.trim();
          setPhoneNumber(formatted);
        }
      } else {
        setPhoneNumber("+998");
      }
    } else if (value.length > 0) {
      // If user starts typing without +998, add it
      if (value.length <= 9) {
        const match = value.match(/^(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (match) {
          const formatted =
            `+998 ${match[1] ? match[1] : ""}${match[2] ? " " + match[2] : ""}${match[3] ? " " + match[3] : ""}${match[4] ? " " + match[4] : ""}`.trim();
          setPhoneNumber(formatted);
        }
      }
    } else {
      setPhoneNumber("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          disabled={isSubmitting}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-full">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">TimePay CRM</CardTitle>
          <CardDescription className="text-base">
            FaceID Attendance & Payroll System
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-300">
                  Muhim:
                </p>
                <p className="text-green-700 dark:text-green-400 mt-1">
                  Server telefon raqamni <strong>998 prefiksi bilan</strong>{" "}
                  kutmoqda. Misol: <strong>+998 77 777 77 77</strong>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-gray-700 dark:text-gray-300"
              >
                Telefon raqami
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+998 77 777 77 77"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                required
                disabled={isSubmitting}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                autoComplete="tel"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Format: +998 XX XXX XX XX (998 prefiksi avtomatik qo'shiladi)
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-700 dark:text-gray-300"
              >
                Parol
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kirilmoqda...
                </>
              ) : (
                "Kirish"
              )}
            </Button>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={
                  isSubmitting || !phoneNumber.trim() || !password.trim()
                }
                className="text-xs"
              >
                <TestTube className="h-3 w-3 mr-1" />
                Test API
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuperAdminTest}
                disabled={isSubmitting}
                className="text-xs bg-yellow-50 dark:bg-yellow-900/20"
              >
                <Bug className="h-3 w-3 mr-1" />
                Test SuperAdmin
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualTest}
                disabled={
                  isSubmitting || !phoneNumber.trim() || !password.trim()
                }
                className="text-xs"
              >
                Manual Test
              </Button>
            </div>

            {testResult && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="font-medium text-sm mb-2">Test natijasi:</p>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(testResult, null, 2)}
                </pre>

                {testResult.note && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-xs font-medium">{testResult.note}</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              <p className="mb-1">Hisobingiz yo'qmi?</p>
              <a
                href="https://t.me/timepayadmin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Biz bilan bog'lanish
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
