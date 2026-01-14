import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Settings, 
  ArrowLeft,
  Volume2,
  Bell,
  Globe,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  Check,
  Eye,
  Mail,
  MessageCircle,
  FileText,
  ExternalLink,
  Users
} from 'lucide-react';
import type { Screen } from '../src/App.tsx';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

type SettingsView = 'main' | 'language' | 'privacy' | 'help' | 'about';

export function SettingsScreen({ onNavigate, onLogout }: SettingsScreenProps) {
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState([75]);
  const [musicVolume, setMusicVolume] = useState([60]);
  
  // Privacy settings
  const [profileVisible, setProfileVisible] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [shareStats, setShareStats] = useState(false);

  // Vista de Idioma
  if (currentView === 'language') {
    const languages = [
      { code: 'es', name: 'Español (España)', selected: true },
      { code: 'en', name: 'English (UK)', selected: false },
      { code: 'fr', name: 'Français', selected: false },
      { code: 'de', name: 'Deutsch', selected: false },
      { code: 'it', name: 'Italiano', selected: false },
      { code: 'pt', name: 'Português', selected: false },
      { code: 'ca', name: 'Català', selected: false }
    ];

    return (
      <div className="flex flex-col h-full p-4">
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
          <h1 className="text-white text-xl">Idioma</h1>
          <div className="w-20" />
        </div>

        <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <span>Selecciona tu Idioma</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                  lang.selected 
                    ? 'bg-amber-500/20 border-2 border-amber-400' 
                    : 'bg-white/5 border border-amber-500/20 hover:bg-white/10'
                }`}
              >
                <span className={lang.selected ? 'text-white' : 'text-white/60'}>
                  {lang.name}
                </span>
                {lang.selected && (
                  <Check className="w-5 h-5 text-amber-400" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de Privacidad
  if (currentView === 'privacy') {
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
          <h1 className="text-white text-xl">Privacidad</h1>
          <div className="w-20" />
        </div>

        <div className="space-y-4">
          {/* Visibilidad de Perfil */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <span>Visibilidad</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white text-sm">Perfil Público</h3>
                  <p className="text-white/60 text-xs">Permite que otros jugadores vean tu perfil</p>
                </div>
                <Switch
                  checked={profileVisible}
                  onCheckedChange={setProfileVisible}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              <Separator className="bg-amber-500/20" />

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white text-sm">Estado En Línea</h3>
                  <p className="text-white/60 text-xs">Muestra cuando estás conectado</p>
                </div>
                <Switch
                  checked={showOnlineStatus}
                  onCheckedChange={setShowOnlineStatus}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              <Separator className="bg-amber-500/20" />

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white text-sm">Compartir Estadísticas</h3>
                  <p className="text-white/60 text-xs">Permite ver tus estadísticas en el ranking</p>
                </div>
                <Switch
                  checked={shareStats}
                  onCheckedChange={setShareStats}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Amigos */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Amigos y Contactos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white text-sm">Solicitudes de Amistad</h3>
                  <p className="text-white/60 text-xs">Permite recibir solicitudes de amistad</p>
                </div>
                <Switch
                  checked={allowFriendRequests}
                  onCheckedChange={setAllowFriendRequests}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vista de Ayuda
  if (currentView === 'help') {
    const helpTopics = [
      {
        title: 'Cómo Jugar',
        description: 'Aprende las reglas básicas del juego',
        icon: HelpCircle
      },
      {
        title: 'Gestión de Cuenta',
        description: 'Perfil, configuración y preferencias',
        icon: Users
      },
      {
        title: 'Compras y Monedas',
        description: 'Información sobre pesetas y gemas',
        icon: Info
      },
      {
        title: 'Problemas Técnicos',
        description: 'Solución de problemas comunes',
        icon: Settings
      }
    ];

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
          <h1 className="text-white text-xl">Ayuda</h1>
          <div className="w-20" />
        </div>

        <div className="space-y-4">
          {/* Centro de Ayuda */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>Centro de Ayuda</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {helpTopics.map((topic, index) => {
                const IconComponent = topic.icon;
                return (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5 text-amber-400" />
                      <div className="text-left">
                        <p className="text-white text-sm">{topic.title}</p>
                        <p className="text-white/60 text-xs">{topic.description}</p>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-amber-400 rotate-180" />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-amber-400" />
                <span>Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Mail className="w-5 h-5 text-amber-400" />
                <div className="text-left flex-1">
                  <p className="text-white text-sm">Email de Soporte</p>
                  <p className="text-amber-300 text-xs">soporte@casinoytapas.com</p>
                </div>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </button>

              <button className="w-full flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <MessageCircle className="w-5 h-5 text-amber-400" />
                <div className="text-left flex-1">
                  <p className="text-white text-sm">Chat en Vivo</p>
                  <p className="text-white/60 text-xs">Disponible L-V 9:00-18:00</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Online
                </Badge>
              </button>
            </CardContent>
          </Card>

          {/* Recursos */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Recursos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm">Preguntas Frecuentes (FAQ)</span>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm">Guía del Jugador</span>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm">Tutoriales en Video</span>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

          {/* Legal */}
          <Card className="bg-black/60 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Legal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm">Términos de Servicio</span>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm">Política de Privacidad</span>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm">Licencias de Código Abierto</span>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </button>
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
  const settingsSections = [
    {
      title: 'Audio',
      icon: Volume2,
      settings: [
        {
          id: 'sound',
          title: 'Efectos de Sonido',
          description: 'Sonidos de dados, monedas y efectos',
          type: 'switch' as const,
          value: soundEnabled,
          onChange: setSoundEnabled
        },
        {
          id: 'music',
          title: 'Música de Fondo',
          description: 'Música ambiental durante el juego',
          type: 'switch' as const,
          value: musicEnabled,
          onChange: setMusicEnabled
        },
        {
          id: 'soundVolume',
          title: 'Volumen de Efectos',
          description: 'Ajusta el volumen de los sonidos',
          type: 'slider' as const,
          value: soundVolume,
          onChange: setSoundVolume,
          disabled: !soundEnabled
        },
        {
          id: 'musicVolume',
          title: 'Volumen de Música',
          description: 'Ajusta el volumen de la música',
          type: 'slider' as const,
          value: musicVolume,
          onChange: setMusicVolume,
          disabled: !musicEnabled
        }
      ]
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      settings: [
        {
          id: 'notifications',
          title: 'Notificaciones Push',
          description: 'Recibe alertas de eventos y partidas',
          type: 'switch' as const,
          value: notificationsEnabled,
          onChange: setNotificationsEnabled
        },
        {
          id: 'vibrations',
          title: 'Vibraciones',
          description: 'Vibración al tocar botones y eventos',
          type: 'switch' as const,
          value: vibrationsEnabled,
          onChange: setVibrationsEnabled
        }
      ]
    }
  ];

  const actionItems = [
    {
      id: 'language',
      title: 'Idioma',
      description: 'Español (España)',
      icon: Globe,
      action: () => setCurrentView('language'),
      type: 'navigation' as const
    },
    {
      id: 'privacy',
      title: 'Privacidad',
      description: 'Gestiona tu privacidad y datos',
      icon: Shield,
      action: () => setCurrentView('privacy'),
      type: 'navigation' as const
    },
    {
      id: 'help',
      title: 'Ayuda y Soporte',
      description: 'Preguntas frecuentes y contacto',
      icon: HelpCircle,
      action: () => setCurrentView('help'),
      type: 'navigation' as const
    },
    {
      id: 'about',
      title: 'Acerca de',
      description: 'Casino y Tapas v1.0.0',
      icon: Info,
      action: () => setCurrentView('about'),
      type: 'navigation' as const
    }
  ];

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
        {/* Settings Sections */}
        {settingsSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.title} className="bg-black/60 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <IconComponent className="w-5 h-5 text-amber-400" />
                  <h2 className="text-white font-medium">{section.title}</h2>
                </div>
                
                <div className="space-y-4">
                  {section.settings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <h3 className="text-white text-sm font-medium">{setting.title}</h3>
                        <p className="text-white/60 text-xs">{setting.description}</p>
                      </div>
                      
                      <div className="ml-4">
                        {setting.type === 'switch' && (
                          <Switch
                            checked={setting.value as boolean}
                            onCheckedChange={setting.onChange as (checked: boolean) => void}
                            className="data-[state=checked]:bg-amber-500"
                          />
                        )}
                        
                        {setting.type === 'slider' && (
                          <div className="w-24">
                            <Slider
                              value={setting.value as number[]}
                              onValueChange={setting.onChange as (value: number[]) => void}
                              max={100}
                              step={1}
                              disabled={setting.disabled}
                              className="w-full"
                            />
                            <div className="text-center text-xs text-white/60 mt-1">
                              {(setting.value as number[])[0]}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Action Items */}
        <Card className="bg-black/60 border-amber-500/20">
          <CardContent className="p-4">
            <h2 className="text-white font-medium mb-4">General</h2>
            
            <div className="space-y-3">
              {actionItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5 text-amber-400" />
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        <p className="text-white/60 text-xs">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-amber-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
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
