// WebSocketClient.jsx
// Simple WebSocket client for testing connection to multiplayer server

import React, { useState, useEffect, useRef } from "react";

export const WebSocketClient = ({
  roomId = "test-room",
  playerId = "player1",
  playerName = "Test Player",
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const joinRoom = () => {
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
        setMessages((prev) => [...prev, `Sent: ${JSON.stringify(message)}`]);
      }
    };

    const connectToServer = () => {
      try {
        console.log("🔗 Attempting to connect to WebSocket server...");
        wsRef.current = new WebSocket("ws://localhost:8080");

        wsRef.current.onopen = () => {
          console.log("✅ Connected to WebSocket server");
          setIsConnected(true);
          setConnectionStatus("Connected");

          // Automatically join a test room
          joinRoom();
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📨 Received from server:", data);

            setMessages((prev) => [
              ...prev,
              `Received: ${JSON.stringify(data)}`,
            ]);

            // Handle different message types
            switch (data.type) {
              case "joinedRoom":
                setConnectionStatus(`Connected to room ${data.payload.roomId}`);
                break;
              case "gameStarted":
                setConnectionStatus("Game Started!");
                break;
              case "error":
                setConnectionStatus(`Error: ${data.payload.message}`);
                break;
              default:
                console.log("📥 Server message:", data);
            }
          } catch (error) {
            console.error("❌ Failed to parse server message:", error);
          }
        };

        wsRef.current.onclose = () => {
          console.log("📡 WebSocket connection closed");
          setIsConnected(false);
          setConnectionStatus("Disconnected");

          // Try to reconnect after 3 seconds
          setTimeout(connectToServer, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          setConnectionStatus("Connection Error");
        };
      } catch (error) {
        console.error("❌ Failed to connect to WebSocket:", error);
        setConnectionStatus("Connection Failed");
      }
    };

    connectToServer();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, playerId, playerName]);

  const joinRoom = () => {
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
      setMessages((prev) => [...prev, `Sent: ${JSON.stringify(message)}`]);
    }
  };

  const sendTestMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: "playerResponse",
        payload: {
          roomId,
          playerId,
          response: "yes",
        },
      };

      console.log("🧪 Sending test message:", message);
      wsRef.current.send(JSON.stringify(message));
      setMessages((prev) => [...prev, `Sent test: ${JSON.stringify(message)}`]);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>WebSocket Client Test</h2>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>{isConnected ? "🟢" : "🔴"}</span>
          <span>
            <strong>Status:</strong> {connectionStatus}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={joinRoom}
          disabled={!isConnected}
          style={{
            padding: "10px 15px",
            marginRight: "10px",
            backgroundColor: isConnected ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isConnected ? "pointer" : "not-allowed",
          }}
        >
          Join Room
        </button>

        <button
          onClick={sendTestMessage}
          disabled={!isConnected}
          style={{
            padding: "10px 15px",
            backgroundColor: isConnected ? "#2196F3" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isConnected ? "pointer" : "not-allowed",
          }}
        >
          Send Test Message
        </button>
      </div>

      <div>
        <h3>Messages:</h3>
        <div
          style={{
            height: "300px",
            overflow: "auto",
            border: "1px solid #ccc",
            padding: "10px",
            backgroundColor: "#f9f9f9",
          }}
        >
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: "5px", fontSize: "12px" }}>
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
