import { useState } from 'react';
import { Button } from './ui/button';

export interface Property {
  id: number;
  nombre: string;
  tipo: 'propiedad' | 'estacion' | 'compañia' | 'comunidad' | 'suerte' | 'hacienda' | 'loteria' | 'carcel' | 'irCarcel' | 'casino' | 'inicio' | 'impuesto';
  precio?: number;
  cantidad?: number;
  dueno?: string;
  nivel?: number; // Para casas/hoteles
  alquiler?: number; // Alquiler que cobran

  // Cartas (COMUNIDAD / SUERTE)
  cardLoading?: boolean;
  card?: {
    id: number;
    type: string;
    description: string;
    effect: string;
    value: number;
  };
}

interface PropertyCardModalProps {
  isOpen: boolean;
  property: Property | null;
  playerMoney: number;
  onClose: () => void;
  onBuy: (propertyId: number) => void;
  onPass: () => void;
}

export function PropertyCardModal({
  isOpen,
  property,
  playerMoney,
  onClose,
  onBuy,
  onPass
}: PropertyCardModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!property || !isOpen) return null;

  const canBuy = 
    property.tipo === 'propiedad' || 
    property.tipo === 'estacion' || 
    property.tipo === 'compañia';
  
  const isOwned = property.dueno !== undefined && property.dueno !== null;
  const canAfford = playerMoney >= (property.precio || 0);

  const handleBuy = () => {
    setShowConfirm(true);
  };

  const confirmBuy = () => {
    onBuy(property.id);
    setShowConfirm(false);
    setTimeout(() => onClose(), 300);
  };

  const handlePass = () => {
    onPass();
    setShowConfirm(false);
    onClose();
  };

  const getPropertyColor = (type: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      propiedad: { bg: 'bg-orange-600', border: 'border-orange-500', text: 'text-orange-100' },
      estacion: { bg: 'bg-gray-600', border: 'border-gray-500', text: 'text-gray-100' },
      compañia: { bg: 'bg-purple-600', border: 'border-purple-500', text: 'text-purple-100' },
      comunidad: { bg: 'bg-green-600', border: 'border-green-500', text: 'text-green-100' },
      suerte: { bg: 'bg-blue-600', border: 'border-blue-500', text: 'text-blue-100' },
      // compatibilidad legacy
      hacienda: { bg: 'bg-green-600', border: 'border-green-500', text: 'text-green-100' },
      loteria: { bg: 'bg-blue-600', border: 'border-blue-500', text: 'text-blue-100' },
      carcel: { bg: 'bg-red-700', border: 'border-red-600', text: 'text-red-100' },
      irCarcel: { bg: 'bg-red-700', border: 'border-red-600', text: 'text-red-100' },
      casino: { bg: 'bg-yellow-600', border: 'border-yellow-500', text: 'text-yellow-100' },
      inicio: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-950' },
      impuesto: { bg: 'bg-red-600', border: 'border-red-500', text: 'text-red-100' }
    };
    return colors[type] || { bg: 'bg-gray-600', border: 'border-gray-500', text: 'text-gray-100' };
  };

  const colors = getPropertyColor(property.tipo);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={handlePass}
      />
      
      {/* CARTA DE PROPIEDAD */}
      <div className="relative z-10 w-80 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
        <div className={`${colors.bg} ${colors.border} border-4 rounded-2xl overflow-hidden shadow-2xl`}>
          
          {/* ENCABEZADO - Nombre de la propiedad */}
          <div className={`${colors.bg} ${colors.text} p-6 text-center border-b-4 ${colors.border}`}>
            <h2 className="text-2xl font-bold uppercase tracking-wider">{property.nombre}</h2>
            <p className={`text-sm mt-1 opacity-75 capitalize`}>{property.tipo}</p>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="bg-white p-6 space-y-4">
            
            {/* Si está comprada */}
            {isOwned && (
              <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 text-center">
                <p className="text-red-700 font-bold text-sm">❌ PROPIEDAD COMPRADA</p>
                <p className="text-red-600 text-xs mt-1">Dueño: {property.dueno}</p>
              </div>
            )}

            {/* INFORMACIÓN DE PRECIO Y ALQUILER */}
            {(property.tipo === 'propiedad' || property.tipo === 'estacion' || property.tipo === 'compañia') && (
              <div className="space-y-2 border-t-2 border-gray-300 pt-4">
                {property.precio && (
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-700">Precio:</span>
                    <span className={`${colors.text} ${colors.bg} px-3 py-1 rounded`}>{property.precio} pts</span>
                  </div>
                )}
                
                {property.alquiler !== undefined && property.alquiler > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Alquiler:</span>
                    <span className="font-semibold text-gray-800">{property.alquiler} pts</span>
                  </div>
                )}

                {property.tipo === 'estacion' && (
                  <div className="text-xs text-gray-600 italic mt-2 text-center">
                    Estación ferroviaria
                  </div>
                )}

                {property.tipo === 'compañia' && (
                  <div className="text-xs text-gray-600 italic mt-2 text-center">
                    Compañía de servicios
                  </div>
                )}
              </div>
            )}

            {/* CASILLAS ESPECIALES */}
            {(property.tipo === 'comunidad' || property.tipo === 'hacienda') && (
              <div className="text-center py-4 border-t-2 border-gray-300">
                <p className="text-lg font-bold text-green-700">📦 CAJA DE COMUNIDAD</p>

                {property.cardLoading ? (
                  <p className="text-xs text-gray-600 mt-2">Robando carta…</p>
                ) : property.card ? (
                  <>
                    <p className="text-sm text-gray-800 mt-3 font-semibold">{property.card.description}</p>
                    <p className="text-xs text-gray-600 mt-2">Efecto: {property.card.effect} ({property.card.value})</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-600 mt-2">No se pudo cargar la carta</p>
                )}
              </div>
            )}

            {(property.tipo === 'suerte' || property.tipo === 'loteria') && (
              <div className="text-center py-4 border-t-2 border-gray-300">
                <p className="text-lg font-bold text-blue-700">🎴 SUERTE</p>

                {property.cardLoading ? (
                  <p className="text-xs text-gray-600 mt-2">Robando carta…</p>
                ) : property.card ? (
                  <>
                    <p className="text-sm text-gray-800 mt-3 font-semibold">{property.card.description}</p>
                    <p className="text-xs text-gray-600 mt-2">Efecto: {property.card.effect} ({property.card.value})</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-600 mt-2">No se pudo cargar la carta</p>
                )}
              </div>
            )}

            {(property.tipo === 'carcel' || property.tipo === 'irCarcel') && (
              <div className="text-center py-4 border-t-2 border-gray-300">
                <p className="text-lg font-bold text-red-700">⚠️ CÁRCEL</p>
                <p className="text-xs text-gray-600 mt-2">¡Has caído en la cárcel!</p>
              </div>
            )}

            {property.tipo === 'casino' && (
              <div className="text-center py-4 border-t-2 border-gray-300">
                <p className="text-lg font-bold text-yellow-700">🎰 CASINO</p>
                <p className="text-xs text-gray-600 mt-2">¡Juega y gana dinero!</p>
              </div>
            )}

            {property.tipo === 'inicio' && (
              <div className="text-center py-4 border-t-2 border-gray-300">
                <p className="text-lg font-bold text-amber-700">✅ SALIDA</p>
                <p className="text-xs text-gray-600 mt-2">Recibe 200 pts al pasar</p>
              </div>
            )}

            {property.cantidad && property.cantidad > 0 && (
              <div className="text-center py-4 border-t-2 border-gray-300 bg-red-50 rounded">
                <p className="text-lg font-bold text-red-700">💸 IMPUESTO</p>
                <p className="text-xs text-gray-600 mt-1">Debes pagar</p>
                <p className="text-2xl font-bold text-red-700 mt-2">{property.cantidad} pts</p>
              </div>
            )}

          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="bg-gray-100 border-t-4 border-gray-300 px-6 py-4 space-y-3">
            {showConfirm ? (
              <>
                <p className="text-center text-gray-700 font-bold text-sm">
                  ¿Comprar por <span className="text-lg">{property.precio} pts</span>?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={confirmBuy}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    ✓ SÍ
                  </Button>
                  <Button
                    onClick={() => setShowConfirm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold"
                  >
                    ✗ NO
                  </Button>
                </div>
              </>
            ) : (
              <>
                {canBuy && !isOwned && (
                  <Button
                    onClick={handleBuy}
                    disabled={!canAfford}
                    className={`w-full font-bold text-lg py-2 ${
                      canAfford
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? '🛒 COMPRAR' : '❌ SIN DINERO'}
                  </Button>
                )}
                <Button
                  onClick={handlePass}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg py-2"
                >
                  ➡️ PASAR
                </Button>
              </>
            )}
          </div>

          {/* DINERO DISPONIBLE */}
          <div className={`${colors.bg} ${colors.text} px-6 py-3 text-center border-t-4 ${colors.border} text-sm font-semibold`}>
            Tu dinero: {playerMoney} pts
          </div>
        </div>
      </div>
    </div>
  );
}
