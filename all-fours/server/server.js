// AI Usage Citation: Portions of this file were developed with assistance from GitHub Copilot (GPT-5.3-Codex).
import WebSocket, { WebSocketServer } from "ws";
import { GameController } from "./logic/GameController.js";
import { GUIIO } from "./GUIIO.js";
import http from "http";

// --- Server bootstrap ---
const PORT = process.env.PORT || 8080;
const server = http.createServer(); 
const wss = new WebSocketServer({ server });
server.listen(PORT, "0.0.0.0", () => {
  console.log(`WS server listening on ${PORT}`);
});

// In-memory room registry.
// Shape: roomId -> { players, game, gameStarted, roomMaster, teamAssignments }
const gameRooms = {};

function heartbeat() { this.isAlive = true; }
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", heartbeat);
  console.log("📡 New WebSocket connection established");

  // Main inbound websocket dispatcher.
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        case "createRoom":
          handleCreateRoom(ws, payload);
          break;
        case "joinRoom":
          await handleJoinRoom(ws, payload);
          break;
        case "playerResponse":
          handlePlayerResponse(ws, payload);
          break;
        case "cardPlayed":
          handleCardPlayed(ws, payload);
          break;
        case "startGame":
          handleStartGame(ws, payload);
          break;
        case "selectTeammate":
          handleSelectTeammate(ws, payload);
          break;
        case "resetTeams":
          handleResetTeams(ws, payload);
          break;
        case "leaveRoom":
          handleLeaveRoom(ws, payload);
          break;
        default:
          console.log("❓ Unknown message type:", type);
      }
    } catch (err) {
      console.error("⚠️ Message parse error:", err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid JSON" } }));
      }
    }
  });

  ws.on("close", (code, reason) => {
    console.log(
      `❌ WebSocket connection closed with code ${code}:`,
      reason?.toString()
    );

    // Code 1000 indicates a deliberate/normal close.
    const wasDeliberate = code === 1000;

    // Remove disconnected socket from whichever room it belonged to.
    cleanupPlayerFromRooms(ws, wasDeliberate);
  });
});

// Heartbeat watchdog: terminate dead sockets so close-cleanup can run.
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
 });
}, 15000);

wss.on("close", () => clearInterval(interval));

// Graceful process shutdown.
process.on("SIGTERM", () => { server.close(() => process.exit(0)); });
process.on("SIGINT", () => { server.close(() => process.exit(0)); });

// =============================================Message handlers ======================================*/
//======================================================================================================
async function handleJoinRoom(ws, payload) {
  try {
    const { roomId, playerId, playerName } = payload;

    console.log(`🚪 Player ${playerName} (${playerId}) joining room ${roomId}`);

    // Lazily create room on first join.
    if (!gameRooms[roomId]) {
      gameRooms[roomId] = {
        players: [],
        game: null,
        gameStarted: false,
        roomMaster: null,
        teamAssignments: null, 
      };
    }

    const room = gameRooms[roomId];

    // Prevent duplicate presence in a room (same id or same name).
    const existingPlayer = room.players.find(
      (p) => p.playerId === playerId || p.playerName === playerName
    );
    if (existingPlayer) {
      console.log(
        `⚠️ Player already exists in room: ${playerName} (${playerId})`
      );
      console.log(
        `Existing: ${existingPlayer.playerName} (${existingPlayer.playerId})`
      );
      ws.send(
        JSON.stringify({
          type: "error",
          payload: {
            message: "You are already in this room",
          },
        })
      );
      return;
    }

    // Hard cap at 4 players 
    if (room.players.length >= 4) {
      console.log(
        `❌ Room ${roomId} is full (${room.players.length}/4 players)`
      );
      ws.send(
        JSON.stringify({
          type: "error",
          payload: {
            message:
              "Room is full (4/4 players). Please try another room or wait for a spot to open.",
          },
        })
      );
      return;
    }

    // Persist player socket + identity in room state.
    const playerData = {
      ws,
      playerId,
      playerName,
    };

    // Add player to room roster.
    room.players.push(playerData);

    // First player becomes room master.
    if (room.players.length === 1) {
      room.roomMaster = playerId;
      console.log(`👑 ${playerName} is now the room master for room ${roomId}`);
    }

    console.log(
      `✅ Player ${playerName} added to room ${roomId}. Total players: ${room.players.length}`
    );

    // Send full room snapshot to joining player.
    ws.send(
      JSON.stringify({
        type: "joinedRoom",
        payload: {
          roomId,
          playerId,
          playersInRoom: room.players.length,
          totalPlayersInRoom: room.players.length,
          maxPlayers: 4,
          isRoomFull: room.players.length >= 4,
          gameStarted: room.gameStarted,
          allPlayers: room.players.map((p) => ({
            id: p.playerId,
            name: p.playerName,
          })),
          roomMaster: room.roomMaster,
          canStartGame:
            room.players.length >= 4 && room.teamAssignments !== null,
          teamAssignments: room.teamAssignments,
        },
      })
    );

    // Broadcast updated lobby state to everyone else.
    const playerListUpdate = {
      type: "playerListUpdate",
      payload: {
        roomId,
        playersInRoom: room.players.length,
        allPlayers: room.players.map((p) => ({
          id: p.playerId,
          name: p.playerName,
        })),
        roomMaster: room.roomMaster,
        canStartGame: room.players.length >= 4 && room.teamAssignments !== null,
        teamAssignments: room.teamAssignments,
      },
    };

    room.players.forEach((player) => {
      if (
        player.playerId !== playerId &&
        player.ws.readyState === WebSocket.OPEN
      ) {
        player.ws.send(JSON.stringify(playerListUpdate));
      }
    });

    // Game start is manual; joining does not auto-start the game.
  } catch (error) {
    console.error("❌ Error in handleJoinRoom:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        payload: { message: "Failed to join room" },
      })
    );
  }
}

