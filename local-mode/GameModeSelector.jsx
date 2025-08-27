// GameModeSelector.jsx
// Component to choose between Local and Multiplayer games
import React, { useState } from "react";
import { LocalGameBoard } from "./LocalGameBoard.jsx";
import { MultiplayerGameBoard } from "../all-fours/src/components/MultiplayerGameBoard.jsx";
import "../styles/game_mode_selector.css";

export const GameModeSelector = ({ localGameProps }) => {
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'multiplayer'
  const [multiplayerConfig, setMultiplayerConfig] = useState({
    roomId: "",
    playerId: `player-${Date.now()}`, // Generate unique ID
    playerName: "",
  });

  const handleModeSelect = (mode) => {
    setGameMode(mode);
  };

  const handleBackToModeSelect = () => {
    setGameMode(null);
  };

  const handleJoinRoom = () => {
    if (!multiplayerConfig.roomId || !multiplayerConfig.playerName) {
      alert("Please enter both Room ID and Player Name");
      return;
    }
    setGameMode("multiplayer");
  };

  // If local game is selected, render LocalGameBoard
  if (gameMode === "local" && localGameProps) {
    return (
      <div>
        <button className="back-button" onClick={handleBackToModeSelect}>
          ← Back to Mode Selection
        </button>
        <LocalGameBoard {...localGameProps} />
      </div>
    );
  }

  // If multiplayer game is selected, render MultiplayerGameBoard
  if (gameMode === "multiplayer") {
    return (
      <div>
        <button className="back-button" onClick={handleBackToModeSelect}>
          ← Back to Mode Selection
        </button>
        <MultiplayerGameBoard
          roomId={multiplayerConfig.roomId}
          playerId={multiplayerConfig.playerId}
          playerName={multiplayerConfig.playerName}
        />
      </div>
    );
  }

  // Default: Show mode selection screen
  return (
    <div className="game-mode-selector">
      <div className="mode-selector-container">
        <h1>🃏 All Fours Card Game</h1>
        <p>Choose your game mode:</p>

        <div className="mode-options">
          {/* Local Game Option */}
          {/* <div className="mode-option">
            <h3>🏠 Local Game</h3>
            <p>Play against AI opponents on this device</p>
            <button
              className="mode-button local"
              onClick={() => handleModeSelect("local")}
              disabled={!localGameProps}
            >
              {localGameProps ? "Start Local Game" : "Local Game Not Available"}
            </button>
          </div> */}

          {/* Multiplayer Game Option */}
          <div className="mode-option">
            <h3>🌐 Multiplayer Game</h3>
            <p>Play with friends online</p>

            <div className="multiplayer-config">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={multiplayerConfig.roomId}
                onChange={(e) =>
                  setMultiplayerConfig((prev) => ({
                    ...prev,
                    roomId: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Enter Your Name"
                value={multiplayerConfig.playerName}
                onChange={(e) =>
                  setMultiplayerConfig((prev) => ({
                    ...prev,
                    playerName: e.target.value,
                  }))
                }
              />
              <button
                className="mode-button multiplayer"
                onClick={handleJoinRoom}
              >
                Join Room
              </button>
            </div>
          </div>
        </div>

        <div className="server-status">
          <p>
            💡 <strong>Tip:</strong> To play multiplayer, make sure the server
            is running on port 8080
          </p>
        </div>
      </div>
    </div>
  );
};
