# Reporte de Errores - Prompt Battle Royale

Generado por análisis automatizado del código fuente.

---

## CRÍTICOS (5)

### CRIT-1: Votación imposible — playerId se anula durante voting
- **Archivo:** `server/src/GameManager.ts:347` / `client/src/components/VotingGallery.tsx:108`
- **Problema:** `getPublicRoomState()` pone `playerId: undefined` para anonimizar imágenes durante voting. El cliente vota con `img.playerId || ''`, enviando string vacío. Todos los votos van a nadie.
- **Solución:** No anonimizar playerId en el estado público. La UI ya oculta el nombre, la anonimidad se mantiene visualmente.

### CRIT-2: Modal de eliminación no se muestra
- **Archivo:** `client/src/context/GameContext.tsx:41`
- **Problema:** `SET_PHASE` resetea `eliminatedPlayerId` a `null`. Si `player_eliminated` llega antes que `phase_change`, el modal nunca aparece.
- **Solución:** No resetear `eliminatedPlayerId` en `SET_PHASE`. Solo limpiarlo al empezar una nueva ronda.

### CRIT-3: advance_reveal sin validación
- **Archivo:** `server/src/socket.ts:74-77`
- **Problema:** El handler `advance_reveal` no valida fase actual ni que el jugador esté en la sala. Cualquiera puede saltarse fases.
- **Solución:** Validar `room.phase === 'reveal'` antes de avanzar.

### CRIT-4: imagesReady nunca se limpia entre rondas
- **Archivo:** `client/src/pages/GamePage.tsx:21`
- **Problema:** `imagesReady` es un `Set<number>` por índice que persiste entre rondas. En ronda 2+, los índices viejos aparecen como "cargados".
- **Solución:** Resetear `imagesReady` al cambiar de ronda.

### CRIT-5: PromptInput no resetea submitted entre rondas
- **Archivo:** `client/src/components/PromptInput.tsx:13`
- **Problema:** `submitted` persiste si React reusa el componente. En ronda 2+ ves "Prompt Enviado" sin poder escribir.
- **Solución:** Forzar remount con `key={room.round}`.

---

## ALTOS (7)

### HIGH-1: Eliminación aleatoria cuando nadie recibe votos
- **Archivo:** `server/src/GameManager.ts:247`
- **Problema:** Si `maxVotes === 0`, todos empatan y se elimina uno al azar.
- **Solución:** Si `maxVotes === 0`, no eliminar a nadie.

### HIGH-2: Timer loop sin cleanup
- **Archivo:** `server/src/socket.ts:109-124`
- **Problema:** La cadena de `setTimeout` nunca se cancela. Si la sala se elimina, el timer sigue un tick más.
- **Solución:** Devolver función de cleanup.

### HIGH-3: Reintentos infinitos de imagen
- **Archivo:** `client/src/components/VotingGallery.tsx:29-33`
- **Problema:** `ImageWithRetry` reintenta infinitamente sin tope.
- **Solución:** Limitar a 5 reintentos, mostrar estado de error.

### HIGH-4: useEffect con dependencias incompletas
- **Archivo:** `client/src/pages/GamePage.tsx:29-33`
- **Problema:** El efecto de navegación a resultados solo depende de `[phase]`, usa `appState.*` sin declararlos.
- **Solución:** Completar dependencias.

### HIGH-5: Precarga de imágenes sin cleanup de timeouts
- **Archivo:** `client/src/pages/GamePage.tsx:35-44`
- **Problema:** Los `setTimeout` de precarga no se cancelan al desmontar, causando actualizaciones en componente desmontado.
- **Solución:** Devolver cleanup que cancele timeouts.

### HIGH-6: targetId no validado como jugador real
- **Archivo:** `server/src/GameManager.ts:208-219`
- **Problema:** `submitVote` no verifica que `targetId` sea un jugador activo. Se aceptan IDs inválidos.
- **Solución:** Validar que `targetId` exista entre los jugadores activos.

### HIGH-7: Sin protección contra múltiples timer loops
- **Archivo:** `server/src/socket.ts:37`
- **Problema:** `startTimerLoop` puede llamarse múltiples veces para la misma sala, creando loops paralelos.
- **Solución:** Usar `Set<string>` para trackear salas con timer activo.

---

## MEDIOS (13)

### MED-1: Sin validación de contenido de prompts
- **Archivo:** `server/src/GameManager.ts:138`
- **Problema:** El servidor acepta cualquier string como prompt sin validar tipo ni longitud.
- **Solución:** Validar tipo string y longitud 10-500 server-side.

### MED-2: Chat sin rate limiting ni validación
- **Archivo:** `server/src/socket.ts:79-86`
- **Problema:** No se valida longitud del mensaje. Un cliente malicioso puede inundar.
- **Solución:** Validar tipo string y longitud máxima.

