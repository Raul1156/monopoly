import type { Property } from "./PropertyCardModal";

interface PropertyInfoCardProps {
  property: Property;
  level: number;
  ownerName?: string;
}

const formatLevelLabel = (level: number) => {
  if (level <= 0) return "Sin casas";
  if (level >= 5) return "Hotel";
  return `${level} casa${level === 1 ? "" : "s"}`;
};

const getCurrentRent = (property: Property, level: number) => {
  if (property.tipo !== "propiedad") {
    return property.alquiler ?? 0;
  }

  if (level <= 0) return property.alquiler ?? 0;
  if (level === 1) return property.alquilerNivel1 ?? property.alquiler ?? 0;
  if (level === 2) return property.alquilerNivel2 ?? property.alquiler ?? 0;
  if (level === 3) return property.alquilerNivel3 ?? property.alquiler ?? 0;
  if (level === 4) return property.alquilerNivel4 ?? property.alquiler ?? 0;
  return property.alquilerHotel ?? property.alquiler ?? 0;
};

export function PropertyInfoCard({ property, level, ownerName }: PropertyInfoCardProps) {
  const currentRent = getCurrentRent(property, level);

  return (
    <div className="w-72 rounded-xl border border-gray-300 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500">Grupo</p>
          <p className="text-lg font-bold text-gray-900">{property.nombre}</p>
        </div>
        {property.colorGrupo && (
          <span className="rounded-full border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700">
            {property.colorGrupo}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Propietario</span>
          <span className="font-semibold text-gray-800">{ownerName ?? "Sin dueño"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Nivel actual</span>
          <span className="font-semibold text-gray-800">{formatLevelLabel(level)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Alquiler actual</span>
          <span className="font-semibold text-gray-900">{currentRent} pts</span>
        </div>
      </div>

      {property.tipo === "propiedad" && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
          <p className="mb-2 font-semibold text-gray-700">Resumen de alquileres</p>
          <div className="space-y-1 text-gray-600">
            <div className="flex items-center justify-between">
              <span>Base</span>
              <span>{property.alquiler ?? 0} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span>1 Casa</span>
              <span>{property.alquilerNivel1 ?? 0} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span>2 Casas</span>
              <span>{property.alquilerNivel2 ?? 0} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span>3 Casas</span>
              <span>{property.alquilerNivel3 ?? 0} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span>4 Casas</span>
              <span>{property.alquilerNivel4 ?? 0} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hotel</span>
              <span>{property.alquilerHotel ?? 0} pts</span>
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold text-gray-700">
              <span>Precio mejora</span>
              <span>{property.precioMejora ?? 0} pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
