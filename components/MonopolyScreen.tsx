import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Home, LogOut } from "lucide-react";
import boardImage from "../Tablero2_1.png";
import { toast } from "sonner";
import type { Screen } from "../src/App";
import { PropertyCardModal, type Property } from "./PropertyCardModal";
import { PlayerPropertiesModal } from "./PlayerPropertiesModal";
import { apiService, type BoardSpace as ApiBoardSpace } from "../src/services/apiService";
import { CasinoRouletteModal } from "./CasinoRouletteModal";
import { BlackjackModal } from "./BlackjackModal";
import { TramCardModal } from "./TramCardModal";
import { TradeModal, IncomingTradeOffer } from "./TradeModal";
import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";
import { getHubUrl, getApiBaseUrl } from "../src/services/urlResolver";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PropertyInfoCard } from "./PropertyInfoCard";
import { PropertyInfoModal } from "./PropertyInfoModal";

import type { User } from "../src/services/apiService";

interface MonopolyScreenProps {
  onNavigate?: (screen: Screen) => void;
  onUserUpdate?: (user: User) => void;
  currentUser: User;
  gameId: number;
}

interface PlayerProperty {
  propertyId: number;
  propertyDbId?: number;
  level?: number;
}

interface LocalPlayer {
  id: number;
  name: string;
  color: string;
  money: number;
  position: number;
  properties: PlayerProperty[];
  isInJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  eliminated: boolean;
}

interface CasillaUpgradeMarkerProps {
  position: number;
  level: number;
  title?: string;
}

function CasillaUpgradeMarker({ position, level, title }: CasillaUpgradeMarkerProps) {
  const [localLevel, setLocalLevel] = useState(level);

  useEffect(() => {
    setLocalLevel(level);
  }, [level]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ position: number; level: number }>).detail;
      if (!detail || detail.position !== position) return;
      setLocalLevel(detail.level);
    };

    window.addEventListener("PropertyUpgradeChanged", handler as EventListener);
    return () => {
      window.removeEventListener("PropertyUpgradeChanged", handler as EventListener);
    };
  }, [position]);

  if (localLevel <= 0) return null;

  if (localLevel >= 5) {
    return (
      <div
        className="w-4 h-3 bg-red-600 border border-white rounded-sm shadow"
        title={title ? `${title} - Hotel` : "Hotel"}
      />
    );
  }

  const houses = Array.from({ length: Math.min(localLevel, 4) });
  return (
    <div className="flex space-x-0.5">
      {houses.map((_, idx) => (
        <div
          key={idx}
          className="w-2 h-2 bg-green-600 border border-white rounded-sm shadow"
          title={title ? `${title} - Casa ${idx + 1}` : `Casa ${idx + 1}`}
        />
      ))}
    </div>
  );
}

