# CARTA ESTRUCTURADA DEL SISTEMA
## "Prompt Battle Royale"

---

**[Nombre de la Institución Educativa]**
**[Facultad / Escuela / Departamento]**
**[Carrera / Programa Académico]**

**Integrantes:** [Nombres del grupo]
**Fecha:** [Fecha]

---

## 1. DESCRIPCIÓN GENERAL DEL SISTEMA

**Prompt Battle Royale** es un sistema web multijugador que permite a los usuarios competir en tiempo real creando prompts creativos para la generación de imágenes mediante inteligencia artificial. El sistema opera bajo una arquitectura cliente-servidor con comunicación WebSocket bidireccional.

---

## 2. CARTA ESTRUCTURADA JERÁRQUICA

### NIVEL 0 – SISTEMA PRINCIPAL

```
┌─────────────────────────────────────────────────────────────────┐
│                  PROMPT BATTLE ROYALE                           │
│            Juego Multijugador de Generación de Imágenes IA      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  MÓDULO 1     │   │  MÓDULO 2     │   │  MÓDULO 3     │
│  CLIENTE      │   │  SERVIDOR     │   │  API EXTERNA  │
│  (Frontend)   │   │  (Backend)    │   │  (IA)         │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        ▼                   ▼
```

---

### NIVEL 1 – DESCOMPOSICIÓN DE MÓDULOS PRINCIPALES

```
                        SISTEMA PROMPT BATTLE ROYALE
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
            ▼                      ▼                      ▼
    ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
    │   MÓDULO 1    │     │   MÓDULO 2    │     │   MÓDULO 3    │
    │   CLIENTE     │     │   SERVIDOR    │     │  POLLINATIONS │
    │   (React)     │     │  (Node.js)    │     │     .AI       │
    └───────┬───────┘     └───────┬───────┘     └───────────────┘
            │                     │
            ▼                     ▼
```

---

### NIVEL 2 – DESCOMPOSICIÓN DEL MÓDULO 1: CLIENTE

```
                         MÓDULO 1: CLIENTE
                              │
      ┌───────────┬───────────┼───────────┬───────────┐
      │           │           │           │           │
      ▼           ▼           ▼           ▼           ▼
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│ 1.1      ││ 1.2      ││ 1.3      ││ 1.4      ││ 1.5      │
│ PÁGINAS  ││COMPONENTES││ CONTEXTO ││ UTILIDADES││ ESTILOS  │
│ (Vistas) ││   (UI)   ││ (Estado) ││          ││(Tailwind)│
└────┬─────┘└────┬─────┘└────┬─────┘└──────────┘└──────────┘
     │           │           │
     ▼           ▼           ▼
```

---

### NIVEL 3 – DESCOMPOSICIÓN DE SUBMÓDULOS CLIENTE

#### 1.1 Páginas (Vistas)

```
                      1.1 PÁGINAS (VISTAS)
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ 1.1.1        │  │ 1.1.2        │  │ 1.1.3        │
    │ HomePage     │  │ LobbyPage    │  │ GamePage     │
    │              │  │              │  │              │
    │• Crear Sala  │  │• Lista       │  │• Fases del   │
    │• Unir Sala   │  │  Jugadores   │  │  Juego       │
    │• Código 4ch  │  │• Chat        │  │• Prompt      │
    └──────────────┘  │• Config Rnd  │  │• Votación    │
                      └──────────────┘  └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │ 1.1.4        │
                      │ ResultsPage  │
                      │              │
                      │• Scoreboard  │
                      │• Ganador     │
                      │• Estadísticas│
                      └──────────────┘
```

#### 1.2 Componentes (UI)

```
                      1.2 COMPONENTES (UI)
                              │
        ┌─────────┬───────────┼───────────┬─────────┐
        │         │           │           │         │
        ▼         ▼           ▼           ▼         ▼
  ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
  │1.2.1     ││1.2.2     ││1.2.3     ││1.2.4     ││1.2.5     │
  │Chat      ││Timer     ││Leaderboard││PromptInput││VotingGallery│
  │          ││          ││          ││          ││          │
  │• Mensajes││• SVG     ││• Tabla   ││• Textarea││• Grid    │
  │• Envío   ││• Circular││• Puntos  ││• 10-500ch││• Votos   │
  │• Historial││• Colores ││• Rachas  ││• Límite  ││• Anónimo │
  └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
        │
        ▼
  ┌──────────┐┌──────────┐
  │1.2.6     ││1.2.7     │
  │PlayerList││ThemeDisplay│
  │          ││          │
  │• Anfitrión││• Tema    │
  │• Online  ││• Ronda   │
  └──────────┘└──────────┘
```