function handlePlayerResponse(ws, payload) {
  try {
    const { roomId, playerId, response } = payload;
    console.log(
      `🗣️ Player response: ${playerId} -> ${response} in room ${roomId}`
    );

    const room = gameRooms[roomId];
    if (!room || !room.game) {
      console.error("❌ Room or game not found for player response");
      return;
    }

    // Forward interactive response to the active game IO adapter.
    if (room.game.io && room.game.io.handlePlayerResponse) {
      room.game.io.handlePlayerResponse(playerId, response);
    }
  } catch (error) {
    console.error("❌ Error in handlePlayerResponse:", error);
  }
}

function handleCardPlayed(ws, payload) {
  try {
    const { roomId, playerId, cardIndex } = payload;
    // console.log(
    //   `🃏 Card played: Player ${playerId} played card ${cardIndex} in room ${roomId}`
    // );

    const room = gameRooms[roomId];
    if (!room || !room.game) {
      console.error("❌ Room or game not found for card play");
      return;
    }

    // Forward card selection to the active game IO adapter.
    if (room.game.io && room.game.io.handleCardSelection) {
      room.game.io.handleCardSelection(playerId, cardIndex);
    }
  } catch (error) {
    console.error("❌ Error in handleCardPlayed:", error);
  }
}

function handleSelectTeammate(ws, payload) {
  try {
    const { roomId, playerId, teammateId } = payload;
    console.log(
      `👥 ${playerId} selected ${teammateId} as teammate in room ${roomId}`
    );

    const room = gameRooms[roomId];
    if (!room) {
      console.error("❌ Room not found for teammate selection");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Room not found" },
        })
      );
      return;
    }

    // Only room master can choose teammate.
    if (room.roomMaster !== playerId) {
      console.error("❌ Only room master can select teammate");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Only room master can select teammate" },
        })
      );
      return;
    }

    // Team assignment is lobby-only.
    if (room.gameStarted) {
      console.error("❌ Cannot select teammate after game started");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Cannot select teammate after game started" },
        })
      );
      return;
    }

    // Teammates can only be set in a full 4-player room.
    if (room.players.length < 4) {
      console.error("❌ Need 4 players before selecting teammates");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Need 4 players before selecting teammates" },
        })
      );
      return;
    }

    // Validate teammate selection target.
    const teammateExists = room.players.some((p) => p.playerId === teammateId);
    if (!teammateExists) {
      console.error("❌ Selected teammate not in room");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Selected player not in room" },
        })
      );
      return;
    }

    if (teammateId === playerId) {
      console.error("❌ Cannot select yourself as teammate");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Cannot select yourself as teammate" },
        })
      );
      return;
    }

    // Build two teams from room master + selected teammate.
    const allPlayerIds = room.players.map((p) => p.playerId);
    const team1 = [playerId, teammateId]; // Room master's team
    const team2 = allPlayerIds.filter((id) => !team1.includes(id)); // Remaining players

    room.teamAssignments = {
      roomMasterTeammate: teammateId,
      team1: team1,
      team2: team2,
    };

    console.log("🔍 DEBUGGING team assignments:");
    console.log("allPlayerIds:", allPlayerIds);
    console.log(
      "allPlayerNames:",
      room.players.map((p) => `${p.playerName} (${p.playerId})`)
    );
    console.log("room master:", playerId);
    console.log("selected teammate:", teammateId);
    console.log("team1:", team1);
    console.log("team2:", team2);
    console.log(
      "final teamAssignments:",
      JSON.stringify(room.teamAssignments, null, 2)
    );

    console.log(
      `✅ Teams assigned: Team 1: ${team1.join(", ")}, Team 2: ${team2.join(", ")}`
    );

    // Broadcast final team assignment and start eligibility.
    const teamUpdate = {
      type: "teamAssignments",
      payload: {
        roomId,
        teamAssignments: room.teamAssignments,
        canStartGame: true,
      },
    };

    room.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(teamUpdate));
      }
    });
  } catch (error) {
    console.error("❌ Error in handleSelectTeammate:", error);
  }
}

