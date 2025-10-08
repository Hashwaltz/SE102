import { useState } from "react";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../App";
import { toast } from "sonner";

export default function LoginPage({ onLogin }) {
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", loginData);
      toast.success("Login successful!");
      onLogin(response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/register", registerData);
      toast.success("Registration successful! Please login.");
      setActiveTab("login");
      setRegisterData({ username: "", email: "", password: "", role: "staff" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 backdrop-blur-lg p-3 rounded-xl border border-white/20">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Puregold
              </h1>
              <p className="text-blue-100 text-sm">Inventory Management</p>
            </div>
          </div>

          <div className="mt-16 space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Smart Inventory,
              <br />
              Smarter Decisions
            </h2>
            <p className="text-blue-100 text-lg max-w-md">
              Powered by AI to forecast demand, optimize stock levels, and streamline your operations.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20">
            <Package className="w-6 h-6 text-white mb-2" />
            <p className="text-white font-semibold text-sm">Product Management</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20">
            <ShoppingCart className="w-6 h-6 text-white mb-2" />
            <p className="text-white font-semibold text-sm">Order Processing</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20">
            <TrendingUp className="w-6 h-6 text-white mb-2" />
            <p className="text-white font-semibold text-sm">AI Forecasting</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login/Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Puregold
            </h1>
            <p className="text-slate-400">Inventory Management System</p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-white">Welcome</CardTitle>
              <CardDescription className="text-slate-400">
                Login to access your inventory dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                  <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" data-testid="login-form">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username" className="text-slate-300">Username</Label>
                      <Input
                        id="login-username"
                        data-testid="login-username-input"
                        type="text"
                        placeholder="Enter username"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                      <Input
                        id="login-password"
                        data-testid="login-password-input"
                        type="password"
                        placeholder="Enter password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      data-testid="login-submit-button"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" data-testid="register-form">
                  <form onSubmit={handleRegister} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="text-slate-300">Username</Label>
                      <Input
                        id="register-username"
                        data-testid="register-username-input"
                        type="text"
                        placeholder="Choose username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-slate-300">Email</Label>
                      <Input
                        id="register-email"
                        data-testid="register-email-input"
                        type="email"
                        placeholder="your@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-slate-300">Password</Label>
                      <Input
                        id="register-password"
                        data-testid="register-password-input"
                        type="password"
                        placeholder="Create password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role" className="text-slate-300">Role</Label>
                      <select
                        id="register-role"
                        data-testid="register-role-select"
                        value={registerData.role}
                        onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                        className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Button
                      type="submit"
                      data-testid="register-submit-button"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      disabled={loading}
                    >
                      {loading ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}