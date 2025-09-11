import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Lock } from "lucide-react";
import claroLogo from "@/assets/logo_claro.png";

// ...existing code...

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
  const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", data.user.username);
        localStorage.setItem("role", data.user.role);
        if (data.user.username === "governanca_labs") {
          window.location.href = "/";
        } else {
          window.location.href = "/em-construcao";
        }
      } else {
        setError(data.error || "Usuário ou senha inválidos");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-lab-primary/10">
      <Card className="w-full max-w-xl shadow-2xl rounded-2xl border-0">
        <CardHeader className="flex flex-col items-center gap-2 pt-8 pb-2">
          <img src={claroLogo} alt="Logo Claro" className="w-16 h-16 mb-2" />
          <CardTitle className="text-3xl font-bold text-lab-primary">
            Login Executivo
          </CardTitle>
          <span className="text-muted-foreground text-lg font-medium">
            Acesso restrito ao dashboard de governança
          </span>
        </CardHeader>
        <CardContent className="py-8 px-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border focus-within:ring-2 focus-within:ring-lab-primary">
              <User className="w-5 h-5 text-lab-primary" />
              <Input
                placeholder="Usuário"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                className="border-0 bg-transparent text-lg focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border focus-within:ring-2 focus-within:ring-lab-primary">
              <Lock className="w-5 h-5 text-lab-primary" />
              <Input
                type="password"
                placeholder="Senha"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                className="border-0 bg-transparent text-lg focus:ring-0"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center font-semibold py-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-lab-primary hover:bg-lab-primary-dark rounded-xl shadow"
            >
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
