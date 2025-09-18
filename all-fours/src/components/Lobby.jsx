// Lobby.jsx
import React from "react";
import { IoExitOutline } from "react-icons/io5";
import { FaCrown } from "react-icons/fa6";
import { IoMdPersonAdd } from "react-icons/io";
import { FaRedoAlt } from "react-icons/fa";
import "../styles/lobby.css";

export const Lobby = ({
  roomId,
  playerId,
  playerName,
  lobbyState,
  teamAssignments,
  onStartGame,
  onLeaveRoom,
  onSelectTeammate,
  onResetTeams,
}) => {
  if (!lobbyState) {
    return (
      <div className="lobby-container">
        <div className="waiting-for-players">
          <h3>Connecting to room...</h3>
          <p>Room: {roomId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="waiting-for-players">
        <h3>Waiting for game to start...</h3>

        {/* Leave Room Button */}
        <div className="room-section">
          <p>Room: {roomId}</p>
          {lobbyState.playersInRoom >= 4 &&
            lobbyState.canStartGame &&
            lobbyState.roomMaster === playerId &&
            teamAssignments && (
              <button className="start-game-button" onClick={onStartGame}>
                Start Game
              </button>
            )}
          <button className="leave-room-button" onClick={onLeaveRoom}>
            <IoExitOutline /> Leave Room
          </button>
        </div>

        <div className="players-in-room lobby-scrollable">
          <div className="room-header">
            <p>
              Players in room ({lobbyState.playersInRoom}/
              {lobbyState.maxPlayers || 4})
              {lobbyState.disconnectedCount > 0 && (
                <span
                  style={{
                    color: "#orange",
                    fontSize: "12px",
                    marginLeft: "8px",
                  }}
                >
                  ({lobbyState.disconnectedCount} disconnected, rejoining
                  soon...)
                </span>
              )}
              {lobbyState.isRoomFull && (
                <span
                  style={{
                    color: "#red",
                    fontSize: "12px",
                    marginLeft: "8px",
                  }}
                >
                  (Room Full)
                </span>
              )}
            </p>
          </div>

          {/* Show instruction for room master when they need to select teammate */}
          {lobbyState.playersInRoom === 4 &&
            lobbyState.roomMaster === playerId &&
            !teamAssignments && (
              <div className="teammate-selection-instruction">
                <p>
                  <IoMdPersonAdd /> Click on a player below to select them as your teammate
                </p>
              </div>
            )}

          <ul>
            {lobbyState.allPlayers.map((player, index) => {
              const isRoomMaster = player.id === lobbyState.roomMaster;
              const isCurrentPlayer = player.id === playerId;
              const canSelectTeammate =
                lobbyState.playersInRoom === 4 &&
                lobbyState.roomMaster === playerId &&
                !teamAssignments &&
                !isCurrentPlayer; // Can't select yourself

              return (
                <li
                  key={player.id || index}
                  className={canSelectTeammate ? "selectable-player" : ""}
                  onClick={
                    canSelectTeammate
                      ? () => onSelectTeammate(player.id)
                      : undefined
                  }
                  style={{
                    cursor: canSelectTeammate ? "pointer" : "default",
                  }}
                >
                  {player.name}
                  {isCurrentPlayer && " (You)"}
                  {isRoomMaster && <FaCrown />}
                  {canSelectTeammate && <IoMdPersonAdd />}
                </li>
              );
            })}
          </ul>

          {/* Show team assignments if they exist */}
          {teamAssignments && (
            <div className="team-assignments">
              {/* <h4>🏆 Teams:</h4> */}
              <div className="teams-display">
                <div className="team">
                  <strong>Team 1:</strong>{" "}
                  {teamAssignments.team1
                    .map((id) => {
                      const player = lobbyState.allPlayers.find(
                        (p) => p.id === id
                      );
                      return player ? player.name : id;
                    })
                    .join(" & ")}
                </div>
                <div className="team">
                  <strong>Team 2:</strong>{" "}
                  {teamAssignments.team2
                    .map((id) => {
                      const player = lobbyState.allPlayers.find(
                        (p) => p.id === id
                      );
                      return player ? player.name : id;
                    })
                    .join(" & ")}
                </div>
              </div>
              {/* Reset teams button for room master */}
              {lobbyState.roomMaster === playerId && (
                <button className="reset-teams-button" onClick={onResetTeams}>
                  <FaRedoAlt /> Reset Teams
                </button>
              )}
            </div>
          )}

          {/* Status messages */}
          {lobbyState.playersInRoom < 4 && !lobbyState.isRoomFull && (
            <p>Waiting for {4 - lobbyState.playersInRoom} more player(s)...</p>
          )}

          {lobbyState.isRoomFull && lobbyState.playersInRoom < 4 && (
            <p style={{ color: "#orange" }}>
              Room is full ({lobbyState.totalPlayersInRoom}/4).
              {lobbyState.disconnectedCount > 0 &&
                ` ${lobbyState.disconnectedCount} player(s) temporarily disconnected.`}
            </p>
          )}

          {/* Start game section for room master */}

          {/* Waiting messages for non-room masters */}
          {lobbyState.playersInRoom === 4 &&
            lobbyState.roomMaster !== playerId &&
            !teamAssignments && (
              <p>⏳ Waiting for room master to select teammates...</p>
            )}

          {lobbyState.playersInRoom === 4 &&
            lobbyState.roomMaster !== playerId &&
            teamAssignments &&
            !lobbyState.canStartGame && (
              <p>⏳ Waiting for room master to start the game...</p>
            )}
        </div>
      </div>
    </div>
  );
};