export function MonopolyScreen({ onNavigate, onUserUpdate, currentUser, gameId }: MonopolyScreenProps) {
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [dice1, setDice1] = useState<number | null>(null);
  const [selectedPlayerForProperties, setSelectedPlayerForProperties] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const connectionRef = useRef<HubConnection | null>(null);

  // Turn enforcement: only allow actions when it's your turn
  const isMyTurn = currentUser.id === currentPlayer;
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedInfoPropertyId, setSelectedInfoPropertyId] = useState<number | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [hasRolledDice, setHasRolledDice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCasinoModal, setShowCasinoModal] = useState(false);
  const [casinoName, setCasinoName] = useState<string | null>(null);
  const [showBlackjackModal, setShowBlackjackModal] = useState(false);
  const [blackjackName, setBlackjackName] = useState<string | null>(null);
  /*tram*/
  const [showTramModal, setShowTramModal] = useState(false);
  const [tramStationName, setTramStationName] = useState<string>("Estacion");
  const [tramNextPosition, setTramNextPosition] = useState<number | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  /*tram*/

  // Dev mode: elegir número del dado para pruebas
  const [devMode, setDevMode] = useState(false);
  const [debugDiceValue, setDebugDiceValue] = useState<number>(1);

  const [boardProperties, setBoardProperties] = useState<Property[]>([]);

  // Game over state
  const [gameOver, setGameOver] = useState(false);
  const [gameWinner, setGameWinner] = useState<{ id: number; name: string; reason: string } | null>(null);

  const gameOverRef = useRef(false);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showEliminatedModal, setShowEliminatedModal] = useState(false);
  const [eliminatedPlayerName, setEliminatedPlayerName] = useState("");

  const handleReturnToMenu = async () => {
    try {
      const updatedUser = await apiService.getUser(currentUser.id);
      if (onUserUpdate) onUserUpdate(updatedUser);
    } catch (err) {
      console.warn("Error updating user before returning to menu", err);
    }
    onNavigate?.("menu");
  };

  // Incoming trade offer state
  const [incomingOffer, setIncomingOffer] = useState<{
    fromPlayerId: number;
    fromPlayerName: string;
    propertyName: string;
    propertyId: number;
    cashOffer: number;
  } | null>(null);

  const propertyPositionByDbId = useMemo(() => {
    const map = new Map<number, number>();
    boardProperties.forEach((prop, idx) => {
      if (prop?.propertyDbId) {
        map.set(prop.propertyDbId, idx);
      }
    });
    return map;
  }, [boardProperties]);

  // Ref for SignalR handlers to avoid stale closures and unnecessary reconnections
  const propertyPositionByDbIdRef = useRef(propertyPositionByDbId);
  useEffect(() => { propertyPositionByDbIdRef.current = propertyPositionByDbId; }, [propertyPositionByDbId]);

  useEffect(() => {
    let mounted = true;

    const mapSpaceToProperty = (space: ApiBoardSpace): Property => {
      const tipo = (() => {
        const typeUpper = space.type.toUpperCase();
        switch (typeUpper) {
          case "SALIDA":
            return "inicio";
          case "PROPIEDAD":
            return "propiedad";
          case "ESTACION":
            return "estacion";
          case "COMPANIA":
          case "COMPAÑIA":
            return "compañia";
          case "COMUNIDAD":
            return "comunidad";
          case "SUERTE":
          case "LOTERIA":
            return "suerte";
          case "CARCEL":
            return "carcel";
          case "IR_CARCEL":
            return "irCarcel";
          case "CASINO":
            return "casino";
          case "IMPUESTO":
            return "impuesto";
          default:
            return "propiedad";
        }
      })();

      const base: Property = {
        id: space.position,
        propertyDbId: space.property?.id,
        nombre: space.name,
        tipo,
      };

      if (tipo === "propiedad" || tipo === "estacion" || tipo === "compañia") {
        return {
          ...base,
          precio: space.property?.price,
          alquiler: space.property?.rentBase,
          alquilerNivel1: space.property?.rentLevel1,
          alquilerNivel2: space.property?.rentLevel2,
          alquilerNivel3: space.property?.rentLevel3,
          alquilerNivel4: space.property?.rentLevel4,
          alquilerHotel: space.property?.rentHotel,
          precioMejora: space.property?.upgradePrice,
          colorGrupo: space.property?.color,
        };
      }

      if (tipo === "impuesto") {
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
        console.error("Error loading board spaces:", err);
        if (mounted) setError("No se pudo cargar el tablero desde la base de datos");
      });

    apiService.getPropertyUpgrades(gameId)
      .then((upgrades) => {
        if (!mounted) return;
        setPlayersInGame((prev) =>
          prev.map((player) => {
            const owned = upgrades.filter((u) => u.ownerId === player.id);
            if (owned.length === 0) return player;

            const updatedProps = owned.map((u) => {
              const position = propertyPositionByDbId.get(u.propertyId);
              if (position === undefined) return null;
              return { propertyId: position, propertyDbId: u.propertyId, level: u.level } as PlayerProperty;
            }).filter((v): v is PlayerProperty => v !== null);

            return {
              ...player,
              properties: updatedProps,
            };
          })
        );
      })
      .catch((err) => {
        console.warn("No se pudieron cargar las mejoras:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const hubUrl = getHubUrl();
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;
    let active = true;

    const start = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinGame", gameId, currentUser.id, currentUser.username);
        console.log("[SignalR] Connected to game", gameId);
      } catch (err) {
        console.warn("SignalR connection failed:", err);
      }
    };

    // --- Listen for remote events ---

    connection.on("DiceRolled", (payload: { userId: number; diceValue: number; newPosition: number; passedGo: boolean; moneyAfter: number }) => {
      if (!active) return;
      console.log("[SignalR] Remote DiceRolled:", payload);
      setPlayersInGame((prev) =>
        prev.map((player) =>
          player.id === payload.userId
            ? { ...player, position: payload.newPosition, money: payload.moneyAfter }
            : player
        )
      );
    });

    connection.on("TurnChanged", (payload: { nextPlayerId: number }) => {
      if (!active) return;
      console.log("[SignalR] Remote TurnChanged:", payload);
      setCurrentPlayer(payload.nextPlayerId);
      setDice1(null);
      setHasRolledDice(false);
    });

    connection.on("PropertyBought", (payload: { userId: number; propertyPosition: number; moneyLeft: number; propertyDbId: number }) => {
      if (!active) return;
      console.log("[SignalR] Remote PropertyBought:", payload);
      setPlayersInGame((prev) =>
        prev.map((player) => {
          if (player.id !== payload.userId) return player;
          const alreadyOwns = player.properties.some((p) => p.propertyId === payload.propertyPosition);
          return {
            ...player,
            money: payload.moneyLeft,
            properties: alreadyOwns
              ? player.properties
              : [...player.properties, { propertyId: payload.propertyPosition, propertyDbId: payload.propertyDbId, level: 0 }],
          };
        })
      );
      setBoardProperties((prev) => {
        const next = [...prev];
        const prop = next[payload.propertyPosition];
        if (prop) {
          const ownerName = "Otro jugador";
          next[payload.propertyPosition] = { ...prop, dueno: ownerName };
        }
        return next;
      });
    });

    connection.on("PlayerJailed", (payload: { userId: number; jailTurns: number }) => {
      if (!active) return;
      setPlayersInGame((prev) =>
        prev.map((player) =>
          player.id === payload.userId
            ? { ...player, position: 10, isInJail: true, jailTurns: payload.jailTurns }
            : player
        )
      );
    });

    connection.on("TaxPaid", (payload: { userId: number; moneyAfter: number }) => {
      if (!active) return;
      setPlayersInGame((prev) =>
        prev.map((player) =>
          player.id === payload.userId
            ? { ...player, money: payload.moneyAfter }
            : player
        )
      );
    });

    connection.on("CardEffectApplied", (playerMoneyUpdates: { userId: number; money: number }[]) => {
      if (!active) return;
      setPlayersInGame((prev) =>
        prev.map((player) => {
          const update = playerMoneyUpdates.find((u) => u.userId === player.id);
          return update ? { ...player, money: update.money } : player;
        })
      );
    });

    connection.on("PropertyUpgradeChanged", (payload: { propertyId: number; level: number; ownerId: number; money?: number }) => {
      if (!active) return;
      const position = propertyPositionByDbIdRef.current.get(payload.propertyId);
      if (position === undefined) return;

      setPlayersInGame((prev) =>
        prev.map((player) => {
          if (player.id !== payload.ownerId) return player;

          const existing = player.properties.find((p) => p.propertyId === position);
          const updatedProperties = existing
            ? player.properties.map((p) =>
                p.propertyId === position ? { ...p, level: payload.level } : p
              )
            : [...player.properties, { propertyId: position, propertyDbId: payload.propertyId, level: payload.level }];

          return {
            ...player,
            money: payload.money ?? player.money,
            properties: updatedProperties,
          };
        })
      );
    });

    connection.on("RentPaid", (payload: { fromUserId: number; toUserId: number; amount: number; fromMoneyAfter: number; toMoneyAfter: number }) => {
      if (!active) return;
      console.log("[SignalR] Remote RentPaid:", payload);
      setPlayersInGame((prev) =>
        prev.map((player) => {
          if (player.id === payload.fromUserId) return { ...player, money: payload.fromMoneyAfter };
          if (player.id === payload.toUserId) return { ...player, money: payload.toMoneyAfter };
          return player;
        })
      );
    });

    connection.on("CasinoResult", (payload: { userId: number; moneyAfter: number }) => {
      if (!active) return;
      console.log("[SignalR] Remote CasinoResult:", payload);
      setPlayersInGame((prev) =>
        prev.map((player) =>
          player.id === payload.userId ? { ...player, money: payload.moneyAfter } : player
        )
      );
    });

    connection.on("TradeCompleted", (payload: { fromUserId: number; toUserId: number; fromMoneyAfter: number; toMoneyAfter: number; fromProperties: number[]; toProperties: number[]; fromPropertyDbIds: number[]; toPropertyDbIds: number[] }) => {
      if (!active) return;
      console.log("[SignalR] Remote TradeCompleted:", payload);
      const tradedIds = new Set<number>([...payload.fromProperties, ...payload.toProperties]);
      setPlayersInGame((prev) =>
        prev.map((player) => {
          if (player.id === payload.fromUserId) {
            const remaining = player.properties.filter((pp) => !tradedIds.has(pp.propertyId));
            const incoming = payload.toProperties.map((pid, i) => ({ propertyId: pid, propertyDbId: payload.toPropertyDbIds?.[i], level: 0 }));
            return { ...player, money: payload.fromMoneyAfter, properties: [...remaining, ...incoming] };
          }
          if (player.id === payload.toUserId) {
            const remaining = player.properties.filter((pp) => !tradedIds.has(pp.propertyId));
            const incoming = payload.fromProperties.map((pid, i) => ({ propertyId: pid, propertyDbId: payload.fromPropertyDbIds?.[i], level: 0 }));
            return { ...player, money: payload.toMoneyAfter, properties: [...remaining, ...incoming] };
          }
          return player;
        })
      );
      setBoardProperties((prev) => {
        const next = [...prev];
        const fromPlayer = playersRef.current.find(p => p.id === payload.fromUserId);
        const toPlayer = playersRef.current.find(p => p.id === payload.toUserId);
        payload.fromProperties.forEach((id: number) => {
          if (next[id] && toPlayer) next[id] = { ...next[id], dueno: toPlayer.name, nivel: 0 };
        });
        payload.toProperties.forEach((id: number) => {
          if (next[id] && fromPlayer) next[id] = { ...next[id], dueno: fromPlayer.name, nivel: 0 };
        });
        return next;
      });
      toast.success("🤝 Un trato ha sido completado");
    });

    connection.on("TradeOfferReceived", (payload: any) => {
      if (!active) return;
      if (payload.offer.toPlayerId === currentUser.id) {
        setIncomingOffer({
          ...payload.offer,
          propertiesFrom: payload.offer.propertiesFrom,
          propertiesTo: payload.offer.propertiesTo,
          cashTo: payload.offer.cashTo
        });
      }
    });

    connection.on("TradeOfferResponse", (payload: any) => {
      if (!active) return;
      if (payload.fromUserId === currentUser.id && !payload.accepted) {
        toast.error("❌ Tu oferta de trato fue rechazada");
      }
    });

    connection.on("PlayerLeft", (payload: { userId: number; username: string; reason: string }) => {
      if (!active) return;
      console.log("[SignalR] PlayerLeft:", payload);
      const reasonText = payload.reason === "abandoned" ? "ha abandonado" : "se ha desconectado de";
      toast.warning(`🚪 ${payload.username} ${reasonText} la partida`);

      // Mark player as eliminated
      setPlayersInGame((prev) =>
        prev.map((player) =>
          player.id === payload.userId ? { ...player, eliminated: true } : player
        )
      );

      // If it was the leaving player's turn, advance to next
      setPlayersInGame((prev) => {
        const activePlayers = prev.filter((p) => !p.eliminated && p.id !== payload.userId).map((p) => p.id);
        if (activePlayers.length > 0) {
          // Use a timeout to let state settle
          setTimeout(() => {
            setCurrentPlayer((currentTurn) => {
              if (currentTurn === payload.userId) {
                const next = activePlayers[0];
                setDice1(null);
                setHasRolledDice(false);
                return next;
              }
              return currentTurn;
            });
          }, 100);
        }
        return prev;
      });
    });

    connection.on("PlayerEliminated", (payload: { userId: number; username: string }) => {
      if (!active) return;
      console.log("[SignalR] PlayerEliminated:", payload);
      setPlayersInGame((prev) =>
        prev.map((player) =>
          player.id === payload.userId ? { ...player, eliminated: true } : player
        )
      );
      setEliminatedPlayerName(payload.username);
      setShowEliminatedModal(true);
    });

    connection.on("GameWonByForfeit", (payload: { winnerId: number; winnerName: string }) => {
      if (!active) return;
      if (gameOverRef.current) return;

      const amIEliminated = playersRef.current.find(p => p.id === currentUser.id)?.eliminated;
      if (amIEliminated) return;

      console.log("[SignalR] GameWonByForfeit:", payload);
      setGameOver(true);
      setGameWinner({ id: payload.winnerId, name: payload.winnerName, reason: "incomparecencia" });
      
      if (currentUser.id === payload.winnerId) {
        apiService.endGame(gameId, payload.winnerId).catch(console.error);
      }
    });

    start();

    return () => {
      active = false;
      connectionRef.current = null;
      connection.stop();
    };
  }, [gameId]);

  const [playersInGame, setPlayersInGame] = useState<LocalPlayer[]>([]);

  // Ref to avoid stale closures in endTurn
  const playersRef = useRef<LocalPlayer[]>(playersInGame);
  useEffect(() => { playersRef.current = playersInGame; }, [playersInGame]);

  useEffect(() => {
    let isMounted = true;
    
    const loadGame = async () => {
      try {
        const game = await apiService.getGame(gameId);
        if (!isMounted) return;

        const mappedPlayers: LocalPlayer[] = game.players.map(p => ({
          id: p.userId,
          name: p.username || `Jugador ${p.userId}`,
          money: p.money,
          position: p.position,
          color: p.token || "bg-gray-500",
          properties: [], // Las propiedades se llenan luego con getPropertyUpgrades
          isInJail: p.isInJail,
          jailTurns: p.jailTurns ?? 0,
          getOutOfJailCards: p.getOutOfJailCards ?? 0,
          eliminated: false
        }));

        setPlayersInGame(mappedPlayers);
        
        const activePlayer = game.players.find(p => p.turnOrder === game.currentTurn);
        if (activePlayer) {
          setCurrentPlayer(activePlayer.userId);
        } else if (mappedPlayers.length > 0) {
          setCurrentPlayer(mappedPlayers[0].id);
        }

        setIsLoadingGame(false);
      } catch (err) {
        console.error("Error al cargar la partida:", err);
        setError("Error al cargar la partida desde el servidor.");
        setIsLoadingGame(false);
      }
    };

    loadGame();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  // Coordenadas del tablero
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

  /*tram*/
  const getStationPositions = () =>
    boardProperties
      .map((p, idx) => (p?.tipo === "estacion" ? idx : null))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

  const getOwnedStationPositions = (player: { properties: PlayerProperty[] }) => {
    const stationPositions = getStationPositions();
    return player.properties
      .map((p) => p.propertyId)
      .filter((id) => stationPositions.includes(id))
      .sort((a, b) => a - b);
  };

  const getNextOwnedConsecutiveStation = (fromPosition: number, ownedStationPositions: number[]) => {
    const stationPositions = getStationPositions();
    const fromIndex = stationPositions.indexOf(fromPosition);
    if (fromIndex === -1) return null;

    const nextStation = stationPositions[fromIndex + 1];
    if (nextStation === undefined) return null;

    // Debe ser consecutiva (siguiente tram del tablero) y estar comprada
    if (ownedStationPositions.includes(nextStation)) return nextStation;

    return null;
  };
  /*tram*/

  const getPropertyLevelForPlayer = (player: { properties: PlayerProperty[] }, position: number) => {
    return player.properties.find((p) => p.propertyId === position)?.level ?? 0;
  };

  const getGroupPositions = (colorGroup?: string) => {
    if (!colorGroup) return [];
    return boardProperties
      .map((p, idx) => (p?.tipo === "propiedad" && p.colorGrupo === colorGroup ? idx : null))
      .filter((v): v is number => v !== null);
  };

  const ownsFullGroup = (player: { properties: PlayerProperty[] }, colorGroup?: string) => {
    const groupPositions = getGroupPositions(colorGroup);
    if (groupPositions.length === 0) return false;
    return groupPositions.every((pos) => player.properties.some((p) => p.propertyId === pos));
  };

  const getBuildEligibility = (player: { properties: PlayerProperty[]; money: number }, property: Property | null) => {
    if (!property || property.tipo !== "propiedad") {
      return { canBuild: false, reason: "Solo se pueden mejorar propiedades" };
    }

    const ownsProperty = player.properties.some((p) => p.propertyId === property.id);
    if (!ownsProperty) {
      return { canBuild: false, reason: "No eres el propietario" };
    }

    if (!ownsFullGroup(player, property.colorGrupo)) {
      return { canBuild: false, reason: "Necesitas el grupo completo" };
    }

    const currentLevel = getPropertyLevelForPlayer(player, property.id);
    if (currentLevel >= 5) {
      return { canBuild: false, reason: "Ya tiene hotel" };
    }

    const cost = property.precioMejora ?? 0;
    if (player.money < cost || cost <= 0) {
      return { canBuild: false, reason: "Dinero insuficiente" };
    }

    const groupPositions = getGroupPositions(property.colorGrupo);
    const groupLevels = groupPositions.map((pos) => getPropertyLevelForPlayer(player, pos));
    const newLevel = currentLevel + 1;

    if (newLevel === 5 && groupLevels.some((lvl) => lvl < 4)) {
      return { canBuild: false, reason: "Todas deben tener 4 casas" };
    }

    const adjustedLevels = groupLevels.map((lvl, idx) =>
      groupPositions[idx] === property.id ? newLevel : lvl
    );

    const maxLevel = Math.max(...adjustedLevels);
    const minLevel = Math.min(...adjustedLevels);
    if (maxLevel - minLevel > 1) {
      return { canBuild: false, reason: "Construye uniforme" };
    }

    return { canBuild: true, reason: "" };
  };

  const getBuildStateForProperty = (player: { properties: PlayerProperty[]; money: number }, propertyId: number) => {
    const property = boardProperties[propertyId];
    if (!property) return { canBuild: false, reason: "Propiedad no encontrada", cost: 0 };
    const eligibility = getBuildEligibility(player, property);
    return {
      canBuild: eligibility.canBuild,
      reason: eligibility.reason,
      cost: property.precioMejora ?? 0,
    };
  };

  const getRentForProperty = (property: Property, level: number) => {
    if (level <= 0) return property.alquiler || 0;
    if (level === 1) return property.alquilerNivel1 ?? property.alquiler ?? 0;
    if (level === 2) return property.alquilerNivel2 ?? property.alquiler ?? 0;
    if (level === 3) return property.alquilerNivel3 ?? property.alquiler ?? 0;
    if (level === 4) return property.alquilerNivel4 ?? property.alquiler ?? 0;
    return property.alquilerHotel ?? property.alquiler ?? 0;
  };

  const getOwnerInfoForPosition = (position: number) => {
    const owner = playersInGame.find((p) => p.properties.some((prop) => prop.propertyId === position));
    const level = owner ? getPropertyLevelForPlayer(owner, position) : 0;
    return { ownerName: owner?.name, level };
  };

  // Tirar dado
  const rollDice = async () => {
    if (!isMyTurn) {
      toast.warning("No es tu turno");
      return;
    }
    if (hasRolledDice) {
      toast.warning("Ya lanzaste los dados en este turno");
      return;
    }

    const currentPlayerData = playersInGame.find(p => p.id === currentPlayer);
    if (!currentPlayerData) return;

    // prision
    if (currentPlayerData.isInJail) {
      setPlayersInGame((prev) =>
        prev.map((player) => {
          if (player.id === currentPlayer) {
            const newTurns = player.jailTurns - 1;
            const stillInJail = newTurns > 0;
            return {
              ...player,
              jailTurns: Math.max(0, newTurns),
              isInJail: stillInJail,
            };
          }
          return player;
        })
      );

      const remaining = currentPlayerData.jailTurns - 1;
      if (remaining > 0) {
        toast.error(`⛓️ Sigues en la cárcel. Turnos restantes: ${remaining}`);
      } else {
        toast.info("🎉 ¡Has cumplido tu condena! Podrás moverte en el siguiente turno.");
      }

      endTurn();
      return;
    }

    try {
      let rawValue: number | null = null;

      if (devMode) {
        // Modo dev: usar el valor elegido manualmente
        rawValue = debugDiceValue;
        toast.info(`🛠️ DEV: Dado forzado a ${debugDiceValue}`);
      } else {
        try {
          // Intentar llamar al backend C# pero con timeout para evitar esperas largas
          const controller = new AbortController();
          const timeoutMs = 800;
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          const res = await fetch(`${getApiBaseUrl()}/gameactions/roll-dice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) throw new Error("Error al tirar los dados");

          const data = await res.json();
          console.log("Respuesta del backend:", data);

          rawValue = data.dice1 ?? data.total ?? null;
        } catch (backendError) {
          console.warn("Backend no disponible o tardó demasiado, usando dado local:", backendError);
          rawValue = Math.floor(Math.random() * 6) + 1;
          toast.info("🎲 Usando dado local (backend no disponible o lento)");
        }
      }

      const singleDie = rawValue !== null ? ((rawValue - 1) % 6) + 1 : Math.floor(Math.random() * 6) + 1;
      const diceTotal = singleDie;

      setDice1(singleDie);
      setHasRolledDice(true);
      toast.success(`🎲 Sacaste ${singleDie}`);

      const currentPlayerData = playersInGame.find(p => p.id === currentPlayer);
      if (!currentPlayerData) {
        console.error("No se encontró el jugador actual");
        return;
      }

      let newPosition = (currentPlayerData.position + diceTotal) % 40;
      let passedGo = newPosition < currentPlayerData.position;
      let sentToJail = false;

      // Check Go To Jail (Cell 30)
      if (newPosition === 30) {
        sentToJail = true;
        passedGo = false;
      }

      // Step 1: Move to destination
      setPlayersInGame((prev) =>
        prev.map((player) =>
          player.id === currentPlayer
            ? {
                ...player,
                position: newPosition,
                money: passedGo ? player.money + 200 : player.money,
              }
            : player
        )
      );

      // Broadcast dice roll to other players
      const moneyAfterMove = currentPlayerData.money + (passedGo ? 200 : 0);
      try {
        await connectionRef.current?.invoke("BroadcastDiceRoll", gameId, currentPlayer, singleDie, newPosition, passedGo, moneyAfterMove);
      } catch (e) { console.warn("Failed to broadcast dice roll:", e); }

      if (sentToJail) {
        toast.error("👮 ¡Has caído en la casilla de ir a la cárcel!");

        setTimeout(() => {
          setPlayersInGame((prev) =>
            prev.map((player) =>
              player.id === currentPlayer
                ? {
                    ...player,
                    position: 10,
                    isInJail: true,
                    jailTurns: 3,
                  }
                : player
            )
          );
          toast.error("🔒 Te vas a la cárcel. 3 turnos sin jugar.");
          // Broadcast jail to other players
          connectionRef.current?.invoke("BroadcastPlayerJailed", gameId, currentPlayer, 3).catch(() => {});
          endTurn();
        }, 1500);

        return;
      }

      // Check Tax (Cell 4)
      if (newPosition === 4) {
        const moneyAfterTax = Math.max(0, moneyAfterMove - 200);
        setPlayersInGame((prev) =>
          prev.map((player) =>
            player.id === currentPlayer
              ? {
                  ...player,
                  money: moneyAfterTax,
                }
              : player
          )
        );
        toast.info("💸 Impuestos: Has pagado 200");
        // Broadcast tax to other players
        connectionRef.current?.invoke("BroadcastTaxPaid", gameId, currentPlayer, moneyAfterTax).catch(() => {});
        if (moneyAfterTax <= 0) {
          connectionRef.current?.invoke("BroadcastPlayerEliminated", gameId, currentPlayer, currentPlayerData.name).catch(() => {});
          const activeAfter = playersRef.current.filter(p => !p.eliminated && p.id !== currentPlayer);
          if (activeAfter.length === 1) {
            apiService.endGame(gameId, activeAfter[0].id).catch(console.error);
          }
        }
      }

      // Check Casino (roulette at 20, blackjack at 38)
      if (newPosition === 20 || newPosition === 38) {
      }

      if (passedGo) {
        toast.success("🎉 ¡Pasaste por la salida! +200 pts");
      }

      // Mostrar propiedad después de que el jugador cae
      setTimeout(() => {
        try {
          const property = boardProperties[newPosition];

          if (property) {
            if (property.tipo === "casino" || newPosition === 20 || newPosition === 38) {
              if (newPosition === 38) {
                setBlackjackName(property.nombre || "Gran Casino");
                setShowBlackjackModal(true);
                return;
              }
              if (newPosition === 20) {
                setCasinoName(property.nombre || "Gran Casino");
                setShowCasinoModal(true);
                return;
              }
            }

            const isCommunity = property.tipo === "comunidad" || property.tipo === "hacienda";
            const isLuck = property.tipo === "suerte" || property.tipo === "loteria";

            const applyCardLocally = (card: { effect: string; value: number; description: string }) => {
              setPlayersInGame((prev) => {
                const triggerId = currentPlayer;
                const updated = prev.map((p) => ({ ...p }));

                const trigger = updated.find((p) => p.id === triggerId);
                if (!trigger) return prev;

                const others = updated.filter((p) => p.id !== triggerId);

                const clamp = (n: number) => Math.max(0, n);

                switch (card.effect) {
                  case "ganar_dinero":
                    trigger.money += card.value;
                    break;

                  case "perder_dinero":
                    trigger.money = clamp(trigger.money - card.value);
                    break;

                  case "cobrar_jugadores": {
                    let total = 0;
                    for (const p of others) {
                      const paid = Math.min(card.value, p.money);
                      p.money -= paid;
                      total += paid;
                    }
                    trigger.money += total;
                    break;
                  }

                  case "pagar_jugadores": {
                    let remaining = trigger.money;
                    for (const p of others) {
                      const paid = Math.min(card.value, remaining);
                      p.money += paid;
                      remaining -= paid;
                      if (remaining <= 0) break;
                    }
                    trigger.money = remaining;
                    break;
                  }

                  default:
                    console.warn("Efecto de carta no soportado en frontend:", card.effect);
                    break;
                }

                return updated;
              });
            };

            if (isCommunity || isLuck) {
              const withLoading = { ...property, cardLoading: true, card: undefined };
              setSelectedProperty(withLoading);
              setShowPropertyModal(true);

              const draw = isCommunity ? apiService.drawCommunityCard() : apiService.drawLuckCard();
              draw
                .then((card) => {
                  applyCardLocally(card);
                  setSelectedProperty((prevSel) => (prevSel ? { ...prevSel, cardLoading: false, card } : prevSel));

                  if (card.effect === "ganar_dinero" || card.effect === "cobrar_jugadores") {
                    toast.success(card.description);
                  } else {
                    toast.error(card.description);
                  }

                  // Broadcast card effect money updates to other players
                  setPlayersInGame((prev) => {
                    const updates = prev.map((p) => ({ userId: p.id, money: p.money }));
                    connectionRef.current?.invoke("BroadcastCardEffect", gameId, updates).catch(() => {});
                    return prev; // no mutation, just reading for broadcast
                  });
                })
                .catch((e) => {
                  console.error("Error robando carta:", e);
                  setSelectedProperty((prevSel) => (prevSel ? { ...prevSel, cardLoading: false } : prevSel));
                  toast.error("No se pudo robar una carta de la base de datos");
                });

              return;
            }

            // Verificar si la propiedad está comprada por otro jugador
            const propertyOwner = playersInGame.find((p) =>
              p.properties.some((prop) => prop.propertyId === newPosition)
            );

            /*tram*/
            const currentPlayerState = playersInGame.find((p) => p.id === currentPlayer);
            const isOwnedTramByCurrentPlayer =
              property.tipo === "estacion" &&
              !!currentPlayerState?.properties.some((prop) => prop.propertyId === newPosition);

            if (isOwnedTramByCurrentPlayer && currentPlayerState) {
              const ownedStations = getOwnedStationPositions(currentPlayerState);
              const nextOwnedConsecutiveStation = getNextOwnedConsecutiveStation(newPosition, ownedStations);

              if (nextOwnedConsecutiveStation !== null) {
                setTramStationName(property.nombre || "Estacion");
                setTramNextPosition(nextOwnedConsecutiveStation);
                setShowTramModal(true);
                return;
              }
            }
            /*tram*/

            if (propertyOwner && propertyOwner.id !== currentPlayer) {
              const isCompany = property.tipo === "compañia";
              const isStation = property.tipo === "estacion";
              let rentAmount = property.alquiler || 0;
              const ownedEntry = propertyOwner.properties.find((prop) => prop.propertyId === newPosition);
              const propertyLevel = ownedEntry?.level ?? 0;

              if (isCompany) {
                const companyPositions = boardProperties
                  .map((p, idx) => (p?.tipo === "compañia" ? idx : null))
                  .filter((v): v is number => v !== null);

                const ownerCompanyCount = propertyOwner.properties.filter((prop) =>
                  companyPositions.includes(prop.propertyId)
                ).length;

                const multiplier = ownerCompanyCount >= 2 ? 10 : 4;
                rentAmount = diceTotal * multiplier;
              } else if (isStation) {
                const stationPositions = boardProperties
                  .map((p, idx) => (p?.tipo === "estacion" ? idx : null))
                  .filter((v): v is number => v !== null);

                const ownerStationCount = propertyOwner.properties.filter((prop) =>
                  stationPositions.includes(prop.propertyId)
                ).length;

                rentAmount = 25 * Math.pow(2, Math.max(0, ownerStationCount - 1));
              } else {
                rentAmount = getRentForProperty(property, propertyLevel);
              }

              setPlayersInGame((prev) =>
                prev.map((player) => {
                  if (player.id === currentPlayer) {
                    const newMoney = Math.max(0, player.money - rentAmount);
                    return { ...player, money: newMoney };
                  } else if (player.id === propertyOwner.id) {
                    const newMoney = player.money + rentAmount;
                    return { ...player, money: newMoney };
                  }
                  return player;
                })
              );

              // Use moneyAfterMove (pre-state) to compute correct values for broadcast
              const currentMoneyBeforeRent = newPosition === 4 ? Math.max(0, moneyAfterMove - 200) : moneyAfterMove;
              const fromMoneyAfterRent = Math.max(0, currentMoneyBeforeRent - rentAmount);
              const toMoneyAfterRent = (propertyOwner.money) + rentAmount;

              // Broadcast rent to other players
              connectionRef.current?.invoke("BroadcastRentPaid", gameId, currentPlayer, propertyOwner.id, rentAmount, fromMoneyAfterRent, toMoneyAfterRent).catch(() => {});

              if (fromMoneyAfterRent <= 0) {
                // Notificar eliminación
                connectionRef.current?.invoke("BroadcastPlayerEliminated", gameId, currentPlayer, currentPlayerData.name).catch(() => {});
                const activeAfter = playersRef.current.filter(p => !p.eliminated && p.id !== currentPlayer);
                if (activeAfter.length === 1) {
                  apiService.endGame(gameId, activeAfter[0].id).catch(console.error);
                }
              } else {
                toast.error(`💸 Pagaste ${rentAmount} pts de alquiler a ${propertyOwner.name}`);
              }

              const propertyToShow = { ...property, dueno: propertyOwner.name, alquiler: rentAmount };
              setSelectedProperty(propertyToShow);
              setShowPropertyModal(true);
            } else {
              setSelectedProperty(property);
              setShowPropertyModal(true);
            }
          }
        } catch (innerError) {
          console.error("Error al procesar la propiedad:", innerError);
          toast.error("Error al procesar la casilla");
        }
      }, 300);
    } catch (error) {
      console.error("Error al tirar dados:", error);
      toast.error("⚠️ Error al tirar los dados");
      setHasRolledDice(false);
    }
  };

  // Manejar compra de propiedad
  const handleBuyProperty = (propertyId: number) => {
    const currentPlayerData = playersInGame.find(p => p.id === currentPlayer);
    const property = boardProperties[propertyId];

    const propertyDbId = property?.propertyDbId;

    if (!property || !property.precio) {
      toast.error("No se puede comprar esta casilla");
      return;
    }

    if (currentPlayerData.money < property.precio) {
      toast.error("No tienes dinero suficiente");
      return;
    }

    setPlayersInGame((prev) =>
      prev.map((player) => {
        if (player.id === currentPlayer) {
          const newMoney = player.money - (property.precio || 0);
          return {
            ...player,
            money: Math.max(0, newMoney),
            properties: [...player.properties, { propertyId, propertyDbId, level: 0 }],
          };
        }
        return player;
      })
    );

    const newMoneyAfterPurchase = currentPlayerData.money - (property.precio || 0);

    toast.success(`✅ Compraste ${property.nombre} por ${property.precio} pts`);

    boardProperties[propertyId].dueno = currentPlayerData.name;

    if (propertyDbId) {
      apiService.buyProperty(gameId, currentPlayer, propertyDbId)
        .catch((err) => {
          console.warn("No se pudo persistir la compra:", err);
        });
    }

    // Broadcast property purchase to other players
    const moneyLeft = Math.max(0, currentPlayerData.money - (property.precio || 0));
    connectionRef.current?.invoke("BroadcastPropertyBought", gameId, currentPlayer, propertyId, moneyLeft, propertyDbId || 0).catch(() => {});
  };

  const handleBuildUpgrade = (propertyId: number) => {
    const currentPlayerData = playersInGame.find(p => p.id === currentPlayer);
    const property = boardProperties[propertyId];

    if (!property || property.tipo !== "propiedad") {
      toast.error("No se puede construir en esta casilla");
      return;
    }

    const eligibility = getBuildEligibility(currentPlayerData, property);
    if (!eligibility.canBuild) {
      toast.error(eligibility.reason || "No puedes construir aquí");
      return;
    }

    const cost = property.precioMejora ?? 0;
    const nextLevel = (currentPlayerData.properties.find((p) => p.propertyId === propertyId)?.level ?? 0) + 1;

    setPlayersInGame((prev) =>
      prev.map((player) => {
        if (player.id !== currentPlayer) return player;
        const hasEntry = player.properties.some((p) => p.propertyId === propertyId);
        const updatedProperties = hasEntry
          ? player.properties.map((p) =>
              p.propertyId === propertyId ? { ...p, level: nextLevel } : p
            )
          : [...player.properties, { propertyId, propertyDbId: property.propertyDbId, level: nextLevel }];

        return {
          ...player,
          money: Math.max(0, player.money - cost),
          properties: updatedProperties,
        };
      })
    );

    toast.success(`🏗️ Mejora comprada en ${property.nombre}`);

    // Broadcast property upgrade to other players
    if (property.propertyDbId) {
      const moneyAfterBuild = Math.max(0, currentPlayerData.money - cost);
      connectionRef.current?.invoke("BroadcastPropertyUpgrade", gameId, currentPlayer, property.propertyDbId, nextLevel, moneyAfterBuild).catch(() => {});
    }

    if (property.propertyDbId) {
      apiService.buildUpgrade(gameId, currentPlayer, property.propertyDbId)
        .then((res) => {
          setPlayersInGame((prev) =>
            prev.map((player) => {
              if (player.id !== currentPlayer) return player;
              return {
                ...player,
                money: res.moneyLeft,
                properties: player.properties.map((p) =>
                  p.propertyId === propertyId ? { ...p, level: res.level } : p
                ),
              };
            })
          );
        })
        .catch((err) => {
          console.warn("No se pudo persistir la mejora:", err);
        });
    }
  };

  const handlePassProperty = () => {
    toast.info("Decidiste no comprar esta propiedad");
  };

  const handleTrade = async (payload: {
    toPlayerId: number;
    cashFrom: number;
    cashTo: number;
    propertiesFrom: { propertyId: number; releaseMortgageNow: boolean }[];
    propertiesTo: { propertyId: number; releaseMortgageNow: boolean }[];
  }) => {
    const fromPlayer = playersInGame.find((p) => p.id === currentPlayer);
    const toPlayer = playersInGame.find((p) => p.id === payload.toPlayerId);

    if (!fromPlayer || !toPlayer) {
      toast.error("Jugadores no válidos para el trato");
      return;
    }

    if (payload.cashFrom < 0 || payload.cashTo < 0) {
      toast.error("El efectivo no puede ser negativo");
      return;
    }

    if (fromPlayer.money < payload.cashFrom || toPlayer.money < payload.cashTo) {
      toast.error("Uno de los jugadores no tiene efectivo suficiente");
      return;
    }

    const fromPropertyIds = payload.propertiesFrom.map((p) => p.propertyId);
    const toPropertyIds = payload.propertiesTo.map((p) => p.propertyId);

    const fromOffersSomething = payload.cashFrom > 0 || fromPropertyIds.length > 0;
    const toOffersSomething = payload.cashTo > 0 || toPropertyIds.length > 0;

    if (!fromOffersSomething || !toOffersSomething) {
      toast.error("Ambos jugadores deben ofrecer dinero o propiedades");
      return;
    }

    if (fromPropertyIds.length === 0 && toPropertyIds.length === 0) {
      toast.error("No se permite negociar solo efectivo contra efectivo");
      return;
    }

    const fromOwnsAll = fromPropertyIds.every((propertyId) => fromPlayer.properties.some((p) => p.propertyId === propertyId));
    const toOwnsAll = toPropertyIds.every((propertyId) => toPlayer.properties.some((p) => p.propertyId === propertyId));

    if (!fromOwnsAll || !toOwnsAll) {
      toast.error("Propiedades inválidas en el trato");
      return;
    }

    const hasBuildingsInColorGroup = (player: LocalPlayer, propertyId: number) => {
      const property = boardProperties[propertyId];
      if (!property || property.tipo !== "propiedad" || !property.colorGrupo) return false;

      const sameGroupPositions = boardProperties
        .map((p, idx) => (p?.tipo === "propiedad" && p.colorGrupo === property.colorGrupo ? idx : null))
        .filter((v): v is number => v !== null);

      return sameGroupPositions.some((pos) => {
        const owned = player.properties.find((pp) => pp.propertyId === pos);
        return (owned?.level ?? 0) > 0;
      });
    };

    if (fromPropertyIds.some((id) => hasBuildingsInColorGroup(fromPlayer, id)) || toPropertyIds.some((id) => hasBuildingsInColorGroup(toPlayer, id))) {
      toast.error("No se puede negociar una calle si su grupo de color tiene edificios");
      return;
    }

    const propertyName = payload.propertiesTo.length > 0
      ? boardProperties[payload.propertiesTo[0].propertyId]?.nombre
      : (payload.cashFrom > 0 ? "dinero" : "propiedad");

    const offer = {
      fromPlayerId: currentPlayer,
      fromPlayerName: fromPlayer.name,
      propertyName,
      propertyId: payload.propertiesTo.length > 0 ? payload.propertiesTo[0].propertyId : 0,
      cashOffer: payload.cashFrom,
      toPlayerId: payload.toPlayerId,
      propertiesFrom: payload.propertiesFrom,
      propertiesTo: payload.propertiesTo,
      cashTo: payload.cashTo
    };

    connectionRef.current?.invoke("ProposeTradeOffer", gameId, payload.toPlayerId, offer).catch(() => {});
    toast.info(`Oferta enviada a ${toPlayer.name}`);
    setShowTradeModal(false);
  };

  const endTurn = () => {
    setTimeout(() => {
      // Use ref to get CURRENT players state (avoids stale closure bug)
      const currentPlayers = playersRef.current;
      const activePlayers = currentPlayers.filter((p) => !p.eliminated);
      const activeIds = activePlayers.map((p) => p.id);

      if (activeIds.length === 0) {
        toast.error("No hay jugadores activos en la partida");
        return;
      }

      if (activeIds.length === 1) {
        const winner = activePlayers[0];
        setGameOver(true);
        setGameWinner({ id: winner.id, name: winner.name, reason: 'bancarrota' });
        setCurrentPlayer(winner.id);
        // Sync stats to backend
        apiService.endGame(gameId, winner.id).catch((err) => console.warn("EndGame API:", err));
        return;
      }

      const currentIndex = activeIds.indexOf(currentPlayer);
      let nextPlayer: number;

      if (currentIndex === -1 || currentIndex === activeIds.length - 1) {
        nextPlayer = activeIds[0];
      } else {
        nextPlayer = activeIds[currentIndex + 1];
      }

      setCurrentPlayer(nextPlayer);
      setDice1(null);
      setHasRolledDice(false);

      // Broadcast turn change to other players
      connectionRef.current?.invoke("BroadcastEndTurn", gameId, nextPlayer).catch(() => {});
    }, 150);
  };

  // Cambiar turno al cerrar modal
  const handleClosePropertyModal = () => {
    setShowPropertyModal(false);
    endTurn();
  };

  const handleCloseCasinoModal = () => {
    setShowCasinoModal(false);
    setCasinoName(null);
    endTurn();
  };

  const handleCloseBlackjackModal = () => {
    setShowBlackjackModal(false);
    setBlackjackName(null);
    endTurn();
  };

  /*tram*/
  const handleUseTram = () => {
    if (tramNextPosition === null) return;

    setPlayersInGame((prev) =>
      prev.map((player) =>
        player.id === currentPlayer
          ? { ...player, position: tramNextPosition }
          : player
      )
    );

    toast.success(`🚋 Te has movido por tram hasta la casilla ${tramNextPosition}`);
    setShowTramModal(false);
    setTramNextPosition(null);
    endTurn();
  };

  const handlePassTram = () => {
    toast.info("🚋 Has decidido pasar y no usar el tram");
    setShowTramModal(false);
    setTramNextPosition(null);
    endTurn();
  };
  /*tram*/

  const handleCasinoResult = (delta: number) => {
    setPlayersInGame((prev) => {
      const updated = prev.map((player) => {
        if (player.id === currentPlayer) {
          const updatedMoney = Math.max(0, player.money + delta);
          return { ...player, money: updatedMoney };
        }
        return player;
      });

      // Broadcast casino result to other players
      const playerAfter = updated.find((p) => p.id === currentPlayer);
      if (playerAfter) {
        connectionRef.current?.invoke("BroadcastCasinoResult", gameId, currentPlayer, playerAfter.money).catch(() => {});
        if (playerAfter.money <= 0) {
          setPlayersInGame((p) => p.map((pl) => pl.id === currentPlayer ? { ...pl, eliminated: true } : pl));
          toast.error(`💥 ¡${playerAfter.name} ha quedado en bancarrota!`);
        }
      }

      return updated;
    });
  };

  const handleBlackjackResult = (delta: number) => {
    setPlayersInGame((prev) => {
      const updated = prev.map((player) => {
        if (player.id === currentPlayer) {
          const updatedMoney = Math.max(0, player.money + delta);
          return { ...player, money: updatedMoney };
        }
        return player;
      });

      // Broadcast blackjack result to other players
      const playerAfter = updated.find((p) => p.id === currentPlayer);
      if (playerAfter) {
        connectionRef.current?.invoke("BroadcastCasinoResult", gameId, currentPlayer, playerAfter.money).catch(() => {});
        if (playerAfter.money <= 0) {
          setPlayersInGame((p) => p.map((pl) => pl.id === currentPlayer ? { ...pl, eliminated: true } : pl));
          toast.error(`💥 ¡${playerAfter.name} ha quedado en bancarrota!`);
        }
      }

      return updated;
    });
  };

  // Icono del dado
  const getDiceIcon = (value: number) => {
    const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const DiceIcon = diceIcons[value - 1];
    return <DiceIcon className="w-8 h-8 text-amber-400" />;
  };

  const currentPlayerData = playersInGame.find(p => p.id === currentPlayer);
  const buildEligibility = selectedProperty && currentPlayerData
    ? getBuildEligibility(currentPlayerData, selectedProperty)
    : { canBuild: false, reason: "" };

  const uniqueOwnershipMarkers = useMemo(() => {
    const ownerByProperty = new Map<number, { playerId: number; color: string; name: string }>();

    for (const player of playersInGame) {
      for (const prop of player.properties) {
        ownerByProperty.set(prop.propertyId, {
          playerId: player.id,
          color: player.color,
          name: player.name,
        });
      }
    }

    return Array.from(ownerByProperty.entries()).map(([propertyId, owner]) => ({
      propertyId,
      ...owner,
    }));
  }, [playersInGame]);

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
              <p className={`text-sm font-medium ${isMyTurn ? 'text-green-400' : 'text-amber-400'}`}>
                {isMyTurn 
                  ? '🎯 ¡Tu turno!' 
                  : `⏳ Turno de ${playersInGame.find((p) => p.id === currentPlayer)?.name || 'Otro jugador'}`
                }
              </p>
            </div>
          </div>
          <Badge className={`${isMyTurn ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
            {isMyTurn ? 'Tu turno' : 'Esperando'}
          </Badge>
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
              target.style.display = "none";
              toast.error("Error al cargar la imagen del tablero");
            }}
          />

          {/* Hotspots con tooltip de informacion */}
          {boardProperties.map((property, idx) => {
            if (!property) return null;
            if (!"propiedad|estacion|compañia".includes(property.tipo)) return null;
            const pos = boardPositions[idx] || boardPositions[0];
            const { ownerName, level } = getOwnerInfoForPosition(idx);

            return (
              <Tooltip key={`tooltip-${idx}`}>
                <TooltipTrigger asChild>
                  <button
                    className="absolute h-6 w-6 rounded-full bg-transparent"
                    style={{
                      ...pos,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => setSelectedInfoPropertyId(idx)}
                    aria-label={`Ver info de ${property.nombre}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-transparent shadow-none border-none p-0">
                  <PropertyInfoCard property={property} level={level} ownerName={ownerName} />
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Distintivos de propiedades compradas */}
          {uniqueOwnershipMarkers.map((marker, index) => {
            const pos = boardPositions[marker.propertyId] || boardPositions[0];
            const offsetX = (index % 2) * 15 - 7;
            const offsetY = Math.floor(index / 2) % 2 === 0 ? -7 : 7;

            return (
              <div
                key={`owned-${marker.playerId}-${marker.propertyId}`}
                className="absolute"
                style={{
                  ...pos,
                  transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`,
                }}
              >
                <div
                  className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${marker.color}`}
                  title={`${boardProperties[marker.propertyId]?.nombre} (${marker.name})`}
                />
              </div>
            );
          })}

          {/* Casas y hoteles */}
          {playersInGame.map((player) =>
            player.properties.map((prop) => {
              const level = prop.level ?? 0;
              if (level <= 0) return null;

              const pos = boardPositions[prop.propertyId] || boardPositions[0];
              const offsetX = 0;
              const offsetY = -12;
              return (
                <div
                  key={`upgrade-${player.id}-${prop.propertyId}`}
                  className="absolute"
                  style={{
                    ...pos,
                    transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`,
                  }}
                >
                  <CasillaUpgradeMarker
                    position={prop.propertyId}
                    level={level}
                    title={boardProperties[prop.propertyId]?.nombre}
                  />
                </div>
              );
            })
          )}

          {playersInGame.map((player, idx) => {
            const pos = boardPositions[player.position] || boardPositions[0];
            const offsetX = (idx % 2) * 10 - 5;
            const offsetY = Math.floor(idx / 2) * 10 - 5;

            if (player.eliminated) {
              return null;
            }

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
                  onClick={() => setSelectedPlayerForProperties(player.id)}
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
          {playersInGame.map((p) => {
            const isActive = !p.eliminated;
            return (
              <div
                key={p.id}
                onClick={() => isActive && setSelectedPlayerForProperties(p.id)}
                className={`p-2 rounded-lg border text-center cursor-pointer transition-all hover:scale-105 ${
                  !isActive
                    ? "border-gray-600/50 bg-black/40 opacity-50"
                    : currentPlayer === p.id
                      ? "border-amber-500 bg-amber-500/20"
                      : "border-gray-600/30 bg-black/20 hover:border-amber-500/50"
                }`}
                title={isActive ? `Click para ver propiedades de ${p.name}` : `${p.name} - ¡ELIMINADO!`}
              >
                <div className={`w-4 h-4 rounded-full ${p.color} mx-auto mb-1`} />
                <p className="text-white text-xs font-medium">{p.name}</p>
                <p className={`text-xs font-bold ${isActive ? "text-amber-400" : "text-red-500"}`}>
                  {isActive ? `${p.money} pts` : "ELIMINADO"}
                </p>
                {p.isInJail && (
                  <Badge variant="destructive" className="mt-1 text-[10px] h-4 px-1 py-0 bg-red-900 border-red-500 text-red-100">
                    En la cárcel
                  </Badge>
                )}
                {!p.isInJail && (
                  <p className="text-gray-400 text-[10px] mt-1">🏠 {p.properties.length}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={rollDice}
              disabled={hasRolledDice || !isMyTurn}
              className={`bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white ${
                (hasRolledDice || !isMyTurn) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Dice1 className="w-4 h-4 mr-2" />
              {!isMyTurn ? 'Esperando...' : 'Lanzar Dados'}
            </Button>
            {dice1 && getDiceIcon(dice1)}

            {/* Dev mode: elegir dado */}
            <button
              onClick={() => setDevMode((v) => !v)}
              className={`ml-2 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                devMode
                  ? "bg-green-600 border-green-400 text-white"
                  : "bg-gray-700/50 border-gray-500/30 text-gray-400 hover:border-gray-400"
              }`}
              title="Modo desarrollo: elegir número del dado"
            >
              🛠️ DEV
            </button>
            {devMode && (
              <select
                value={debugDiceValue}
                onChange={(e) => setDebugDiceValue(Number(e.target.value))}
                className="bg-gray-800 border border-green-500/50 text-green-400 text-xs rounded px-1 py-1 w-12"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
              onClick={() => setShowTradeModal(true)}
              disabled={!isMyTurn}
            >
              Negociar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-600/30 text-amber-400 hover:bg-amber-600/10"
              onClick={handleReturnToMenu}
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
        playerMoney={currentPlayerData?.money || 0}
        onClose={handleClosePropertyModal}
        onBuy={handleBuyProperty}
        onPass={handlePassProperty}
        onBuild={handleBuildUpgrade}
        canBuild={buildEligibility.canBuild}
        buildCost={selectedProperty?.precioMejora}
        buildDisabledReason={buildEligibility.reason}
      />

      <PropertyInfoModal
        isOpen={selectedInfoPropertyId !== null}
        property={selectedInfoPropertyId !== null ? boardProperties[selectedInfoPropertyId] : null}
        level={selectedInfoPropertyId !== null ? getOwnerInfoForPosition(selectedInfoPropertyId).level : 0}
        ownerName={selectedInfoPropertyId !== null ? getOwnerInfoForPosition(selectedInfoPropertyId).ownerName : undefined}
        onClose={() => setSelectedInfoPropertyId(null)}
      />

      <CasinoRouletteModal
        isOpen={showCasinoModal}
        playerMoney={playersInGame.find(p => p.id === currentPlayer)?.money || 0}
        playerName={playersInGame.find((p) => p.id === currentPlayer)?.name || "Jugador"}
        casinoName={casinoName || "Casino"}
        onApplyResult={handleCasinoResult}
        onClose={handleCloseCasinoModal}
      />

      <BlackjackModal
        isOpen={showBlackjackModal}
        playerMoney={playersInGame.find(p => p.id === currentPlayer)?.money || 0}
        playerName={playersInGame.find((p) => p.id === currentPlayer)?.name || "Jugador"}
        casinoName={blackjackName || "Casino"}
        onApplyResult={handleBlackjackResult}
        onClose={handleCloseBlackjackModal}
      />

      {/*tram*/}
      <TramCardModal
        isOpen={showTramModal}
        stationName={tramStationName}
        nextStationPosition={tramNextPosition ?? 0}
        onUseTram={handleUseTram}
        onPass={handlePassTram}
      />
      {/*tram*/}

      {/* Modal de propiedades del jugador */}
      {selectedPlayerForProperties && (
        <PlayerPropertiesModal
          isOpen={true}
          playerName={playersInGame.find((p) => p.id === selectedPlayerForProperties)?.name || ""}
          playerColor={playersInGame.find((p) => p.id === selectedPlayerForProperties)?.color || ""}
          properties={playersInGame.find((p) => p.id === selectedPlayerForProperties)?.properties || []}
          boardProperties={boardProperties}
          isCurrentPlayer={selectedPlayerForProperties === currentPlayer}
          onBuild={handleBuildUpgrade}
          getBuildState={(propertyId) =>
            currentPlayerData
              ? getBuildStateForProperty(currentPlayerData, propertyId)
              : { canBuild: false, reason: "No es tu turno", cost: 0 }
          }
          onInfo={(propertyId) => {
            setSelectedPlayerForProperties(null);
            setSelectedInfoPropertyId(propertyId);
          }}
          onClose={() => setSelectedPlayerForProperties(null)}
        />
      )}

      <TradeModal
        isOpen={showTradeModal}
        fromPlayer={playersInGame.find((p) => p.id === currentPlayer) ?? playersInGame[0]}
        players={playersInGame.filter((p) => p.id !== currentPlayer && !p.eliminated)}
        boardProperties={boardProperties}
        onClose={() => setShowTradeModal(false)}
        onSubmit={handleTrade}
      />

      {/* Incoming trade offer popup */}
      <IncomingTradeOffer
        isOpen={incomingOffer !== null}
        fromPlayerName={incomingOffer?.fromPlayerName ?? ''}
        propertyName={incomingOffer?.propertyName ?? ''}
        cashOffer={incomingOffer?.cashOffer ?? 0}
        onAccept={() => {
          if (!incomingOffer) return;
          
          const mapToTradeDto = (p: any) => {
            const dbId = boardProperties[p.propertyId]?.propertyDbId;
            return dbId ? { propertyId: dbId, releaseMortgageNow: p.releaseMortgageNow || false } : null;
          };

          const propertiesFromDb = ((incomingOffer as any).propertiesFrom || []).map(mapToTradeDto).filter(Boolean);
          const propertiesToDb = ((incomingOffer as any).propertiesTo || []).map(mapToTradeDto).filter(Boolean);

          apiService.trade({
            gameId,
            fromPlayerId: incomingOffer.fromPlayerId,
            toPlayerId: currentUser.id,
            cashFrom: incomingOffer.cashOffer,
            cashTo: (incomingOffer as any).cashTo || 0,
            propertiesFrom: propertiesFromDb,
            propertiesTo: propertiesToDb
          }).then(() => {
            // The API handles the DB. We now broadcast the completion to update all clients (including ourselves)
            const fromProperties = (incomingOffer as any).propertiesFrom?.map((p: any) => p.propertyId) || [];
            const toProperties = (incomingOffer as any).propertiesTo?.map((p: any) => p.propertyId) || [];
            
            connectionRef.current?.invoke("BroadcastTradeCompleted", gameId, {
              fromUserId: incomingOffer.fromPlayerId,
              toUserId: currentUser.id,
              fromMoneyAfter: playersInGame.find(p => p.id === incomingOffer.fromPlayerId)!.money - incomingOffer.cashOffer,
              toMoneyAfter: playersInGame.find(p => p.id === currentUser.id)!.money + incomingOffer.cashOffer,
              fromProperties,
              toProperties,
              fromPropertyDbIds: fromProperties.map((id: number) => boardProperties[id]?.propertyDbId ?? 0),
              toPropertyDbIds: toProperties.map((id: number) => boardProperties[id]?.propertyDbId ?? 0)
            }).catch(() => {});
            
            toast.success(`✅ Aceptaste la oferta de ${incomingOffer.fromPlayerName}`);
            setIncomingOffer(null);
          }).catch(() => {
            toast.error("Error al procesar el trato");
          });
        }}
        onReject={() => {
          if (incomingOffer) {
            connectionRef.current?.invoke("RespondTradeOffer", gameId, incomingOffer.fromPlayerId, false).catch(() => {});
          }
          toast.info(`❌ Rechazaste la oferta de ${incomingOffer?.fromPlayerName}`);
          setIncomingOffer(null);
        }}
      />

      {/* Game Over popup */}
      {gameOver && gameWinner && (
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative z-10 w-[90vw] max-w-md rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-black text-amber-300 mb-2">¡Partida finalizada!</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-white/80 text-sm mb-1">El ganador es</p>
              <p className="text-amber-400 text-2xl font-bold">{gameWinner.name}</p>
              <p className="text-white/60 text-xs mt-1">
                {gameWinner.reason === 'bancarrota' ? 'Último jugador en pie' : 
                 gameWinner.reason === 'incomparecencia' ? 'Victoria por abandono' : 'Victoria'}
              </p>
            </div>
            <Button
              onClick={handleReturnToMenu}
              className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white py-4 text-lg font-bold rounded-xl"
            >
              Volver al Menú
            </Button>
          </div>
        </div>
      )}

      {/* Eliminated popup */}
      {showEliminatedModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative z-10 w-[90vw] max-w-md rounded-3xl border-2 border-red-500/60 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-3xl font-black text-red-400 mb-2">¡Jugador Eliminado!</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 my-6">
              <p className="text-white text-lg">
                <span className="font-bold text-red-300">{eliminatedPlayerName}</span> se ha quedado en bancarrota y ha sido eliminado de la partida.
              </p>
            </div>
            <Button
              onClick={() => {
                setShowEliminatedModal(false);
                const activePlayers = playersInGame.filter(p => !p.eliminated);
                if (activePlayers.length === 1) {
                  const winner = activePlayers[0];
                  setGameOver(true);
                  setGameWinner({ id: winner.id, name: winner.name, reason: "victoria" });
                  if (currentUser.id === winner.id) {
                    apiService.endGame(gameId).catch(console.error);
                  }
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-bold rounded-xl"
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}