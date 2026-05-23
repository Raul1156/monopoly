import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Settings, 
  ArrowLeft,
  Volume2,
  VolumeX,
  Info,
  LogOut,
  Users
} from 'lucide-react';
import type { Screen } from '../src/App.tsx';
import { useSoundSettings } from '../hooks/SoundSettingsContext';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

type SettingsView = 'main' | 'about';

export function SettingsScreen({ onNavigate, onLogout }: SettingsScreenProps) {
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const { soundEnabled, setSoundEnabled, soundVolume, setSoundVolume } = useSoundSettings();

  // Vista Acerca de
  if (currentView === 'about') {
    return (
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentView('main')}
            className="text-white hover:text-amber-400"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <h1 className="text-white text-xl">Acerca de</h1>
          <div className="w-20" />
        </div>

        <div className="space-y-4">
          {/* App Info */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎰</span>
                </div>
                <h2 className="text-white text-2xl mb-2">Casino y Tapas</h2>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Versión 1.0.0
                </Badge>
              </div>

              <Separator className="bg-amber-500/20 mb-6" />

              <div className="space-y-3 text-center">
                <p className="text-white/80 text-sm">
                  Un juego de mesa digital inspirado en Monopoly, ambientado en la cultura española con mecánicas únicas.
                </p>
                <p className="text-white/60 text-xs">
                  © 2025 Casino y Tapas. Todos los derechos reservados.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Credits */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Equipo de Desarrollo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <p className="text-white text-sm">Proyecto INTERMODULAR 2º DAM A</p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {['Raúl', 'Dayron', 'Anna', 'Marcelo', 'Izan'].map((name) => (
                    <Badge 
                      key={name}
                      className="bg-amber-500/20 text-amber-300 border-amber-500/30"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Info className="w-5 h-5 text-amber-400" />
                <span>Información Técnica</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Versión de la App:</span>
                <span className="text-white">1.0.0</span>
              </div>
              <Separator className="bg-amber-500/20" />
              <div className="flex justify-between">
                <span className="text-white/60">Última Actualización:</span>
                <span className="text-white">22/10/2025</span>
              </div>
              <Separator className="bg-amber-500/20" />
              <div className="flex justify-between">
                <span className="text-white/60">Tamaño:</span>
                <span className="text-white">45.2 MB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vista Principal
  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onNavigate('menu')}
          className="text-white hover:text-amber-400"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver
        </Button>
        
        <h1 className="text-white text-xl flex items-center">
          <Settings className="w-6 h-6 mr-2 text-amber-400" />
          Configuración
        </h1>
        
        <div className="w-20" />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Audio Section */}
        <Card className="bg-black/60 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Volume2 className="w-5 h-5 text-amber-400" />
              <h2 className="text-white font-medium">Audio</h2>
            </div>
            
            {/* Sound Effects Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${
                soundEnabled
                  ? 'bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  soundEnabled
                    ? 'bg-amber-500/30 text-amber-400'
                    : 'bg-white/10 text-white/30'
                }`}>
                  {soundEnabled
                    ? <Volume2 className="w-5 h-5" />
                    : <VolumeX className="w-5 h-5" />
                  }
                </div>
                <div className="text-left">
                  <h3 className="text-white text-sm font-medium">Efectos de Sonido</h3>
                  <p className={`text-xs transition-colors duration-300 ${
                    soundEnabled ? 'text-amber-300/70' : 'text-white/40'
                  }`}>
                    {soundEnabled ? 'Sonidos activados' : 'Sonidos desactivados'}
                  </p>
                </div>
              </div>

              {/* Custom pill toggle */}
              <div className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${
                soundEnabled ? 'bg-amber-500' : 'bg-white/20'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* General - About */}
        <Card className="bg-black/60 border-amber-500/20">
          <CardContent className="p-4">
            <h2 className="text-white font-medium mb-4">General</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('about')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Info className="w-5 h-5 text-amber-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">Acerca de</p>
                    <p className="text-white/60 text-xs">Casino y Tapas v1.0.0</p>
                  </div>
                </div>
                
                <div className="text-amber-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Card className="bg-red-900/60 border-red-500/30">
          <CardContent className="p-4">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full flex items-center justify-center space-x-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
