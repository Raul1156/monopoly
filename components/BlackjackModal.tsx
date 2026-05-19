import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface BlackjackModalProps {
  isOpen: boolean;
  playerMoney: number;
  playerName: string;
  casinoName?: string;
  onApplyResult: (delta: number) => void;
  onClose: () => void;
}

type Suit = "S" | "H" | "D" | "C";

type Card = {
  rank: string;
  suit: Suit;
  value: number;
};

type Phase = "idle" | "player" | "dealer" | "result";

type Outcome = "win" | "lose" | "push" | "blackjack";

const MIN_BET = 100;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const SUITS: Suit[] = ["S", "H", "D", "C"];

const buildDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const value = rank === "A" ? 11 : ["J", "Q", "K"].includes(rank) ? 10 : Number(rank);
      deck.push({ rank, suit, value });
    }
  }
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const drawCard = (deck: Card[]) => {
  const [card, ...rest] = deck;
  return { card, deck: rest };
};

const getHandValue = (hand: Card[]) => {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    total += card.value;
    if (card.rank === "A") aces += 1;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
};

const suitLabelMap: Record<Suit, string> = {
  S: "SPADE",
  H: "HEART",
  D: "DIAMOND",
  C: "CLUB"
};

const suitSymbolMap: Record<Suit, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣"
};

