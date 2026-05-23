import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ShoppingBag, 
  Coins,
  ArrowLeft,
  Camera,
  Check,
  ShieldAlert
} from 'lucide-react';
import type { Screen } from '../src/App.tsx';
import { apiService, type ShopProduct, type User, type InventoryItem } from '../src/services/apiService';
import { toast } from 'sonner';

interface ShopScreenProps {
  onNavigate: (screen: Screen) => void;
  currentUser: User;
  onUserUpdate?: (user: User) => void;
}

export function ShopScreen({ onNavigate, currentUser, onUserUpdate }: ShopScreenProps) {
  const [selectedItem, setSelectedItem] = useState<ShopProduct | null>(null);
  const [avatarItems, setAvatarItems] = useState<ShopProduct[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [userBalance, setUserBalance] = useState(currentUser.totalMoney);

  useEffect(() => {
    let mounted = true;
    const loadShop = async () => {
      try {
        const [profilePhotos, inventory] = await Promise.all([
          apiService.getProfilePhotos(),
          apiService.getInventory(currentUser.id),
        ]);

        if (!mounted) return;

        setAvatarItems(profilePhotos);
        setOwnedIds(new Set(inventory.map((i: InventoryItem) => i.productId)));
      } catch (err) {
        console.error('Error loading shop:', err);
        if (!mounted) return;
        setAvatarItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadShop();
    return () => { mounted = false; };
  }, [currentUser.id]);

  const rarityColors = {
    common: 'border-gray-400 text-gray-400',
    rare: 'border-blue-400 text-blue-400',
    epic: 'border-purple-400 text-purple-400',
    legendary: 'border-amber-400 text-amber-400'
  };

  const rarityLabels: Record<string, string> = {
    common: 'Común',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Legendario'
  };

  const handleBuyClick = (item: ShopProduct) => {
    if (ownedIds.has(item.id)) {
      toast.info('Ya posees este item');
      return;
    }
    setSelectedItem(item);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;
    if (userBalance < selectedItem.price) {
      toast.error('No tienes suficientes puntos');
      return;
    }
    setBuying(true);
    try {
      const result = await apiService.buyProduct(currentUser.id, selectedItem.id);
      setUserBalance(result.newBalance);
      setOwnedIds(prev => new Set([...prev, selectedItem.id]));
      toast.success(result.message);
      setSelectedItem(null);
      // Update parent user state
      if (onUserUpdate) {
        onUserUpdate({ ...currentUser, totalMoney: result.newBalance });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al comprar';
      toast.error(msg);
    } finally {
      setBuying(false);
    }
  };

  const handleCancelPurchase = () => {
    setSelectedItem(null);
  };

  const items = avatarItems;

  // ========== PAYMENT GATEWAY ==========
  if (selectedItem) {
    const isAvatar = selectedItem.category === 'avatar';
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
          {isAvatar ? (
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-amber-500/30 shadow-lg shadow-amber-500/10">
              <img 
                src={`/fotos-perfil/${selectedItem.preview}`} 
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 bg-gradient-to-br from-amber-400/20 to-red-600/20 rounded-2xl flex items-center justify-center text-6xl border-4 border-amber-500/30">
              {selectedItem.preview}
            </div>
          )}

          <div className="text-center">
            <h2 className="text-white text-2xl mb-2">{selectedItem.name}</h2>
            <Badge 
              variant="outline" 
              className={`text-sm px-3 py-1 ${rarityColors[selectedItem.rarity]}`}
            >
              {rarityLabels[selectedItem.rarity] || selectedItem.rarity}
            </Badge>
            <p className="text-white/60 text-sm mt-3">{selectedItem.description}</p>
          </div>

          {/* Price Display */}
          <Card className="bg-black/60 border-amber-500/30 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Precio:</span>
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-green-400" />
                  <span className="text-2xl text-green-400">
                    {selectedItem.price.toLocaleString()} pts
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-500/20">
                <span className="text-white/60">Tu saldo actual:</span>
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">{userBalance.toLocaleString()} pts</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-white">Saldo después de la compra:</span>
                <span className={userBalance >= selectedItem.price ? 'text-green-400' : 'text-red-400'}>
                  {Math.max(0, userBalance - selectedItem.price).toLocaleString()} pts
                </span>
              </div>

              {userBalance < selectedItem.price ? (
                <div className="flex items-center justify-center space-x-2 text-red-400 bg-red-500/10 rounded-lg p-3">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Saldo insuficiente</span>
                </div>
              ) : (
                <Button 
                  onClick={handleConfirmPurchase}
                  disabled={buying}
                  className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white py-6"
                >
                  {buying ? 'Procesando...' : 'Confirmar Compra'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ========== SHOP MAIN VIEW ==========
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
            <span>{userBalance.toLocaleString()} pts</span>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center space-x-2 mb-5">
        <Camera className="w-5 h-5 text-amber-400" />
        <h2 className="text-white font-semibold">Fotos de Perfil</h2>
      </div>

      {loading && (
        <div className="text-white/60 text-center py-6">Cargando productos...</div>
      )}

      {/* Shop Items */}
      <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const owned = ownedIds.has(item.id);
              return (
                <Card 
                  key={item.id} 
                  className={`bg-black/60 border-amber-500/20 hover:border-amber-400/50 transition-all duration-200 ${owned ? 'opacity-70' : 'cursor-pointer'}`}
                  onClick={() => !owned && handleBuyClick(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Photo Preview */}
                      <div className={`w-24 h-24 rounded-xl overflow-hidden border-2 relative ${
                        owned ? 'border-green-500/50' : 'border-amber-500/30'
                      }`}>
                        <img 
                          src={`/fotos-perfil/${item.preview}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {owned && (
                          <div className="absolute inset-0 bg-green-900/40 flex items-center justify-center">
                            <div className="bg-green-500 rounded-full p-1">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h3 className="text-white font-medium text-sm">{item.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-0 mt-1 ${rarityColors[item.rarity]}`}
                        >
                          {rarityLabels[item.rarity] || item.rarity}
                        </Badge>
                      </div>

                      {/* Price / Owned */}
                      {owned ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Comprado
                        </Badge>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-green-400" />
                          <span className="font-medium text-green-400 text-sm">
                            {item.price.toLocaleString()} pts
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {items.length === 0 && !loading && (
              <div className="col-span-full text-center text-white/40 py-8">
                No hay fotos de perfil disponibles
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
