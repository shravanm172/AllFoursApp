// LocalGameBoard.jsx
// This is your existing GameBoard component for local games
import React, { useState, useEffect } from "react";
import "../styles/game_board.css";
import { getCardComponent } from "../all-fours/src/utils/getCardComponent.js";
import { ScoreBoard } from "../all-fours/src/components/Scoreboard.jsx";
import { TrickArea } from "../all-fours/src/components/TrickArea.jsx";
import { PlayerHand } from "../all-fours/src/components/PlayerHand.jsx";
import { LogPanel } from "../all-fours/src/components/LogPanel.jsx";

export const LocalGameBoard = ({ game, guiIO, players }) => {
  // All your existing GameBoard logic stays exactly the same
  console.log("🧪 LocalGameBoard.guiIO === game.io?", game?.io === guiIO);
  console.log("🧪 LocalGameBoard.guiIO:", guiIO);
  console.log("🧪 game.io:", game?.io);

  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [privateOverlays, setPrivateOverlays] = useState({});
  const [kickedCards, setKickedCards] = useState([]);
  const [currentPlayers, setCurrentPlayers] = useState(players || []);
  const [prompt, setPrompt] = useState(null);
  const [cardPrompt, setCardPrompt] = useState(null);
  const matchState = game?.getMatchState?.();

  const renderPlayerName = (player) => {
    const playerName = player?.getName?.() || "Unknown Player";
    const isDealer = matchState?.currentDealer === playerName;
    return isDealer ? `🎲 ${playerName}` : playerName;
  };

  const [trickState, setTrickState] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(null);

  const gameIO = guiIO;
  useEffect(() => {
    if (!guiIO) return;

    guiIO.callbacks.onLogMessage = handleLogMessage;
    guiIO.callbacks.onOverlayMessage = handleOverlayMessage;
    guiIO.callbacks.onPrivateOverlayMessage = (msg, playerId) => {
      if (msg === null) {
        setPrivateOverlays((prev) => {
          const updated = { ...prev };
          delete updated[playerId];
          return updated;
        });
      } else {
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
      setCurrentPlayers([...updatedPlayers]);
    };
    guiIO.callbacks.onTrickStateUpdate = (playedCards) => {
      console.log("🎯 onTrickStateUpdate called with:", playedCards);
      setTrickState(playedCards);
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
    setTimeout(() => setOverlayMessage(""), 3000);
  };

  const handlePlayerResponse = (choice) => {
    console.log("🔘 handlePlayerResponse called with:", choice);
    if (prompt && prompt.resolve) {
      prompt.resolve(choice);
      setPrompt(null);
    }
  };

  return (
    <div className="game-board">
      <div className="local-game-indicator">
        <span>🏠 Local Game</span>
      </div>

      {overlayMessage && (
        <div className="overlay-message">
          <p>{overlayMessage}</p>
        </div>
      )}

      <div className="kicked-deck">
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
            const isActive = playerId === activePlayerId;
            const isPromptingCard = cardPrompt?.playerId === playerId;

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
                  selfId={game?.getSelfId?.()}
                  teammateId={game?.getTeammateId?.()}
                  layout={index === 0 || index === 2 ? "teammate" : "opponent"}
                  playerIndex={index}
                />
              </div>
            );
          })}
      </div>

      <TrickArea trickCards={trickState} />

      {prompt && (
        <div className="prompt-container">
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

      <div className="log-toggle-button">
        <button onClick={() => setShowLog(!showLog)}>
          {showLog ? "Hide Log" : "Show Log"}
        </button>
      </div>

      {showLog && <LogPanel log={log} onClose={() => setShowLog(false)} />}
    </div>
  );
};
