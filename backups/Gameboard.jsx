// GameBoard.jsx
import React, { useState, useEffect } from "react";
import "../styles/game_board.css"; // Stylesheet
import { getCardComponent } from "../utils/getCardComponent.js";
import { ScoreBoard } from "./Scoreboard.jsx";
import { TrickArea } from "./TrickArea.jsx";
import { PlayerHand } from "./PlayerHand.jsx";
import { LogPanel } from "./LogPanel.jsx";

export const GameBoard = ({ game, guiIO, players }) => {
  // Debugging logs
  console.log("🧪 GameBoard.guiIO === game.io?", game?.io === guiIO); // Should be true
  console.log("🧪 GameBoard.guiIO:", guiIO);
  console.log("🧪 game.io:", game?.io);

  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [privateOverlays, setPrivateOverlays] = useState({}); // { playerId: message }
  const [kickedCards, setKickedCards] = useState([]);
  const [currentPlayers, setCurrentPlayers] = useState(players || []);
  const [prompt, setPrompt] = useState(null); // { playerId, promptText, resolve }
  const [cardPrompt, setCardPrompt] = useState(null); // { playerId, hand, resolve }
  const matchState = game?.getMatchState?.();

  // Helper function to render player name with dealer indicator
  const renderPlayerName = (player) => {
    const playerName = player?.getName?.() || "Unknown Player";
    const isDealer = matchState?.currentDealer === playerName;
    return isDealer ? `🎲 ${playerName}` : playerName;
  };
  const [trickState, setTrickState] = useState([]); // [{card, player}, ...]
  const [activePlayerId, setActivePlayerId] = useState(null);

  const gameIO = guiIO;
  useEffect(() => {
    if (!guiIO) return;

    guiIO.callbacks.onLogMessage = handleLogMessage;
    guiIO.callbacks.onOverlayMessage = handleOverlayMessage;
    guiIO.callbacks.onPrivateOverlayMessage = (msg, playerId) => {
      if (msg === null) {
        // Clear the private overlay for this player
        setPrivateOverlays((prev) => {
          const updated = { ...prev };
          delete updated[playerId];
          return updated;
        });
      } else {
        // Set the private overlay message
        setPrivateOverlays((prev) => ({ ...prev, [playerId]: msg }));
      }
    };
    guiIO.callbacks.onKickedCard = (card) =>
      setKickedCards((prev) => [...prev, card]);
    guiIO.callbacks.onClearKickedCards = () => {
      console.log("🧹 Clearing kicked cards");
      setKickedCards([]);
    };
    guiIO.callbacks.onPromptPlayer = (
      playerId,
      promptText,
      resolve,
      buttonOptions
    ) => {
      console.log("🤔 Player prompt received:", {
        playerId,
        promptText,
        buttonOptions,
      });
      setPrompt({ playerId, promptText, resolve, buttonOptions });
    };
    guiIO.callbacks.onPromptCard = (playerId, hand, resolve) => {
      console.log("🃏 Card prompt received:", {
        playerId,
        handSize: hand?.length,
      });
      setCardPrompt({ playerId, hand, resolve });
    };
    guiIO.callbacks.onShowPlayerHands = (updatedPlayers) => {
      console.log("🖐️ showPlayerHands called", updatedPlayers);
      setCurrentPlayers([...updatedPlayers]); // 👈 update local state to re-render
    };
    guiIO.callbacks.onTrickStateUpdate = (playedCards) => {
      console.log("🎯 onTrickStateUpdate called with:", playedCards);
      console.log("🎯 playedCards type:", typeof playedCards);
      console.log("🎯 playedCards length:", playedCards?.length || 0);
      setTrickState(playedCards); // overwrite with latest trick state
    };
    guiIO.callbacks.onActivePlayerChange = setActivePlayerId;
  }, [guiIO]);

  const handleLogMessage = (msg) => {
    console.log("📝 Log message received:", msg);
    setLog((prev) => [...prev, msg]);
  };

  const handleOverlayMessage = (msg) => {
    console.log("📢 Overlay message received:", msg);
    setOverlayMessage(msg);
    // Auto-clear after 3 seconds
    setTimeout(() => setOverlayMessage(""), 3000);
  };

  const handlePlayerResponse = (choice) => {
    console.log("🔘 handlePlayerResponse called with:", choice);
    console.log("🔘 Current prompt:", prompt);
    if (prompt && prompt.resolve) {
      console.log("🔘 Resolving prompt with choice:", choice);
      prompt.resolve(choice); // Resolve the Promise in promptPlayer
      setPrompt(null); // Clear prompt state
      console.log("🔘 Prompt cleared");
    } else {
      console.log("🔘 No prompt or resolve function available");
    }
  };

  // Main return for the GameBoard.jsx component
  return (
    <div className="game-board">
      {/* Public Overlay Message */}
      {overlayMessage && (
        <div className="overlay-message">
          <p>{overlayMessage}</p>
        </div>
      )}
      {/* Kicked Card Deck */}
      <div className="kicked-deck">
        {/* <h3>Kicked Cards</h3> */}
        <div className="kicked-cards-row">
          {kickedCards.map((card, index) => (
            <div key={`kicked-${card.toString()}-${index}`} className="card">
              {getCardComponent(card.suit, card.rank)
                ? getCardComponent(
                    card.suit,
                    card.rank
                  )({
                    style: { width: "100%", height: "100%" },
                  })
                : card.toString()}
            </div>
          ))}
        </div>
      </div>
      {/* Scoreboard */}
      <ScoreBoard
        matchState={matchState}
        showLog={showLog}
        setShowLog={setShowLog}
        kickedCards={kickedCards}
      />

      <div className="player-area">
        {currentPlayers &&
          currentPlayers.map((player, index) => {
            const playerId = player?.getId?.() || `player-${index}`;
            // const isActive =
            //   prompt?.playerId === playerId ||
            //   cardPrompt?.playerId === playerId;
            const isActive = playerId === activePlayerId;
            // const isActive = activePlayerId === playerId; --> PROBLEMATIC LINE
            const isPromptingCard = cardPrompt?.playerId === playerId;
            console.log(
              `🔍 Checking player ${player?.getName?.()} with ID ${playerId}`
            );
            console.log(
              `     IsActive? prompt=${prompt?.playerId}, cardPrompt=${cardPrompt?.playerId}`
            );
            return (
              <div
                key={playerId}
                className={`player-slot ${isActive ? "active" : ""}`}
              >
                {privateOverlays[playerId] && (
                  <div className="private-overlay">
                    {privateOverlays[playerId]}
                  </div>
                )}

                {/* Player name above hand for all except top player */}
                {/* {index !== 2 && (
                  <div className={`player-name ${isActive ? "active" : ""}`}>
                    {player?.getName?.() || "Unknown Player"}
                  </div>
                )} */}

                <div className={`player-name ${isActive ? "active" : ""}`}>
                  {renderPlayerName(player)}
                </div>

                <PlayerHand
                  player={player}
                  isPromptingCard={isPromptingCard}
                  onCardClick={(index) => {
                    if (isPromptingCard && cardPrompt?.resolve) {
                      cardPrompt.resolve(index);
                      setCardPrompt(null);
                    }
                  }}
                  selfId={game?.getSelfId?.()} // ✅ safe accessor
                  teammateId={game?.getTeammateId?.()} // ✅ safe accessor
                  layout={index === 0 || index === 2 ? "teammate" : "opponent"} // bottom/top
                  playerIndex={index} // Pass index to identify top player
                />

                {/* Player name below hand for top player only */}
                {/* {index === 2 && (
                  <div className={`player-name ${isActive ? "active" : ""}`}>
                    {player?.getName?.() || "Unknown Player"}
                  </div>
                )} */}
              </div>
            );
          })}
      </div>
      <TrickArea trickCards={trickState} />
      {/* Prompt (for beg/give1/run decisions) */}
      {prompt && (
        <div className="prompt-container">
          <h3>🗣️ {prompt.promptText}</h3>
          <div className="prompt-buttons">
            <button
              key="yes-button"
              onClick={() => handlePlayerResponse("yes")}
            >
              {prompt.buttonOptions?.yesText || "Yes"}
            </button>
            <button key="no-button" onClick={() => handlePlayerResponse("no")}>
              {prompt.buttonOptions?.noText || "No"}
            </button>
          </div>
        </div>
      )}
      {/* Log Panel */}
      <div className="log-toggle-button">
        <button onClick={() => setShowLog(!showLog)}>
          {showLog ? "Hide Log" : "Show Log"}
        </button>
      </div>
      {showLog && <LogPanel log={log} onClose={() => setShowLog(false)} />}
    </div>
  );
};
