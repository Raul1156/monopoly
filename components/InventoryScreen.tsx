import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Package, 
  ArrowLeft,
  Check,
  Home,
  DollarSign
} from 'lucide-react';
import type { Screen } from '../src/App.tsx';

interface InventoryScreenProps {
  onNavigate: (screen: Screen) => void;
  playerProperties?: Array<{ id: number; name: string; price: number; level?: number }>;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'avatars' | 'themes' | 'properties';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: string;
  equipped: boolean;
}

export function InventoryScreen({ onNavigate, playerProperties = [] }: InventoryScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<'avatars' | 'themes' | 'properties'>('properties');
  const [equippedItems, setEquippedItems] = useState<Set<string>>(new Set(['1', '4']));

  const inventoryItems: InventoryItem[] = [
    // Avatars
    {
      id: '1',
      name: 'Avatar Clásico',
      description: 'Tu avatar por defecto',
      category: 'avatars',
      rarity: 'common',
      preview: '👤',
      equipped: true
    },
    {
      id: '2',
      name: 'Avatar Torero',
      description: 'Luce como un auténtico torero español',
      category: 'avatars',
      rarity: 'rare',
      preview: '🐂',
      equipped: false
    },
    {
      id: '3',
      name: 'Avatar Flamenca',
      description: 'Baila por el tablero con elegancia',
      category: 'avatars',
      rarity: 'epic',
      preview: '💃',
      equipped: false
    },
    
    // Themes
    {
      id: '4',
      name: 'Tema Clásico',
      description: 'Tablero tradicional español',
      category: 'themes',
      rarity: 'common',
      preview: '🏛️',
      equipped: true
    },
    {
      id: '5',
      name: 'Tema Andaluz',
      description: 'Tablero con estilo andaluz clásico',
      category: 'themes',
      rarity: 'legendary',
      preview: '🌸',
      equipped: false
    }
  ];

  const rarityColors = {
    common: 'border-gray-400 text-gray-400',
    rare: 'border-blue-400 text-blue-400',
    epic: 'border-purple-400 text-purple-400',
    legendary: 'border-amber-400 text-amber-400'
  };

  const filteredItems = inventoryItems.filter(item => item.category === selectedCategory);

  const handleEquip = (itemId: string, category: string) => {
    const newEquipped = new Set(equippedItems);
    
    // Desequipar otros items de la misma categoría
    inventoryItems.forEach(item => {
      if (item.category === category && item.id !== itemId) {
        newEquipped.delete(item.id);
      }
    });
    
    // Equipar/desequipar el item seleccionado
    if (newEquipped.has(itemId)) {
      newEquipped.delete(itemId);
    } else {
      newEquipped.add(itemId);
    }
    
    setEquippedItems(newEquipped);
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          size="lg"
          onClick={() => onNavigate('menu')}
          className="text-white hover:text-amber-400"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Volver
        </Button>
        
        <h1 className="text-white text-3xl font-bold flex items-center">
          <Package className="w-8 h-8 mr-3 text-amber-400" />
          Mi Inventario
        </h1>
        
        <div className="flex items-center text-white/60 text-lg">
          <span>{inventoryItems.length} items</span>
        </div>
      </div>

      {/* Categories Tabs */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)} className="flex-1">
        <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-amber-500/30 mb-6">
          <TabsTrigger value="properties" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-white/60 text-lg py-3">
            🏠 Propiedades
          </TabsTrigger>
          <TabsTrigger value="avatars" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-white/60 text-lg py-3">
            👤 Avatars
          </TabsTrigger>
          <TabsTrigger value="themes" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-white/60 text-lg py-3">
            🎨 Temas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="flex-1 mt-6">
          {selectedCategory === 'properties' ? (
            <div className="space-y-6">
              {playerProperties.length > 0 ? (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-amber-300 text-sm font-semibold">Total de propiedades</p>
                        <p className="text-white text-2xl font-bold">{playerProperties.length}</p>
                      </div>
                      <div>
                        <p className="text-amber-300 text-sm font-semibold">Inversión total</p>
                        <p className="text-white text-2xl font-bold">
                          ${playerProperties.reduce((sum, prop) => sum + prop.price, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-amber-300 text-sm font-semibold">Valor promedio</p>
                        <p className="text-white text-2xl font-bold">
                          ${playerProperties.length > 0 ? Math.floor(playerProperties.reduce((sum, prop) => sum + prop.price, 0) / playerProperties.length) : 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playerProperties.map((property) => (
                      <Card key={property.id} className="bg-black/60 border-amber-500/20 hover:border-amber-400/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex flex-col space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-white font-semibold text-lg">{property.name}</h3>
                                <p className="text-amber-400 text-sm mt-1">Propiedad</p>
                              </div>
                              <Home className="w-5 h-5 text-amber-400" />
                            </div>

                            <div className="bg-black/40 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-amber-300 text-sm flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Precio:
                                </span>
                                <span className="text-white font-bold">${property.price}</span>
                              </div>
                              {property.level !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-amber-300 text-sm">Nivel:</span>
                                  <Badge className="bg-amber-600/30 text-amber-300 border-amber-500/30">
                                    Level {property.level}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <Button 
                              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                              size="sm"
                            >
                              Ver detalles
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="bg-black/40 border-amber-500/20">
                  <CardContent className="p-12 text-center">
                    <Home className="w-16 h-16 text-white/40 mx-auto mb-6" />
                    <p className="text-white/60 text-lg">Aún no tienes propiedades</p>
                    <p className="text-white/40 text-base mt-2">¡Ve al juego y compra casillas del tablero!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="bg-black/60 border-amber-500/20 hover:border-amber-400/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Item Preview */}
                    <div className={`w-24 h-24 bg-gradient-to-br from-amber-400/20 to-red-600/20 rounded-xl flex items-center justify-center text-4xl border-2 relative ${
                      equippedItems.has(item.id) ? 'border-amber-400 shadow-amber-400/50 shadow-lg' : 'border-amber-500/30'
                    }`}>
                      {item.preview}
                      {equippedItems.has(item.id) && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      )}
                    </div>
                    
                    {/* Item Info */}
                    <div className="flex-1 w-full">
                      <div className="flex flex-col items-center space-y-2 mb-2">
                        <h3 className="text-white font-semibold text-lg">{item.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-3 py-1 ${rarityColors[item.rarity]}`}
                        >
                          {item.rarity}
                        </Badge>
                      </div>
                      <p className="text-white/60 text-sm mb-4">{item.description}</p>
                      
                      <div className="flex flex-col items-center space-y-3">
                        {equippedItems.has(item.id) && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Equipado
                          </Badge>
                        )}
                        
                        <Button 
                          size="default"
                          variant={equippedItems.has(item.id) ? "outline" : "default"}
                          onClick={() => handleEquip(item.id, item.category)}
                          className={
                            equippedItems.has(item.id) 
                              ? "border-amber-400 text-amber-400 hover:bg-amber-500/20 w-full" 
                              : "bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white w-full"
                          }
                        >
                          {equippedItems.has(item.id) ? 'Desequipar' : 'Equipar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredItems.length === 0 && (
              <Card className="bg-black/40 border-amber-500/20 col-span-full">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-white/40 mx-auto mb-6" />
                  <p className="text-white/60 text-lg">No tienes items en esta categoría</p>
                  <p className="text-white/40 text-base mt-2">¡Visita la tienda para conseguir más!</p>
                </CardContent>
              </Card>
            )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
