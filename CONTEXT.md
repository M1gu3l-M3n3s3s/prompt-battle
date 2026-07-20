# Simon - Prompt Battle Royale - Context

## Overview
A real-time multiplayer drawing/prompt game where players write prompts, AI generates images, and players vote for their favorites. No elimination — all players advance every round with cumulative scoring.

## Tech Stack
- **Server:** Node.js + Express + Socket.IO + TypeScript + Pollinations AI
- **Client:** React 19 + Vite + TailwindCSS + TypeScript
- **Room codes:** 4 digits (changed from 6)
- **Game phases:** `waiting → prompt_writing → generating → voting → reveal → (loop) → finished`

---

## Core Game Mechanic

### Cumulative Voting (NOT elimination)
- All players advance every round — no one gets eliminated
- Each image gets 1 point per vote received (self-voting not allowed)
- Host selects 2-5 rounds in lobby before starting
- `setMaxRounds()` on GameManager controls round count
- `set_max_rounds` socket event for host to configure

### Phase Flow
1. **waiting** — Host starts game, all players in room
2. **prompt_writing** — Players write prompts (30s timer)
3. **generating** — AI generates images via Pollinations (60s timer)
4. **voting** — Players vote for favorite images (30s timer)
5. **reveal** — Results shown, host clicks "Siguiente Ronda" or "Ver Resultados"
6. **finished** — Final leaderboard

### Timer
- Timer continues through ALL phases — loop does NOT die after timeout
- Critical fix: timer was stopping after first phase

---

## Project Structure

```
Simon/
├── server/
│   ├── src/
│   │   ├── GameManager.ts    # Core game logic, scoring, rounds, rooms
│   │   ├── socket.ts         # Socket event handlers, timer loop, phase transitions
│   │   └── types.ts          # Server types + THEMES array (60 themes)
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LobbyPage.tsx     # Room code, host settings (rounds 2-5)
│   │   │   ├── GamePage.tsx      # Main game UI, host "Siguiente Ronda" button
│   │   │   └── ResultsPage.tsx   # Final leaderboard
│   │   ├── components/
│   │   │   ├── VotingGallery.tsx  # Voting UI, "imagen favorita" text
│   │   │   ├── PlayerList.tsx     # Player list (no elimination indicators)
│   │   │   ├── Leaderboard.tsx    # Score ranking
│   │   │   └── PromptInput.tsx    # Prompt writing input
│   │   ├── context/
│   │   │   ├── GameContext.tsx     # Game state reducer
│   │   │   └── SocketContext.tsx   # Socket connection provider
│   │   └── types.ts              # Client types
│   └── package.json
└── CONTEXT.md                    # This file
```

---

## Key Types

### Server Player (types.ts)
```ts
interface Player {
  id: string;
  socketId: string;
  name: string;
  score: number;
  avatar: string;
}
```
- NO `eliminated` field
- `socketId` stripped before sending to clients

### Server Room (types.ts)
```ts
interface Room {
  code: string;
  hostId: string;
  players: Player[];
  images: ImageData[];
  phase: GamePhase;
  currentRound: number;
  maxRounds: number;
  timer: number;
  roundScores: Record<string, number>;
}
```
- NO `roundOrder` field

### ImageData
```ts
interface ImageData {
  id: string;
  prompt: string;
  url: string;
  playerId: string;  // required
  votes: number;
  votedBy: string[];
}
```

---

## Socket Events

### Client → Server
| Event | Payload | Notes |
|-------|---------|-------|
| `join_room` | `{ roomCode, playerName }` | |
| `create_room` | `{ playerName }` | Returns 4-digit code |
| `start_game` | `{}` | Host only, checks `isHost` |
| `submit_prompt` | `{ prompt }` | |
| `vote` | `{ imageId }` | Self-voting blocked |
| `advance_reveal` | `{}` | Host only — next round |
| `finish_game` | `{}` | Host only — show results |
| `set_max_rounds` | `{ rounds }` | Host configures 2-5 |
| `chat_message` | `{ message }` | Server validates via `getRoomBySocket` |

### Server → Client
| Event | Payload | Notes |
|-------|---------|-------|
| `room_update` | `{ room }` | Full room state |
| `game_started` | `{}` | |
| `images_ready` | `{ images }` | |
| `vote_update` | `{ imageId, votes, votedBy }` | |
| `next_round` | `{}` | |
| `game_over` | `{ results }` | `socketId` stripped |
| `player_eliminated` | NEVER | Removed |
| `timer_tick` | `{ timeLeft, phase }` | |
| `error` | `{ message }` | |
| `chat_message` | `{ playerId, playerName, message }` | Server-validated |

---

## THEMES (60 total)

