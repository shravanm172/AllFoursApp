import WebSocket, { WebSocketServer } from "ws";
import { GameController } from "./logic/GameController.js"; // game logic
import { GUIIO } from "./GUIIO.js"; // custom IO handler
import http from "http";

// const wss = new WebSocketServer({ port: 8080 });
// console.log("🌐 WebSocket server running on ws://localhost:8080");
const PORT = process.env.PORT || 8080;
const server = http.createServer(); 
const wss = new WebSocketServer({ server });
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 WebSocket server listening on ws://0.0.0.0:${PORT}`);
});

const gameRooms = {}; // Map: roomId => { players: [], game: GameController }

function heartbeat() { this.isAlive = true; }
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", heartbeat);
  console.log("📡 New WebSocket connection established");

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

    // Determine if this was a deliberate close (code 1000) or unexpected
    const wasDeliberate = code === 1000;

    // Clean up player from any rooms they were in
    cleanupPlayerFromRooms(ws, wasDeliberate);
  });
});

// Ping every 15s; terminate if no pong -> triggers  cleanup
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
 });
}, 15000);

wss.on("close", () => clearInterval(interval));

// Graceful shutdown on platform signals
process.on("SIGTERM", () => { server.close(() => process.exit(0)); });
process.on("SIGINT", () => { server.close(() => process.exit(0)); });

