import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { cn } from "./ui/utils";

// --- TYPES ---
export type BetType = "number" | "color" | "parity";
export type BetValue = number | "rojo" | "negro" | "par" | "impar";

interface CurrentBet {
  type: BetType;
  value: BetValue;
}

interface CasinoRouletteModalProps {
  isOpen: boolean;
  playerMoney: number;
  playerName: string;
  casinoName?: string;
  onApplyResult: (delta: number) => void;
  onClose: () => void;
}

// --- CONSTANTS & HELPERS ---

// User requested sequential order: 0, 1, 2, ... 36
const WHEEL_ORDER = Array.from({ length: 37 }, (_, i) => i);

const getNumberColor = (num: number): "rojo" | "negro" | "verde" => {
  if (num === 0) return "verde";
  // Simple alternating for sequential wheel: Odd = Rojo, Even = Negro
  // This visually looks like Red/Black/Red/Black...
  return num % 2 !== 0 ? "rojo" : "negro";
};

const getParity = (num: number): "par" | "impar" | null => {
  if (num === 0) return null;
  return num % 2 === 0 ? "par" : "impar";
};

export function CasinoRouletteModal({
  isOpen,
  playerMoney,
  playerName,
  casinoName = "Casino Royale",
  onApplyResult,
  onClose
}: CasinoRouletteModalProps) {
  // State
  const [bet, setBet] = useState<CurrentBet | null>(null);
  const [amount, setAmount] = useState<string>("50");
  const [spinning, setSpinning] = useState(false);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setResultNumber(null);
      setSpinning(false);
      setBet(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedAmount = parseInt(amount) || 0;
  const canBet = parsedAmount > 0 && parsedAmount <= playerMoney && bet !== null && !spinning;

  // --- LOGIC ---

  const handleSpin = () => {
    if (!canBet) {
      if (!bet) toast.error("Por favor, selecciona una apuesta");
      else if (parsedAmount <= 0) toast.error("Ingresa un monto válido");
      else if (parsedAmount > playerMoney) toast.error("Fondos insuficientes");
      return;
    }

    setSpinning(true);
    setResultNumber(null);

    // 1. Determine Result
    const winningIndex = Math.floor(Math.random() * 37); // 0-36
    const winningNumber = WHEEL_ORDER[winningIndex];

    // 2. Calculate Payout
    let win = false;
    let multiplier = 0;

    if (bet.type === "number") {
      win = winningNumber === bet.value;
      multiplier = 36;
    } else if (bet.type === "color") {
      const color = getNumberColor(winningNumber);
      win = color === bet.value;
      multiplier = 2; // Pays 1:1
    } else if (bet.type === "parity") {
      const parity = getParity(winningNumber);
      win = parity === bet.value;
      multiplier = 2; // Pays 1:1
    }

    const delta = win ? parsedAmount * (multiplier - 1) : -parsedAmount;

    // 3. Animation Logic
    const segmentAngle = 360 / 37;

    // Logic: 
    // Wheel starts with 0 at top (0deg).
    // Numbers increase CLOCKWISE: 0, 1, 2...
    // So index i is at Angle = i * segmentAngle.
    // To bring index i to Top (0deg), we must rotate COUNTER-CLOCKWISE (negative) or rotate wheel by 360 - Angle.

    const indexInWheel = winningIndex;

    // We want the CENTER of the segment.
    // Segment i spans from i*ang to (i+1)*ang. Center is (i+0.5)*ang.
    const centerAngle = (indexInWheel + 0.5) * segmentAngle;

    // Target rotation to bring this center to visual top (0 deg)
    const baseTargetAngle = 360 - centerAngle;

    const extraSpins = 360 * 5;
    // Randomize within 80% of the segment to look natural
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);

    const currentRotation = rotation;
    const currentMod = currentRotation % 360;

    // Ensure we always spin forward
    let targetRotation = currentRotation - currentMod + baseTargetAngle;
    if (targetRotation <= currentRotation) {
      targetRotation += 360;
    }

    const finalRotation = targetRotation + extraSpins + randomOffset;
    setRotation(finalRotation);

    // 4. Resolve
    setTimeout(() => {
      setResultNumber(winningNumber);
      setSpinning(false);
      onApplyResult(delta);

      if (win) {
        toast.success(`🎉 ¡GANASTE! Salió el ${winningNumber}. Ganancia: $${parsedAmount * (multiplier - 1)}`);
      } else {
        toast.error(`💸 Perdiste. Salió el ${winningNumber}.`);
      }
    }, 3800);
  };

  // --- RENDERING HELPERS ---

  const renderNumberBtn = (num: number) => {
    const color = getNumberColor(num);
    const isSelected = bet?.type === "number" && bet.value === num;
    let bgClass = "";
    if (color === "rojo") bgClass = "bg-red-600 hover:bg-red-500";
    else if (color === "negro") bgClass = "bg-zinc-800 hover:bg-zinc-700";
    else bgClass = "bg-emerald-600 hover:bg-emerald-500";

    return (
      <button
        key={num}
        disabled={spinning}
        onClick={() => setBet({ type: "number", value: num })}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-sm text-sm font-bold text-white transition-all shadow-md",
          bgClass,
          isSelected && "ring-4 ring-amber-400 z-10 scale-110",
          spinning && "opacity-50 cursor-not-allowed"
        )}
      >
        {num}
      </button>
    );
  };

  // Rows for the board
  // Top: 3, 6, 9...
  // Mid: 2, 5, 8...
  // Bot: 1, 4, 7...
  const rows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-sm p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => !spinning && onClose()} />

      <div className="relative w-full max-w-5xl rounded-xl border border-amber-600/50 bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 py-8 shadow-2xl md:px-8" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-amber-500 drop-shadow-sm tracking-wide">
              {casinoName}
            </h2>
            <p className="text-zinc-400 font-medium">Ruleta Secuencial (1-36)</p>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={spinning}
            className="border-amber-600/30 text-amber-500 hover:bg-amber-900/20 hover:text-amber-400"
          >
            Cerrar
          </Button>
        </div>

        <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-center">

          {/* LEFT: Wheel & Status */}
          <div className="flex flex-col items-center gap-6 xl:w-1/3">
            <div className="relative h-72 w-72 md:h-80 md:w-80 shadow-2xl rounded-full">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-[12px] border-amber-800 bg-amber-950 shadow-[0_0_50px_rgba(0,0,0,0.8)]"></div>

              {/* Spinning Wheel */}
              <div
                className="absolute inset-3 rounded-full overflow-hidden transition-transform duration-[3800ms] cubic-bezier(0.15, 0, 0, 1)"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {/* Conic Gradient for Wheel Segments */}
                <div
                  className="relative h-full w-full rounded-full"
                  style={{
                    background: `conic-gradient(
                      ${WHEEL_ORDER.map((num, i) => {
                      const color = num === 0 ? "#059669" : (num % 2 !== 0 ? "#b91c1c" : "#18181b");
                      const start = i * (360 / 37);
                      const end = (i + 1) * (360 / 37);
                      return `${color} ${start}deg ${end}deg`;
                    }).join(", ")}
                    )`
                  }}
                >
                  {/* Render Numbers */}
                  {WHEEL_ORDER.map((num, i) => {
                    const angle = (i + 0.5) * (360 / 37);
                    return (
                      <div
                        key={i}
                        className="absolute left-1/2 top-1/2 -ml-[1px] -mt-[50%] h-[50%] w-[2px] origin-bottom font-bold text-white"
                        style={{
                          transform: `rotate(${angle}deg)`
                        }}
                      >
                        <span className="block mt-4 text-[12px] font-bold text-center w-6 -ml-3"
                          style={{ transform: 'rotate(0deg)' }}>
                          {num}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Inner decorative circle */}
                <div className="absolute inset-[30%] rounded-full border-[6px] border-amber-700 bg-zinc-900 flex items-center justify-center shadow-inner">
                  <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_15px_orange]"></div>
                </div>
              </div>

              {/* Marker/Pointer */}
              <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-20 filter drop-shadow-lg">
                <div className="h-8 w-6 bg-gradient-to-b from-amber-300 to-amber-600 clip-path-polygon-[50%_100%,0_0,100%_0]" style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }} />
              </div>

              {/* Result Overlay */}
              {resultNumber !== null && !spinning && (
                <div className="absolute inset-0 flex items-center justify-center z-30 animate-in fade-in zoom-in duration-500">
                  <div className="bg-black/80 backdrop-blur-md border-2 border-amber-500 px-8 py-4 rounded-2xl text-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <p className="text-xs text-amber-100 uppercase font-bold tracking-widest mb-1">Ganador</p>
                    <p className={cn(
                      "text-5xl font-black drop-shadow-md",
                      getNumberColor(resultNumber) === "rojo" ? "text-red-500" :
                        getNumberColor(resultNumber) === "negro" ? "text-zinc-100" : "text-emerald-500"
                    )}>
                      {resultNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-sm uppercase tracking-wider">Jugador</span>
                <span className="font-bold text-zinc-200">{playerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm uppercase tracking-wider">Saldo Disponible</span>
                <span className="font-mono text-xl font-bold text-emerald-400">${playerMoney}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Betting Table */}
          <div className="flex flex-col gap-6 xl:w-2/3 select-none">

            {/* Bet Controls */}
            <div className="flex flex-col sm:flex-row items-end gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="w-full sm:flex-1 space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Monto de la apuesta</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors">$</span>
                  <Input
                    type="number"
                    min="1"
                    max={playerMoney}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7 h-11 bg-zinc-950 border-zinc-700 text-white font-mono text-lg focus:ring-amber-500 focus:border-amber-500"
                    disabled={spinning}
                  />
                </div>
              </div>
              <Button
                onClick={handleSpin}
                disabled={!canBet || spinning}
                className={cn(
                  "h-11 w-full sm:w-auto min-w-[140px] font-bold uppercase tracking-wide text-lg transition-all duration-300 transform",
                  spinning ? "bg-zinc-800 text-zinc-500 scale-95" : "bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95"
                )}
              >
                {spinning ? "Girando..." : "GIRAR"}
              </Button>
            </div>

            {/* THE BOARD */}
            <div className="relative rounded-xl border-[8px] border-amber-900 bg-emerald-900 p-2 lg:p-6 shadow-2xl overflow-x-auto">

              {/* Felt Texture Overlay */}
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

              <div className="min-w-max flex flex-col gap-3 relative z-10">
                {/* Main Grid: 0 and Numbers */}
                <div className="flex items-stretch gap-1.5">
                  {/* 0 Column */}
                  <button
                    onClick={() => setBet({ type: "number", value: 0 })}
                    disabled={spinning}
                    className={cn(
                      "flex w-14 items-center justify-center rounded-l-md border-2 border-emerald-400/30 font-bold text-xl hover:bg-emerald-600 transition-all duration-200",
                      bet?.type === "number" && bet.value === 0 ? "bg-emerald-500 ring-4 ring-amber-400 z-10 text-white shadow-lg scale-105" : "bg-emerald-700 text-emerald-100"
                    )}
                  >
                    0
                  </button>

                  {/* 1-36 Grid */}
                  <div className="grid grid-rows-3 gap-1.5">
                    {rows.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-1.5">
                        {row.map((num) => renderNumberBtn(num))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outside Bets Row */}
                <div className="grid grid-cols-4 gap-2 ml-[3.6rem]">

                  {/* Even/Odd Group */}
                  <div className="col-span-1 grid grid-cols-1 gap-1">
                    <button
                      onClick={() => setBet({ type: "parity", value: "par" })}
                      disabled={spinning}
                      className={cn(
                        "h-10 rounded border-2 border-emerald-400/20 text-xs font-bold uppercase tracking-widest transition-all",
                        bet?.type === "parity" && bet.value === "par"
                          ? "bg-emerald-600 border-emerald-400 text-white ring-2 ring-amber-400 shadow-lg"
                          : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
                      )}
                    >
                      PAR
                    </button>
                    <button
                      onClick={() => setBet({ type: "parity", value: "impar" })}
                      disabled={spinning}
                      className={cn(
                        "h-10 rounded border-2 border-emerald-400/20 text-xs font-bold uppercase tracking-widest transition-all",
                        bet?.type === "parity" && bet.value === "impar"
                          ? "bg-emerald-600 border-emerald-400 text-white ring-2 ring-amber-400 shadow-lg"
                          : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
                      )}
                    >
                      IMPAR
                    </button>
                  </div>

                  {/* Red/Black Group */}
                  <div className="col-span-1 grid grid-cols-1 gap-1">
                    <button
                      onClick={() => setBet({ type: "color", value: "rojo" })}
                      disabled={spinning}
                      className={cn(
                        "h-10 rounded border-2 border-red-900/50 flex items-center justify-center gap-2 transition-all",
                        bet?.type === "color" && bet.value === "rojo"
                          ? "bg-red-600 ring-2 ring-amber-400 shadow-lg border-red-400"
                          : "bg-red-800 hover:bg-red-700"
                      )}
                    >
                      <div className="w-4 h-4 bg-red-500 rotate-45 border border-red-900 rounded-[1px]" />
                      <span className="text-white font-bold text-xs">ROJO</span>
                    </button>
                    <button
                      onClick={() => setBet({ type: "color", value: "negro" })}
                      disabled={spinning}
                      className={cn(
                        "h-10 rounded border-2 border-zinc-700 flex items-center justify-center gap-2 transition-all",
                        bet?.type === "color" && bet.value === "negro"
                          ? "bg-zinc-800 ring-2 ring-amber-400 shadow-lg border-zinc-500"
                          : "bg-zinc-900 hover:bg-zinc-800"
                      )}
                    >
                      <div className="w-4 h-4 bg-zinc-600 rotate-45 border border-black rounded-[1px]" />
                      <span className="text-white font-bold text-xs">NEGRO</span>
                    </button>
                  </div>

                  <div className="col-span-2 flex items-center justify-center rounded border border-emerald-500/10 bg-emerald-900/30 p-2 text-center text-xs text-emerald-400/60 font-medium">
                    Suerte en el juego
                  </div>

                </div>
              </div>
            </div>

            {/* Current Bet Footer */}
            <div className="flex h-12 w-full items-center justify-center rounded-lg border border-amber-900/30 bg-black/40 px-6 backdrop-blur">
              {bet ? (
                <div className="flex items-center gap-2 text-lg animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-zinc-400">Apuesta a:</span>
                  <span className={cn(
                    "font-bold uppercase px-3 py-1 rounded bg-zinc-800 border border-zinc-700",
                    bet.type === "color" && bet.value === "rojo" && "text-red-500 border-red-900 bg-red-950/30",
                    bet.type === "color" && bet.value === "negro" && "text-zinc-300 border-zinc-600",
                    bet.type === "number" && "text-amber-400 border-amber-900/50",
                  )}>
                    {bet.type === "number" ? `Número ${bet.value}` : bet.value}
                  </span>
                  <span className="text-emerald-500 font-mono ml-2">
                    (Paga x{bet.type === "number" ? "36" : "2"})
                  </span>
                </div>
              ) : (
                <span className="text-zinc-500 italic">Selecciona una ficha para apostar...</span>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
