// WebSocketClient.jsx
// Component to handle WebSocket connection to multiplayer server
// Protocol adapter
// returns null

import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../config'; // adjust path if needed

export const WebSocketClient = ({
  onGameUpdate,
  roomId,
  playerId,
  playerName,
  onClientReady,
  onError,
}) => {
  const [, setIsConnected] = useState(false);
  const [, setConnectionStatus] = useState('Disconnected');

  const wsRef = useRef(null);

  // Keep latest props in refs (avoids stale closures)
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

  const hasJoinedRef = useRef(false);

  // ===== Reconnect state =====
  const manualCloseRef = useRef(false); // true when we *intend* to close (leave/unmount/unload)
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const notifyError = (msg, err) => {
    // Keep this minimal; you said you'll clean logs later
    if (msg) setConnectionStatus(`Error: ${msg}`);
    onErrorRef.current?.(msg || 'WebSocket error');
    // Optional extra logging for dev
    // console.error(msg, err);
  };

  // ===== All outbound messages go through this helper ======
  const send = useCallback((type, payload) => {
    const ws = wsRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // In production, you'd probably show a toast; for now just no-op.
      // console.warn(`Cannot send ${type} — socket not open`);
      return false;
    }

    ws.send(JSON.stringify({ type, payload }));
    return true;
  }, []);

  const sendStartGame = useCallback(() => {
    // Optional: require joined before allowing “start”
    if (!hasJoinedRef.current) return false;
    return send('startGame', { roomId, playerId });
  }, [send, roomId, playerId]);

  const sendSelectTeammate = useCallback(
    (teammateId) => {
      if (!hasJoinedRef.current) return false;
      return send('selectTeammate', { roomId, playerId, teammateId });
    },
    [send, roomId, playerId]
  );

  const sendResetTeams = useCallback(() => {
    if (!hasJoinedRef.current) return false;
    return send('resetTeams', { roomId, playerId });
  }, [send, roomId, playerId]);

  const sendLeaveRoom = useCallback(() => {
    // leaving is intentional → prevent reconnect
    manualCloseRef.current = true;
    clearReconnectTimer();
    hasJoinedRef.current = false;
    return send('leaveRoom', { roomId, playerId });
  }, [send, roomId, playerId]);

  const sendPlayerResponse = useCallback(
    (response) => {
      if (!hasJoinedRef.current) return false;
      return send('playerResponse', { roomId, playerId, response });
    },
    [send, roomId, playerId]
  );

  const sendCardPlayed = useCallback(
    (cardIndex) => {
      if (!hasJoinedRef.current) return false;
      return send('cardPlayed', { roomId, playerId, cardIndex });
    },
    [send, roomId, playerId]
  );

  // Expose client functions to parent component
  useEffect(() => {
    onClientReady?.({
      sendPlayerResponse,
      sendCardPlayed,
      sendStartGame,
      sendSelectTeammate,
      sendResetTeams,
      sendLeaveRoom,
    });
  }, [
    onClientReady,
    sendPlayerResponse,
    sendCardPlayed,
    sendStartGame,
    sendSelectTeammate,
    sendResetTeams,
    sendLeaveRoom,
  ]);

  // Main effect: connect + (re)join
  useEffect(() => {
    if (!roomId || !playerId) return;

    let didUnload = false;

    // ----------Handle Message----------
    const handleMessage = (data) => {
      const { type, payload } = data || {};
      if (!type) return;

      switch (type) {
        case 'joinedRoom':
          if (!payload) return;

          setConnectionStatus(`Connected to room ${payload.roomId}`);

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

          onGameUpdateRef.current?.({
            type: 'lobby',
            roomId: payload.roomId,
            playersInRoom: payload.playersInRoom,
            allPlayers: payload.allPlayers || [],
            gameStarted: false,
            roomMaster: payload.roomMaster,
            canStartGame: payload.canStartGame,
          });
          break;

        case 'teamAssignments':
          if (!payload) return;

          onGameUpdateRef.current?.({
            type: 'teamAssignments',
            teamAssignments: payload.teamAssignments,
            canStartGame: payload.canStartGame,
          });
          break;

        case 'gameStarted':
          if (!payload) return;
          setConnectionStatus('Game Started');

          onGameUpdateRef.current?.({
            gameStarted: true,
            players: payload.players || [],
            roomId: payload.roomId,
            yourPlayerId: payload.yourPlayerId || playerId,
          });
          break;

        case 'logMessage':
          onGameUpdateRef.current?.({
            type: 'logMessage',
            message: payload?.message,
          });
          break;

        case 'overlayMessage':
          onGameUpdateRef.current?.({
            type: 'overlayMessage',
            message: payload?.message,
          });
          break;

        case 'gameState':
          onGameUpdateRef.current?.(payload);
          break;

        case 'activePlayerChange':
          onGameUpdateRef.current?.({
            type: 'activePlayerChange',
            activePlayerId: payload?.playerId,
          });
          break;

        case 'trickState':
          onGameUpdateRef.current?.({
            type: 'trickState',
            playedCards: payload?.playedCards,
          });
          break;

        case 'kickedCard':
          onGameUpdateRef.current?.({
            type: 'kickedCard',
            card: payload?.card,
          });
          break;

        case 'clearKickedCards':
          onGameUpdateRef.current?.({ type: 'clearKickedCards' });
          break;

        case 'scores':
          if (!payload) return;
          onGameUpdateRef.current?.({
            type: 'scores',
            teamA: payload.teamA,
            teamB: payload.teamB,
          });
          break;

        case 'playerPrompt':
          if (!payload) return;
          onGameUpdateRef.current?.({
            type: 'playerPrompt',
            promptText: payload.promptText,
            buttonOptions: payload.buttonOptions,
            playerId: payload.playerId,
          });
          break;

        case 'cardPrompt':
          if (!payload) return;
          onGameUpdateRef.current?.({
            type: 'cardPrompt',
            hand: payload.hand,
            playerId: payload.playerId,
          });
          break;

        case 'error':
          notifyError(payload?.message || 'Server error');
          break;

        case 'leftRoom':
          onGameUpdateRef.current?.({
            type: 'leftRoom',
            message: payload?.message,
          });
          break;

        case 'gameEnded':
          onGameUpdateRef.current?.({
            type: 'gameEnded',
            reason: payload?.reason,
            message: payload?.message,
          });
          break;

        default:
          // ignore unknown types in prod
          break;
      }
    };

    // ------Join Room------
    const joinRoomNow = () => {
      if (hasJoinedRef.current) return;

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        hasJoinedRef.current = true;
        ws.send(
          JSON.stringify({
            type: 'joinRoom',
            payload: { roomId, playerId, playerName: playerNameRef.current },
          })
        );
      }
    };

    // -----Reconnect scheduler-----
    const scheduleReconnect = (reason) => {
      if (manualCloseRef.current) return; // intentional close: do not reconnect
      clearReconnectTimer();

      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(8000, 500 * Math.pow(2, attempt)); // 0.5s,1s,2s,4s,8s cap
      reconnectAttemptRef.current = attempt + 1;

      setConnectionStatus(
        `Reconnecting (${reconnectAttemptRef.current})...${reason ? ` ${reason}` : ''}`
      );

      reconnectTimerRef.current = setTimeout(() => {
        connectToServer(); // re-init socket
      }, delay);
    };

    // -----Connect to WebSocket server-----
    const connectToServer = () => {
      try {
        // (Re)connect is never “manual” by itself
        // manualCloseRef is only set true on unmount/leave/unload
        setConnectionStatus('Connecting...');
        hasJoinedRef.current = false;

        // Close any existing socket before creating a new one
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'reconnect-replace');
        }

        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
          setIsConnected(true);
          setConnectionStatus('Connected');

          // Connection is healthy again → reset attempts
          reconnectAttemptRef.current = 0;
          clearReconnectTimer();

          // Join after open
          joinRoomNow();
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleMessage(data);
          } catch (err) {
            notifyError('Failed to parse server message', err);
          }
        };

        wsRef.current.onclose = (event) => {
          setIsConnected(false);

          // If we intentionally closed, don't reconnect.
          if (manualCloseRef.current) {
            setConnectionStatus('Disconnected');
            return;
          }

          // Unexpected close → try reconnect
          // Note: code 1000 is normal close; 1006 is common abnormal close
          const code = event?.code;
          const shouldReconnect = code !== 1000;

          setConnectionStatus('Disconnected');

          if (shouldReconnect) {
            scheduleReconnect(code ? `(code ${code})` : '');
          }
        };

        wsRef.current.onerror = (err) => {
          // onerror often fires before onclose; we still let onclose handle reconnect
          notifyError('WebSocket error', err);
        };
      } catch (err) {
        notifyError('Failed to connect to WebSocket', err);
        scheduleReconnect('(connect exception)');
      }
    };

    // When room/player changes, treat as a fresh session.
    manualCloseRef.current = false;
    reconnectAttemptRef.current = 0;
    clearReconnectTimer();

    connectToServer();

    // ----------Handle page unload to properly close connection-----------
    const handleBeforeUnload = () => {
      if (wsRef.current) {
        didUnload = true;
        manualCloseRef.current = true;
        clearReconnectTimer();
        wsRef.current.close(1000, 'page-unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount / dependency change
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Mark as intentional close so onclose doesn't reconnect
      manualCloseRef.current = true;
      clearReconnectTimer();
      hasJoinedRef.current = false;

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;

        const closeReason = didUnload ? 'page-unload' : 'component-unmount';
        try {
          wsRef.current.close(1000, closeReason);
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [roomId, playerId]); // keep as-is

  return null;
};
