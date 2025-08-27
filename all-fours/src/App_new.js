// src/App.js
import React, { useState } from "react";
import "./App.css";
import { GameModeSelector } from "./components/GameModeSelector.jsx";
import { MultiplayerGameBoard } from "./components/MultiplayerGameBoard.jsx";

// 🧪 TEMPORARY: Import LocalTestApp for local testing
import LocalTestApp from "./LocalTestApp.jsx";

function App() {
  const [currentMode, setCurrentMode] = useState(null);

  const handleModeSelect = (modeConfig) => {
    console.log("Mode selected:", modeConfig);
    setCurrentMode(modeConfig);
  };

  const handleBackToModeSelect = () => {
    setCurrentMode(null);
  };

  // Show mode selector if no mode is selected
  if (!currentMode) {
    return <GameModeSelector onModeSelect={handleModeSelect} />;
  }

  // Show appropriate game based on selected mode
  if (currentMode.mode === "local") {
    return <LocalTestApp onBackToModeSelect={handleBackToModeSelect} />;
  }

  if (currentMode.mode === "multiplayer") {
    return (
      <MultiplayerGameBoard
        roomId={currentMode.roomId}
        playerId={currentMode.playerId}
        playerName={currentMode.playerName}
        onBackToModeSelect={handleBackToModeSelect}
      />
    );
  }

  return <div>Unknown mode</div>;
}

export default App;
