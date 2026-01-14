# 🎲 Monopoly Casino y Tapas

> Juego de Monopoly temático desarrollado con arquitectura cliente-servidor profesional

![Status](https://img.shields.io/badge/status-active-success.svg)
![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

## 🚀 Inicio Rápido

### Windows - Un Click
```bash
# Doble click en:
START.bat
```

Esto iniciará automáticamente:
- ✅ Backend C# en `http://localhost:5000`
- ✅ Frontend React en `http://localhost:5173`

### Manual

**Backend:**
```bash
cd backend-csharp
dotnet restore
dotnet run
```

**Frontend:**
```bash
npm install
npm run dev
```

📖 **Más detalles:** [INICIO_RAPIDO.md](INICIO_RAPIDO.md)

---

## 📋 Características

- 🎮 **Juego Multijugador** - Hasta 4 jugadores por partida
- 🏠 **Sistema de Propiedades** - Compra, vende y desarrolla
- 🎲 **Dados Aleatorios** - Generados en el servidor
- 💰 **Economía Completa** - Dinero, alquileres, bancarrota
- 👥 **Sistema de Usuarios** - Perfiles, rankings, estadísticas
- 📊 **Rankings ELO** - Sistema de puntuación competitivo
- 🎨 **UI Moderna** - Diseño responsive con Tailwind CSS
- 🔒 **API REST Segura** - Backend en C# con validaciones

---

## 🏗️ Arquitectura

```
┌────────────────┐         HTTP/REST         ┌────────────────┐
│    FRONTEND    │ ◄──────────────────────► │    BACKEND     │
│  React + Vite  │         (JSON)            │  C# ASP.NET    │
│   Puerto 5173  │                           │   Puerto 5000  │
└────────────────┘                           └────────────────┘
       │                                              │
       │                                              │
   [UI/UX]                                       [Lógica]
  [Rendering]                                   [Validaciones]
  [User Input]                                  [Base de Datos]
```

### 🔧 Backend (C#)
- ASP.NET Core 8.0 Web API
- Entity Framework Core
- In-Memory Database (desarrollo)
- Swagger/OpenAPI

### ⚛️ Frontend (React)
- React 19 + TypeScript
- Vite (Build tool)
- Tailwind CSS
- Radix UI Components

📖 **Arquitectura detallada:** [ARQUITECTURA.md](ARQUITECTURA.md)

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [🚀 INICIO_RAPIDO.md](INICIO_RAPIDO.md) | Guía para empezar en 2 minutos |
| [🏗️ ARQUITECTURA.md](ARQUITECTURA.md) | Diagramas y flujos del sistema |
| [📖 SEPARACION_FRONTEND_BACKEND.md](SEPARACION_FRONTEND_BACKEND.md) | Explicación de la arquitectura |
| [🛠️ GUIA_DESARROLLO.md](GUIA_DESARROLLO.md) | Cómo desarrollar nuevas features |
| [📋 PROYECTO_README.md](PROYECTO_README.md) | README completo del proyecto |
| [🔧 backend-csharp/README.md](backend-csharp/README.md) | Documentación del backend |

---

## 🎯 API Endpoints

### Usuarios
```
POST   /api/users/login           - Login/Registro
GET    /api/users/{id}            - Obtener usuario
GET    /api/users/ranking         - Top jugadores
```

### Juegos
```
POST   /api/games                 - Crear partida
GET    /api/games/available       - Listar partidas
POST   /api/games/{id}/join       - Unirse a partida
POST   /api/games/{id}/start      - Iniciar partida
```

### Acciones
```
POST   /api/gameactions/roll-dice       - Tirar dados
POST   /api/gameactions/move            - Mover jugador
POST   /api/gameactions/buy-property    - Comprar propiedad
```

🔍 **Ver API completa en:** http://localhost:5000/swagger

---

## 🛠️ Tecnologías

<table>
<tr>
<td align="center" width="33%">

### Backend
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=c-sharp&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Entity Framework](https://img.shields.io/badge/Entity_Framework-512BD4?style=for-the-badge)

</td>
<td align="center" width="33%">

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</td>
<td align="center" width="33%">

### Styles
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)

</td>
</tr>
</table>

---

## 📦 Estructura del Proyecto

```
MonopolyFinal/
├── 📁 backend-csharp/          Backend en C# ASP.NET Core
│   ├── Controllers/           Endpoints REST
│   ├── Models/               Entidades
│   ├── Services/             Lógica de negocio
│   ├── DTOs/                 Data Transfer Objects
│   └── Data/                 DbContext
│
├── 📁 src/                    Frontend en React + TypeScript
│   ├── App.tsx               Componente principal
│   ├── services/             Cliente API HTTP
│   └── components/           Componentes React
│
├── 📁 components/             Componentes compartidos
├── 📄 START.bat              🚀 Inicio rápido
└── 📄 .env                   Variables de entorno
```

---

## 🎮 Cómo Jugar

1. **Ejecutar START.bat** (o iniciar backend y frontend manualmente)
2. **Abrir** http://localhost:5173 en tu navegador
3. **Ingresar** tu nombre de usuario
4. **Crear o unirse** a una partida
5. **¡Jugar!** 🎲

---

## 🧪 Testing

### Backend
```bash
cd backend-csharp
dotnet test
```

### Frontend
```bash
npm test
```

### API Manual
Abre http://localhost:5000/swagger y prueba los endpoints

---

## 🚀 Deployment

### Backend → Azure
```bash
cd backend-csharp
dotnet publish -c Release
```

### Frontend → Vercel
```bash
npm run build
vercel deploy
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es de uso educativo para DAM 2.

---

## 👨‍💻 Autor

**Raúl Bañó**  
Proyecto para DAM 2 - 2026

---

## 🆘 ¿Problemas?

Consulta la sección de solución de problemas en:
- [INICIO_RAPIDO.md - Solución de Problemas](INICIO_RAPIDO.md#-solución-de-problemas-comunes)

O revisa los logs:
- Backend: Consola donde ejecutaste `dotnet run`
- Frontend: Consola del navegador (F12)

---

<div align="center">

**Desarrollado con ❤️ para DAM 2**

[Documentación](PROYECTO_README.md) • [Arquitectura](ARQUITECTURA.md) • [Guía de Desarrollo](GUIA_DESARROLLO.md)

</div>

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