### MED-3: Host reasignado por posición en array
- **Archivo:** `server/src/GameManager.ts:82-84`
- **Problema:** Si el host se va, el jugador en posición 0 (incluso eliminado) recibe host.
- **Solución:** Verificar que no haya host antes de reasignar.

### MED-4: Doble check redundante en submitVote
- **Archivo:** `server/src/GameManager.ts:213-215`
- **Problema:** `voter.hasVoted` ya previene doble voto, el `room.votes.some()` es redundante.
- **Solución:** Eliminar el check redundante.

### MED-5: currentPlayer como dependencia inestable en useEffect
- **Archivo:** `client/src/pages/LobbyPage.tsx:32`
- **Problema:** `currentPlayer` es nuevo objeto en cada render, causa re-registro constante del listener.
- **Solución:** Usar `currentPlayer?.id` o sacar la lógica del efecto.

### MED-6: PlayerList compara por username
- **Archivo:** `client/src/components/PlayerList.tsx:21`
- **Problema:** Se compara por `username` en vez de `id`. Nombres duplicados causan resaltado incorrecto.
- **Solución:** Pasar `currentPlayerId` y comparar por ID.

### MED-7: Timer SVG hardcodea max 60s
- **Archivo:** `client/src/components/Timer.tsx:18`
- **Problema:** `strokeDasharray` calcula con `seconds/60`. Si el timer > 60, el círculo se desborda.
- **Solución:** Pasar max por prop o calcular dinámicamente.

### MED-8: GameState nunca se resetea al salir
- **Archivo:** `client/src/pages/ResultsPage.tsx:21-24`
- **Problema:** No se dispatcha `RESET` al salir. Datos de partida anterior persisten.
- **Solución:** Dispatch `RESET` en `handlePlayAgain`.

### MED-9: Chat acumula mensajes infinitamente
- **Archivo:** `client/src/components/Chat.tsx:24`
- **Problema:** Los mensajes nunca se eliminan, consumo de memoria creciente.
- **Solución:** Limitar a últimos 100 mensajes.

### MED-10: submitPrompt/submitVote sin validación de tipos
- **Archivo:** `server/src/GameManager.ts:125,208`
- **Problema:** No se valida que prompt/targetId sean strings. Cliente podría enviar objetos.
- **Solución:** Validar tipo al inicio de cada función.

### MED-11: generateImages sin verificar jugadores activos
- **Archivo:** `server/src/socket.ts:165-168`
- **Problema:** Crea URLs para TODOS los prompts sin verificar que los jugadores aún estén activos.
- **Solución:** Filtrar por jugadores activos antes de generar URLs.

### MED-12: code no validado contra sala del socket
- **Archivo:** `server/src/socket.ts:31,74`
- **Problema:** `start_game` y `advance_reveal` reciben `data.code` pero no validan que el socket pertenezca a esa sala.
- **Solución:** Usar `getRoomBySocket(socket.id)` en vez de confiar en `data.code`.

### MED-13: voteResults siempre [] durante voting
- **Archivo:** `server/src/GameManager.ts:350-355`
- **Problema:** Los votos solo se envían en reveal/finished, nunca durante voting.
- **Solución:** Es intencional (anonimato), no requiere cambio.

---

## BAJOS (8)

### LOW-1: CORS abierto a todos
- **Archivo:** `server/src/index.ts:16`
- **Problema:** `cors({ origin: '*' })` inseguro para producción.
- **Solución:** Restringir origin en producción.

### LOW-2: Sin reconexión de socket
- **Archivo:** `client/src/context/SocketContext.tsx`
- **Problema:** Si el socket se desconecta, el jugador pierde todo su estado.

### LOW-3: Nombres duplicados permitidos
- **Archivo:** `server/src/GameManager.ts:48`
- **Problema:** Dos jugadores pueden tener el mismo username en una sala.

### LOW-4: Streak inconsistente
- **Archivo:** `client/src/components/Leaderboard.tsx:36`
- **Problema:** `Leaderboard` muestra streak > 1, `PlayerList` lo muestra > 0.

### LOW-5: formatTimer no maneja negativos
- **Archivo:** `client/src/utils/api.ts:1-5`
- **Problema:** Si seconds fuera negativo, mostraría -1:59.

### LOW-6: Build script frágil
- **Archivo:** `package.json:9`
- **Problema:** Si build del cliente falla, el servidor aún se ejecuta.

### LOW-7: @types/node faltante
- **Archivo:** `server/package.json`
- **Problema:** El servidor usa path/__dirname pero no tiene @types/node.

### LOW-8: eliminatedPlayerId no se resetea en SET_ROOM
- **Archivo:** `client/src/context/GameContext.tsx:37`
- **Problema:** Cuando llega room_update, eliminatedPlayerId persiste.

---

*Total: 33 problemas (5 críticos, 7 altos, 13 medios, 8 bajos)*
