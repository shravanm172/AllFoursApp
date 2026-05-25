// src/App.js
import React, { useState, useCallback, useRef } from 'react';
import './App.css';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard.jsx';
import { WebSocketClient } from './components/WebSocketClient.jsx';
import { WS_URL } from './config.js';

const generateUniquePlayerId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const perf =
    typeof window !== 'undefined' && window.performance
      ? Math.floor(window.performance.now())
      : Math.floor(Math.random() * 10000);
  return `player-${timestamp}-${random}-${perf}`;
};

function App() {
  // gameMode: null | 'creating' | 'connecting' | 'multiplayer'
  const [gameMode, setGameMode] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [multiplayerConfig, setMultiplayerConfig] = useState({
    roomId: '',
    playerId: generateUniquePlayerId(),
    playerName: '',
  });
  const [roomIdInput, setRoomIdInput] = useState('');
  const createWsRef = useRef(null);

  const handleReturnToMenu = useCallback(() => {
    setGameMode(null);
    setErrorMessage('');
    setRoomIdInput('');
    setMultiplayerConfig({
      roomId: '',
      playerId: generateUniquePlayerId(),
      playerName: '',
    });
  }, []);

  // One-shot native WS: asks the server to reserve a room code, then closes.
  // MultiplayerGameBoard mounts afterward and joins via the normal joinRoom path.
  const handleCreateRoom = () => {
    const name = multiplayerConfig.playerName.trim();
    if (!name) {
      setErrorMessage('Please enter your nickname first.');
      return;
    }

    setErrorMessage('');
    setGameMode('creating');

    const ws = new WebSocket(WS_URL);
    createWsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'createRoom',
          payload: {
            playerId: multiplayerConfig.playerId,
            playerName: name,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'roomCreated') {
          ws.close(1000, 'room-id-received');
          setMultiplayerConfig((prev) => ({ ...prev, roomId: data.payload.roomId }));
          setGameMode('multiplayer');
        } else if (data.type === 'error') {
          ws.close(1000, 'error');
          setErrorMessage(data.payload?.message || 'Failed to create room.');
          setGameMode(null);
        }
      } catch {
        setErrorMessage('Unexpected response from server.');
        setGameMode(null);
      }
    };

    ws.onerror = () => {
      setErrorMessage('Could not connect to server. Please try again.');
      setGameMode(null);
    };
  };

  const handleJoinRoom = () => {
    const name = multiplayerConfig.playerName.trim();
    const code = roomIdInput.trim().toUpperCase();

    if (!name) {
      setErrorMessage('Please enter your nickname.');
      return;
    }
    if (!code) {
      setErrorMessage('Please enter a room code.');
      return;
    }

    setErrorMessage('');
    setMultiplayerConfig((prev) => ({ ...prev, roomId: code }));
    setGameMode('connecting');
  };

  // ── Home / creating screen ────────────────────────────────────────────────
  if (!gameMode || gameMode === 'creating') {
    return (
      <div className="App">
        <div className="home-page">
          <h1 className="title">Fours Owa</h1>

          {errorMessage && <div className="error-message">{errorMessage}</div>}
          {gameMode === 'creating' && (
            <div className="connecting-status">Creating room...</div>
          )}

          <div className="join-form">
            <input
              type="text"
              placeholder="Your Nickname"
              value={multiplayerConfig.playerName}
              className="nickname-input"
              onChange={(e) =>
                setMultiplayerConfig((prev) => ({ ...prev, playerName: e.target.value }))
              }
            />

            <button
              className="mode-button multiplayer-button"
              onClick={handleCreateRoom}
              disabled={gameMode === 'creating'}
            >
              Create Room
            </button>

            <div className="divider">— or join an existing room —</div>

            <input
              type="text"
              placeholder="Room Code (e.g. XK9P2M)"
              value={roomIdInput}
              className="room-id-input"
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <button
              className="mode-button multiplayer-button"
              onClick={handleJoinRoom}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Connecting (join path) ────────────────────────────────────────────────
  if (gameMode === 'connecting') {
    return (
      <div className="App">
        <div className="home-page">
          <h1 className="title">Fours Owa</h1>
          <div className="connecting-status">
            Joining room {multiplayerConfig.roomId}...
          </div>
          <div style={{ display: 'none' }}>
            <WebSocketClient
              roomId={multiplayerConfig.roomId}
              playerId={multiplayerConfig.playerId}
              playerName={multiplayerConfig.playerName}
              onGameUpdate={(update) => {
                if (update?.type === 'lobby') setGameMode('multiplayer');
              }}
              onError={() => {
                setErrorMessage(
                  `Could not join room ${multiplayerConfig.roomId}. Check the code and try again.`
                );
                setGameMode(null);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── In game ───────────────────────────────────────────────────────────────
  if (gameMode === 'multiplayer') {
    return (
      <MultiplayerGameBoard
        roomId={multiplayerConfig.roomId}
        playerId={multiplayerConfig.playerId}
        playerName={multiplayerConfig.playerName}
        onReturnToMenu={handleReturnToMenu}
      />
    );
  }

  return null;
}

export default App;
