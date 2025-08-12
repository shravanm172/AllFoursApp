// src/App.js
import React, { useState } from "react";
import "./App.css";
// import { GameBoard } from "./components/GameBoard.jsx";
// import { GameController } from "./logic/GameController.js";
// import { GUIIO } from "./logic/GUIIO.js";

// 🧪 TEMPORARY: Import LocalTestApp for local testing
import LocalTestApp from "./LocalTestApp.jsx";

function App() {
  // 🧪 TEMPORARY: Use LocalTestApp instead of main app
  return <LocalTestApp />;

  // 🧪 COMMENTED OUT: Original app code - uncomment to restore
  /*
  const [gameStarted, setGameStarted] = useState(false);
  const [gameController, setGameController] = useState(null);
  const [players, setPlayers] = useState([]);

  // This will be passed to GameBoard to hook into GUIIO
  const [guiIO, setGuiIO] = useState(null);

  const handleStartGame = () => {
    const gui = new GUIIO({
      onLogMessage: () => {},
      onOverlayMessage: () => {},
      onPrivateOverlayMessage: () => {},
      onKickedCard: () => {},
      onPromptPlayer: () => {},
      onPromptCard: () => {},
    });

    const controller = new GameController(gui);
    controller.setupGame();
    setPlayers(controller.getPlayersArray());
    setGuiIO(gui);
    setGameController(controller);
    setGameStarted(true);
  };

  return (
    <div className="App">
      {!gameStarted ? (
        <div className="lobby-screen">
          <h1>🎮 Welcome to All Fours</h1>
          <button onClick={handleStartGame}>Start Game</button>
        </div>
      ) : (
        <GameBoard game={gameController} guiIO={guiIO} players={players} />
      )}
    </div>
  );
  */
}

export default App;
