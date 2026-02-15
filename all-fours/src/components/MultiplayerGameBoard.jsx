// MultiplayerGameBoard.jsx
import React, { useState, useCallback, useReducer, useMemo, useRef, useEffect } from 'react';
import '../styles/game_board.css';
import { getCardComponent } from '../utils/getCardComponent.js';
import { ScoreBoard } from './Scoreboard.jsx';
import { TrickArea } from './TrickArea.jsx';
import { PlayerHand } from './PlayerHand.jsx';
import { LogPanel } from './LogPanel.jsx';
import { WebSocketClient } from './WebSocketClient.jsx';
import { Lobby } from './Lobby.jsx';
import { Card } from '../logic/Card.js';

const initialMatchState = {
  teamA: { name: 'Team A', matchScore: 0, gameScore: 0 },
  teamB: { name: 'Team B', matchScore: 0, gameScore: 0 },
  isMatchOver: false,
  winner: null,
  currentDealer: null,
};

const initialUIState = {
  log: [],
  overlayMessage: '',
  kickedCards: [],
  gameState: null,
  lobbyState: null,
  teamAssignments: null,
  matchState: initialMatchState,
  prompt: null,
  cardPrompt: null,
  trickState: [],
  activePlayerId: null,
};

function uiReducer(state, action) {
  switch (action.type) {
    case 'RESET_TO_LOBBY':
      // full reset
      return { ...initialUIState };

    case 'SET_LOBBY_STATE':
      return { ...state, lobbyState: action.payload };

    case 'SET_TEAM_ASSIGNMENTS':
      return { ...state, teamAssignments: action.payload };

    case 'PATCH_LOBBY_STATE':
      return {
        ...state,
        lobbyState: state.lobbyState
          ? { ...state.lobbyState, ...action.payload }
          : state.lobbyState,
      };

    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };

    case 'SET_KICKED_CARDS':
      return { ...state, kickedCards: action.payload };

    case 'ADD_KICKED_CARD':
      return { ...state, kickedCards: [...state.kickedCards, action.payload] };

    case 'SET_TRICK_STATE':
      return { ...state, trickState: action.payload };

    case 'SET_ACTIVE_PLAYER':
      return { ...state, activePlayerId: action.payload };

    case 'SET_PROMPT':
      return { ...state, prompt: action.payload };

    case 'SET_CARD_PROMPT':
      return { ...state, cardPrompt: action.payload };

    case 'ADD_LOG':
      return { ...state, log: [...state.log, action.payload] };

    case 'SET_OVERLAY':
      return { ...state, overlayMessage: action.payload };

    case 'SET_MATCH_STATE':
      return { ...state, matchState: action.payload };

    case 'PATCH_MATCH_STATE':
      return { ...state, matchState: { ...state.matchState, ...action.payload } };

    default:
      return state;
  }
}

