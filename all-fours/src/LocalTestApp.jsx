// LocalTestApp.jsx
// Simple React app component for local testing of All Fours game

import React, { useState } from "react";
import { GameBoard } from "./components/GameBoard.jsx";
import { GUIIO } from "./logic/GUIIO.js";
import { LocalTestGameController } from "./logic/LocalTestGameController.js";

export const LocalTestApp = () => {
  const [gameController, setGameController] = useState(null);
  const [guiIO, setGuiIO] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);

  // Initialize the game
  const startLocalGame = async () => {
    console.log("🎮 Starting local game...");
    try {
      // Create GUIIO instance for React communication
      const gameIO = new GUIIO();
      console.log("📡 GUIIO created:", gameIO);
      setGuiIO(gameIO);

      // Create local test game controller
      const controller = new LocalTestGameController(gameIO);
      console.log("🎯 Controller created:", controller);
      setGameController(controller);

      // Set up the game (creates players and teams)
      controller.setupGame();
      console.log("⚙️ Game setup complete");

      // Get the players for the GameBoard
      const players = controller.getPlayers();
      console.log(
        "👥 Players:",
        players.map((p) => ({ name: p.getName(), id: p.getId() }))
      );
      setPlayers(players);
      setGameStarted(true);

      // Start the match in the background
      console.log("🚀 Starting match in background...");
      setTimeout(async () => {
        try {
          console.log("▶️ Calling playMatch()...");
          const winner = await controller.playMatch();
          console.log("🏆 Match completed! Winner:", winner?.name);
        } catch (error) {
          console.error("❌ Match error:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to start game:", error);
      alert("Failed to start game: " + error.message);
    }
  };

  // No need for useEffect - methods are now built into LocalTestGameController

  if (!gameStarted) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#1e3c72",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>🃏 All Fours - Local Test</h1>
        <p>Test the game locally with AI opponents</p>
        <button
          onClick={startLocalGame}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Start Local Game
        </button>
        <div
          style={{ marginTop: "30px", textAlign: "center", maxWidth: "500px" }}
        >
          <h3>How it works:</h3>
          <ul style={{ textAlign: "left" }}>
            <li>You play as the bottom player</li>
            <li>3 AI players control the other positions</li>
            <li>AI makes automatic decisions with small delays</li>
            <li>You interact normally through the UI</li>
            <li>Game follows standard All Fours rules</li>
          </ul>
        </div>
      </div>
    );
  }

  return <GameBoard game={gameController} guiIO={guiIO} players={players} />;
};

export default LocalTestApp;
