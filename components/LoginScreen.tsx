import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Gamepad2, Trophy, Crown } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string, email: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      const userEmail = email.trim() || `${username}@monopoly.com`;
      onLogin(username, userEmail);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo del casino */}
      <div className="absolute inset-0 opacity-20">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1745473383212-59428c1156bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFuaXNoJTIwY2FzaW5vJTIwcm91bGV0dGUlMjBnb2xkZW4lMjByZWR8ZW58MXx8fHwxNzU5OTI5NjkxfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Casino background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Iconos decorativos */}
      <div className="absolute top-20 left-10 text-amber-400 opacity-30">
        <Crown className="w-12 h-12 animate-pulse" />
      </div>
      <div className="absolute top-32 right-12 text-red-400 opacity-30">
        <Trophy className="w-10 h-10 animate-bounce" />
      </div>
      <div className="absolute bottom-32 left-8 text-amber-300 opacity-30">
        <Gamepad2 className="w-11 h-11 animate-pulse" />
      </div>

      {/* Tarjeta principal */}
      <Card className="w-full max-w-md bg-black/80 border-amber-500/30 shadow-2xl backdrop-blur-sm relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-red-600 rounded-full flex items-center justify-center">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
            Casino y Tapas
          </CardTitle>
          <p className="text-amber-200/80 text-base mt-2">
            {showRegister ? 'Crea tu cuenta' : 'Inicia tu aventura'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/10 border-amber-500/30 text-white placeholder:text-white/60 focus:border-amber-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Contraseña (opcional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-amber-500/30 text-white placeholder:text-white/60 focus:border-amber-400"
              />
            </div>

            {showRegister && (
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email (opcional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-amber-500/30 text-white placeholder:text-white/60 focus:border-amber-400"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white border-none shadow-lg"
            >
              {showRegister ? 'Registrarse' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button
              onClick={() => setShowRegister(!showRegister)}
              className="text-amber-300 hover:text-amber-200 text-sm underline"
            >
              {showRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>

            {!showRegister && (
              <button className="block text-red-300 hover:text-red-200 text-sm underline mx-auto">
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