### Original 25 (whimsical/sci-fi leaning)
1. Un gato samurái en Neo-Tokyo
2. Un dragón helado custodiando un castillo de cristal
3. Una biblioteca infinita en el espacio
4. Un robot jardinero cuidando un jardín de estrellas
5. Una ciudad submarina con arquitectura bioluminescente
6. Un chef fantasma preparando la cena en un castillo encantado
7. Un tren a vapor viajando a través de un bosque de caramelos
8. Una bailarina de ballet en un planeta de gravedad cero
9. Un detective privado en un mundo de dinosaurios
10. Una tienda de mascotas mágicas en una esquina de Brooklyn
11. Un caballero medieval con armadura de LED
12. Una selva donde las plantas son de cristal
13. Un mercadillo flotante en las nubes
14. Una banda de rock compuesta enteramente por pulpos
15. Un faro que conecta dimensiones paralelas
16. Una carrera de autos en una pista de gelatina
17. Un artista callejero pintando con luz de estrellas
18. Un té virtual en un campo de flores digitales
19. Un pulpo que toca el piano en un bar de jazz
20. Una expedición a un volcán de chocolate
21. Un bosque donde los árboles cantan al atardecer
22. Un circo ambulante en el desierto con caravanas steampunk
23. Una batalla de rap entre inteligencias artificiales
24. Un jardín zen con arena de oro líquido
25. Una nave espacial hecha de madera reciclada

### New 35 (mythology, nature, cultural, horror, fantasy)
26. Un templo griego flotando entre las nubes
27. Una sirena pintando un mural en el fondo del océano
28. Un faraón egipcio jugando ajedrez con esfinges
29. Una bruja preparando un caldo en una cueva de cristal
30. Unos vikingos navegando en un barco hecho de huesos de ballena
31. Una ciudad maya oculta dentro de una cascada
32. Un león con corona de flores gobernando una selva brillante
33. Una procesión de esqueletos tocando mariachis en el desierto
34. Unos samuráis luchando bajo una lluvia de pétalos de cerezo
35. Unos gladiadores romanos luchando en una arena de arena dorada
36. Unos duendes construyendo una ciudad subterránea de gemas
37. Unos esquimales cazando una aurora boreal viviente
38. Unos piratas navegando en un barco fantasma por un río de lava
39. Unos ninjas luchando en un techo bajo la luz de la luna
40. Unos vaqueros cazando un bisonte mecánico en el Lejano Oeste
41. Unos magos mezclando pociones en una torre de arena
42. Unos exploradores descubriendo una ciudad perdida en la selva
43. Unos guerreros espartanos luchando contra una horda de zombis
44. Unos monjes budistas meditando en la cima de una montaña flotante
45. Unos gladiadores luchando en una arena submarina
46. Unos esquimales construyendo un iglú de diamantes
47. Unos vaqueros del desierto persiguiendo bandidos en motocicletas
48. Unos monjes tocando campanas en un templo de bambú
49. Unos exploradores del Ártico descubriendo un castillo de hielo
50. Una rana gigante gobernando un reino de nenúfares
51. Unos elfos construyendo una ciudad en las copas de los árboles
52. Unos centauros compitiendo en una carrera de caballos
53. Unos minotauros jugando ajedrez en un laberinto de mármol
54. Unos fénix renaciendo de las cenizas en un bosque encantado
55. Unos trolls construyendo un puente sobre un río de lava
56. Unos gnomos excavando en una mina de gemas brillantes
57. Unos hadas tejiendo telarañas de luz en un bosque nocturno
58. Unos ogros cocinando un festín en una cueva de montaña
59. Unos ogros cuidando un jardín de setas gigantes
60. Unos enanos forjando una espada legendaria en un volcán

### Theme Distribution
| Category | Count |
|----------|-------|
| Fantasy/Medieval | 12 |
| Mitología | 8 |
| Naturaleza | 8 |
| Cultural | 6 |
| Horror/Gótico | 4 |
| Humor/Divertido | 8 |
| Aventura | 8 |
| Arte/Música | 6 |

---

## Bug Fixes Applied

1. **Timer loop dying** — Loop continued through all phases after first timeout
2. **Null guard in SET_ROOM** — Reducer handles null room state
3. **advance_reveal host-only** — Only host can advance reveal phase
4. **socketId leaking** — Stripped from winner/game_over objects
5. **chat_message validation** — Server validates via `getRoomBySocket`, not client payload
6. **start_game host check** — Server verifies `isHost` before starting
7. **Dead code cleanup** — Removed `useTimer` hook, `images_ready` listener, unused imports

---

## Commands

```bash
# Server
cd server && npm run dev

# Client
cd client && npm run dev

# Type check
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```

---

## Future Improvements Ideas
- Expand theme pool beyond 60 if needed
- Add theme categories/tags for filtering
- Allow custom theme input from players
- Add sound effects for phase transitions
- Show voting statistics in reveal phase
