import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";

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

function isStreet(property: Property | undefined) {
  return property?.tipo === "propiedad";
}

export function TradeModal({
  isOpen,
  fromPlayer,
  players,
  boardProperties,
  onClose,
  onSubmit,
}: TradeModalProps) {
  const [toPlayerId, setToPlayerId] = useState<number>(players[0]?.id ?? 0);
  const [cashFrom, setCashFrom] = useState(0);
  const [cashTo, setCashTo] = useState(0);
  const [selectedFrom, setSelectedFrom] = useState<number[]>([]);
  const [selectedTo, setSelectedTo] = useState<number[]>([]);

  const toPlayer = useMemo(
    () => players.find((p) => p.id === toPlayerId) ?? null,
    [players, toPlayerId]
  );

  const hasBuildingsInGroup = (player: TradePlayer, propertyId: number) => {
    const prop = boardProperties[propertyId];
    if (!isStreet(prop) || !prop?.colorGrupo) return false;

    const sameGroup = boardProperties
      .map((p, idx) => (p?.tipo === "propiedad" && p.colorGrupo === prop.colorGrupo ? idx : null))
      .filter((idx): idx is number => idx !== null);

    return sameGroup.some((groupPos) => {
      const owned = player.properties.find((pp) => pp.propertyId === groupPos);
      return (owned?.level ?? 0) > 0;
    });
  };

  const fromTradable = fromPlayer.properties.filter((pp) => !hasBuildingsInGroup(fromPlayer, pp.propertyId));
  const toTradable = toPlayer
    ? toPlayer.properties.filter((pp) => !hasBuildingsInGroup(toPlayer, pp.propertyId))
    : [];

  const toggleSelection = (list: number[], setList: (v: number[]) => void, id: number) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
      return;
    }
    setList([...list, id]);
  };

  const submitTrade = () => {
    if (!toPlayer) return;

    const fromOffersSomething = cashFrom > 0 || selectedFrom.length > 0;
    const toOffersSomething = cashTo > 0 || selectedTo.length > 0;
    const isCashOnlyTrade = selectedFrom.length === 0 && selectedTo.length === 0;

    if (!fromOffersSomething || !toOffersSomething || isCashOnlyTrade) {
      return;
    }

    onSubmit({
      toPlayerId: toPlayer.id,
      cashFrom,
      cashTo,
      propertiesFrom: selectedFrom.map((propertyId) => ({ propertyId, releaseMortgageNow: false })),
      propertiesTo: selectedTo.map((propertyId) => ({ propertyId, releaseMortgageNow: false })),
    });

    setCashFrom(0);
    setCashTo(0);
    setSelectedFrom([]);
    setSelectedTo([]);
    onClose();
  };

  if (!isOpen) return null;

  const fromOffersSomething = cashFrom > 0 || selectedFrom.length > 0;
  const toOffersSomething = cashTo > 0 || selectedTo.length > 0;
  const isCashOnlyTrade = selectedFrom.length === 0 && selectedTo.length === 0;
  const canConfirmTrade = !!toPlayer && fromOffersSomething && toOffersSomething && !isCashOnlyTrade;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={onClose} />

      <div className="relative z-10 w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-amber-500/40 bg-zinc-900 shadow-2xl pointer-events-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-amber-500/30">
          <div>
            <h3 className="text-lg font-bold text-amber-300">Negociar propiedades</h3>
            <p className="text-xs text-zinc-300">Puedes negociar en cualquier momento de la partida</p>
          </div>
          <Button variant="ghost" size="sm" className="text-zinc-300" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400">Jugador que recibe tu oferta</label>
              <select
                value={toPlayerId}
                onChange={(e) => {
                  setToPlayerId(Number(e.target.value));
                  setSelectedTo([]);
                }}
                className="mt-1 w-full rounded-md border border-zinc-600 bg-zinc-800 text-zinc-100 px-3 py-2"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.money} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-700 p-3 bg-zinc-800/60">
              <p className="text-sm font-semibold text-amber-300">Tu oferta ({fromPlayer.name})</p>
              <div className="grid grid-cols-1 gap-2 mt-3">
                <label className="text-xs text-zinc-300">
                  Efectivo
                  <input
                    type="number"
                    min={0}
                    value={cashFrom}
                    onChange={(e) => setCashFrom(Number(e.target.value || 0))}
                    className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1"
                  />
                </label>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Propiedades seleccionables (sin edificios en su grupo)</p>
              <div className="mt-2 space-y-1 max-h-56 overflow-y-auto pr-1">
                {fromTradable.length === 0 ? (
                  <p className="text-xs text-zinc-500">No tienes propiedades negociables</p>
                ) : (
                  fromTradable.map((pp) => (
                    <label key={`from-${pp.propertyId}`} className="flex items-center gap-2 text-sm text-zinc-100">
                      <input
                        type="checkbox"
                        checked={selectedFrom.includes(pp.propertyId)}
                        onChange={() => toggleSelection(selectedFrom, setSelectedFrom, pp.propertyId)}
                      />
                      <span>{boardProperties[pp.propertyId]?.nombre ?? `Casilla ${pp.propertyId}`}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-700 p-3 bg-zinc-800/60">
              <p className="text-sm font-semibold text-cyan-300">Su oferta ({toPlayer?.name ?? "Jugador"})</p>
              <div className="grid grid-cols-1 gap-2 mt-3">
                <label className="text-xs text-zinc-300">
                  Efectivo
                  <input
                    type="number"
                    min={0}
                    value={cashTo}
                    onChange={(e) => setCashTo(Number(e.target.value || 0))}
                    className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1"
                  />
                </label>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Propiedades seleccionables (sin edificios en su grupo)</p>
              <div className="mt-2 space-y-1 max-h-56 overflow-y-auto pr-1">
                {toTradable.length === 0 ? (
                  <p className="text-xs text-zinc-500">Este jugador no tiene propiedades negociables</p>
                ) : (
                  toTradable.map((pp) => (
                    <label key={`to-${pp.propertyId}`} className="flex items-center gap-2 text-sm text-zinc-100">
                      <input
                        type="checkbox"
                        checked={selectedTo.includes(pp.propertyId)}
                        onChange={() => toggleSelection(selectedTo, setSelectedTo, pp.propertyId)}
                      />
                      <span>{boardProperties[pp.propertyId]?.nombre ?? `Casilla ${pp.propertyId}`}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="border-zinc-600 text-zinc-100" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!canConfirmTrade}
              onClick={submitTrade}
            >
              Confirmar trato
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
