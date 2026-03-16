import { Button } from "./ui/button";
import { PropertyInfoCard } from "./PropertyInfoCard";
import type { Property } from "./PropertyCardModal";

interface PropertyInfoModalProps {
  isOpen: boolean;
  property: Property | null;
  level: number;
  ownerName?: string;
  onClose: () => void;
}

export function PropertyInfoModal({ isOpen, property, level, ownerName, onClose }: PropertyInfoModalProps) {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose} />
      <div className="pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-3 flex justify-end">
          <Button size="sm" className="bg-gray-600 hover:bg-gray-700 text-white" onClick={onClose}>
            Cerrar
          </Button>
        </div>
        <PropertyInfoCard property={property} level={level} ownerName={ownerName} />
      </div>
    </div>
  );
}
