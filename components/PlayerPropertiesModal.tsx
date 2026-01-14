import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Home, X, DollarSign } from 'lucide-react';

interface PlayerProperty {
  propertyId: number;
  level?: number;
}

interface Property {
  id: number;
  nombre: string;
  tipo: string;
  precio?: number;
  alquiler?: number;
}

interface PlayerPropertiesModalProps {
  isOpen: boolean;
  playerName: string;
  playerColor: string;
  properties: PlayerProperty[];
  boardProperties: Property[];
  onClose: () => void;
}

export function PlayerPropertiesModal({
  isOpen,
  playerName,
  playerColor,
  properties,
  boardProperties,
  onClose
}: PlayerPropertiesModalProps) {
  if (!isOpen) return null;

  const getPropertyDetails = (propertyId: number) => {
    return boardProperties[propertyId];
  };

  const totalValue = properties.reduce((sum, prop) => {
    const detail = getPropertyDetails(prop.propertyId);
    return sum + (detail?.precio || 0);
  }, 0);

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    'bg-red-500': { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' },
    'bg-blue-500': { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' },
    'bg-green-500': { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
    'bg-yellow-500': { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700' },
  };

  const colorClass = colorMap[playerColor] || colorMap['bg-red-500'];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />
      
      {/* MODAL DE PROPIEDADES */}
      <div className="relative z-10 w-96 pointer-events-auto animate-in fade-in zoom-in-95 duration-300 max-h-96 overflow-y-auto">
        <div className={`${colorClass.bg} border-4 ${colorClass.border} rounded-2xl overflow-hidden shadow-2xl`}>
          
          {/* ENCABEZADO */}
          <div className={`${colorClass.bg} ${colorClass.text} p-6 text-center border-b-4 ${colorClass.border} flex items-center justify-between`}>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">🏠 Propiedades</h2>
              <p className={`text-sm mt-1 ${colorClass.text}`}>{playerName}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* CONTENIDO */}
          <div className="bg-white p-6 space-y-4">
            
            {/* ESTADÍSTICAS */}
            {properties.length > 0 ? (
              <div className={`${colorClass.bg} border-2 ${colorClass.border} rounded-lg p-4`}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Total</p>
                    <p className={`text-2xl font-bold ${colorClass.text}`}>{properties.length}</p>
                  </div>
                  <div className="border-l-2 border-r-2 border-gray-300">
                    <p className="text-xs text-gray-600 font-semibold">Valor</p>
                    <p className={`text-2xl font-bold ${colorClass.text}`}>{totalValue} pts</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Promedio</p>
                    <p className={`text-2xl font-bold ${colorClass.text}`}>{properties.length > 0 ? Math.floor(totalValue / properties.length) : 0} pts</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* LISTA DE PROPIEDADES */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {properties.length > 0 ? (
                properties.map((prop, idx) => {
                  const detail = getPropertyDetails(prop.propertyId);
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Home className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm">{detail?.nombre}</p>
                          <p className="text-xs text-gray-600 capitalize">{detail?.tipo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">{detail?.precio} pts</p>
                        {prop.level !== undefined && prop.level > 0 && (
                          <Badge className="mt-1 bg-amber-600/30 text-amber-700 border-amber-500/30 text-xs">
                            Level {prop.level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold">Sin propiedades</p>
                  <p className="text-gray-500 text-sm">Aún no ha comprado ninguna casilla</p>
                </div>
              )}
            </div>

          </div>

          {/* BOTÓN DE CIERRE */}
          <div className="bg-gray-100 border-t-4 border-gray-300 px-6 py-3">
            <Button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold"
            >
              ← Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
