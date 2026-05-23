# Monopoly Casino y Tapas

Este proyecto es una aplicación web full-stack desarrollada como proyecto académico para el ciclo formativo de grado superior en Desarrollo de Aplicaciones Multiplataforma (DAM). Consiste en un juego de Monopoly online en tiempo real, tematizado en el entorno de casinos y tapas españolas.

## 1. Descripción del proyecto

El sistema proporciona una experiencia de juego de tablero multijugador completa. Su objetivo principal es aplicar conceptos avanzados de programación web, sincronización en tiempo real y gestión de bases de datos relacionales en un entorno lúdico. Los usuarios pueden registrarse, gestionar su perfil, comprar avatares en una tienda virtual y competir en partidas online interactuando con mecánicas clásicas (dados, propiedades, cartas) y mecánicas nuevas (ruleta de casino, transporte entre estaciones).

## 2. Tecnologías utilizadas

El proyecto está construido sobre las siguientes tecnologías y herramientas:

**Frontend:**
- **Librería principal:** React (con TypeScript).
- **Estilos:** TailwindCSS.
- **Empaquetador y entorno de desarrollo:** Vite.

**Backend:**
- **Framework:** ASP.NET Core (C#).
- **Comunicación en tiempo real:** SignalR.
- **ORM:** Entity Framework Core.

**Base de Datos y Persistencia:**
- **Base de datos relacional:** MySQL (desplegada mediante contenedor Docker).
- **Base de datos temporal:** Entity Framework Core InMemory (para gestionar el estado efímero de las partidas activas).

## 3. Arquitectura general del sistema

La aplicación emplea una arquitectura cliente-servidor, con el backend estructurado en capas para asegurar la escalabilidad y separación de responsabilidades:

- **Capa de Controladores (Controllers):** Gestiona las peticiones HTTP (API REST) para las operaciones CRUD y la autenticación.
- **SignalR Hubs:** Administra los WebSockets para la comunicación bidireccional y la sincronización de estado entre los distintos jugadores conectados a una misma partida.
- **Capa de Servicios (Services):** Contiene toda la lógica de negocio (validación de turnos, reglas económicas del juego, gestión del inventario).
- **Capa de Acceso a Datos (Data/Repositories):** Implementa los DbContext de Entity Framework para realizar consultas tanto a la base de datos MySQL como a la base de datos en memoria.
- **Modelos y DTOs (Models / DTOs):** Entidades de dominio que mapean con la base de datos y objetos de transferencia de datos utilizados en la comunicación con el cliente.

El frontend consume los servicios a través de un servicio centralizado y gestiona el estado global de la interfaz y de la partida mediante Hooks de React.

## 4. Requisitos previos

Para poder ejecutar el proyecto en un entorno local, es necesario disponer del siguiente software instalado en su equipo:

- **Node.js** (versión 18 o superior) y **npm**.
- **.NET SDK** (versión 8.0 recomendada).
- **Docker Desktop** (o Docker Engine con Docker Compose) para la base de datos MySQL.
- **Git** (para el control de versiones).

## 5. Instalación

> **Nota:** Los siguientes pasos de instalación están orientados exclusivamente a configurar el proyecto en un entorno de desarrollo local. Si su único objetivo es probar el juego de manera multijugador, puede omitir todo este proceso y acceder directamente a la URL de AWS indicada en el apartado **Despliegue y URL**.

Siga los siguientes pasos para preparar el entorno de desarrollo local:

1. **Clonar el repositorio principal del juego:**
   ```bash
   git clone https://github.com/Raul1156/monopoly.git
   cd monopoly
   ```

2. **Instalar dependencias del Frontend:**
   ```bash
   npm install
   ```

3. **Restaurar dependencias del Backend:**
   ```bash
   cd backend-csharp
   dotnet restore
   cd ..
   ```

4. **Preparar la Base de Datos:**
   La base de datos MySQL, configurada mediante Docker, se encuentra en un repositorio independiente. Proceda a clonarlo y levantar el contenedor:
   ```bash
   git clone https://github.com/Marcelo3537/database.git
   cd database
   docker-compose up -d
   ```

## 6. Ejecución

Existen dos formas principales de poner en marcha el proyecto:

**Opción A: Uso del script de inicio rápido (Recomendado para Windows)**
En la raíz del proyecto, ejecute el archivo de procesamiento por lotes diseñado para levantar ambos servicios de forma simultánea:
```cmd
START.bat
```

**Opción B: Arranque manual independiente**
1. **Frontend:** En una terminal, sitúese en la raíz del proyecto y ejecute:
   ```bash
   npm run dev
   ```
2. **Backend:** En otra terminal, acceda a la carpeta `backend-csharp` y ejecute:
   ```bash
   dotnet run
   ```

## 7. Estructura del repositorio

La estructura de directorios está organizada de la siguiente manera:

```text
monopoly/
├── backend-csharp/             # Código fuente del servidor (ASP.NET Core)
│   ├── Controllers/            # Endpoints de la API REST
│   ├── Hubs/                   # Controladores de WebSockets (SignalR)
│   ├── Models/                 # Entidades del dominio
│   ├── Data/                   # Contextos de la base de datos (MySQL e InMemory)
│   ├── Services/               # Lógica de negocio y reglas del juego
│   ├── DTOs/                   # Objetos de transferencia de datos
│   └── Program.cs              # Punto de entrada y configuración
│
├── src/                        # Código fuente de la interfaz de usuario (React)
│   ├── App.tsx                 # Enrutador principal y configuración raíz
│   ├── services/               # Clientes para la API y SignalR (ej. apiService.ts)
│   ├── index.css               # Hoja de estilos global y configuración Tailwind
│   └── main.tsx                # Punto de entrada de la aplicación web
│
├── components/                 # Componentes de React
│   ├── MonopolyScreen.tsx      # Lógica y renderizado del tablero de juego
│   ├── LoginScreen.tsx         # Pantallas de autenticación y registro
│   ├── MainMenu.tsx            # Navegación del menú principal
│   ├── ShopScreen.tsx          # Lógica de la tienda de artículos
│   ├── ui/                     # Componentes genéricos y reutilizables
│   └── ...                     # Otras pantallas secundarias (inventario, perfil)
│
├── database/                   # Scripts de base de datos (migraciones SQL)
├── public/                     # Archivos estáticos e imágenes
├── .env                        # Variables de entorno locales
├── package.json                # Configuración y dependencias del entorno Node
├── vite.config.ts              # Configuración del bundler
├── START.bat                   # Script de automatización de arranque
└── README.md                   # Documentación principal del proyecto
```

## 8. Configuración

El comportamiento de la aplicación puede ser modificado mediante las variables de entorno y los parámetros de red:

- **Frontend (`.env`):** Debe contener la configuración para apuntar a la URL de la API y de los Hubs de SignalR correspondientes (por defecto, apuntando al host de backend local).
- **Puertos de red habituales:**
  - Aplicación Web Frontend: `5173`
  - Servidor Backend API: `5000` / `5001`
  - Base de datos MySQL Docker: `3306` / `3307` (según configuración del contenedor)

Asegúrese de que estos puertos se encuentren libres en su equipo o modifique los archivos de configuración en consecuencia.

## 9. Uso del sistema

El flujo de uso principal para interactuar con la aplicación es el siguiente:

1. **Autenticación:** Iniciar la aplicación y acceder al sistema. Puede crear una nueva cuenta mediante el formulario de registro.
2. **Navegación:** Desde el menú principal, podrá visitar su inventario, la tienda, visualizar su perfil, consultar el ranking general o unirse a una partida.
3. **Lobby Multijugador:** Los jugadores se conectan a un espacio común. La partida iniciará cuando todos los participantes estén sincronizados y listos.
4. **Desarrollo de la partida:** El sistema otorga turnos de manera estricta. Durante un turno el jugador puede:
   - Tirar los dados.
   - Adquirir la propiedad sobre la que se detiene o, en su defecto, pagar el alquiler correspondiente.
   - Realizar acciones especiales según la casilla (Cartas de Comunidad, Suerte, Cárcel o Ruleta).
5. **Finalización:** La partida concluye mediante la bancarrota progresiva de los jugadores, declarando victorioso al último participante que mantenga fondos positivos.

## 10. Credenciales de prueba

Para realizar pruebas rápidas sin necesidad de configurar correos reales, el sistema admite cualquier dirección de correo electrónico válida estructuralmente (por ejemplo, `test@test.com` o `admin@admin.com`) en el registro de un nuevo usuario. Puede crear cuantas cuentas desee de esta manera para realizar pruebas multijugador con diferentes ventanas de navegador.

## 11. Estado del proyecto

El proyecto se encuentra en una etapa de desarrollo estable tras finalizar su Producto Mínimo Viable (MVP).
Están implementadas y operativas todas las mecánicas centrales del juego, incluyendo la sincronización en tiempo real, el sistema financiero, el comercio de propiedades, la lógica del tablero, y los sistemas de persistencia del usuario.

## 12. Despliegue y URL

El proyecto ha sido desplegado exitosamente utilizando una instancia de Amazon Web Services (AWS), permitiendo la ejecución de partidas multijugador en red sin necesidad de configuraciones locales.

Puede acceder a la aplicación, crear su cuenta y jugar directamente con otros usuarios a través del siguiente enlace público:

**URL de Acceso (AWS):** [http://32.194.172.210:5173/](http://32.194.172.210:5173/)
