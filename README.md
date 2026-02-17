# All Fours – Project Architecture

This is a multiplayer implementation of the popualr Trinidadian card game All Fours.

The system is split into a React client and a Node WebSocket server with shared game-domain concepts.

## High-Level Overview

Multiplayer flow (runtime path):

Client UI (React)
→ WebSocket transport adapter
→ Server message router + room state
→ Game engine (GameController/Round/Trick)
→ Server IO adapter (GUIIO)
→ Back to client via typed socket messages

## Repository Structure

- all-fours/src
        - React app UI and client-side message handling
        - Multiplayer game board, lobby, reducer-driven state updates
- all-fours/server
        - WebSocket server and authoritative game execution
        - Room lifecycle, start/end transitions, disconnect handling
- all-fours/src/logic and all-fours/server/logic
        - Domain classes: Card, Deck, Team, Round, Trick, GameController
        - Server logic is authoritative for multiplayer matches
- root-level legacy/test files
        - Older prototypes and Java versions retained for reference

## Runtime Components (Multiplayer)

### 1) Client App Shell

- Entry: all-fours/src/index.js
- Main app: all-fours/src/App.js
- Responsibilities:
        - Collect player name + room id
        - Move between menu/lobby/game modes
        - Mount MultiplayerGameBoard once room join succeeds

### 2) Multiplayer UI State Owner

- File: all-fours/src/components/MultiplayerGameBoard.jsx
- Uses a reducer (`uiReducer`) as the single UI state container.
- Stores:
        - lobby state, team assignments
        - game state snapshot
        - prompts, trick state, active player
        - logs, overlays, kicked cards
- Sends user actions to server via WebSocketClient methods:
        - sendStartGame, sendSelectTeammate, sendResetTeams
        - sendPlayerResponse, sendCardPlayed, sendLeaveRoom

### 3) Client Message Normalizer/Dispatcher

- File: all-fours/src/net/applyServerMessages.js
- Converts incoming server messages into reducer actions.
- Message examples:
        - lobby, teamAssignments, gameState
        - playerPrompt, cardPrompt
        - trickState, scores, logMessage, overlayMessage
        - gameEnded, leftRoom

### 4) Client Socket Transport

- File: all-fours/src/components/WebSocketClient.jsx
- Responsibilities:
        - Open/close/reconnect WebSocket
        - Join room after connect
        - Map envelope `{ type, payload }` from server into client callbacks
        - Expose send* command methods to UI

### 5) Server Transport + Room Router

- File: all-fours/server/server.js
- Responsibilities:
        - Accept WebSocket connections
        - Parse inbound message envelopes
        - Route by message type (join/start/select/card/player response/leave)
        - Manage room registry (`gameRooms`)
        - Handle room master, team assignment, room capacity
        - Handle disconnect cleanup and lobby rebroadcasts

### 6) Authoritative Game Engine

- Files:
        - all-fours/server/logic/GameController.js
        - all-fours/server/logic/Round.js
        - all-fours/server/logic/Trick.js
- Responsibilities:
        - Setup players/teams/dealer
        - Execute match loop and rounds
        - Enforce game rules, scoring, and turn order
        - Trigger IO events (prompts, scores, trick updates, logs)

### 7) Server IO Adapter (Bridge Layer)

- File: all-fours/server/GUIIO.js
- Purpose: translate engine-level IO calls into socket messages.
- Examples:
        - `promptPlayer` / `promptCard` → targeted prompts
        - `showTrickState` / `showPlayerHands` → state broadcasts
        - `showScores`, `showMessage`, overlays → UX updates

This layer decouples game rules from websocket protocol details.

## State Ownership Model

### Server (Source of Truth)

- Room membership and room master
- Team assignments and game start eligibility
- Match/round/trick progression
- Final score/winner decisions

### Client (Projection of Server State)

- UI-only state for rendering and interaction
- Local reducer state is derived from server events
- Client does not authoritatively compute match outcomes

## Message Contract Pattern

Socket protocol uses a typed envelope:

- Inbound to server:
        - `{ type: "joinRoom", payload: {...} }`
        - `{ type: "startGame", payload: {...} }`
        - `{ type: "playerResponse", payload: {...} }`
        - `{ type: "cardPlayed", payload: {...} }`
- Outbound to client:
        - `lobby`, `playerListUpdate`, `teamAssignments`
        - `gameStarted`, `gameState`, `trickState`, `scores`
        - `playerPrompt`, `cardPrompt`
        - `logMessage`, `overlayMessage`, `gameEnded`, `leftRoom`

## Match Lifecycle

1) Players join room
2) Room master assigns teammates
3) Room master starts game
4) Server builds GameController + GUIIO and runs `playMatch()`
5) Round/trick events stream to clients
6) On natural finish or interruption, room transitions back to lobby-ready state
7) Players can start a new game in the same room

## Failure/Recovery Behavior

- Server heartbeat terminates dead sockets.
- Disconnect/leave triggers room cleanup.
- Team assignments are invalidated when a player leaves.
- Lobby snapshot is rebroadcast after room membership changes.

## Local Development

Run server:

- cd all-fours/server
- node server.js

Run frontend:

- cd all-fours
- npm start

If testing local sockets, ensure frontend connects to `ws://localhost:8080`.

## Notes For Future Refactors

- Keep server logic authoritative to avoid client/server divergence.
- Treat GUIIO as protocol adapter; avoid embedding game rules there.
- Keep message types stable and version changes carefully.
- When changing reducer shape, update `applyServerMessages` in lockstep.