// Handler Functions
async function handleJoinRoom(ws, payload) {
  try {
    const { roomId, playerId, playerName } = payload;

    console.log(`🚪 Player ${playerName} (${playerId}) joining room ${roomId}`);

    // Initialize room if it doesn't exist
    if (!gameRooms[roomId]) {
      gameRooms[roomId] = {
        players: [],
        game: null,
        gameStarted: false,
        roomMaster: null,
        teamAssignments: null, // { roomMasterTeammate: playerId, team1: [id1, id2], team2: [id3, id4] }
      };
    }

    const room = gameRooms[roomId];

    // Debug: Check if player already exists in room
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

    // Check room capacity - no reconnection logic, everyone is treated as new
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

    // Create new player data - everyone is treated as a new player
    const playerData = {
      ws,
      playerId,
      playerName,
    };

    // New player joining
    room.players.push(playerData);

    // Set as room master if they're the first player
    if (room.players.length === 1) {
      room.roomMaster = playerId;
      console.log(`👑 ${playerName} is now the room master for room ${roomId}`);
    }

    console.log(
      `✅ Player ${playerName} added to room ${roomId}. Total players: ${room.players.length}`
    );

    // Send initial join confirmation
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

    // Broadcast updated player list to all other players in the room
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

    // Note: Game will only start when room master manually starts it
    // No longer auto-starting when 4 players join
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

    // Forward response to WebSocket GUIIO
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
    console.log(
      `🃏 Card played: Player ${playerId} played card ${cardIndex} in room ${roomId}`
    );

    const room = gameRooms[roomId];
    if (!room || !room.game) {
      console.error("❌ Room or game not found for card play");
      return;
    }

    // Forward card selection to WebSocket GUIIO
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

    // Check if player is room master
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

    // Check if game already started
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

    // Check if we have 4 players
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

    // Validate teammate selection
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

    // Create team assignments
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

    // Broadcast team assignments to all players
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
    console.log(`🔄 Reset teams requested by ${playerId} in room ${roomId}`);

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

    // Check if player is room master
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

    // Check if game already started
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

    // Reset team assignments
    room.teamAssignments = null;
    console.log(`🔄 Teams reset in room ${roomId}`);

    // Send updated team assignments to all players
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
    console.log(`🎮 Start game requested by ${playerId} in room ${roomId}`);

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

    // Check if player is room master
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

    // Check if game already started
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

    // Check if we have enough players
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

    // Check if teams have been assigned
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

    // Start the game
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

    console.log("🔍 DEBUGGING startGame():");
    console.log("playerData:", JSON.stringify(playerData, null, 2));
    console.log(
      "teamAssignments:",
      JSON.stringify(room.teamAssignments, null, 2)
    );

    // Create WebSocket IO handler for this game
    const wsIO = new GUIIO(room.players);

    // Initialize game with WebSocket IO and player data (including IDs)
    const game = new GameController(wsIO, playerData, room.teamAssignments);
    room.game = game;
    room.gameStarted = true;

    // Set up the game
    console.log("🔍 About to call game.setupGame()...");
    game.setupGame();
    console.log("🔍 game.setupGame() completed");

    // Sync GUIIO player order with GameController's arranged order
    console.log("🔄 Syncing GUIIO player order with GameController...");
    wsIO.updatePlayerOrder(game.getPlayers());
    console.log("🔄 GUIIO player order synced!");

    // Notify all players that game is starting
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

    // Start the game logic
    console.log("🎮 About to call game.playMatch()...");
    try {
      await game.playMatch();
      console.log("🎮 game.playMatch() completed successfully!");
    } catch (error) {
      console.error("❌ Error in game.playMatch():", error);
      console.error("❌ Stack trace:", error.stack);
    }
  } catch (error) {
    console.error("❌ Error starting game:", error);
  }
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

    // If game is in progress, end it
    if (room.gameStarted) {
      console.log(`🛑 Ending game due to player leaving`);
      room.gameStarted = false;
      room.game = null;

      // Notify all other players that game ended
      room.players.forEach((p) => {
        if (p.playerId !== playerId && p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(
            JSON.stringify({
              type: "gameEnded",
              payload: {
                reason: "Player left",
                message: `Game ended - ${player.playerName} left the room`,
              },
            })
          );
        }
      });
    }

    // Remove player from room immediately
    removePlayerFromRoom(roomId, playerId);

    // Send confirmation to the leaving player
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
    // Find and remove player from any rooms immediately
    for (const [roomId, room] of Object.entries(gameRooms)) {
      const playerIndex = room.players.findIndex((p) => p.ws === ws);
      if (playerIndex >= 0) {
        const player = room.players[playerIndex];
        console.log(
          `🧹 Player ${player.playerName} disconnected from room ${roomId} - removing immediately`
        );

        // If game is in progress, end it
        if (room.gameStarted) {
          console.log(`🛑 Ending game due to player disconnection`);
          room.gameStarted = false;
          room.game = null;

          // Notify all remaining players that game ended
          room.players.forEach((p) => {
            if (
              p.playerId !== player.playerId &&
              p.ws.readyState === WebSocket.OPEN
            ) {
              p.ws.send(
                JSON.stringify({
                  type: "gameEnded",
                  payload: {
                    reason: "Player disconnected",
                    message: `Game ended - ${player.playerName} disconnected`,
                  },
                })
              );
            }
          });
        }

        // Remove player from room immediately
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

    // Remove player from room
    room.players = room.players.filter((p) => p.playerId !== playerId);
    console.log(`🚫 Removed player ${playerId} from room ${roomId}`);

    // Always reset team assignments when someone leaves because teams become invalid
    room.teamAssignments = null;
    console.log(`🔄 Team assignments reset due to player leaving`);

    // Handle room master change if needed
    if (room.roomMaster === playerId && room.players.length > 0) {
      // Transfer room master to first remaining player
      room.roomMaster = room.players[0].playerId;
      console.log(
        `👑 Room master transferred to ${room.players[0].playerName}`
      );
    }

    // Clean up empty rooms
    if (room.players.length === 0) {
      console.log(`🗑️ Removing empty room ${roomId}`);
      delete gameRooms[roomId];
    } else {
      // Broadcast updated room state
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

    const connectedPlayers = room.players; // All players are connected (no disconnected state)

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

    // Send to all connected players
    connectedPlayers.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(statusUpdate));
      }
    });
  } catch (error) {
    console.error("❌ Error broadcasting player status:", error);
  }
}
