import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { X, Coins, ArrowRight, Check, XCircle } from "lucide-react";

interface PlayerProperty {
  propertyId: number;
  propertyDbId?: number;
  level?: number;
}

interface Property {
  id: number;
  propertyDbId?: number;
  nombre: string;
  tipo: string;
  colorGrupo?: string;
  precio?: number;
}

interface TradePlayer {
  id: number;
  name: string;
  money: number;
  properties: PlayerProperty[];
}

interface TradeOfferProperty {
  propertyId: number;
  releaseMortgageNow: boolean;
}

// Incoming offer modal (shown to the receiving player)
interface IncomingOfferProps {
  isOpen: boolean;
  fromPlayerName: string;
  propertyName: string;
  cashOffer: number;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingTradeOffer({ isOpen, fromPlayerName, propertyName, cashOffer, onAccept, onReject }: IncomingOfferProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60]">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 w-[90vw] max-w-md rounded-2xl border-2 border-amber-500/50 bg-zinc-900 shadow-2xl p-6">
        <h3 className="text-xl font-bold text-amber-300 mb-4 text-center">📨 Oferta de Negociación</h3>

        <div className="bg-zinc-800 rounded-lg p-4 mb-4 border border-zinc-700">
          <p className="text-white text-center mb-3">
            <span className="font-bold text-cyan-300">{fromPlayerName}</span> quiere comprarte:
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center mb-3">
            <p className="text-amber-300 font-bold text-lg">{propertyName}</p>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Coins className="w-5 h-5 text-green-400" />
            <p className="text-green-400 font-bold text-xl">{cashOffer.toLocaleString()} pts</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" /> Aceptar
          </Button>
          <Button
            onClick={onReject}
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <XCircle className="w-4 h-4 mr-2" /> Rechazar
          </Button>
        </div>
      </div>
    </div>
  );
}

// === Main Trade Modal ===
interface TradeModalProps {
  isOpen: boolean;
  fromPlayer: TradePlayer;
  players: TradePlayer[];
  boardProperties: Property[];
  onClose: () => void;
  onSubmit: (payload: {
    toPlayerId: number;
    cashFrom: number;
    cashTo: number;
    propertiesFrom: TradeOfferProperty[];
    propertiesTo: TradeOfferProperty[];
  }) => void;
}

type Step = "selectPlayer" | "selectProperty" | "makeOffer";

