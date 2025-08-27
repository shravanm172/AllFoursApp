// ScoreBoard.jsx
import React from "react";
import "../styles/scoreboard.css";
import { getCardComponent } from "../utils/getCardComponent.js";

export const ScoreBoard = ({
  matchState,
  showLog,
  setShowLog,
  kickedCards,
  onLeaveRoom,
  gameState,
}) => {
  if (!matchState) return null;

  const { teamA, teamB, isMatchOver, winner } = matchState;

  return (
    <div className="score-board">
      {/* Top row: main content and kicked cards */}
      <div className="scoreboard-top-row">
        {/* Main scoreboard content */}
        <div className="scoreboard-main">
          <h3>Scoreboard</h3>
          <div className="score-row">
            <div className="team-name">
              <h4>{teamA.name}</h4>
            </div>
            <div className="team-score">
              <div><p>Match Score: {teamA.matchScore}</p></div>
              <div><p>Game Score: {teamA.gameScore}</p></div>
              {/* <p>Players: {teamA.players.join(" & ")}</p> */}
            </div>
          </div>
          <div className="score-row">
            <div className="team-name">
              <h4>{teamB.name}</h4>
            </div>
            <div className="team-score">
              <div><p>Match Score: {teamB.matchScore}</p></div>
              <div><p>Game Score: {teamB.gameScore}</p></div>
              {/* <p>Players: {teamB.players.join(" & ")}</p> */}
            </div>
          </div>

          {isMatchOver && (
            <div className="winner-announcement">
              <h3>🏆 {winner} Wins the Match!</h3>
            </div>
          )}
        </div>

        {/* Mobile Kicked Cards - only visible on mobile */}
        <div className="scoreboard-kicked-deck">
          <div className="kicked-cards-row">
            {kickedCards &&
              kickedCards.map((card, index) => (
                <div
                  key={`kicked-${card.toString()}-${index}`}
                  className="card"
                >
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
      </div>

      {/* Mobile Leave Room and Show Log Button Ribbon */}
      <div className="button-row">
        <button
          className="scoreboard-toggle-log-btn"
          onClick={() => setShowLog(!showLog)}
        >
          {showLog ? "Hide Log" : "Show Log"}
        </button>
        {gameState && onLeaveRoom && (
          <button
            className="scoreboard-leave-btn"
            onClick={onLeaveRoom}
            title="Leave room and end game"
          >
            🚪Leave Room
          </button>
        )}
      </div>
    </div>
  );
};
