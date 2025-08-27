// src/App.js
import React, { useState, useCallback, useRef } from 'react';
import './App.css';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard.jsx';
import { WebSocketClient } from './components/WebSocketClient.jsx';

// Import LocalTestApp for local testing
// import LocalTestApp from "./LocalTestApp.jsx";

// Function to generate a unique player ID for each tab/session
const generateUniquePlayerId = () => {
  // For testing: Generate a completely unique ID each time the app loads
  // This ensures each tab acts as a different client
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const performance =
    typeof window !== 'undefined' && window.performance
      ? Math.floor(window.performance.now())
      : Math.floor(Math.random() * 10000);

  return `player-${timestamp}-${random}-${performance}`;
};


function App() {
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'multiplayer', 'connecting'
  const [errorMessage, setErrorMessage] = useState(''); // For displaying errors
  const [multiplayerConfig, setMultiplayerConfig] = useState({
    roomId: '',
    playerId: generateUniquePlayerId(),
    playerName: '',
  });





  const handleReturnToMenu = useCallback(() => {
    // Reset to main menu when player leaves room
    setGameMode(null);
    setErrorMessage(''); // Clear any error messages
    // Optionally reset multiplayer config
    setMultiplayerConfig({
      roomId: '',
      playerId: generateUniquePlayerId(), // Generate new player ID
      playerName: '',
    });
  }, []);

  // Mode Selection Screen
  if (!gameMode || gameMode === 'connecting') {
    return (
      <div className="App">
        <div className="home-page">
          <h1 className="title">Fours Owa</h1>
          {/* <p>Choose your game mode</p> */}

          {/* Error Message Display */}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {gameMode === 'connecting' && (
            <div className="connecting-status">
              🔄 Connecting to room {multiplayerConfig.roomId}...
            </div>
          )}

          
          {/* <div className="mode-card">
            <h3>🏠 Local Game</h3>
            <p>Play against AI on this device</p>
            <button
              className="mode-button local-button"
              onClick={() => setGameMode("local")}
            >
              Start Local Game
            </button>
          </div> */}


          <div className="nickname-container">
            <input
              type="text"
              placeholder="Your Nickname"
              value={multiplayerConfig.playerName}
              className="nickname-input"
              onChange={(e) =>
                setMultiplayerConfig({
                  ...multiplayerConfig,
                  playerName: e.target.value,
                })
              }
            />
          </div>



          <div className="join-room-container">
              <input
                type="text"
                placeholder="Room ID (e.g., room123)"
                value={multiplayerConfig.roomId}
                className="room-id-input"
                onChange={(e) =>
                  setMultiplayerConfig({
                    ...multiplayerConfig,
                    roomId: e.target.value,
                  })
                }
              />
              <button
                className="mode-button multiplayer-button"
                onClick={() => {
                  if (multiplayerConfig.playerName && multiplayerConfig.roomId) {
                    setErrorMessage(''); // Clear any previous errors
                    setGameMode('connecting'); // Set connecting state first
                  } else {
                    alert('Please enter your name and room ID');
                  }
                }}
              >
                Join Room
              </button>
          </div>

          <div className="create-room-container">
                
          </div>
          

          {/* Hidden WebSocketClient for connection testing when in connecting state */}
          {gameMode === 'connecting' && (
            <div style={{ display: 'none' }}>
              <WebSocketClient
                roomId={multiplayerConfig.roomId}
                playerId={multiplayerConfig.playerId}
                playerName={multiplayerConfig.playerName}
                onGameUpdate={(gameState) => {
                  // If we receive any valid game update, connection succeeded
                  if (gameState && gameState.type === 'lobby') {
                    setGameMode('multiplayer');
                  }
                }}
                onError={(errorMsg) => {
                  // Connection failed, show error and go back to menu
                  setErrorMessage(`Room ${multiplayerConfig.roomId} is full. Unable to join.`);
                  setGameMode(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Local Game Mode
  // if (gameMode === "local") {
  //   return (
  //     <div>
  //       <button className="back-button" onClick={() => setGameMode(null)}>
  //         ← Back to Menu
  //       </button>
  //       <LocalTestApp />
  //     </div>
  //   );
  // }

  // Multiplayer Game Mode
  if (gameMode === 'multiplayer') {
    return (
      <div>
        <MultiplayerGameBoard
          roomId={multiplayerConfig.roomId}
          playerId={multiplayerConfig.playerId}
          playerName={multiplayerConfig.playerName}
          onReturnToMenu={handleReturnToMenu}
        />
      </div>
    );
  }

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
