import { Button } from "./ui/button";

interface TramCardModalProps {
  isOpen: boolean;
  stationName: string;
  nextStationPosition: number;
  onUseTram: () => void;
  onPass: () => void;
}

export function TramCardModal({
  isOpen,
  stationName,
  nextStationPosition,
  onUseTram,
  onPass,
}: TramCardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={onPass} />

      {/*tram*/}
      <div className="relative z-10 w-80 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-gray-700 border-4 border-gray-500 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-gray-700 text-gray-100 p-6 text-center border-b-4 border-gray-500">
            <h2 className="text-2xl font-bold uppercase tracking-wider">{stationName}</h2>
            <p className="text-sm mt-1 opacity-80">Estacion Tram</p>
          </div>

          <div className="bg-white p-6 space-y-4 text-center">
            <p className="text-gray-800 font-semibold">Tienes estaciones consecutivas compradas.</p>
            <p className="text-gray-700">
              Puedes usar el tram para ir directamente a la siguiente estacion comprada.
            </p>
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
              <p className="text-sm text-gray-600">Destino</p>
              <p className="text-lg font-bold text-gray-900">Casilla {nextStationPosition}</p>
            </div>
          </div>

          <div className="bg-gray-100 border-t-4 border-gray-300 px-6 py-4 space-y-3">
            <Button
              onClick={onUseTram}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-2"
            >
              🚋 USAR TRAM
            </Button>
            <Button
              onClick={onPass}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg py-2"
            >
              ➡️ PASAR
            </Button>
          </div>
        </div>
      </div>
      {/*tram*/}
    </div>
  );
}
