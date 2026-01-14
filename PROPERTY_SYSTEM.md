# Sistema de Propiedades - Monopoly Casino y Tapas

## 📋 Descripción General
Sistema completo de compra, gestión y visualización de propiedades en el juego de Monopoly.

---

## 🎯 Características Implementadas

### 1. **Modal de Tarjeta de Propiedad** (`PropertyCardModal.tsx`)
Componente que se abre cuando un jugador cae en una casilla:

**Características:**
- ✅ Mostrar información detallada de la propiedad
- ✅ Código de color según tipo de casilla
- ✅ Botones de Comprar/Pasar
- ✅ Confirmación antes de comprar
- ✅ Validación de dinero disponible
- ✅ Información de propietario si está comprada

**Tipos de Casillas Soportadas:**
- Propiedades (comprable)
- Estaciones (comprable)
- Compañías (comprable)
- Hacienda, Lotería, Casino, Cárcel, Inicio, Impuestos

---

### 2. **Pantalla de Juego Actualizada** (`MonopolyScreen.tsx`)

**Cambios Realizados:**
- Integración de estructura de propiedades del tablero
- Modal de compra automático al caer en casilla
- Estado para guardar propiedades compradas por jugador
- Sistema de lógica de compra

**Datos de Propiedades:**
```tsx
interface PlayerProperty {
  propertyId: number;  // ID de la casilla en el tablero
  level?: number;      // Nivel de construcción (casas/hoteles)
}
```

**Flujo de Compra:**
1. Jugador lanza los dados → cae en casilla
2. Se abre el modal con la tarjeta de propiedad
3. Jugador decide comprar o pasar
4. Si compra: dinero se resta y propiedad se añade al inventario
5. Se muestra distintivo visual en la casilla

---

### 3. **Distintivos de Propiedades Compradas**
Pequeños círculos de color del jugador sobre las casillas compradas:

```tsx
{/* Distintivos de propiedades compradas */}
{playersInGame.map((player) =>
  player.properties.map((prop) => {
    // Renderiza círculo pequeño del color del jugador
    // Posicionado en la casilla comprada
  })
)}
```

**Características:**
- Color diferente por jugador
- Tooltip con información de la propiedad
- Tamaño pequeño (3x3px) para no obstruir el tablero
- Múltiples propiedades distribuidas alrededor de la casilla

---

### 4. **Pantalla de Inventario Mejorada** (`InventoryScreen.tsx`)

**Nueva Pestaña de Propiedades:**
- Muestra todas las propiedades compradas del jugador
- Estadísticas: total de propiedades, inversión total, valor promedio
- Tarjetas por propiedad con precio y nivel
- Interfaz intuitiva y visual

**Pestañas Disponibles:**
- 🏠 Propiedades
- 👤 Avatars
- 🎨 Temas

---

## 🔗 Integración del Sistema

### Flujo de Datos:
```
MonopolyScreen (datos de jugadores + propiedades)
    ↓
rollDice() → tirar dados
    ↓
Mostrar PropertyCardModal
    ↓
onBuy() → handleBuyProperty()
    ↓
Actualizar estado de jugador + propiedades
    ↓
Mostrar distintivos en tablero
    ↓
InventoryScreen recibe playerProperties
```

---

## 💰 Estructura de Precios

Las propiedades están clasificadas por precio:
- **Económicas:** San José, Juan Ramón Jiménez, Calle Perú (60-100)
- **Medias:** Calle de La Plata, Calle de Alicante (140-160)
- **Premium:** Calle Costa Blanca, Calle de la Dorada (300-400)
- **Estaciones:** 200 pts cada una
- **Compañías:** 150 pts cada una

---

## 🎮 Cómo Usar

### Comprar una Propiedad:
1. Lanzar dados y caer en una casilla comprable
2. Se abre el modal automáticamente
3. Leer información de la propiedad
4. Click en "Comprar" si tienes dinero
5. Confirmar la compra
6. La propiedad aparece en tu inventario

### Ver Propiedades:
1. Click en el nombre del jugador o en el botón del inventario
2. Ir a la pestaña "Propiedades"
3. Ver todas tus casillas compradas con estadísticas

### Distintivos Visuales:
- Los pequeños círculos de color en las casillas indican propiedades compradas
- El color corresponde al jugador dueño
- Puedes pasar el mouse para ver el nombre de la propiedad

---

## 🔧 Componentes Clave

### PropertyCardModal
```tsx
<PropertyCardModal
  isOpen={showPropertyModal}
  property={selectedProperty}
  playerMoney={playerMoney}
  onClose={() => setShowPropertyModal(false)}
  onBuy={handleBuyProperty}
  onPass={handlePassProperty}
/>
```

### Estructura de Property
```tsx
interface Property {
  id: number;
  nombre: string;
  tipo: 'propiedad' | 'estacion' | 'compañia' | ...
  precio?: number;
  alquiler?: number;
  dueno?: string;
  nivel?: number;
}
```

---

## 📊 Estados Manejados

**En MonopolyScreen:**
- `selectedProperty`: Propiedad actual seleccionada
- `showPropertyModal`: Control de visibilidad del modal
- `playersInGame[].properties`: Array de propiedades de cada jugador

**En InventoryScreen:**
- `playerProperties`: Props pasadas con propiedades del jugador
- `selectedCategory`: Categoría de inventario activa

---

## 🎨 Estilos y Diseño

### Colores por Tipo:
- **Propiedad:** Naranja/Ámbar
- **Estación:** Gris
- **Compañía:** Púrpura
- **Hacienda:** Verde
- **Lotería:** Azul
- **Cárcel:** Rojo
- **Inicio/Casino:** Amarillo/Ámbar

### Tema General:
- Fondo oscuro con degradado rojo-ámbar
- Bordes color ámbar (amber-500)
- Contraste blanco para texto
- Tooltips y efectos hover suave

---

## ⚠️ Nota Importante

El sistema está preparado para integrarse con el backend. Actualmente, los datos de propiedades se manejan en el frontend. Para persistencia:

1. Enviar compra al backend: `POST /comprar-propiedad`
2. Guardar propiedades en base de datos
3. Recuperar propiedades al iniciar juego: `GET /propiedades-jugador`

---

## 🚀 Próximas Mejoras Sugeridas

- [ ] Sistema de alquileres dinámico
- [ ] Construcción de casas y hoteles
- [ ] Hipotecas
- [ ] Transacciones entre jugadores
- [ ] Animaciones de compra
- [ ] Sistema de logros por propiedades
- [ ] Persistencia en base de datos

---

Implementado por: **GitHub Copilot**
Fecha: **18/12/2025**
