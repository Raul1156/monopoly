# Monopoly Casino y Tapas — Memoria Tecnica (Hito 3)

Proyecto de segundo curso de DAM. Consiste en un juego de Monopoly online con tematica de casino y tapas espanolas, desarrollado como aplicacion fullstack con frontend en React, backend en C# y base de datos MySQL en Docker.

---

## Indice

1. [Resumen del MVP-1 y alcance implementado]
2. [Funcionalidades del MVP-1 (casos de uso implementados)]
3. [Arquitectura implementada y entorno de ejecucion]
4. [Base de datos y operaciones CRUD implementadas]
5. [Plan de pruebas ejecutado]
6. [Repositorio y control de versiones]

---

## 1. Resumen del MVP-1 y alcance implementado

En este hito se ha implementado el flujo completo de una partida de Monopoly: el usuario puede registrarse, iniciar sesion, acceder al menu principal y jugar una partida completa en la pantalla del tablero. La partida incluye tirar dados, moverse por el tablero, comprar propiedades, pagar alquileres, caer en la carcel, robar cartas de Comunidad y Suerte, y jugar a la ruleta del casino. El juego detecta la bancarrota de jugadores y determina al ganador.

Ademas del flujo de juego, se han desarrollado las interfaces de las pantallas complementarias (tienda, inventario, configuracion, ranking, perfil y eventos), aunque algunas de ellas todavia no estan completamente conectadas con el backend.

**Funcionalidades del MVP-1:**
- Registro e inicio de sesion de usuarios (con contrasenas hasheadas).
- Menu principal con navegacion a todas las secciones.
- Partida completa de Monopoly con tablero visual, dados, turnos, propiedades, alquileres, carcel, cartas y casino.
- Ranking de jugadores por ELO consultado desde la base de datos.
- Pantalla de perfil con estadisticas del usuario.
- Tienda con productos obtenidos de la base de datos.
- Inventario del usuario.

**Cambios respecto al diseno del Hito 2:**
- Se ha anadido una base de datos en memoria (InMemory) ademas de MySQL para gestionar las sesiones de juego activas, ya que los datos de partida no necesitan persistir tras reiniciar el servidor.
- Se ha incorporado una casilla de casino con una ruleta interactiva y efectos de sonido generados proceduralmente, que no estaba prevista en el diseno original.
- La mecanica de teletransporte entre estaciones (trams) tiene el backend preparado pero no se ha integrado todavia en el frontend.

---

## 2. Funcionalidades del MVP-1 (casos de uso implementados)

A continuacion se listan los casos de uso del proyecto con su estado actual de implementacion:

| ID | Caso de uso | Estado |
|---|---|---|
| CU01 | Registrarse | Implementado |
| CU02 | Iniciar sesion | Implementado |
| CU03 | Ver menu principal | Implementado |
| CU04 | Jugar partida de Monopoly | Implementado |
| CU05 | Tirar dados | Implementado |
| CU06 | Moverse por el tablero | Implementado |
| CU07 | Comprar propiedad | Implementado |
| CU08 | Pagar alquiler | Implementado |
| CU09 | Caer en la carcel | Implementado |
| CU10 | Robar carta de Comunidad | Implementado |
| CU11 | Robar carta de Suerte | Implementado |
| CU12 | Jugar a la ruleta del casino | Implementado |
| CU13 | Detectar bancarrota | Implementado |
| CU14 | Determinar ganador | Implementado |
| CU15 | Ver ranking de jugadores | Implementado |
| CU16 | Ver perfil de usuario | Implementado |
| CU17 | Teletransporte entre estaciones | En progreso (backend listo, falta frontend) |
| CU18 | Comprar en la tienda | En progreso (interfaz lista, falta logica de compra) |
| CU19 | Gestionar inventario | En progreso (interfaz lista, falta equipar/desequipar) |
| CU20 | Configurar ajustes | En progreso (interfaz lista, falta persistencia) |
| CU21 | Mejorar propiedades (casas/hoteles) | Pendiente |
| CU22 | Hipotecar propiedades | Pendiente |
| CU23 | Subastar propiedades | Pendiente |
| CU24 | Editar perfil | Pendiente |
| CU25 | Gestionar eventos | Pendiente |
| CU26 | Guardar resultado de partida en BD | Pendiente |

**Flujo completo funcional:** Un usuario puede registrarse, iniciar sesion, acceder al menu, entrar a una partida de Monopoly y jugarla de principio a fin (tirar dados, comprar propiedades, pagar alquileres, ir a la carcel, robar cartas, jugar en el casino) hasta que se determina un ganador.

---

## 3. Arquitectura implementada y entorno de ejecucion

### Tecnologias utilizadas por capa

