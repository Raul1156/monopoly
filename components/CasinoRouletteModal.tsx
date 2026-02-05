import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export type RouletteBet = "rojo" | "negro" | "verde";

interface CasinoRouletteModalProps {
  isOpen: boolean;
  playerMoney: number;
  playerName: string;
  casinoName?: string;
  onApplyResult: (delta: number) => void;
  onClose: () => void;
}

const redNumbers = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36
]);

const getColor = (num: number): RouletteBet => {
  if (num === 0) return "verde";
  return redNumbers.has(num) ? "rojo" : "negro";
};

const getMultiplier = (bet: RouletteBet) => {
  if (bet === "verde") return 14;
  return 2;
};

export function CasinoRouletteModal({
  isOpen,
  playerMoney,
  playerName,
  casinoName = "Casino",
  onApplyResult,
  onClose
}: CasinoRouletteModalProps) {
  const [betType, setBetType] = useState<RouletteBet>("rojo");
  const [betAmount, setBetAmount] = useState<number>(50);
  const [spinning, setSpinning] = useState(false);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  const betOptions = useMemo(() => [25, 50, 100, 200, 300], []);

  if (!isOpen) return null;

  const canBet = betAmount > 0 && betAmount <= playerMoney && !spinning;

  const handleSpin = () => {
    if (!canBet) {
      if (betAmount <= 0) {
        toast.error("Selecciona una apuesta válida");
      } else {
        toast.error("No tienes dinero suficiente para esa apuesta");
      }
      return;
    }

    setSpinning(true);
    setResultNumber(null);

    const number = Math.floor(Math.random() * 37);
    const color = getColor(number);
    const multiplier = getMultiplier(betType);

    const win = color === betType;
    const delta = win ? betAmount * (multiplier - 1) : -betAmount;

    const extraRotation = 720 + Math.floor(Math.random() * 360);
    setRotation((prev) => prev + extraRotation);

    setTimeout(() => {
      setResultNumber(number);
      onApplyResult(delta);

      if (win) {
        toast.success(`🎉 ${playerName} ganó ${delta} pts en la ruleta`);
      } else {
        toast.error(`😵 ${playerName} perdió ${Math.abs(delta)} pts en la ruleta`);
      }

      setSpinning(false);
    }, 1400);
  };

  const resultColor = resultNumber !== null ? getColor(resultNumber) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[95%] max-w-xl rounded-2xl border border-amber-500/40 bg-gradient-to-br from-zinc-900 via-zinc-800 to-amber-900/60 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-200">🎰 {casinoName}</h2>
            <p className="text-sm text-amber-100/80">Ruleta del casino</p>
          </div>
          <Button variant="outline" className="border-amber-500/40 text-amber-100 hover:bg-amber-500/10" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative h-56 w-56 rounded-full border-4 border-amber-400/70 bg-black">
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background:
                    "conic-gradient(#1f2937 0deg 15deg, #b91c1c 15deg 45deg, #111827 45deg 75deg, #b91c1c 75deg 105deg, #111827 105deg 135deg, #b91c1c 135deg 165deg, #111827 165deg 195deg, #b91c1c 195deg 225deg, #111827 225deg 255deg, #b91c1c 255deg 285deg, #111827 285deg 315deg, #b91c1c 315deg 345deg, #111827 345deg 360deg)",
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)" : "transform 0.4s ease"
                }}
              />
              <div className="absolute left-1/2 top-[-10px] h-5 w-5 -translate-x-1/2 rounded-full bg-amber-300 shadow-lg" />
              <div className="absolute inset-10 rounded-full border border-amber-300/60 bg-black/70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-zinc-900">
                  {spinning ? "Girando..." : "Ruleta"}
                </div>
              </div>
            </div>

            {resultNumber !== null && (
              <div className="rounded-xl border border-amber-500/30 bg-black/40 px-4 py-2 text-center">
                <p className="text-sm text-amber-100">Resultado</p>
                <p className="text-2xl font-bold text-amber-200">{resultNumber}</p>
                <p
                  className={`text-xs font-semibold uppercase ${
                    resultColor === "rojo"
                      ? "text-red-400"
                      : resultColor === "negro"
                      ? "text-zinc-300"
                      : "text-emerald-400"
                  }`}
                >
                  {resultColor}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-black/40 p-4">
              <p className="text-sm text-amber-100/80">Jugador</p>
              <p className="text-lg font-bold text-amber-200">{playerName}</p>
              <p className="text-xs text-amber-100/70">Saldo: {playerMoney} pts</p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-black/40 p-4">
              <p className="text-sm text-amber-100/80">Apuesta</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {betOptions.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className={`border-amber-500/40 text-amber-100 hover:bg-amber-500/10 ${
                      betAmount === amount ? "bg-amber-500/20" : ""
                    }`}
                    onClick={() => setBetAmount(amount)}
                  >
                    {amount} pts
                  </Button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button
                  className={`w-full ${betType === "rojo" ? "bg-red-600" : "bg-red-600/30"}`}
                  onClick={() => setBetType("rojo")}
                >
                  Rojo
                </Button>
                <Button
                  className={`w-full ${betType === "negro" ? "bg-zinc-800" : "bg-zinc-800/40"}`}
                  onClick={() => setBetType("negro")}
                >
                  Negro
                </Button>
                <Button
                  className={`w-full ${betType === "verde" ? "bg-emerald-600" : "bg-emerald-600/30"}`}
                  onClick={() => setBetType("verde")}
                >
                  Verde (x14)
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSpin}
              disabled={!canBet}
              className="w-full bg-gradient-to-r from-amber-500 to-red-600 text-white"
            >
              {spinning ? "Girando..." : "Girar ruleta"}
            </Button>

            <p className="text-xs text-amber-100/70">
              Rojo/Negro paga x2. Verde paga x14. Si pierdes, se descuenta la apuesta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