#### 1.3 Contexto (Estado Global)

```
                    1.3 CONTEXTO (ESTADO)
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
    ┌──────────────────┐       ┌──────────────────┐
    │ 1.3.1            │       │ 1.3.2            │
    │ SocketContext    │       │ GameContext      │
    │                  │       │                  │
    │• Conexión Socket │       │• Estado Juego    │
    │• Eventos         │       │• Reducer         │
    │• Desconexión     │       │• Provider        │
    └──────────────────┘       └──────────────────┘
```

---

### NIVEL 3 – DESCOMPOSICIÓN DEL MÓDULO 2: SERVIDOR

```
                         MÓDULO 2: SERVIDOR
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ 2.1          │  │ 2.2          │  │ 2.3          │
    │ SERVIDOR     │  │ GESTOR DE    │  │ PROXY DE     │
    │ PRINCIPAL    │  │ JUEGO        │  │ IMÁGENES     │
    │              │  │ (GameManager)│  │              │
    │• Express     │  │• Salas       │  │• Pollinations │
    │• HTTP Server │  │• Jugadores   │  │• Cache       │
    │• Socket.IO   │  │• Rondas      │  │• Proxy       │
    └──────────────┘  └──────────────┘  └──────────────┘
```

#### 2.1 Servidor Principal

```
                       2.1 SERVIDOR PRINCIPAL
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ 2.1.1        │  │ 2.1.2        │  │ 2.1.3        │
    │ Configuración│  │ Rutas HTTP   │  │ Eventos      │
    │              │  │              │  │ WebSocket    │
    │• CORS        │  │• /api/images │  │              │
    │• Puerto 3001 │  │• Static Files│  │• create_room │
    │• Middleware   │  │              │  │• join_room   │
    └──────────────┘  └──────────────┘  │• start_game  │
                                        │• submit_prompt│
                                        │• submit_vote  │
                                        │• chat_message │
                                        └──────────────┘
```

#### 2.2 Gestor de Juego

```
                       2.2 GESTOR DE JUEGO
                              │
      ┌───────────┬───────────┼───────────┬───────────┐
      │           │           │           │           │
      ▼           ▼           ▼           ▼           ▼
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│2.2.1     ││2.2.2     ││2.2.3     ││2.2.4     ││2.2.5     │
│MÁQUINA   ││GESTIÓN   ││GESTIÓN   ││SISTEMA   ││TEMAS     │
│ESTADOS   ││SALAS     ││JUGADORES ││PUNTUACIÓN││          │
│          ││          ││          ││          ││          │
│• waiting  ││• Crear   ││• Unirse  ││• Votos   ││• 60 temas│
│• prompt   ││• Eliminar││• Salir   ││• Rachas  ││• Aleatorio│
│• generating││• Código ││• Anfitrión││• Ranking ││• Español │
│• voting   ││• Límite  ││• Reconectar││          ││          │
│• reveal   ││          ││          ││          ││          │
│• finished ││          ││          ││          ││          │
└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
```

---

## 3. DIAGRAMA DE FLUJO DE PROCESOS

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUJO PRINCIPAL                            │
└─────────────────────────────────────────────────────────────────────┘

                              INICIO
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │ 1. ACCESO AL SISTEMA  │
                    │    (Navegador Web)    │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ 2. CREAR/UNIR SALA    │
                    │   • Generar código    │
                    │   • Máx 8 jugadores   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ 3. LOBBY              │
                    │   • Esperar jugadores │
                    │   • Chat en tiempo    │
                    │     real              │
                    │   • Configurar rondas │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ 4. INICIAR JUEGO      │
                    │   (Anfitrión)         │
                    └───────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │         BUCLE DE RONDAS             │
              │            (N rondas)               │
              └─────────────────┬───────────────────┘
                                │
        ┌───────────────────────┼───────────────────┐
        │                       │                   │
        ▼                       ▼                   ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ 4a. ESCRIBIR  │     │ 4b. GENERAR   │     │ 4c. VOTAR     │
