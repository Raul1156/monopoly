import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ShoppingBag, 
  Coins,
  Star,
  ArrowLeft
} from 'lucide-react';
import type { Screen } from '../src/App.tsx';
import { apiService, type ShopProduct, type User } from '../src/services/apiService';

interface ShopScreenProps {
  onNavigate: (screen: Screen) => void;
  currentUser: User;
}

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: 'pts' | 'gems';
  category: 'avatar' | 'theme';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: string;
}

export function ShopScreen({ onNavigate, currentUser }: ShopScreenProps) {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiService.getShopProducts()
      .then((products: ShopProduct[]) => {
        if (!mounted) return;
        setShopItems(products);
      })
      .catch((err) => {
        console.error('Error loading shop products:', err);
        if (!mounted) return;
        setShopItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const rarityColors = {
    common: 'border-gray-400 text-gray-400',
    rare: 'border-blue-400 text-blue-400',
    epic: 'border-purple-400 text-purple-400',
    legendary: 'border-amber-400 text-amber-400'
  };

  const categoryIcons = {
    avatar: '👤',
    theme: '🎨'
  };

  const handleBuyClick = (item: ShopItem) => {
    setSelectedItem(item);
  };

  const handleConfirmPurchase = () => {
    if (selectedItem) {
      alert(`¡Compra realizada! ${selectedItem.name} agregado a tu inventario`);
      setSelectedItem(null);
    }
  };

  const handleCancelPurchase = () => {
    setSelectedItem(null);
  };

  if (selectedItem) {
    // Payment Gateway Screen
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleCancelPurchase}
            className="text-white hover:text-amber-400"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Cancelar
          </Button>
          
          <h1 className="text-white text-xl">Pasarela de Pago</h1>
          
          <div className="w-20" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          {/* Item Preview */}
          <div className="w-32 h-32 bg-gradient-to-br from-amber-400/20 to-red-600/20 rounded-2xl flex items-center justify-center text-6xl border-4 border-amber-500/30">
            {selectedItem.preview}
          </div>

          <div className="text-center">
            <h2 className="text-white text-2xl mb-2">{selectedItem.name}</h2>
            <Badge 
              variant="outline" 
              className={`text-sm px-3 py-1 ${rarityColors[selectedItem.rarity]}`}
            >
              {selectedItem.rarity}
            </Badge>
            <p className="text-white/60 text-sm mt-3">{selectedItem.description}</p>
          </div>

          {/* Price Display */}
          <Card className="bg-black/60 border-amber-500/30 w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Precio:</span>
                <div className="flex items-center space-x-2">
                  {selectedItem.currency === 'pts' ? (
                    <Coins className="w-5 h-5 text-green-400" />
                  ) : (
                    <Star className="w-5 h-5 text-purple-400" />
                  )}
                  <span className={`text-2xl ${selectedItem.currency === 'pts' ? 'text-green-400' : 'text-purple-400'}`}>
                    {selectedItem.price.toLocaleString()} {selectedItem.currency}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-500/20">
                <span className="text-white/60">Tu saldo actual:</span>
                <div className="flex items-center space-x-2">
                  {selectedItem.currency === 'pts' ? (
                    <>
                      <Coins className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">{currentUser.totalMoney.toLocaleString()} pts</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400">{currentUser.gems.toLocaleString()} gems</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-white">Saldo después de la compra:</span>
                <span className={selectedItem.currency === 'pts' ? 'text-green-400' : 'text-purple-400'}>
                  {selectedItem.currency === 'pts' 
                    ? `${Math.max(0, currentUser.totalMoney - selectedItem.price).toLocaleString()} pts`
                    : `${Math.max(0, currentUser.gems - selectedItem.price).toLocaleString()} gems`
                  }
                </span>
              </div>

              <Button 
                onClick={handleConfirmPurchase}
                className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white py-6"
              >
                Confirmar Compra
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <ShoppingBag className="w-6 h-6 mr-2 text-amber-400" />
          Tienda
        </h1>
        
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex items-center text-green-300">
            <Coins className="w-4 h-4 mr-1" />
            <span>{currentUser.totalMoney.toLocaleString()} pts</span>
          </div>
          <div className="flex items-center text-purple-300">
            <Star className="w-4 h-4 mr-1" />
            <span>{currentUser.gems.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-white/60 text-center py-6">Cargando productos...</div>
      )}

      {/* Categories */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {['avatar', 'theme'].map((category) => (
          <Button
            key={category}
            variant="outline"
            size="sm"
            className="bg-black/40 border-amber-500/30 text-white hover:bg-amber-500/20 flex flex-col items-center py-3 h-auto"
          >
            <span className="text-lg mb-1">{categoryIcons[category as keyof typeof categoryIcons]}</span>
            <span className="text-xs capitalize">{category}</span>
          </Button>
        ))}
      </div>

      {/* Shop Items */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {shopItems.map((item) => (
          <Card key={item.id} className="bg-black/60 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {/* Item Preview */}
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-red-600/20 rounded-xl flex items-center justify-center text-2xl border-2 border-amber-500/30">
                  {item.preview}
                </div>
                
                {/* Item Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-white font-medium">{item.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 ${rarityColors[item.rarity]}`}
                    >
                      {item.rarity}
                    </Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {item.currency === 'pts' ? (
                        <Coins className="w-4 h-4 text-green-400" />
                      ) : (
                        <Star className="w-4 h-4 text-purple-400" />
                      )}
                      <span className={`font-medium ${item.currency === 'pts' ? 'text-green-400' : 'text-purple-400'}`}>
                        {item.price.toLocaleString()} {item.currency}
                      </span>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleBuyClick(item)}
                      className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white px-4"
                    >
                      Comprar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
