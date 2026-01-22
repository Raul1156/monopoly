import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Home } from "lucide-react";
import boardImage from "../Tablero2_1.png";
import { toast } from "sonner";
import type { Screen } from "../src/App";
import { PropertyCardModal, type Property } from "./PropertyCardModal";
import { PlayerPropertiesModal } from "./PlayerPropertiesModal";
import { apiService, type BoardSpace as ApiBoardSpace } from "../src/services/apiService";

interface MonopolyScreenProps {
  onNavigate?: (screen: Screen) => void;
}

interface PlayerProperty {
  propertyId: number;
  level?: number;
}

export function MonopolyScreen({ onNavigate }: MonopolyScreenProps = {}) {
  const [dice1, setDice1] = useState<number | null>(null);
  const [selectedPlayerForProperties, setSelectedPlayerForProperties] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [hasRolledDice, setHasRolledDice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [boardProperties, setBoardProperties] = useState<Property[]>([]);

  useEffect(() => {
    let mounted = true;

    const mapSpaceToProperty = (space: ApiBoardSpace): Property => {
      const tipo = (() => {
        switch (space.type) {
          case 'SALIDA':
            return 'inicio';
          case 'PROPIEDAD':
            return 'propiedad';
          case 'ESTACION':
            return 'estacion';
          case 'COMPANIA':
            return 'compañia';
          case 'COMUNIDAD':
            return 'hacienda';
          case 'SUERTE':
          case 'LOTERIA':
            return 'loteria';
          case 'CARCEL':
            return 'carcel';
          case 'IR_CARCEL':
            return 'irCarcel';
          case 'CASINO':
            return 'casino';
          case 'IMPUESTO':
            return 'impuesto';
          default:
            return 'propiedad';
        }
      })();

      const base: Property = {
        id: space.position,
        nombre: space.name,
        tipo,
      };

      if (tipo === 'propiedad' || tipo === 'estacion' || tipo === 'compañia') {
        return {
          ...base,
          precio: space.property?.price,
          alquiler: space.property?.rentBase,
        };
      }

      if (tipo === 'impuesto') {
        return { ...base, cantidad: space.actionAmount ?? undefined };
      }

      return base;
    };

    apiService.getBoardSpaces()
      .then((spaces) => {
        if (!mounted) return;
        const maxPos = spaces.reduce((max, s) => Math.max(max, s.position), 0);
        const arr = new Array<Property>(maxPos + 1);
        spaces.forEach((s) => {
          arr[s.position] = mapSpaceToProperty(s);
        });
        setBoardProperties(arr);
      })
      .catch((err) => {
        console.error('Error loading board spaces:', err);
        if (mounted) setError('No se pudo cargar el tablero desde la base de datos');
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Jugadores: todos empiezan en la casilla 0 
  const [playersInGame, setPlayersInGame] = useState([
    { id: 1, name: "Raúl", color: "bg-red-500", money: 1500, position: 0, properties: [] as PlayerProperty[] },
    { id: 2, name: "Dayron", color: "bg-blue-500", money: 1500, position: 0, properties: [] as PlayerProperty[] },
    { id: 3, name: "Anna", color: "bg-green-500", money: 1500, position: 0, properties: [] as PlayerProperty[] },
    { id: 4, name: "Marcelo", color: "bg-yellow-500", money: 1500, position: 0, properties: [] as PlayerProperty[] },
  ]);

  // Coordenadas del tablero 
  // Coordenadas reales del tablero
const boardPositions = [
  { left: "92.6%", top: "92.0%" },
  { left: "81.8%", top: "92.7%" },
  { left: "73.1%", top: "92.8%" },
  { left: "65.2%", top: "93.1%" },
  { left: "57.4%", top: "92.8%" },
  { left: "49.1%", top: "93.3%" },
  { left: "42.2%", top: "93.2%" },
  { left: "33.4%", top: "92.8%" },
  { left: "25.2%", top: "93.3%" },
  { left: "16.6%", top: "93.3%" },
  { left: "6.3%", top: "92.8%" },
  { left: "6.1%", top: "83.1%" },
  { left: "5.8%", top: "74.5%" },
  { left: "5.3%", top: "67.1%" },
  { left: "5.1%", top: "58.0%" },
  { left: "5.1%", top: "50.7%" },
  { left: "6.6%", top: "41.1%" },
  { left: "5.8%", top: "33.5%" },
  { left: "5.8%", top: "26.1%" },
  { left: "6.3%", top: "17.3%" },
  { left: "6.6%", top: "6.6%" },
  { left: "16.9%", top: "6.2%" },
  { left: "24.9%", top: "6.3%" },
  { left: "34.2%", top: "6.6%" },
  { left: "41.4%", top: "6.6%" },
  { left: "49.4%", top: "6.6%" },
  { left: "57.3%", top: "6.3%" },
  { left: "65.8%", top: "5.6%" },
  { left: "73.9%", top: "6.5%" },
  { left: "82.4%", top: "6.2%" },
  { left: "92.8%", top: "7.3%" },
  { left: "93.0%", top: "17.6%" },
  { left: "93.8%", top: "25.7%" },
  { left: "93.2%", top: "33.7%" },
  { left: "92.5%", top: "42.6%" },
  { left: "92.0%", top: "50.2%" },
  { left: "92.2%", top: "58.0%" },
  { left: "92.3%", top: "66.9%" },
  { left: "92.3%", top: "75.4%" },
  { left: "91.9%", top: "82.9%" },
];


  // Tirar dado
  const rollDice = async () => {
    if (hasRolledDice) {
      toast.warning("Ya lanzaste los dados en este turno");
      return;
    }

      try {
      let rawValue: number | null = null;

      try {
        // Intentar llamar al backend C# pero con timeout para evitar esperas largas
        const controller = new AbortController();
        const timeoutMs = 800; // tiempo máximo a esperar al backend
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch("http://localhost:5000/api/gameactions/roll-dice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Error al tirar los dados");

        const data = await res.json();
        console.log("Respuesta del backend:", data);

        // Interpretar la respuesta como un único dado. Preferimos `dice1` si existe,
        // si viene `total` lo usamos también (pero lo mapeamos a 1-6).
        rawValue = data.dice1 ?? data.total ?? null;
      } catch (backendError) {
        // Si falla el backend o se agota el timeout, usar lógica local (un solo dado)
        console.warn('Backend no disponible o tardó demasiado, usando dado local:', backendError);
        rawValue = Math.floor(Math.random() * 6) + 1;
        toast.info("🎲 Usando dado local (backend no disponible o lento)");
      }

      // Mapear cualquier valor numérico a un único dado en rango 1..6
      const singleDie = rawValue !== null ? ((rawValue - 1) % 6) + 1 : Math.floor(Math.random() * 6) + 1;
      const diceTotal = singleDie;

      setDice1(singleDie);
      setHasRolledDice(true);
      toast.success(`🎲 Sacaste ${singleDie}`);

      // Calcular nueva posición
      const currentPlayerData = playersInGame[currentPlayer - 1];
      if (!currentPlayerData) {
        console.error("No se encontró el jugador actual");
        return;
      }

      const newPosition = (currentPlayerData.position + diceTotal) % 40;
      const passedGo = newPosition < currentPlayerData.position;
      
      setPlayersInGame((prev) =>
        prev.map((player) =>
          player.id === currentPlayer
            ? {
                ...player,
                position: newPosition,
                // Si pasó por la salida (posición 0), suma 200
                money: passedGo ? player.money + 200 : player.money,
              }
            : player
        )
      );

      if (passedGo) {
        toast.success("🎉 ¡Pasaste por la salida! +200 pts");
      }

      // Mostrar propiedad después de que el jugador cae (reducido para mayor rapidez)
      setTimeout(() => {
        try {
          const property = boardProperties[newPosition];
          
          if (property) {
            // Verificar si la propiedad está comprada por otro jugador
            const propertyOwner = playersInGame.find(p => 
              p.properties.some(prop => prop.propertyId === newPosition)
            );

            if (propertyOwner && propertyOwner.id !== currentPlayer) {
              // Cobrar alquiler
              const rentAmount = property.alquiler || 0;
              
              setPlayersInGame((prev) =>
                prev.map((player) => {
                  if (player.id === currentPlayer) {
                    // Descontar alquiler al jugador actual
                    return { ...player, money: player.money - rentAmount };
                  } else if (player.id === propertyOwner.id) {
                    // Dar alquiler al propietario
                    return { ...player, money: player.money + rentAmount };
                  }
                  return player;
                })
              );

              toast.error(`💸 Pagaste ${rentAmount} pts de alquiler a ${propertyOwner.name}`);
              
              // Añadir dueño a la propiedad para mostrar en el modal
              property.dueno = propertyOwner.name;
            }

            setSelectedProperty(property);
            setShowPropertyModal(true);
          }
        } catch (innerError) {
          console.error('Error al procesar la propiedad:', innerError);
          toast.error("Error al procesar la casilla");
        }
      }, 300);
    } catch (error) {
      console.error('Error al tirar dados:', error);
      toast.error("⚠️ Error al tirar los dados");
      // Resetear el estado en caso de error
      setHasRolledDice(false);
    }
  };

  // Manejar compra de propiedad
  const handleBuyProperty = (propertyId: number) => {
    const currentPlayerData = playersInGame[currentPlayer - 1];
    const property = boardProperties[propertyId];

    if (!property || !property.precio) {
      toast.error("No se puede comprar esta casilla");
      return;
    }

    if (currentPlayerData.money < property.precio) {
      toast.error("No tienes dinero suficiente");
      return;
    }

    // Actualizar dinero y propiedades del jugador
    setPlayersInGame((prev) =>
      prev.map((player) =>
        player.id === currentPlayer
          ? {
              ...player,
              money: player.money - (property.precio || 0),
              properties: [...player.properties, { propertyId, level: 0 }]
            }
          : player
      )
    );

    // Marcar la propiedad como comprada
    boardProperties[propertyId].dueno = currentPlayerData.name;

    toast.success(`✓ ¡Compraste ${property.nombre}!`);
  };

  const handlePassProperty = () => {
    toast.info("Decidiste no comprar esta propiedad");
  };

  // Cambiar turno al cerrar modal
  const handleClosePropertyModal = () => {
    setShowPropertyModal(false);
    // Cambiar turno después de que se cierre el modal
    setTimeout(() => {
      setCurrentPlayer((prev) => (prev % playersInGame.length) + 1);
      setDice1(null);
      setHasRolledDice(false);
    }, 150);
  };

  // Icono del dado
  const getDiceIcon = (value: number) => {
    const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const DiceIcon = diceIcons[value - 1];
    return <DiceIcon className="w-8 h-8 text-amber-400" />;
  };

  // Manejo de errores
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 p-4 flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-red-500/30 p-6 max-w-md">
          <h2 className="text-red-400 font-bold text-xl mb-4">Error</h2>
          <p className="text-white mb-4">{error}</p>
          <Button onClick={() => { setError(null); window.location.reload(); }} className="bg-red-600 hover:bg-red-700">
            Recargar página
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 p-2 flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-500/30 p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-white font-bold">Monopoly Casino y Tapas</h2>
              <p className="text-amber-400 text-sm">
                Turno de {playersInGame[currentPlayer - 1]?.name}
              </p>
            </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Ronda 1</Badge>
        </div>
      </div>

      {/* Tablero */}
      <div className="flex-1 flex items-center justify-center px-2">
        <div className="relative w-full max-w-md">
          <img
            src={boardImage}
            alt="Tablero Casino y Tapas"
            className="w-full h-auto rounded-lg shadow-2xl border-4 border-amber-500/40"
            onError={(e) => {
              console.error("Error al cargar la imagen del tablero");
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              toast.error("Error al cargar la imagen del tablero");
            }}
          />

          {/* Distintivos de propiedades compradas */}
          {playersInGame.map((player) =>
            player.properties.map((prop) => {
              const pos = boardPositions[prop.propertyId] || boardPositions[0];
              const offset = player.properties.indexOf(prop);
              const offsetX = (offset % 2) * 15 - 7;
              const offsetY = Math.floor(offset / 2) * 15 - 7;

              return (
                <div
                  key={`owned-${player.id}-${prop.propertyId}`}
                  className="absolute"
                  style={{
                    ...pos,
                    transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`,
                  }}
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${player.color}`}
                    title={`${boardProperties[prop.propertyId]?.nombre} (${player.name})`}
                  />
                </div>
              );
            })
          )}

          {playersInGame.map((player, idx) => {
            const pos = boardPositions[player.position] || boardPositions[0];
            const offsetX = (idx % 2) * 10 - 5;
            const offsetY = Math.floor(idx / 2) * 10 - 5;

            return (
              <div
                key={player.id}
                className="absolute transition-all duration-300"
                style={{
                  ...pos,
                  transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`,
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full ${player.color} border border-white shadow-md flex items-center justify-center hover:cursor-pointer hover:scale-125 transition-transform`}
                  title={player.name}
                  onClick={() => onNavigate?.("inventory")}
                >
                  <span className="text-white text-[9px] font-bold">{player.name.charAt(0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel inferior */}
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-500/30 p-3 space-y-3">
        {/* Jugadores */}
        <div className="grid grid-cols-4 gap-2">
          {playersInGame.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPlayerForProperties(p.id)}
              className={`p-2 rounded-lg border text-center cursor-pointer transition-all hover:scale-105 ${
                currentPlayer === p.id
                  ? "border-amber-500 bg-amber-500/20"
                  : "border-gray-600/30 bg-black/20 hover:border-amber-500/50"
              }`}
              title={`Click para ver propiedades de ${p.name}`}
            >
              <div className={`w-4 h-4 rounded-full ${p.color} mx-auto mb-1`} />
              <p className="text-white text-xs font-medium">{p.name}</p>
              <p className="text-amber-400 text-xs">{p.money} pts</p>
              <p className="text-gray-400 text-[10px] mt-1">🏠 {p.properties.length}</p>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={rollDice}
              disabled={hasRolledDice}
              className={`bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white ${
                hasRolledDice ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Dice1 className="w-4 h-4 mr-2" />
              Lanzar Dados
            </Button>
            {dice1 && getDiceIcon(dice1)}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-600/30 text-amber-400 hover:bg-amber-600/10"
              onClick={() => onNavigate?.("menu")}
            >
              <Home className="w-4 h-4 mr-1" />
              Inicio
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de propiedad */}
      <PropertyCardModal
        isOpen={showPropertyModal}
        property={selectedProperty}
        playerMoney={playersInGame[currentPlayer - 1]?.money || 0}
        onClose={handleClosePropertyModal}
        onBuy={handleBuyProperty}
        onPass={handlePassProperty}
      />

      {/* Modal de propiedades del jugador */}
      {selectedPlayerForProperties && (
        <PlayerPropertiesModal
          isOpen={true}
          playerName={playersInGame.find(p => p.id === selectedPlayerForProperties)?.name || ""}
          playerColor={playersInGame.find(p => p.id === selectedPlayerForProperties)?.color || ""}
          properties={playersInGame.find(p => p.id === selectedPlayerForProperties)?.properties || []}
          boardProperties={boardProperties}
          onClose={() => setSelectedPlayerForProperties(null)}
        />
      )}
    </div>
  );
}
