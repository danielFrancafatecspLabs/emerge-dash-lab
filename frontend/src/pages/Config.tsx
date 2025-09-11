import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Config() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Usuário registrado com sucesso!");
        setUser("");
        setPass("");
      } else {
        setError(data.error || "Erro ao registrar usuário");
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
          <CardTitle className="text-2xl font-bold text-lab-primary">
            Registrar novo usuário
          </CardTitle>
          <span className="text-muted-foreground text-lg font-medium">
            Apenas administradores podem registrar novos usuários
          </span>
        </CardHeader>
        <CardContent className="py-8 px-6">
          <form onSubmit={handleRegister} className="space-y-6">
            <Input
              placeholder="Usuário"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              className="border-0 bg-gray-50 text-lg focus:ring-0"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              className="border-0 bg-gray-50 text-lg focus:ring-0"
            />
            {error && (
              <div className="text-red-500 text-sm text-center font-semibold py-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm text-center font-semibold py-2 bg-green-50 rounded">
                {success}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-lab-primary hover:bg-lab-primary-dark rounded-xl shadow"
              disabled={loading}
            >
              Registrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