export function TradeModal({
  isOpen,
  fromPlayer,
  players,
  boardProperties,
  onClose,
  onSubmit,
}: TradeModalProps) {
  const [step, setStep] = useState<Step>("selectPlayer");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [cashOffer, setCashOffer] = useState(0);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  const selectedPropertyName = useMemo(() => {
    if (selectedPropertyId === null) return "";
    return boardProperties[selectedPropertyId]?.nombre ?? `Casilla ${selectedPropertyId}`;
  }, [selectedPropertyId, boardProperties]);

  const reset = () => {
    setStep("selectPlayer");
    setSelectedPlayerId(null);
    setSelectedPropertyId(null);
    setCashOffer(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectPlayer = (playerId: number) => {
    setSelectedPlayerId(playerId);
    setSelectedPropertyId(null);
    setCashOffer(0);
    setStep("selectProperty");
  };

  const handleSelectProperty = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
    setStep("makeOffer");
  };

  const handleSubmitOffer = () => {
    if (selectedPlayerId === null || selectedPropertyId === null) return;
    if (cashOffer <= 0) return;
    if (cashOffer > fromPlayer.money) return;

    onSubmit({
      toPlayerId: selectedPlayerId,
      cashFrom: cashOffer,
      cashTo: 0,
      propertiesFrom: [],
      propertiesTo: [{ propertyId: selectedPropertyId, releaseMortgageNow: false }],
    });

    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={handleClose} />

      <div className="relative z-10 w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-amber-500/40 bg-zinc-900 shadow-2xl pointer-events-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-amber-500/30">
          <div className="flex items-center space-x-2">
            {step !== "selectPlayer" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white px-2"
                onClick={() => {
                  if (step === "makeOffer") setStep("selectProperty");
                  else if (step === "selectProperty") setStep("selectPlayer");
                }}
              >
                ← Atrás
              </Button>
            )}
            <h3 className="text-lg font-bold text-amber-300">
              {step === "selectPlayer" && "Elige un jugador"}
              {step === "selectProperty" && "Elige una propiedad"}
              {step === "makeOffer" && "Haz tu oferta"}
            </h3>
          </div>
          <Button variant="ghost" size="sm" className="text-zinc-300" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4">
          {/* Step 1: Select player */}
          {step === "selectPlayer" && (
            <div className="space-y-2">
              <p className="text-zinc-400 text-sm mb-3">¿A quién quieres comprarle una propiedad?</p>
              {players.length === 0 ? (
                <p className="text-zinc-500 text-center py-6">No hay otros jugadores activos</p>
              ) : (
                players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlayer(p.id)}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800/80 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-red-600 flex items-center justify-center text-white font-bold text-sm`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{p.name}</p>
                        <p className="text-zinc-400 text-xs">{p.properties.length} propiedades</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Select property from that player */}
          {step === "selectProperty" && selectedPlayer && (
            <div className="space-y-2">
              <p className="text-zinc-400 text-sm mb-3">
                Propiedades de <span className="text-cyan-300 font-semibold">{selectedPlayer.name}</span>:
              </p>
              {selectedPlayer.properties.length === 0 ? (
                <p className="text-zinc-500 text-center py-6">Este jugador no tiene propiedades</p>
              ) : (
                selectedPlayer.properties.map((pp) => {
                  const prop = boardProperties[pp.propertyId];
                  if (!prop) return null;
                  const hasBuildings = (pp.level ?? 0) > 0;

                  return (
                    <button
                      key={pp.propertyId}
                      onClick={() => !hasBuildings && handleSelectProperty(pp.propertyId)}
                      disabled={hasBuildings}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${hasBuildings
                          ? "bg-zinc-800/50 border-zinc-700/50 opacity-50 cursor-not-allowed"
                          : "bg-zinc-800 border-zinc-700 hover:border-amber-500/50"
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        {prop.colorGrupo && (
                          <div
                            className="w-4 h-8 rounded"
                            style={{ backgroundColor: prop.colorGrupo }}
                          />
                        )}
                        <div className="text-left">
                          <p className="text-white text-sm font-medium">{prop.nombre}</p>
                          <p className="text-zinc-400 text-xs">
                            {prop.precio ? `Valor: ${prop.precio} pts` : prop.tipo}
                            {hasBuildings && " · Tiene edificios"}
                          </p>
                        </div>
                      </div>
                      {!hasBuildings && <ArrowRight className="w-4 h-4 text-zinc-500" />}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Step 3: Make offer */}
          {step === "makeOffer" && selectedPlayer && selectedPropertyId !== null && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <p className="text-zinc-400 text-xs mb-2">Quieres comprar de {selectedPlayer.name}:</p>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                  <p className="text-amber-300 font-bold text-lg">{selectedPropertyName}</p>
                </div>
              </div>

              {/* Cash offer */}
              <div>
                <label className="text-sm text-zinc-300 block mb-2">
                  ¿Cuánto ofreces? <span className="text-zinc-500">(Tienes {fromPlayer.money.toLocaleString()} pts)</span>
                </label>
                <div className="flex items-center space-x-3">
                  <Coins className="w-5 h-5 text-green-400 shrink-0" />
                  <input
                    type="number"
                    min={1}
                    max={fromPlayer.money}
                    value={cashOffer || ""}
                    onChange={(e) => setCashOffer(Math.max(0, Number(e.target.value || 0)))}
                    className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 text-white px-4 py-3 text-lg font-bold text-center"
                    placeholder="0"
                  />
                  <span className="text-zinc-400 font-medium">pts</span>
                </div>
                {cashOffer > fromPlayer.money && (
                  <p className="text-red-400 text-xs mt-1">No tienes suficiente dinero</p>
                )}
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2">
                {[100, 250, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashOffer(Math.min(amount, fromPlayer.money))}
                    className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-300 text-sm hover:border-amber-500/50 hover:text-amber-300 transition-colors"
                  >
                    {amount} pts
                  </button>
                ))}
                <button
                  onClick={() => {
                    const prop = boardProperties[selectedPropertyId];
                    if (prop?.precio) setCashOffer(Math.min(prop.precio, fromPlayer.money));
                  }}
                  className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm hover:bg-amber-500/20 transition-colors"
                >
                  Precio original
                </button>
              </div>

              {/* Submit */}
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white py-6 text-lg font-bold"
                disabled={cashOffer <= 0 || cashOffer > fromPlayer.money}
                onClick={handleSubmitOffer}
              >
                Enviar oferta de {cashOffer.toLocaleString()} pts
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