function handleResetTeams(ws, payload) {
  try {
    const { roomId, playerId } = payload;
    // console.log(`🔄 Reset teams requested by ${playerId} in room ${roomId}`);

    const room = gameRooms[roomId];
    if (!room) {
      console.error("❌ Room not found for reset teams");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Room not found" },
        })
      );
      return;
    }

    // Only room master can reset teams.
    if (room.roomMaster !== playerId) {
      console.error("❌ Only room master can reset teams");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Only room master can reset teams" },
        })
      );
      return;
    }

    // Team reset is lobby-only.
    if (room.gameStarted) {
      console.error("❌ Cannot reset teams after game started");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Cannot reset teams after game started" },
        })
      );
      return;
    }

    // Clear team assignments and return lobby to pre-team state.
    room.teamAssignments = null;
    console.log(`🔄 Teams reset in room ${roomId}`);

    // Broadcast reset team state.
    const teamUpdate = {
      type: "teamAssignments",
      payload: {
        roomId,
        teamAssignments: null,
        canStartGame: false,
      },
    };

    room.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(teamUpdate));
      }
    });
  } catch (error) {
    console.error("❌ Error in handleResetTeams:", error);
  }
}

function handleStartGame(ws, payload) {
  try {
    const { roomId, playerId } = payload;
    // console.log(`🎮 Start game requested by ${playerId} in room ${roomId}`);

    const room = gameRooms[roomId];
    if (!room) {
      console.error("❌ Room not found for game start");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Room not found" },
        })
      );
      return;
    }

    // Only room master can start the game.
    if (room.roomMaster !== playerId) {
      console.error("❌ Only room master can start the game");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Only room master can start the game" },
        })
      );
      return;
    }

    // Reject duplicate start requests.
    if (room.gameStarted) {
      console.error("❌ Game already started");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Game already started" },
        })
      );
      return;
    }

    // Require full table.
    if (room.players.length < 4) {
      console.error("❌ Not enough players to start game");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: {
            message: `Need 4 players to start. Currently have ${room.players.length}`,
          },
        })
      );
      return;
    }

    // Require explicit team assignment before start.
    if (!room.teamAssignments) {
      console.error("❌ Teams not assigned yet");
      ws.send(
        JSON.stringify({
          type: "error",
          payload: {
            message: "Please select your teammate before starting the game",
          },
        })
      );
      return;
    }

    // Start game asynchronously (fire-and-forget from message handler).
    startGame(roomId);
  } catch (error) {
    console.error("❌ Error in handleStartGame:", error);
  }
}

async function startGame(roomId) {
  try {
    console.log(`🎮 Starting game in room ${roomId}`);

    const room = gameRooms[roomId];
    const playerData = room.players.map((p) => ({
      playerId: p.playerId,
      playerName: p.playerName,
    }));

    // Create websocket IO adapter used by game engine callbacks.
    const wsIO = new GUIIO(room.players);

    // Initialize game engine with room players and chosen team layout.
    const game = new GameController(wsIO, playerData, room.teamAssignments);
    room.game = game;
    room.gameStarted = true;

    // Engine setup (players, teams, dealer, intro messages).
    game.setupGame();


    // Keep GUI seat order aligned with game engine seat order.
    wsIO.updatePlayerOrder(game.getPlayers());
 

    // Notify clients to switch from lobby UI into game UI.
    room.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "gameStarted",
          payload: {
            roomId,
            players: room.players.map((p) => ({
              id: p.playerId,
              name: p.playerName,
              hand: [], // Will be populated when cards are dealt
            })),
            yourPlayerId: player.playerId,
          },
        })
      );
    });

    // Run match loop until winner, then transition room back to lobby-ready.
    try {
      const winner = await game.playMatch();

      transitionRoomToLobby(roomId, {
        reason: "Match completed",
        message: winner
          ? `Match ended - ${winner.name} won. Returning to lobby.`
          : "Match ended. Returning to lobby.",
      });

      // Broadcast refreshed lobby snapshot after natural match end.
      broadcastPlayerStatusUpdate(roomId);
    } catch (error) {
      console.error("❌ Error in game.playMatch():", error);
      console.error("❌ Stack trace:", error.stack);
    }
  } catch (error) {
    console.error("❌ Error starting game:", error);
  }
}