export function BlackjackModal({
  isOpen,
  playerMoney,
  playerName,
  casinoName = "Gran Casino",
  onApplyResult,
  onClose
}: BlackjackModalProps) {
  const [betInput, setBetInput] = useState("100");
  const [currentBet, setCurrentBet] = useState<number | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [lastDelta, setLastDelta] = useState<number>(0);

  const parsedBet = useMemo(() => Number.parseInt(betInput, 10) || 0, [betInput]);

  // Reset only when modal opens, NOT when playerMoney changes
  useEffect(() => {
    if (!isOpen) return;
    setBetInput(playerMoney < MIN_BET ? String(playerMoney) : String(MIN_BET));
    setCurrentBet(null);
    setDeck([]);
    setPlayerHand([]);
    setDealerHand([]);
    setPhase("idle");
    setMessage(null);
    setHandsPlayed(0);
    setLastDelta(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const playerTotal = getHandValue(playerHand);
  const dealerTotal = getHandValue(dealerHand);

  const isAllIn = playerMoney > 0 && playerMoney < MIN_BET;
  const minBetOk = isAllIn ? parsedBet > 0 : parsedBet >= MIN_BET;
  const canDeal = phase === "idle" && minBetOk && parsedBet <= playerMoney && handsPlayed < 5;
  const canHit = phase === "player" && playerTotal < 21;
  const canStand = phase === "player";
  const canDouble =
    phase === "player" &&
    playerHand.length === 2 &&
    currentBet !== null &&
    playerMoney >= currentBet * 2;
  const canClose = (phase === "idle" || phase === "result") && handsPlayed >= 1;

  const resolveRound = (_result: Outcome, delta: number, text: string) => {
    setMessage(text);
    setLastDelta(delta);
    setPhase("result");
    setHandsPlayed((prev) => prev + 1);
    onApplyResult(delta);
  };

  const finishDealerTurn = async (workingDeck: Card[], workingDealer: Card[]) => {
    let deckState = [...workingDeck];
    let dealerState = [...workingDealer];

    // Reveal dealer's second card first
    setDealerHand([...dealerState]);
    await new Promise((r) => setTimeout(r, 600));

    // Dealer draws until 17+
    while (getHandValue(dealerState) < 17) {
      const draw = drawCard(deckState);
      deckState = draw.deck;
      if (draw.card) dealerState = [...dealerState, draw.card];
      setDeck(deckState);
      setDealerHand(dealerState);
      await new Promise((r) => setTimeout(r, 700));
    }

    const finalDealer = getHandValue(dealerState);
    const betValue = currentBet ?? 0;

    if (finalDealer > 21) {
      resolveRound("win", betValue, "El dealer se pasó de 21. ¡Ganaste!");
      return;
    }

    if (playerTotal > finalDealer) {
      resolveRound("win", betValue, "¡Ganaste la mano!");
      return;
    }

    if (playerTotal < finalDealer) {
      resolveRound("lose", -betValue, "El dealer gana.");
      return;
    }

    resolveRound("push", 0, "Empate. Recuperas tu apuesta.");
  };

  const handleDeal = () => {
    if (!canDeal) return;

    const newDeck = shuffleDeck(buildDeck());
    let deckState = [...newDeck];

    const first = drawCard(deckState);
    deckState = first.deck;
    const second = drawCard(deckState);
    deckState = second.deck;
    const third = drawCard(deckState);
    deckState = third.deck;
    const fourth = drawCard(deckState);
    deckState = fourth.deck;

    const newPlayer = [first.card, third.card].filter(Boolean) as Card[];
    const newDealer = [second.card, fourth.card].filter(Boolean) as Card[];

    setDeck(deckState);
    setPlayerHand(newPlayer);
    setDealerHand(newDealer);
    setCurrentBet(parsedBet);
    setMessage(null);
    setPhase("player");

    const playerValue = getHandValue(newPlayer);
    const dealerValue = getHandValue(newDealer);
    const playerBlackjack = playerValue === 21 && newPlayer.length === 2;
    const dealerBlackjack = dealerValue === 21 && newDealer.length === 2;

    if (playerBlackjack) {
      if (dealerBlackjack) {
        resolveRound("push", 0, "Blackjack doble. Empate.");
        return;
      }

      const payout = Math.floor(parsedBet * 1.5);
      resolveRound("blackjack", payout, "Blackjack. Ganaste 3:2.");
    }
  };

  const handleHit = async () => {
    if (!canHit) return;

    const draw = drawCard(deck);
    const newHand = draw.card ? [...playerHand, draw.card] : [...playerHand];
    setDeck(draw.deck);
    setPlayerHand(newHand);

    const total = getHandValue(newHand);
    const betValue = currentBet ?? 0;

    if (total > 21) {
      resolveRound("lose", -betValue, "Te pasaste de 21.");
      return;
    }

    if (total === 21) {
      // Auto-win with 21!
      setPhase("dealer");
      await finishDealerTurn(draw.deck, dealerHand);
    }
  };

  const handleStand = async () => {
    if (!canStand) return;
    setPhase("dealer");
    await finishDealerTurn(deck, dealerHand);
  };

  const handleDouble = async () => {
    if (!canDouble || currentBet === null) return;

    const nextBet = currentBet * 2;
    setCurrentBet(nextBet);

    const draw = drawCard(deck);
    const newHand = draw.card ? [...playerHand, draw.card] : [...playerHand];
    setDeck(draw.deck);
    setPlayerHand(newHand);

    const total = getHandValue(newHand);
    if (total > 21) {
      resolveRound("lose", -nextBet, "Te pasaste de 21 tras doblar.");
      return;
    }

    setPhase("dealer");
    await finishDealerTurn(draw.deck, dealerHand);
  };

  const handleReset = () => {
    setBetInput(playerMoney < MIN_BET ? String(playerMoney) : String(MIN_BET));
    setCurrentBet(null);
    setDeck([]);
    setPlayerHand([]);
    setDealerHand([]);
    setPhase("idle");
    setMessage(null);
    setLastDelta(0);
  };

  const dealerCardsDisplay = phase === "player"
    ? [dealerHand[0], null]
    : dealerHand;

  const renderCard = (card: Card) => {
    const isRed = card.suit === "H" || card.suit === "D";
    const suitClass = isRed ? "text-red-500" : "text-zinc-800";
    const symbol = suitSymbolMap[card.suit];

    return (
      <div
        className="relative flex h-32 w-24 flex-col justify-between rounded-xl border border-amber-600/40 bg-gradient-to-b from-zinc-50 to-zinc-200 p-2 text-zinc-900 shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
      >
        <div className="flex flex-col">
          <span className={`text-sm font-bold leading-none ${suitClass}`}>{card.rank}</span>
          <span className={`text-sm font-bold leading-none ${suitClass}`}>{symbol}</span>
        </div>
        <span className={`text-3xl font-black ${suitClass} self-center`}>{symbol}</span>
        <div className="flex flex-col items-end">
          <span className={`text-sm font-bold leading-none ${suitClass}`}>{card.rank}</span>
          <span className={`text-sm font-bold leading-none ${suitClass}`}>{symbol}</span>
        </div>
        <span className="absolute bottom-1 left-1 text-[9px] text-zinc-500">
          {suitLabelMap[card.suit]}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top,#0f766e_0%,#020617_60%)] p-4">
      <div className="absolute inset-0" onClick={() => canClose && onClose()} />

      <div
        className="relative w-full max-w-5xl rounded-3xl border border-amber-600/50 bg-[radial-gradient(circle_at_top,#4a1c1c_0%,#1a0a0a_45%,#020617_100%)] px-6 py-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-amber-400 tracking-wide">{casinoName}</h2>
            <p className="text-zinc-300 text-sm">Blackjack para {playerName}</p>
            <p className="text-[11px] text-amber-200">Mano {Math.min(handsPlayed + 1, 5)} / 5</p>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={!canClose}
            className="border-amber-600/40 text-amber-300 hover:bg-amber-900/20 disabled:opacity-50"
          >
            Cerrar
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-amber-700/30 bg-zinc-950/60 p-4 shadow-[inset_0_0_30px_rgba(5,150,105,0.2)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-amber-300">Dealer</p>
                {phase !== "player" && dealerHand.length > 0 && (
                  <p className="text-xs text-amber-200">Total: {dealerTotal}</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {dealerCardsDisplay.length === 0 && (
                  <span className="text-zinc-300 text-sm">Sin cartas</span>
                )}
                {dealerCardsDisplay.map((card, index) => (
                  <div key={`dealer-${card?.rank ?? "hidden"}-${card?.suit ?? "x"}-${index}`} className="transition-all duration-300 ease-out">
                    {card ? renderCard(card) : (
                      <div className="flex h-32 w-24 items-center justify-center rounded-xl border-2 border-amber-600/50 bg-gradient-to-br from-amber-800 to-zinc-950 text-2xl font-bold text-amber-300 shadow-lg">
                        ?
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-700/30 bg-zinc-950/60 p-4 shadow-[inset_0_0_30px_rgba(16,185,129,0.2)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-amber-300">Jugador</p>
                {playerHand.length > 0 && (
                  <p className="text-xs text-amber-200">Total: {playerTotal}</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {playerHand.length === 0 && (
                  <span className="text-zinc-300 text-sm">Sin cartas</span>
                )}
                {playerHand.map((card, index) => (
                  <div key={`player-${card.rank}-${card.suit}-${index}`} className="transition-all duration-300 ease-out animate-in slide-in-from-top-4">
                    {renderCard(card)}
                  </div>
                ))}
              </div>
            </div>

            {phase === "result" && message && (
              <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-900/80 to-zinc-900/90 p-6 text-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <p className={`text-4xl font-black mb-2 ${lastDelta > 0 ? 'text-amber-400' : lastDelta < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {lastDelta > 0 ? '🎉 ¡GANASTE!' : lastDelta < 0 ? '💸 PERDISTE' : '🤝 EMPATE'}
                </p>
                <p className={`text-5xl font-black mb-3 ${lastDelta > 0 ? 'text-amber-300' : lastDelta < 0 ? 'text-red-300' : 'text-amber-300'}`}>
                  {lastDelta >= 0 ? '+' : ''}{lastDelta}$
                </p>
                <p className="text-lg text-zinc-300">{message}</p>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-amber-700/30 bg-zinc-950/70 p-5">
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">Saldo: ${playerMoney}</p>
              <p className="text-sm text-zinc-300">Apuesta actual: ${currentBet ?? 0}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-amber-400">Apuesta</label>
              <Input
                value={betInput}
                onChange={(e) => setBetInput(e.target.value.replace(/[^0-9]/g, ""))}
                disabled={phase !== "idle"}
                className="bg-zinc-900 border-amber-700/40 text-amber-100"
              />
              <p className="text-[11px] text-zinc-400">
                Minimo ${MIN_BET} {isAllIn ? "(all-in obligado)" : ""}
              </p>
            </div>

            <div className="grid gap-2">
              {phase === "idle" && (
                <Button
                  onClick={handleDeal}
                  disabled={!canDeal}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3"
                >
                  🃏 Repartir
                </Button>
              )}

              {phase === "player" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleHit}
                      disabled={!canHit}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3"
                    >
                      👆 Pedir
                    </Button>
                    <Button
                      onClick={handleStand}
                      disabled={!canStand}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-3"
                    >
                      ✋ Plantarse
                    </Button>
                  </div>
                  <Button
                    onClick={handleDouble}
                    disabled={!canDouble}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 disabled:opacity-40"
                  >
                    💰 Doblar (x2)
                  </Button>
                </>
              )}

              {phase === "dealer" && (
                <div className="text-center text-amber-300 py-3 animate-pulse">
                  El dealer roba cartas...
                </div>
              )}

              {phase === "result" && (
                <Button
                  onClick={handleReset}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3"
                >
                  🔄 Nueva mano
                </Button>
              )}
            </div>

            <div className="text-[11px] text-zinc-400">
              Reglas: 1 baraja, dealer se planta en 17, blackjack paga 3:2. Minimo 1 mano, maximo 5.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