| Capa | Tecnologia |
|---|---|
| **Frontend** | React + TypeScript |
| **Estilos** | TailwindCSS |
| **Bundler** | Vite |
| **Backend** | C# (ASP.NET Core) |
| **Base de datos persistente** | MySQL (en contenedor Docker) |
| **Base de datos en memoria** | Entity Framework Core InMemory |
| **ORM** | Entity Framework Core |

### Entorno de ejecucion

- **Frontend**: Se ejecuta en local mediante `npm run dev` (servidor de desarrollo de Vite) en el puerto 5173.
- **Backend**: Se ejecuta en local mediante `dotnet run` en el puerto 5000. En modo desarrollo incluye Swagger para poder probar los endpoints de la API.
- **Base de datos**: MySQL se ejecuta en un contenedor Docker en el puerto 3307. La base de datos se llama `monopoly_db`.

### Descripcion de la arquitectura

El backend sigue una arquitectura por capas:

- **Controllers**: Reciben las peticiones HTTP del frontend y las redirigen al servicio correspondiente. Hay controladores para el tablero, las cartas, las acciones del juego, la gestion de partidas, la tienda y los usuarios.
- **Services**: Contienen la logica de negocio. Cada area del juego tiene su propio servicio (usuarios, tablero, cartas, partida, sesiones de juego).
- **Data**: Contiene los contextos de base de datos. Usamos dos contextos: uno para la base de datos en memoria (sesiones de juego activas) y otro para MySQL (datos persistentes como usuarios, tablero, cartas, productos).
- **Models**: Definen las entidades del dominio (usuario, partida, jugador, propiedad, casilla, etc.).
- **DTOs**: Objetos de transferencia de datos que usamos para comunicarnos entre el frontend y el backend.

El frontend se comunica con el backend a traves de un servicio centralizado (`apiService.ts`) que realiza peticiones HTTP a la API REST. La URL base de la API se configura en el archivo `.env`.

---

## 4. Base de datos y operaciones CRUD implementadas

### Modelo de datos

El modelo entidad-relacion del Hito 2 se ha trasladado a las siguientes tablas en MySQL:

- **usuarios**: Almacena los datos de los jugadores registrados (nombre de usuario, email, contrasenya, avatar, color, ELO, monedas, gemas, nivel, experiencia, estadisticas de partidas, fechas de creacion y ultimo login).
- **casillas**: Contiene las 40 casillas del tablero con su posicion, nombre, tipo (salida, propiedad, estacion, comunidad, suerte, casino, impuesto, carcel, ir a la carcel) y descripcion.
- **propiedades**: Guarda la informacion de las propiedades comprables, vinculadas a las casillas. Incluye precio, alquiler base, alquileres mejorados, precio de mejora y grupo de color.
- **cartas**: Almacena las cartas de Comunidad y Suerte con su tipo, descripcion, efecto y valor.
- **productos**: Articulos de la tienda con nombre, descripcion, precio, moneda, categoria, rareza y vista previa.
- **inventario**: Registra los articulos comprados por cada usuario, con cantidad, estado de equipamiento y fecha de compra.

### Relaciones

- Cada propiedad esta vinculada a una casilla (relacion 1:1).
- Cada registro de inventario pertenece a un usuario y a un producto (relaciones N:1).

### Operaciones CRUD implementadas

| Entidad | Crear | Leer | Actualizar | Borrar |
|---|---|---|---|---|
| **Usuarios** | Si (registro) | Si (perfil, ranking) | Si (perfil) | No |
| **Casillas** | No (precargadas) | Si (tablero) | No | No |
| **Propiedades** | No (precargadas) | Si (tablero, detalles) | No | No |
| **Cartas** | No (precargadas) | Si (robar carta) | No | No |
| **Productos** | No (precargadas) | Si (tienda) | No | No |
| **Inventario** | Parcial | Si (inventario) | Pendiente (equipar) | No |

### Acceso a datos

El acceso a la base de datos se realiza a traves de Entity Framework Core, que actua como ORM. Hemos creado servicios especificos para cada area (por ejemplo, `MySqlUserService` para usuarios, `MySqlBoardService` para el tablero). Cada servicio utiliza el contexto de base de datos correspondiente para realizar las consultas. Las entidades de MySQL se definen en la carpeta `Data/MySqlEntities/` y se mapean a las tablas con Fluent API en el archivo `MonopolyMySqlDbContext.cs`.

---

## 5. Plan de pruebas ejecutado

A continuacion se detallan las pruebas que se han realizado sobre el MVP-1:

