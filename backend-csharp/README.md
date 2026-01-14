# Backend C# - ASP.NET Core Web API

Este es el backend del juego Monopoly desarrollado en C# con ASP.NET Core.

## 🚀 Tecnologías

- **.NET 8.0**
- **ASP.NET Core Web API**
- **Entity Framework Core** (In-Memory Database para desarrollo)
- **Swagger/OpenAPI** para documentación de la API

## 📁 Estructura del Proyecto

```
backend-csharp/
├── Controllers/          # Controladores de la API REST
│   ├── UsersController.cs
│   ├── GamesController.cs
│   ├── BoardController.cs
│   └── GameActionsController.cs
├── Models/              # Entidades del dominio
│   ├── User.cs
│   ├── Game.cs
│   ├── PlayerInGame.cs
│   ├── Property.cs
│   ├── PropertyOwnership.cs
│   └── BoardSpace.cs
├── Services/            # Lógica de negocio
│   ├── UserService.cs
│   ├── GameService.cs
│   ├── BoardService.cs
│   └── GameSessionService.cs
├── DTOs/                # Data Transfer Objects
│   └── GameDTOs.cs
├── Data/                # Contexto de base de datos
│   └── MonopolyDbContext.cs
├── Program.cs           # Punto de entrada
└── appsettings.json     # Configuración
```

## 🎮 Endpoints de la API

### Usuarios
- `POST /api/users/login` - Login/registro de usuario
- `GET /api/users/{id}` - Obtener usuario por ID
- `GET /api/users/ranking?count=10` - Top jugadores por ELO
- `PUT /api/users/{id}` - Actualizar usuario

### Juegos
- `POST /api/games?hostUserId={id}` - Crear nueva partida
- `GET /api/games/{id}` - Obtener información de una partida
- `GET /api/games/available` - Listar partidas disponibles
- `POST /api/games/{id}/join?userId={id}&token={token}` - Unirse a una partida
- `POST /api/games/{id}/start` - Iniciar partida
- `GET /api/games/{gameId}/players/{playerId}` - Obtener info de un jugador

### Tablero
- `GET /api/board/spaces` - Obtener todas las casillas del tablero
- `GET /api/board/properties` - Obtener todas las propiedades
- `GET /api/board/properties/{position}` - Obtener propiedad por posición

### Acciones del Juego
- `POST /api/gameactions/roll-dice` - Tirar dados
- `POST /api/gameactions/move?gameId={id}&playerId={id}` - Mover jugador
- `POST /api/gameactions/buy-property` - Comprar propiedad
- `POST /api/gameactions/pay-rent` - Pagar alquiler

## 🔧 Instalación y Ejecución

### Prerrequisitos
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

### Pasos

1. **Navegar a la carpeta del backend:**
   ```bash
   cd backend-csharp
   ```

2. **Restaurar dependencias:**
   ```bash
   dotnet restore
   ```

3. **Ejecutar el proyecto:**
   ```bash
   dotnet run
   ```

4. **La API estará disponible en:**
   - HTTP: `http://localhost:5000`
   - Swagger UI: `http://localhost:5000/swagger`

## 🗄️ Base de Datos

Por defecto, el proyecto usa una base de datos **In-Memory** para desarrollo. Los datos se pierden al reiniciar el servidor.

Para usar SQL Server (producción):
1. Descomentar la configuración de SQL Server en `Program.cs`
2. Actualizar la cadena de conexión en `appsettings.json`
3. Ejecutar migraciones:
   ```bash
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

## 🧪 Testing con Swagger

1. Ejecuta el proyecto: `dotnet run`
2. Abre tu navegador en: `http://localhost:5000/swagger`
3. Prueba los endpoints directamente desde la interfaz de Swagger

## 📝 Ejemplos de Uso

### Login de Usuario
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"raul","email":"raul@monopoly.com"}'
```

### Crear Partida
```bash
curl -X POST "http://localhost:5000/api/games?hostUserId=1" \
  -H "Content-Type: application/json" \
  -d '{"name":"Partida de Raúl","maxPlayers":4}'
```

### Tirar Dados
```bash
curl -X POST http://localhost:5000/api/gameactions/roll-dice
```

## 🔐 CORS

El backend está configurado para aceptar peticiones del frontend en:
- `http://localhost:5173` (Vite dev server)

Para cambiar esto, edita el archivo `Program.cs`.

## 🚀 Despliegue

### Azure App Service
1. Publica el proyecto: `dotnet publish -c Release`
2. Sube los archivos de `bin/Release/net8.0/publish/` a Azure

### Docker
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MonopolyAPI.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MonopolyAPI.dll"]
```

## 📚 Recursos

- [Documentación de ASP.NET Core](https://docs.microsoft.com/aspnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [Swagger/OpenAPI](https://swagger.io)