// Returns room to lobby-ready state without disconnecting participants.
function transitionRoomToLobby(
  roomId,
  { reason = "Game ended", message = "Game ended", excludePlayerId = null } = {}
) {
  const room = gameRooms[roomId];
  if (!room) return false;

  // No-op if room is already lobby-ready.
  if (!room.gameStarted && !room.game) {
    return false;
  }

  console.log(`🔄 Transitioning room ${roomId} back to lobby-ready state`);

  room.gameStarted = false;
  room.game = null;

  room.players.forEach((p) => {
    if (p.playerId === excludePlayerId) return;
    if (p.ws.readyState !== WebSocket.OPEN) return;

    p.ws.send(
      JSON.stringify({
        type: "gameEnded",
        payload: {
          reason,
          message,
        },
      })
    );
  });

  return true;
}

function handleLeaveRoom(ws, payload) {
  try {
    const { roomId, playerId } = payload;

    console.log(`🚪 Player ${playerId} manually leaving room ${roomId}`);

    const room = gameRooms[roomId];
    if (!room) {
      console.log(`❌ Room ${roomId} not found`);
      return;
    }

    const player = room.players.find((p) => p.playerId === playerId);
    if (!player) {
      console.log(`❌ Player ${playerId} not found in room ${roomId}`);
      return;
    }

    transitionRoomToLobby(roomId, {
      reason: "Player left",
      message: `Game ended - ${player.playerName} left the room`,
      excludePlayerId: playerId,
    });

    // Remove player from roster after notifying room of game end.
    removePlayerFromRoom(roomId, playerId);

    // Confirm leave action back to requester.
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "leftRoom",
          payload: {
            roomId,
            message: "Successfully left room",
          },
        })
      );
    }
  } catch (error) {
    console.error("❌ Error handling leave room:", error);
  }
}

function cleanupPlayerFromRooms(ws, wasDeliberate = false) {
  try {
    // Find socket owner and remove from its room.
    for (const [roomId, room] of Object.entries(gameRooms)) {
      const playerIndex = room.players.findIndex((p) => p.ws === ws);
      if (playerIndex >= 0) {
        const player = room.players[playerIndex];
        console.log(
          `🧹 Player ${player.playerName} disconnected from room ${roomId} - removing immediately`
        );

        transitionRoomToLobby(roomId, {
          reason: "Player disconnected",
          message: `Game ended - ${player.playerName} disconnected`,
          excludePlayerId: player.playerId,
        });

        // Remove from room roster and rebroadcast lobby state.
        removePlayerFromRoom(roomId, player.playerId);
        break;
      }
    }
  } catch (error) {
    console.error("❌ Error in cleanup:", error);
  }
}

function removePlayerFromRoom(roomId, playerId) {
  try {
    const room = gameRooms[roomId];
    if (!room) return;

    // Remove player from room roster.
    room.players = room.players.filter((p) => p.playerId !== playerId);
    console.log(`🚫 Removed player ${playerId} from room ${roomId}`);

    // Team selections become invalid after a player leaves.
    room.teamAssignments = null;
    // console.log(`🔄 Team assignments reset due to player leaving`);

    // Transfer room master if the current master left.
    if (room.roomMaster === playerId && room.players.length > 0) {
      room.roomMaster = room.players[0].playerId;
      console.log(
        `👑 Room master transferred to ${room.players[0].playerName}`
      );
    }

    // Delete empty room, otherwise rebroadcast lobby state.
    if (room.players.length === 0) {
      console.log(`🗑️ Removing empty room ${roomId}`);
      delete gameRooms[roomId];
    } else {
      broadcastPlayerStatusUpdate(roomId);
    }
  } catch (error) {
    console.error("❌ Error removing player from room:", error);
  }
}

function broadcastPlayerStatusUpdate(roomId) {
  try {
    const room = gameRooms[roomId];
    if (!room) return;

    // All entries are live connections in the current room model.
    const connectedPlayers = room.players;

    const statusUpdate = {
      type: "playerListUpdate",
      payload: {
        roomId,
        playersInRoom: connectedPlayers.length,
        totalPlayersInRoom: connectedPlayers.length,
        maxPlayers: 4,
        isRoomFull: connectedPlayers.length >= 4,
        allPlayers: connectedPlayers.map((p) => ({
          id: p.playerId,
          name: p.playerName,
        })),
        roomMaster: room.roomMaster,
        canStartGame:
          connectedPlayers.length >= 4 && room.teamAssignments !== null,
        teamAssignments: room.teamAssignments,
      },
    };

    // Broadcast current lobby snapshot to all connected players.
    connectedPlayers.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(statusUpdate));
      }
    });
  } catch (error) {
    console.error("❌ Error broadcasting player status:", error);
  }
}