| ID | Caso de prueba | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| T01 | Registro con datos validos | Se crea el usuario y se redirige al menu | El usuario se crea correctamente y accede al menu | OK |
| T02 | Registro con usuario duplicado | Se muestra un mensaje de error | Se muestra el error correctamente | OK |
| T03 | Login con credenciales correctas | Se accede al menu principal | Acceso permitido | OK |
| T04 | Login con contrasena incorrecta | Se muestra un mensaje de error | Se muestra el error correctamente | OK |
| T05 | Tirar dados con backend activo | Se obtiene un valor del servidor | El dado se genera desde el backend | OK |
| T06 | Tirar dados sin backend | Se genera un valor local | El dado se genera localmente con aviso al usuario | OK |
| T07 | Comprar propiedad con dinero suficiente | Se descuenta el precio y se asigna la propiedad | La compra se realiza correctamente | OK |
| T08 | Comprar propiedad sin dinero suficiente | Se muestra un mensaje de error | Se muestra el error correctamente | OK |
| T09 | Caer en propiedad de otro jugador | Se cobra el alquiler automaticamente | El alquiler se descuenta y se suma al propietario | OK |
| T10 | Caer en casilla de Ir a la Carcel | El jugador va a la carcel 3 turnos | El jugador se teletransporta a la carcel y permanece 3 turnos | OK |
| T11 | Robar carta de Comunidad | Se obtiene una carta de la BD y se aplica el efecto | La carta se obtiene y el efecto se aplica correctamente | OK |
| T12 | Caer en el casino | Se abre la ruleta interactiva | La ruleta se abre, se puede apostar y el resultado se aplica | OK |
| T13 | Jugador llega a 0 puntos | Se marca como eliminado | El jugador se elimina y se salta en los turnos | OK |
| T14 | Solo queda un jugador activo | Se declara ganador | Se muestra el mensaje de victoria | OK |
| T15 | Consultar ranking | Se muestran los jugadores ordenados por ELO | Los jugadores se muestran correctamente desde la BD | OK |
| T16 | Modo desarrollador de dados | Se puede elegir el valor del dado | El dado toma el valor seleccionado manualmente | OK |

### Errores detectados y correcciones

1. **Alquiler de estaciones incorrecto**: Inicialmente, el alquiler de las estaciones no escalaba correctamente segun el numero de estaciones que poseia el propietario. Se corrigio implementando la formula `25 * 2^(n-1)` donde n es el numero de estaciones del propietario.

2. **Turno no avanzaba tras la carcel**: Cuando un jugador cumplia su condena en la carcel, el sistema no pasaba correctamente al siguiente turno. Se corrigio asegurando que la funcion `endTurn()` se llamase siempre al finalizar el procesamiento de la carcel, independientemente de si el jugador seguia preso o se liberaba.

---

## 6. Repositorio y control de versiones

### Enlace al repositorio
Repositorio del proyecto:

https://github.com/Raul1156/monopoly.git

### Estructura de carpetas del proyecto

```
monopoly/
├── backend-csharp/           # Backend en C# (ASP.NET Core)
│   ├── Controllers/          # Controladores de la API REST
│   ├── Models/               # Entidades del dominio
│   ├── Data/                 # Contextos de BD y entidades MySQL
│   ├── Services/             # Logica de negocio
│   ├── DTOs/                 # Objetos de transferencia de datos
│   └── Program.cs            # Punto de entrada del backend
│
├── src/                      # Codigo fuente del frontend
│   ├── App.tsx               # Componente raiz con navegacion
│   ├── services/
│   │   └── apiService.ts     # Servicio de comunicacion con la API
│   ├── index.css             # Estilos globales
│   └── main.tsx              # Punto de entrada del frontend
│
├── components/               # Componentes React de la aplicacion
│   ├── MonopolyScreen.tsx    # Pantalla principal del juego
│   ├── LoginScreen.tsx       # Pantalla de login y registro
│   ├── MainMenu.tsx          # Menu principal
│   ├── ShopScreen.tsx        # Tienda
│   ├── InventoryScreen.tsx   # Inventario
│   ├── SettingsScreen.tsx    # Configuracion
│   ├── RankingScreen.tsx     # Ranking de jugadores
│   ├── ProfileScreen.tsx     # Perfil del usuario
│   ├── EventosScreen.tsx     # Eventos (placeholder)
│   ├── CasinoRouletteModal.tsx # Ruleta del casino
│   ├── PropertyCardModal.tsx # Modal de propiedad
│   ├── PlayerPropertiesModal.tsx # Modal de propiedades del jugador
│   └── ui/                   # Componentes de interfaz reutilizables
│
├── hooks/                    # Hooks personalizados de React
│   └── useCasinoSounds.ts   # Efectos de sonido del casino
│
├── styles/                   # Hojas de estilo adicionales
├── public/                   # Recursos estaticos
├── .env                      # Variables de entorno (URL de la API)
├── package.json              # Dependencias del frontend
├── vite.config.ts            # Configuracion de Vite
├── START.bat                 # Script para arrancar backend y frontend
└── README.md                 # Este archivo
```