│    PROMPT     │────▶│    IMAGEN     │────▶│    ANÓNIMO    │
│               │     │               │     │               │
│ • 30 seg      │     │ • 60 seg      │     │ • 30 seg      │
│ • 10-500 car  │     │ • Pollinations │     │ • No propio   │
│ • Tema random │     │ • 400x400px   │     │ • 1 voto      │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                    │
                                                    ▼
                                          ┌───────────────┐
                                          │ 4d. REVELAR   │
                                          │    RESULTADOS │
                                          │               │
                                          │ • 10 seg      │
                                          │ • Creador     │
                                          │ • Votos       │
                                          │ • Ganador rnd │
                                          └───────┬───────┘
                                                  │
                                                  ▼
                                        ┌─────────────────┐
                                        │ ¿Más rondas?    │
                                        └────────┬────────┘
                                                 │
                                    ┌────────────┴────────────┐
                                    │                         │
                                    ▼ SI                      ▼ NO
                          ┌─────────────────┐       ┌─────────────────┐
                          │ Volver a 4a     │       │ 5. RESULTADOS   │
                          │ (Siguiente rnd) │       │    FINALES      │
                          └─────────────────┘       │                 │
                                                    │ • Scoreboard    │
                                                    │ • Ganador final │
                                                    │ • Estadísticas  │
                                                    └────────┬────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │       FIN       │
                                                    └─────────────────┘
```

---

## 4. DESCRIPCIÓN DE MÓDULOS

### 4.1 Módulo 1: Cliente (Frontend)

| Submódulo | Función | Tecnología |
|-----------|---------|------------|
| **1.1 Páginas** | Vistas principales de la aplicación | React Router (manual) |
| 1.1.1 HomePage | Formularios crear/unir sala | React + Tailwind |
| 1.1.2 LobbyPage | Sala de espera con chat | React + Socket.IO |
| 1.1.3 GamePage | Control de fases del juego | React + Context |
| 1.1.4 ResultsPage | Tabla de posiciones final | React + Tailwind |
| **1.2 Componentes** | Elementos UI reutilizables | React Components |
| 1.2.1 Chat | Sistema de mensajería | Socket.IO Events |
| 1.2.2 Timer | Temporizador SVG circular | SVG + CSS Animations |
| 1.2.3 Leaderboard | Tabla de posiciones | React + Context |
| 1.2.4 PromptInput | Área de texto para prompts | HTML + Validation |
| 1.2.5 VotingGallery | Galería de imágenes para votar | Grid + onClick |
| 1.2.6 PlayerList | Lista de jugadores en lobby | React + Socket.IO |
| 1.2.7 ThemeDisplay | Banner de tema por ronda | React + Animation |
| **1.3 Contexto** | Estado global de la aplicación | React Context API |
| 1.3.1 SocketContext | Conexión WebSocket | Socket.IO Client |
| 1.3.2 GameContext | Estado del juego + reducer | useReducer |
| **1.4 Utilidades** | Funciones auxiliares | TypeScript |
| 1.4.1 formatTimer | Formateo de tiempo | Vanilla JS |
| 1.4.2 getPhaseLabel | Labels de fases | Switch/Case |
| 1.4.3 getPhaseColor | Colores por fase | Tailwind Classes |
| **1.5 Estilos** | Hojas de estilo | Tailwind CSS 3.4 |

### 4.2 Módulo 2: Servidor (Backend)

| Submódulo | Función | Tecnología |
|-----------|---------|------------|
| **2.1 Servidor Principal** | Configuración y rutas | Express 4.18 |
| 2.1.1 Configuración | CORS, puerto, middleware | Express |
| 2.1.2 Rutas HTTP | Endpoint de imágenes | Express Router |
| 2.1.3 Eventos WebSocket | Comunicación en tiempo real | Socket.IO 4.7 |
| **2.2 Gestor de Juego** | Lógica del juego | TypeScript Class |
| 2.2.1 Máquina Estados | Control de fases | State Machine |
| 2.2.2 Gestión Salas | Crear/eliminar/limpiar | In-Memory |
| 2.2.3 Gestión Jugadores | Unirse/salir/reconectar | Socket.IO |
| 2.2.4 Sistema Puntuación | Votos y rachas | Arrays/Maps |
| 2.2.5 Temas | 60 temas predefinidos | Array hardcoded |
| **2.3 Proxy Imágenes** | Comunicación con IA | HTTP Client |
| 2.3.1 Pollinations | Generación de imágenes | Fetch API |
| 2.3.2 Cache | Almacenamiento en memoria | Map/Object |
| 2.3.3 Proxy | Servir imágenes al cliente | Express |

### 4.3 Módulo 3: API Externa (Pollinations.ai)

| Componente | Función |
|------------|---------|
| **Endpoint** | `https://image.pollinations.ai/prompt/{prompt}` |
| **Parámetros** | width=400, height=400, seed=determinístico |
| **Respuesta** | Imagen PNG/JPEG |
| **Autenticación** | Ninguna (servicio gratuito) |

