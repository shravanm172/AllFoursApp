// MultiplayerGameBoard.jsx
import React, { useState, useCallback } from "react";
import "../styles/game_board.css";
import { getCardComponent } from "../utils/getCardComponent.js";
import { ScoreBoard } from "./Scoreboard.jsx";
import { TrickArea } from "./TrickArea.jsx";
import { PlayerHand } from "./PlayerHand.jsx";
import { LogPanel } from "./LogPanel.jsx";
import { WebSocketClient } from "./WebSocketClient.jsx";
import { Lobby } from "./Lobby.jsx";
import { Card } from "../logic/Card.js";

export const MultiplayerGameBoard = ({
  roomId,
  playerId,
  playerName,
  onReturnToMenu,
}) => {
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [kickedCards, setKickedCards] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [lobbyState, setLobbyState] = useState(null);
  const [teamAssignments, setTeamAssignments] = useState(null);
  const [matchState, setMatchState] = useState({
    teamA: { name: "Team A", matchScore: 0, gameScore: 0 },
    teamB: { name: "Team B", matchScore: 0, gameScore: 0 },
    isMatchOver: false,
    winner: null,
    currentDealer: null,
  });
  const [prompt, setPrompt] = useState(null);
  const [cardPrompt, setCardPrompt] = useState(null);
  const [trickState, setTrickState] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(null);

  const handleGameUpdate = useCallback(
    (newGameState) => {
      console.log("🎲 Game state updated:", newGameState);
      console.log("🔍 Message type:", newGameState.type);

      // Handle different types of updates
      if (newGameState.type) {
        switch (newGameState.type) {
          case "lobby":
            console.log("🏛️ Received lobby state:", newGameState);
            setLobbyState({
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
            });

            // 🔄 COMPLETE GAME STATE RESET when returning to lobby
            console.log("🔄 Complete game state reset - returned to lobby");
            setTeamAssignments(null);
            setGameState(null);
            setKickedCards([]);
            setTrickState([]);
            setActivePlayerId(null);
            setPrompt(null);
            setCardPrompt(null);
            setLog([]);
            setShowLog(false);
            setOverlayMessage("");
            setMatchState({
              teamA: { name: "Team A", matchScore: 0, gameScore: 0 },
              teamB: { name: "Team B", matchScore: 0, gameScore: 0 },
              isMatchOver: false,
              winner: null,
              currentDealer: null,
            });
            break;

          case "teamAssignments":
            console.log("👥 Received team assignments:", newGameState);
            setTeamAssignments(newGameState.teamAssignments);
            // Update lobby state to reflect new canStartGame status
            setLobbyState((prev) =>
              prev
                ? {
                    ...prev,
                    canStartGame: newGameState.canStartGame,
                  }
                : null
            );
            break;

          case "activePlayerChange":
            setActivePlayerId(
              newGameState.playerId || newGameState.activePlayerId
            );
            break;

          case "trickState":
            console.log("🎯 Received trick state:", newGameState.playedCards);
            const trickCards = (newGameState.playedCards || []).map(
              (cardData) => {
                // Handle null entries isn sparse array
                if (!cardData) return null;

                return {
                  player: cardData.player,
                  card: createCardInstance(cardData.card),
                };
              }
            );
            setTrickState(trickCards);
            break;

          case "kickedCard":
            const cardInstance = createCardInstance(newGameState.card);
            setKickedCards((prev) => [...prev, cardInstance]);
            break;

          case "clearKickedCards":
            setKickedCards([]);
            break;

          case "scores":
            // Update team scores
            console.log("📊 Team scores updated:", newGameState);
            if (newGameState.teamA && newGameState.teamB) {
              setMatchState((prev) => ({
                ...prev,
                teamA: newGameState.teamA,
                teamB: newGameState.teamB,
              }));
            }
            break;

          case "logMessage":
            handleLogMessage(newGameState.message);
            break;

          case "overlayMessage":
            handleOverlayMessage(newGameState.message);
            break;

          case "leftRoom":
            console.log("👋 Successfully left room");
            handleOverlayMessage("Left room successfully");
            // Clear all state
            setLobbyState(null);
            setGameState(null);
            setTeamAssignments(null);

            // Return to main menu after a brief delay
            setTimeout(() => {
              if (onReturnToMenu) {
                onReturnToMenu();
              }
            }, 1500); // Give time for the overlay message to be seen
            break;

          case "gameEnded":
            console.log("🏁 Game ended:", newGameState);
            handleOverlayMessage(`Game ended: ${newGameState.message}`);
            // Reset to lobby state
            setGameState(null);
            setPrompt(null);
            setCardPrompt(null);
            setTrickState([]);
            break;

          case "privateMessage":
            // Private overlay message for specific player
            handleOverlayMessage(newGameState.message);
            break;

          case "playerPrompt":
            // Begging, standing, giving one, running pack
            setPrompt({
              playerId: newGameState.playerId,
              promptText: newGameState.promptText,
              buttonOptions: newGameState.buttonOptions,
            });
            break;

          case "cardPrompt":
            // Play a card
            console.log("🃏 Received card prompt:", newGameState);
            console.log(
              "🃏 Is this prompt for me?",
              newGameState.playerId === playerId
            );

            setCardPrompt({
              playerId: newGameState.playerId,
              hand: (newGameState.hand || []).map(createCardInstance),
            });
            break;

          case "gameState":
            console.log("🎮 Full game state received:", newGameState);

            // Debug: Log round information
            console.log("🔍 ROUND INFO:", {
              isBeggingPhase: newGameState.isBeggingPhase,
              beggarId: newGameState.beggarId,
              currentDealer: newGameState.currentDealer,
            });

            // Debug: Log hand sizes received from server
            console.log("🃏 DEBUG - Hand sizes received from server:");
            (newGameState.players || []).forEach((player, index) => {
              console.log(
                `  Player ${index} (${player.name}): handSize=${player.handSize}, actualCards=${(player.hand || []).length}`
              );
            });

            // Convert player hands to Card instances
            const updatedPlayers = (newGameState.players || []).map(
              (player) => ({
                ...player,
                hand: (player.hand || []).map(createCardInstance),
              })
            );
            setGameState({ ...newGameState, players: updatedPlayers });

            // Update dealer info if present
            if (newGameState.currentDealer) {
              setMatchState((prev) => ({
                ...prev,
                currentDealer: newGameState.currentDealer,
              }));
            }
            break;

          default:
            console.log("❓ Unknown game update type:", newGameState.type);
        }
      } else {
        // Full game state update (fallback)
        console.log("🎮 Processing full game state update");

        // Debug: Log round information for fallback case too
        console.log("🔍 ROUND INFO (fallback):", {
          isBeggingPhase: newGameState.isBeggingPhase,
          beggarId: newGameState.beggarId,
          currentDealer: newGameState.currentDealer,
        });

        setGameState(newGameState);
      }
    },
    [playerId, onReturnToMenu]
  );

  const handleLogMessage = (msg) => {
    setLog((prev) => [...prev, msg]);
  };

  const handleOverlayMessage = (msg) => {
    setOverlayMessage(msg);
    setTimeout(() => setOverlayMessage(""), 3000);
  };

  const [wsClient, setWsClient] = useState(null);

  const handleClientReady = useCallback((clientFunctions) => {
    setWsClient(clientFunctions);
  }, []);

  const handlePlayerResponse = useCallback(
    (choice) => {
      console.log("🔘 Multiplayer player response:", choice);
      if (wsClient && wsClient.sendPlayerResponse) {
        wsClient.sendPlayerResponse(choice);
        setPrompt(null); // Clear the prompt
      }
    },
    [wsClient]
  );

  const handleCardClick = (cardIndex) => {
    console.log("🃏 Multiplayer card clicked:", cardIndex);
    if (wsClient && wsClient.sendCardPlayed) {
      wsClient.sendCardPlayed(cardIndex);
      setCardPrompt(null); // Clear the card prompt
    }
  };

  const handleStartGame = () => {
    console.log("🎮 Start game button clicked");
    if (wsClient && wsClient.sendStartGame) {
      wsClient.sendStartGame();
    }
  };

  const handleLeaveRoom = () => {
    console.log("🚪 Leave room button clicked");
    if (wsClient && wsClient.sendLeaveRoom) {
      if (
        window.confirm(
          "Are you sure you want to leave the room? This will end the game in progress."
        )
      ) {
        wsClient.sendLeaveRoom();
      }
    }
  };

  const handleSelectTeammate = (teammateId) => {
    console.log("👥 Teammate selected:", teammateId);
    if (wsClient && wsClient.sendSelectTeammate) {
      wsClient.sendSelectTeammate(teammateId);
    }
  };

  const handleResetTeams = () => {
    console.log("🔄 Reset teams button clicked");
    if (wsClient && wsClient.sendResetTeams) {
      wsClient.sendResetTeams();
    }
  };

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
    if (cardData.toString && typeof cardData.toString === "string") {
      // Handle cases where toString is a string property, not a method
      const parts = cardData.toString.split(" of ");
      if (parts.length === 2) {
        return new Card(parts[1], parts[0]);
      }
    }

    console.warn("Unable to convert card data to Card instance:", cardData);
    return cardData; // Return as-is as fallback
  };

  // Helper function to render player name with dealer indicator
  const renderPlayerName = (player) => {
    const playerName = player?.name || "Unknown Player";
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

    // Use current match state
    return matchState;
  }, [gameState, matchState]);

  return (
    <div className={`game-board ${!gameState ? "lobby-mode" : "game-mode"}`}>
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
                <div
                  key={`kicked-${card.toString()}-${index}`}
                  className="card"
                >
                  {getCardComponent(card.getSuit(), card.getRank())
                    ? getCardComponent(
                        card.getSuit(),
                        card.getRank()
                      )({
                        style: { width: "100%", height: "100%" },
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

      <div className="player-area">
        {gameState?.players &&
          (() => {
            // Calculate the current viewing player's teammate ID
            const currentPlayerIndex = gameState.players.findIndex(
              (p) => p.id === playerId
            );
            let viewerTeammateId = null;

            // Teammates are: 0&2, 1&3
            if (currentPlayerIndex === 0 && gameState.players[2]) {
              viewerTeammateId = gameState.players[2].id;
            } else if (currentPlayerIndex === 2 && gameState.players[0]) {
              viewerTeammateId = gameState.players[0].id;
            } else if (currentPlayerIndex === 1 && gameState.players[3]) {
              viewerTeammateId = gameState.players[3].id;
            } else if (currentPlayerIndex === 3 && gameState.players[1]) {
              viewerTeammateId = gameState.players[1].id;
            }

            console.log(
              `👁️ Viewer ${playerId} at index ${currentPlayerIndex}, teammate ID: ${viewerTeammateId}`
            );

            return gameState.players.map((player, index) => {
              const isActive = player.id === activePlayerId;
              const isPromptingCard = cardPrompt?.playerId === player.id;
              const isSelf = player.id === playerId;

              // Determine if this player is the viewer's teammate
              // Teammates: 0&2 are teammates, 1&3 are teammates
              const isTeammate = player.id === viewerTeammateId;

              // Debug log for teammate relationships
              console.log(
                `🤝DEBUGGING SHOW TEAMMATE HANDS: Player at index ${index} (${player.name}): viewerTeammateId = ${viewerTeammateId}, isTeammate = ${isTeammate}, handSize = ${player.hand?.length || 0}, hasHandData = ${!!player.hand}`
              );
              return (
                <div
                  key={player.id}
                  className={`player-slot ${isActive ? "active" : ""}`}
                >
                  <div className={`player-name ${isActive ? "active" : ""}`}>
                    {renderPlayerName(player)}
                  </div>

                  <PlayerHand
                    player={{
                      getId: () => player.id,
                      getName: () => player.name,
                      getHand: () => player.hand || [],
                    }}
                    isPromptingCard={isPromptingCard && isSelf}
                    onCardClick={(index) => {
                      if (isPromptingCard && isSelf) {
                        handleCardClick(index);
                      }
                    }}
                    selfId={playerId}
                    teammateId={viewerTeammateId}
                    layout={isTeammate ? "teammate" : "opponent"}
                    playerIndex={index}
                    isBeggingPhase={gameState.isBeggingPhase || false}
                    beggarId={gameState.beggarId || null}
                    dealerId={
                      gameState.currentDealer
                        ? gameState.players.find(
                            (p) => p.name === gameState.currentDealer
                          )?.id
                        : null
                    }
                  />
                </div>
              );
            });
          })()}
      </div>

      {/* Trick Area - only show when in game */}
      {gameState && (
        <TrickArea trickCards={trickState} activePlayerId={activePlayerId} />
      )}

      {/* Player prompts - only show when in game */}
      {gameState && prompt && prompt.playerId === playerId && (
        <div className="prompt-container">
          {console.log("🟢 Rendering prompt for current player")}
          <h3>🗣️ {prompt.promptText}</h3>
          <div className="prompt-buttons">
            <button onClick={() => handlePlayerResponse("yes")}>
              {prompt.buttonOptions?.yesText || "Yes"}
            </button>
            <button onClick={() => handlePlayerResponse("no")}>
              {prompt.buttonOptions?.noText || "No"}
            </button>
          </div>
        </div>
      )}

      {/* Log controls - only show when in game */}
      {gameState && (
        <>
          <div className="log-toggle-button">
            <button onClick={() => setShowLog(!showLog)}>
              {showLog ? "Hide Log" : "Show Log"}
            </button>
          </div>

          {showLog && <LogPanel log={log} onClose={() => setShowLog(false)} />}
        </>
      )}
    </div>
  );
};
