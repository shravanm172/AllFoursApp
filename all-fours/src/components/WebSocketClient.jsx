// import React, { useState, useEffect, useRef, useCallback } from 'react';ebSocketClient.jsx
// Component to handle WebSocket connection to multiplayer server
// Protocol adapter
// returns null

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../config'; // adjust path if needed

export const WebSocketClient = ({
  onGameUpdate,
  roomId,
  playerId,
  playerName,
  onClientReady, // New callback to expose client functions
  onError, // New callback for error handling
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const wsRef = useRef(null);

  const playerNameRef = useRef(playerName);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const onGameUpdateRef = useRef(onGameUpdate);

  useEffect(() => {
    onGameUpdateRef.current = onGameUpdate;
  }, [onGameUpdate]);

  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    // Define handleServerMessage inside useEffect to avoid dependency issues
    const handleMessage = (data) => {
      const { type, payload } = data || {};
      if (!type) return;

      switch (type) {
        case 'joinedRoom':
          if (!payload) return;

          console.log('✅ Successfully joined room:', payload);
          setConnectionStatus(`Connected to room ${payload.roomId}`);
          // Update game state with lobby information

          onGameUpdateRef.current?.({
            type: 'lobby',
            roomId: payload.roomId,
            playersInRoom: payload.playersInRoom,
            allPlayers: payload.allPlayers || [],
            gameStarted: payload.gameStarted,
            roomMaster: payload.roomMaster,
            canStartGame: payload.canStartGame,
          });

          break;

        case 'playerListUpdate':
          if (!payload) return;
          console.log('👥 Player list updated:', payload);
          // Update lobby state with new player list

          onGameUpdateRef.current?.({
            type: 'lobby',
            roomId: payload.roomId,
            playersInRoom: payload.playersInRoom,
            allPlayers: payload.allPlayers || [],
            gameStarted: false, // Still in lobby if we're getting player list updates
            roomMaster: payload.roomMaster,
            canStartGame: payload.canStartGame,
          });

          break;

        case 'teamAssignments':
          if (!payload) return;
          console.log('👥 Team assignments updated:', payload);

          onGameUpdateRef.current?.({
            type: 'teamAssignments',
            teamAssignments: payload.teamAssignments,
            canStartGame: payload.canStartGame,
          });

          break;

        case 'gameStarted':
          if (!payload) return;
          console.log('🎮 Game started:', payload);
          setConnectionStatus('Game Started');
          // Trigger game state update when game starts

          onGameUpdateRef.current?.({
            gameStarted: true,
            players: payload.players || [],
            roomId: payload.roomId,
            yourPlayerId: payload.yourPlayerId || playerId,
          });

          break;

        case 'logMessage':
          console.log('📝 Log message:', payload.message);

          onGameUpdateRef.current?.({
            type: 'logMessage',
            message: payload.message,
          });

          break;

        case 'overlayMessage':
          console.log('📢 Overlay message:', payload.message);

          onGameUpdateRef.current?.({
            type: 'overlayMessage',
            message: payload.message,
          });

          break;

        case 'gameState':
          console.log('🎲 Game state update:', payload);

          onGameUpdateRef.current?.(payload);

          break;

        case 'activePlayerChange':
          console.log('👆 Active player changed:', payload);

          onGameUpdateRef.current?.({
            type: 'activePlayerChange',
            activePlayerId: payload.playerId,
          });

          break;

        case 'trickState':
          console.log('🎯 Trick state update:', payload);

          onGameUpdateRef.current?.({
            type: 'trickState',
            playedCards: payload.playedCards,
          });

          break;

        case 'kickedCard':
          console.log('🃏 Kicked card:', payload);

          onGameUpdateRef.current?.({
            type: 'kickedCard',
            card: payload.card,
          });

          break;

        case 'clearKickedCards':
          console.log('🧼 Clear kicked cards');

          onGameUpdateRef.current?.({ type: 'clearKickedCards' });

          break;

        case 'scores':
          if (!payload) return;
          console.log('📊 Scores update:', payload);

          onGameUpdateRef.current?.({
            type: 'scores',
            teamA: payload.teamA,
            teamB: payload.teamB,
          });

          break;

        case 'playerPrompt':
          if (!payload) return;
          console.log('🤔 Player prompt:', payload);

          onGameUpdateRef.current?.({
            type: 'playerPrompt',
            promptText: payload.promptText,
            buttonOptions: payload.buttonOptions,
            playerId: payload.playerId,
          });

          break;

        case 'cardPrompt':
          if (!payload) return;
          console.log('🃏 Card prompt:', payload);

          onGameUpdateRef.current?.({
            type: 'cardPrompt',
            hand: payload.hand,
            playerId: payload.playerId,
          });

          break;
        case 'error':
          if (!payload) return;
          console.error('❌ Server error:', payload.message);
          setConnectionStatus(`Error: ${payload.message}`);
          // Call error callback if provided
          onErrorRef.current?.(payload.message);

          break;

        case 'leftRoom':
          console.log('👋 Left room successfully:', payload);

          onGameUpdateRef.current?.({
            type: 'leftRoom',
            message: payload.message,
          });

          break;

        case 'gameEnded':
          console.log('🏁 Game ended:', payload);

          onGameUpdateRef.current?.({
            type: 'gameEnded',
            reason: payload.reason,
            message: payload.message,
          });

          break;

        default:
          console.log('❓ Unknown message type:', type, payload);
      }
    };

    // Define joinRoom inside useEffect
    const joinRoomNow = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = {
          type: 'joinRoom',
          payload: {
            roomId,
            playerId,
            playerName: playerNameRef.current,
          },
        };

        wsRef.current.send(JSON.stringify(message));
      }
    };

    // Connect to WebSocket server
    const connectToServer = () => {
      try {
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
          console.log('🔗 Connected to WebSocket server');
          setIsConnected(true);
          setConnectionStatus('Connected');

          // Join room when connected
          if (roomId && playerId && playerNameRef.current) {
            joinRoomNow();
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Received from server:', data);

            // Handle different message types
            handleMessage(data);
          } catch (error) {
            console.error('❌ Failed to parse server message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('📡 WebSocket connection closed', event);
          setIsConnected(false);
          setConnectionStatus('Disconnected');

          // No automatic reconnection - any disconnect is treated as leaving
          console.log('🔌 Connection closed, player has left');
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setConnectionStatus('Error');
        };
      } catch (error) {
        console.error('❌ Failed to connect to WebSocket:', error);
        setConnectionStatus('Connection Failed');
      }
    };

    connectToServer();

    // Handle page unload to properly close connection
    const handleBeforeUnload = () => {
      if (wsRef.current) {
        // Close the WebSocket with normal closure code
        // The server will detect this as a deliberate departure
        wsRef.current.close(1000, 'User left');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [roomId, playerId]); // <- dependency array

  const send = useCallback((type, payload) => {
    const ws = wsRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn(`❌ Cannot send ${type} — socket not open`);
      return false;
    }

    ws.send(JSON.stringify({ type, payload }));
    return true;
  }, []);

  const sendStartGame = useCallback(() => {
    send('startGame', { roomId, playerId });
  }, [send, roomId, playerId]);

  const sendSelectTeammate = useCallback(
    (teammateId) => {
      send('selectTeammate', { roomId, playerId, teammateId });
    },
    [send, roomId, playerId]
  );

  const sendResetTeams = useCallback(() => {
    send('resetTeams', { roomId, playerId });
  }, [send, roomId, playerId]);

  const sendLeaveRoom = useCallback(() => {
    send('leaveRoom', { roomId, playerId });
  }, [send, roomId, playerId]);

  const sendPlayerResponse = useCallback(
    (response) => {
      send('playerResponse', {
        roomId,
        playerId,
        response,
      });
    },
    [send, roomId, playerId]
  );

  const sendCardPlayed = useCallback(
    (cardIndex) => {
      send('cardPlayed', {
        roomId,
        playerId,
        cardIndex,
      });
    },
    [send, roomId, playerId]
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

  return null;
};