---

## 5. INTERFACES ENTRE MÓDULOS

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERFACES DEL SISTEMA                       │
└─────────────────────────────────────────────────────────────────┘

CLIENTE ◄─────────── WebSocket (Socket.IO) ──────────► SERVIDOR
   │                                                        │
   │  Eventos:                                              │
   │  • create_room                                         │
   │  • join_room                                           │
   │  • start_game                                          │
   │  • submit_prompt                                       │
   │  • submit_vote                                         │
   │  • chat_message                                        │
   │  • game_state_update                                   │
   │  • timer_tick                                          │
   │                                                        │
   │                                                        │
   │  HTTP GET                                              │
   │  ◄──────── /api/images/:roomId/:hash ──────────────── │
   │                                                        │
   │                                                        │
 SERVIDOR ──────── HTTP GET/POST ──────────► POLLINATIONS.AI
                       │
                       │  GET /prompt/{prompt}?width=400
                       │      &height=400&seed={hash}
                       │
                       ◄──── Imagen (PNG/JPEG) ────────────
```

---

## 6. DIAGRAMA DE ESTADOS DEL JUEGO

```
┌─────────────────────────────────────────────────────────────────┐
│                   MÁQUINA DE ESTADOS                            │
└─────────────────────────────────────────────────────────────────┘

                            ┌─────────┐
                            │ WAITING │ ◄── Estado inicial
                            └────┬────┘
                                 │ start_game (mín 2 jugadores)
                                 ▼
                         ┌───────────────┐
                         │PROMPT_WRITING │ ── 30 segundos
                         └───────┬───────┘
                                 │ tiempo_expire / todos_enviaron
                                 ▼
                       ┌─────────────────┐
                       │   GENERATING    │ ── 60 segundos
                       └────────┬────────┘
                                │ tiempo_expire / todas_listas
                                ▼
                      ┌──────────────────┐
                      │     VOTING       │ ── 30 segundos
                      └────────┬─────────┘
                               │ tiempo_expire / todos_votaron
                               ▼
                     ┌───────────────────┐
                     │      REVEAL       │ ── 10 segundos
                     └────────┬──────────┘
                              │ tiempo_expire
                              ▼
                    ┌───────────────────┐
                    │¿ÚLTIMA RONDA?    │
                    └────────┬──────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼ NO                      ▼ SI
     ┌──────────────────┐       ┌──────────────────┐
     │  (volver a       │       │    FINISHED      │
     │  PROMPT_WRITING) │       │                  │
     └──────────────────┘       │  Scoreboard Final│
                                └──────────────────┘
```

---

## 7. RESUMEN DE TECNOLOGÍAS

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| **Lenguaje** | TypeScript | 5.3 | Tipado estático |
| **Frontend** | React | 18.2 | UI Framework |
| **Build Tool** | Vite | 5.0 | Bundler + Dev Server |
| **Estilos** | Tailwind CSS | 3.4 | CSS Utility-first |
| **Comunicación** | Socket.IO | 4.7 | WebSocket bidireccional |
| **Backend** | Node.js + Express | 4.18 | Servidor HTTP |
| **API IA** | Pollinations.ai | - | Generación de imágenes |

---

**Nota:** Los campos marcados con `[ ]` deben ser completados con los datos específicos del proyecto y la institución.