export const MultiplayerGameBoard = ({ roomId, playerId, playerName, onReturnToMenu }) => {
  const [ui, uiDispatch] = useReducer(uiReducer, initialUIState);
  const [showLog, setShowLog] = useState(false);

  // Destructure UI
  const {
    gameState,
    lobbyState,
    teamAssignments,
    matchState,
    prompt,
    cardPrompt,
    trickState,
    activePlayerId,
    kickedCards,
    overlayMessage,
    log,
  } = ui;

  const players = gameState?.players || [];

  const viewerIndex = useMemo(() => {
    return players.findIndex((p) => p.id === playerId);
  }, [players, playerId]);

  const viewerTeammateId = useMemo(() => {
    if (viewerIndex < 0) return null;
    const teammateIndex =
      viewerIndex === 0
        ? 2
        : viewerIndex === 2
          ? 0
          : viewerIndex === 1
            ? 3
            : viewerIndex === 3
              ? 1
              : null;

    return teammateIndex != null ? (players[teammateIndex]?.id ?? null) : null;
  }, [players, viewerIndex]);

  // Helper function to convert plain card object to Card instance
  const createCardInstance = (cardData) => {
    if (!cardData) return null;

    // If it's already a Card instance with methods, return as-is
    if (cardData.getSuit && cardData.getRank && cardData.toString) {
      return cardData;
    }

    // If it's a plain object with suit and rank properties, convert to Card instance
    if (cardData.suit && cardData.rank) {
      return new Card(cardData.suit, cardData.rank);
    }

    // If it has a toString property but no methods, try to extract suit and rank
    if (cardData.toString && typeof cardData.toString === 'string') {
      // Handle cases where toString is a string property, not a method
      const parts = cardData.toString.split(' of ');
      if (parts.length === 2) {
        return new Card(parts[1], parts[0]);
      }
    }

    console.warn('Unable to convert card data to Card instance:', cardData);
    return cardData; // Return as-is as fallback
  };

  const handleGameUpdate = useCallback(
    (newGameState) => {
      console.log('🎲 Game state updated:', newGameState);
      console.log('🔍 Message type:', newGameState.type);

      // Handle different types of updates
      if (newGameState.type) {
        switch (newGameState.type) {
          case 'lobby': {
            const lobby = {
              roomId: newGameState.roomId,
              playersInRoom: newGameState.playersInRoom,
              totalPlayersInRoom: newGameState.totalPlayersInRoom,
              maxPlayers: newGameState.maxPlayers,
              isRoomFull: newGameState.isRoomFull,
              disconnectedCount: newGameState.disconnectedCount,
              allPlayers: newGameState.allPlayers || [],
              gameStarted: newGameState.gameStarted,
              roomMaster: newGameState.roomMaster,
              canStartGame: newGameState.canStartGame,
            };

            // Reset everything back to lobby defaults
            uiDispatch({ type: 'RESET_TO_LOBBY' });
            uiDispatch({ type: 'SET_LOBBY_STATE', payload: lobby });

            // UI-only toggle stays outside reducer
            setShowLog(false);
            break;
          }

          case 'teamAssignments':
            uiDispatch({ type: 'SET_TEAM_ASSIGNMENTS', payload: newGameState.teamAssignments });
            uiDispatch({
              type: 'PATCH_LOBBY_STATE',
              payload: { canStartGame: newGameState.canStartGame },
            });
            break;

          case 'activePlayerChange':
            uiDispatch({
              type: 'SET_ACTIVE_PLAYER',
              payload: newGameState.playerId || newGameState.activePlayerId,
            });
            break;

          case 'trickState': {
            const trickCards = (newGameState.playedCards || []).map((cardData) => {
              if (!cardData) return null;
              return {
                player: cardData.player,
                card: createCardInstance(cardData.card),
              };
            });

            uiDispatch({ type: 'SET_TRICK_STATE', payload: trickCards });
            break;
          }

          case 'kickedCard': {
            const cardInstance = createCardInstance(newGameState.card);
            uiDispatch({ type: 'ADD_KICKED_CARD', payload: cardInstance });
            break;
          }

          case 'clearKickedCards':
            uiDispatch({ type: 'SET_KICKED_CARDS', payload: [] });
            break;

          case 'scores':
            if (newGameState.teamA && newGameState.teamB) {
              uiDispatch({
                type: 'PATCH_MATCH_STATE',
                payload: { teamA: newGameState.teamA, teamB: newGameState.teamB },
              });
            }
            break;

          case 'logMessage':
            handleLogMessage(newGameState.message);
            break;

          case 'overlayMessage':
            handleOverlayMessage(newGameState.message);
            break;

          case 'leftRoom':
            handleOverlayMessage('Left room successfully');
            uiDispatch({ type: 'RESET_TO_LOBBY' });
            uiDispatch({ type: 'SET_LOBBY_STATE', payload: null });
            uiDispatch({ type: 'SET_GAME_STATE', payload: null });
            uiDispatch({ type: 'SET_TEAM_ASSIGNMENTS', payload: null });

            setTimeout(() => onReturnToMenu?.(), 1500);
            break;

          case 'gameEnded':
            handleOverlayMessage(`Game ended: ${newGameState.message}`);
            uiDispatch({ type: 'SET_GAME_STATE', payload: null });
            uiDispatch({ type: 'SET_PROMPT', payload: null });
            uiDispatch({ type: 'SET_CARD_PROMPT', payload: null });
            uiDispatch({ type: 'SET_TRICK_STATE', payload: [] });
            break;

          case 'privateMessage':
            // Private overlay message for specific player
            handleOverlayMessage(newGameState.message);
            break;

          case 'playerPrompt':
            uiDispatch({
              type: 'SET_PROMPT',
              payload: {
                playerId: newGameState.playerId,
                promptText: newGameState.promptText,
                buttonOptions: newGameState.buttonOptions,
              },
            });
            break;

          case 'cardPrompt':
            uiDispatch({
              type: 'SET_CARD_PROMPT',
              payload: {
                playerId: newGameState.playerId,
                hand: (newGameState.hand || []).map(createCardInstance),
              },
            });
            break;

          case 'gameState': {
            const updatedPlayers = (newGameState.players || []).map((player) => ({
              ...player,
              hand: (player.hand || []).map(createCardInstance),
            }));

            const nextGameState = { ...newGameState, players: updatedPlayers };

            uiDispatch({ type: 'SET_GAME_STATE', payload: nextGameState });

            if (newGameState.currentDealer) {
              uiDispatch({
                type: 'PATCH_MATCH_STATE',
                payload: { currentDealer: newGameState.currentDealer },
              });
            }
            break;
          }

          default:
            uiDispatch({ type: 'SET_GAME_STATE', payload: newGameState });
        }
      } else {
        // Full game state update (fallback)
        console.log('FALLBACK: Full game state update');
        uiDispatch({ type: 'SET_GAME_STATE', payload: newGameState });
      }
    },
    [playerId, onReturnToMenu]
  );

  const handleLogMessage = (msg) => {
    uiDispatch({ type: 'ADD_LOG', payload: msg });
  };

  const overlayTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, []);

  const handleOverlayMessage = (msg) => {
    // doesn't leak
    uiDispatch({ type: 'SET_OVERLAY', payload: msg });

    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);

    overlayTimerRef.current = setTimeout(() => {
      uiDispatch({ type: 'SET_OVERLAY', payload: '' });
      overlayTimerRef.current = null;
    }, 3000);
  };

  const [wsClient, setWsClient] = useState(null);

  const handleClientReady = useCallback((clientFunctions) => {
    setWsClient(clientFunctions);
  }, []);

  const handlePlayerResponse = useCallback(
    (choice) => {
      console.log('🔘 Multiplayer player response:', choice);
      if (wsClient && wsClient.sendPlayerResponse) {
        wsClient.sendPlayerResponse(choice);
        uiDispatch({ type: 'SET_PROMPT', payload: null }); // Clear the prompt
      }
    },
    [wsClient]
  );

  const handleCardClick = (cardIndex) => {
    console.log('🃏 Multiplayer card clicked:', cardIndex);
    if (wsClient && wsClient.sendCardPlayed) {
      wsClient.sendCardPlayed(cardIndex);
      uiDispatch({ type: 'SET_CARD_PROMPT', payload: null }); // Clear the card prompt
    }
  };

  const handleStartGame = () => {
    console.log('🎮 Start game button clicked');
    if (wsClient && wsClient.sendStartGame) {
      wsClient.sendStartGame();
    }
  };

  const handleLeaveRoom = () => {
    console.log('🚪 Leave room button clicked');
    if (wsClient && wsClient.sendLeaveRoom) {
      if (
        window.confirm(
          'Are you sure you want to leave the room? This will end the game in progress.'
        )
      ) {
        wsClient.sendLeaveRoom();
      }
    }
  };

  const handleSelectTeammate = (teammateId) => {
    console.log('👥 Teammate selected:', teammateId);
    if (wsClient && wsClient.sendSelectTeammate) {
      wsClient.sendSelectTeammate(teammateId);
    }
  };

  const handleResetTeams = () => {
    console.log('🔄 Reset teams button clicked');
    if (wsClient && wsClient.sendResetTeams) {
      wsClient.sendResetTeams();
    }
  };

  // Helper function to render player name with dealer indicator
  const renderPlayerName = (player) => {
    const playerName = player?.name || 'Unknown Player';
    const currentMatchState = getMatchState();
    const isDealer = currentMatchState?.currentDealer === playerName;
    return isDealer ? `🎲 ${playerName}` : playerName;
  };

  // Get match state from game state or use current match state as fallback
  const getMatchState = useCallback(() => {
    if (gameState && gameState.teamA && gameState.teamB) {
      return {
        teamA: gameState.teamA,
        teamB: gameState.teamB,
        isMatchOver: gameState.isMatchOver || false,
        winner: gameState.winner || null,
        currentDealer: gameState.currentDealer || null,
      };
    }
    return matchState;
  }, [gameState, matchState]);

  return (
    <div className={`game-board ${!gameState ? 'lobby-mode' : 'game-mode'}`}>
      <div>
        {gameState && (
          <button
            className="leave-room-button-game"
            onClick={handleLeaveRoom}
            title="Leave room and end game"
          >
            🚪 Leave Room
          </button>
        )}
      </div>

      {/* WebSocket Connection */}
      <WebSocketClient
        roomId={roomId}
        playerId={playerId}
        playerName={playerName}
        onGameUpdate={handleGameUpdate}
        onClientReady={handleClientReady}
      />

      {overlayMessage && (
        <div className="overlay-message">
          <p>{overlayMessage}</p>
        </div>
      )}

      {/* Game UI - only show when actually in game */}
      {gameState && (
        <>
          <div className="kicked-deck">
            <div className="kicked-cards-row">
              {kickedCards.map((card, index) => (
                <div key={`kicked-${card.toString()}-${index}`} className="card">
                  {getCardComponent(card.getSuit(), card.getRank())
                    ? getCardComponent(
                        card.getSuit(),
                        card.getRank()
                      )({
                        style: { width: '100%', height: '100%' },
                      })
                    : card.toString()}
                </div>
              ))}
            </div>
          </div>

          <ScoreBoard
            matchState={getMatchState()}
            showLog={showLog}
            setShowLog={setShowLog}
            kickedCards={kickedCards}
            onLeaveRoom={handleLeaveRoom}
            gameState={gameState}
          />
        </>
      )}

      {/* Lobby - render independently when not in game */}
      {!gameState && (
        <Lobby
          roomId={roomId}
          playerId={playerId}
          playerName={playerName}
          lobbyState={lobbyState}
          teamAssignments={teamAssignments}
          onLeaveRoom={handleLeaveRoom}
          onSelectTeammate={handleSelectTeammate}
          onResetTeams={handleResetTeams}
          onStartGame={handleStartGame}
        />
      )}

      {/* Player Area */}
      <div className="player-area">
        {players.map((player, index) => {
          const isActive = player.id === activePlayerId;
          const isPromptingCard = cardPrompt?.playerId === player.id;
          const isSelf = player.id === playerId;

          const isTeammate = player.id === viewerTeammateId;

          return (
            <div key={player.id} className={`player-slot ${isActive ? 'active' : ''}`}>
              <div className={`player-name ${isActive ? 'active' : ''}`}>
                {renderPlayerName(player)}
              </div>

              <PlayerHand
                player={{
                  getId: () => player.id,
                  getName: () => player.name,
                  getHand: () => player.hand || [],
                }}
                isPromptingCard={isPromptingCard && isSelf}
                onCardClick={(i) => {
                  if (isPromptingCard && isSelf) handleCardClick(i);
                }}
                selfId={playerId}
                teammateId={viewerTeammateId}
                layout={isTeammate ? 'teammate' : 'opponent'}
                playerIndex={index}
                isBeggingPhase={gameState?.isBeggingPhase || false}
                beggarId={gameState?.beggarId || null}
                dealerId={
                  gameState?.currentDealer
                    ? players.find((p) => p.name === gameState.currentDealer)?.id
                    : null
                }
              />
            </div>
          );
        })}
      </div>

      {/* Trick Area - only show when in game */}
      {gameState && <TrickArea trickCards={trickState} activePlayerId={activePlayerId} />}

      {/* Player prompts - only show when in game */}
      {gameState && prompt && prompt.playerId === playerId && (
        <div className="prompt-container">
          <h3>🗣️ {prompt.promptText}</h3>
          <div className="prompt-buttons">
            <button onClick={() => handlePlayerResponse('yes')}>
              {prompt.buttonOptions?.yesText || 'Yes'}
            </button>
            <button onClick={() => handlePlayerResponse('no')}>
              {prompt.buttonOptions?.noText || 'No'}
            </button>
          </div>
        </div>
      )}

      {/* Log controls - only show when in game */}
      {gameState && (
        <>
          <div className="log-toggle-button">
            <button onClick={() => setShowLog(!showLog)}>
              {showLog ? 'Hide Log' : 'Show Log'}
            </button>
          </div>

          {showLog && <LogPanel log={log} onClose={() => setShowLog(false)} />}
        </>
      )}
    </div>
  );
};
