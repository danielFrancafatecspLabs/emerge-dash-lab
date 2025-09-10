
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Lock } from "lucide-react";
import claroLogo from "@/assets/logo_claro.png";

const defaultUsers = {
  "governanca_labs": "govlabs2025",
  "Hugo_Santana": "governanca123",
  "Luis_Hansen": "governanca123",
  "Gui_Raiol_Gui_Magal": "governanca123",
  "Pedro_Vieira": "governanca123",
  "Bruno_Pinheiro_Rogerio_januario": "governanca123"
};

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (defaultUsers[user] && defaultUsers[user] === pass) {
      localStorage.setItem("user", user);
      window.location.reload();
    } else {
      setError("Usuário ou senha inválidos");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-lab-primary/10">
      <Card className="w-full max-w-xl shadow-2xl rounded-2xl border-0">
        <CardHeader className="flex flex-col items-center gap-2 pt-8 pb-2">
          <img src={claroLogo} alt="Logo Claro" className="w-16 h-16 mb-2" />
          <CardTitle className="text-3xl font-bold text-lab-primary">Login Executivo</CardTitle>
          <span className="text-muted-foreground text-lg font-medium">Acesso restrito ao dashboard de governança</span>
        </CardHeader>
        <CardContent className="py-8 px-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border focus-within:ring-2 focus-within:ring-lab-primary">
              <User className="w-5 h-5 text-lab-primary" />
              <Input
                placeholder="Usuário"
                value={user}
                onChange={e => setUser(e.target.value)}
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
                onChange={e => setPass(e.target.value)}
                required
                className="border-0 bg-transparent text-lg focus:ring-0"
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center font-semibold py-2 bg-red-50 rounded">{error}</div>}
            <Button type="submit" className="w-full h-12 text-lg font-bold bg-lab-primary hover:bg-lab-primary-dark rounded-xl shadow">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
