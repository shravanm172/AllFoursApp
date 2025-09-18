// import React, { useState, useEffect, useRef, useCallback } from 'react';ebSocketClient.jsx
// Component to handle WebSocket connection to multiplayer server

import React, { useState, useEffect, useRef, useCallback } from "react";
import { WS_URL } from "../config";   // adjust path if needed

export const WebSocketClient = ({
  onGameUpdate,
  roomId,
  playerId,
  playerName,
  onClientReady, // New callback to expose client functions
  onError, // New callback for error handling
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const wsRef = useRef(null);

  useEffect(() => {
    // Define handleServerMessage inside useEffect to avoid dependency issues
    const handleMessage = (data) => {
      const { type, payload } = data;

      switch (type) {
        case "joinedRoom":
          console.log("✅ Successfully joined room:", payload);
          setConnectionStatus(`Connected to room ${payload.roomId}`);
          // Update game state with lobby information
          if (onGameUpdate && payload) {
            onGameUpdate({
              type: "lobby",
              roomId: payload.roomId,
              playersInRoom: payload.playersInRoom,
              allPlayers: payload.allPlayers || [],
              gameStarted: payload.gameStarted,
              roomMaster: payload.roomMaster,
              canStartGame: payload.canStartGame,
            });
          }
          break;

        case "playerListUpdate":
          console.log("👥 Player list updated:", payload);
          // Update lobby state with new player list
          if (onGameUpdate && payload) {
            onGameUpdate({
              type: "lobby",
              roomId: payload.roomId,
              playersInRoom: payload.playersInRoom,
              allPlayers: payload.allPlayers || [],
              gameStarted: false, // Still in lobby if we're getting player list updates
              roomMaster: payload.roomMaster,
              canStartGame: payload.canStartGame,
            });
          }
          break;

        case "teamAssignments":
          console.log("👥 Team assignments updated:", payload);
          if (onGameUpdate && payload) {
            onGameUpdate({
              type: "teamAssignments",
              teamAssignments: payload.teamAssignments,
              canStartGame: payload.canStartGame,
            });
          }
          break;

        case "gameStarted":
          console.log("🎮 Game started:", payload);
          setConnectionStatus("Game Started");
          // Trigger game state update when game starts
          if (onGameUpdate && payload) {
            onGameUpdate({
              gameStarted: true,
              players: payload.players || [],
              roomId: payload.roomId,
              yourPlayerId: payload.yourPlayerId || playerId,
            });
          }
          break;

        case "logMessage":
          console.log("📝 Log message:", payload.message);
          if (onGameUpdate) {
            onGameUpdate({
              type: "logMessage",
              message: payload.message,
            });
          }
          break;

        case "overlayMessage":
          console.log("📢 Overlay message:", payload.message);
          if (onGameUpdate) {
            onGameUpdate({
              type: "overlayMessage",
              message: payload.message,
            });
          }
          break;

        case "gameState":
          console.log("🎲 Game state update:", payload);
          if (onGameUpdate) {
            onGameUpdate(payload);
          }
          break;

        case "activePlayerChange":
          console.log("👆 Active player changed:", payload);
          if (onGameUpdate) {
            onGameUpdate({
              type: "activePlayerChange",
              activePlayerId: payload.playerId,
            });
          }
          break;

        case "trickState":
          console.log("🎯 Trick state update:", payload);
          if (onGameUpdate) {
            onGameUpdate({
              type: "trickState",
              playedCards: payload.playedCards,
            });
          }
          break;

        case "kickedCard":
          console.log("🃏 Kicked card:", payload);
          if (onGameUpdate) {
            onGameUpdate({
              type: "kickedCard",
              card: payload.card,
            });
          }
          break;

        case "clearKickedCards":
          console.log("🧼 Clear kicked cards");
          if (onGameUpdate) {
            onGameUpdate({ type: "clearKickedCards" });
          }
          break;

        case "scores":
          console.log("📊 Scores update:", payload);
          if (onGameUpdate) {
            onGameUpdate({
              type: "scores",
              teamA: payload.teamA,
              teamB: payload.teamB,
            });
          }
          break;

        case "playerPrompt":
          console.log("🤔 Player prompt:", payload);
          if (onGameUpdate) {
            onGameUpdate({
              type: "playerPrompt",
              promptText: payload.promptText,
              buttonOptions: payload.buttonOptions,
              playerId: payload.playerId,
            });
          }
          break;

        case "cardPrompt":
          console.log("🃏 Card prompt:", payload);
          if (onGameUpdate) {
            onGameUpdate({
              type: "cardPrompt",
              hand: payload.hand,
              playerId: payload.playerId,
            });
          }
          break;
        case "error":
          console.error("❌ Server error:", payload.message);
          setConnectionStatus(`Error: ${payload.message}`);
          // Call error callback if provided
          if (onError) {
            onError(payload.message);
          }
          break;

        case "leftRoom":
          console.log("👋 Left room successfully:", payload);
          if (onGameUpdate) {
            onGameUpdate({
              type: "leftRoom",
              message: payload.message,
            });
          }
          break;

        case "gameEnded":
          console.log("🏁 Game ended:", payload);
          if (onGameUpdate) {
            onGameUpdate({
              type: "gameEnded",
              reason: payload.reason,
              message: payload.message,
            });
          }
          break;

        default:
          console.log("❓ Unknown message type:", type, payload);
      }
    };

    // Define joinRoom inside useEffect
    const joinRoomNow = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = {
          type: "joinRoom",
          payload: {
            roomId,
            playerId,
            playerName,
          },
        };

        console.log("🚪 Joining room:", message);
        wsRef.current.send(JSON.stringify(message));
      }
    };

    // Connect to WebSocket server
    const connectToServer = () => {
      try {
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
          console.log("🔗 Connected to WebSocket server");
          setIsConnected(true);
          setConnectionStatus("Connected");

          // Join room when connected
          if (roomId && playerId && playerName) {
            joinRoomNow();
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📨 Received from server:", data);

            // Handle different message types
            handleMessage(data);
          } catch (error) {
            console.error("❌ Failed to parse server message:", error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log("📡 WebSocket connection closed", event);
          setIsConnected(false);
          setConnectionStatus("Disconnected");

          // No automatic reconnection - any disconnect is treated as leaving
          console.log("🔌 Connection closed, player has left");
        };

        wsRef.current.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          setConnectionStatus("Error");
        };
      } catch (error) {
        console.error("❌ Failed to connect to WebSocket:", error);
        setConnectionStatus("Connection Failed");
      }
    };

    connectToServer();

    // Handle page unload to properly close connection
    const handleBeforeUnload = () => {
      if (wsRef.current) {
        // Close the WebSocket with normal closure code
        // The server will detect this as a deliberate departure
        wsRef.current.close(1000, "User left");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [roomId, playerId, playerName, onGameUpdate]);

  const sendStartGame = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("🎮 Sending start game request...");
      const message = {
        type: "startGame",
        payload: {
          roomId,
          playerId,
        },
      };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("❌ WebSocket not connected for start game");
    }
  }, [roomId, playerId]);

  const sendSelectTeammate = useCallback(
    (teammateId) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("👥 Sending teammate selection...");
        const message = {
          type: "selectTeammate",
          payload: {
            roomId,
            playerId,
            teammateId,
          },
        };
        wsRef.current.send(JSON.stringify(message));
      } else {
        console.error("❌ WebSocket not connected for teammate selection");
      }
    },
    [roomId, playerId]
  );

  const sendResetTeams = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("🔄 Sending reset teams request...");
      const message = {
        type: "resetTeams",
        payload: {
          roomId,
          playerId,
        },
      };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("❌ WebSocket not connected for reset teams");
    }
  }, [roomId, playerId]);

  const sendLeaveRoom = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("🚪 Sending leave room request...");
      const message = {
        type: "leaveRoom",
        payload: {
          roomId,
          playerId,
        },
      };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("❌ WebSocket not connected for leave room");
    }
  }, [roomId, playerId]);

  const sendPlayerResponse = useCallback(
    (response) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = {
          type: "playerResponse",
          payload: {
            roomId,
            playerId,
            response,
          },
        };

        console.log("🗣️ Sending player response:", message);
        wsRef.current.send(JSON.stringify(message));
      }
    },
    [roomId, playerId]
  );

  const sendCardPlayed = useCallback(
    (cardIndex) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = {
          type: "cardPlayed",
          payload: {
            roomId,
            playerId,
            cardIndex,
          },
        };

        console.log("🃏 Playing card:", message);
        wsRef.current.send(JSON.stringify(message));
      }
    },
    [roomId, playerId]
  );

  // Expose client functions to parent component
  useEffect(() => {
    if (onClientReady) {
      onClientReady({
        sendPlayerResponse,
        sendCardPlayed,
        sendStartGame,
        sendSelectTeammate,
        sendResetTeams,
        sendLeaveRoom,
      });
    }
  }, [
    onClientReady,
    sendPlayerResponse,
    sendCardPlayed,
    sendStartGame,
    sendSelectTeammate,
    sendResetTeams,
    sendLeaveRoom,
  ]);

  return (
    <div className="websocket-client">
      {/* s */}

      {/* Expose functions for parent components to use */}
      <div style={{ display: "none" }}>
        {/* These refs will be used by parent components */}
        <button
          ref={(ref) => {
            if (ref) ref.sendPlayerResponse = sendPlayerResponse;
          }}
        >
          Hidden - for parent component access
        </button>
        <button
          ref={(ref) => {
            if (ref) ref.sendCardPlayed = sendCardPlayed;
          }}
        >
          Hidden - for parent component access
        </button>
        <button
          ref={(ref) => {
            if (ref) ref.sendStartGame = sendStartGame;
          }}
        >
          Hidden - for parent component access
        </button>
        <button
          ref={(ref) => {
            if (ref) ref.sendSelectTeammate = sendSelectTeammate;
          }}
        >
          Hidden - for parent component access
        </button>
        <button
          ref={(ref) => {
            if (ref) ref.sendLeaveRoom = sendLeaveRoom;
          }}
        >
          Hidden - for parent component access
        </button>
      </div>
    </div>
  );
};
