// src/net/applyServerMessages.js
export function applyServerMessages(msg, { dispatch, toCard, onReturnToMenu, setShowLog, overlay, log }) {
  if (!msg) return;

  // If server ever sends raw game state without a "type"
  if (!msg.type) {
    dispatch({ type: "SET_GAME_STATE", payload: msg });
    return;
  }

  switch (msg.type) {
    case "lobby": {
      const lobby = {
        roomId: msg.roomId,
        playersInRoom: msg.playersInRoom,
        totalPlayersInRoom: msg.totalPlayersInRoom,
        maxPlayers: msg.maxPlayers,
        isRoomFull: msg.isRoomFull,
        disconnectedCount: msg.disconnectedCount,
        allPlayers: msg.allPlayers || [],
        gameStarted: msg.gameStarted,
        roomMaster: msg.roomMaster,
        canStartGame: msg.canStartGame,
      };

      dispatch({ type: "RESET_TO_LOBBY" });
      dispatch({ type: "SET_LOBBY_STATE", payload: lobby });
      setShowLog?.(false);
      return;
    }

    case "logMessage":
      log?.(msg.message);
      return;

    case "overlayMessage":
      overlay?.(msg.message);
      return;

    case "teamAssignments":
      dispatch({ type: "SET_TEAM_ASSIGNMENTS", payload: msg.teamAssignments });
      dispatch({ type: "PATCH_LOBBY_STATE", payload: { canStartGame: msg.canStartGame } });
      return;

    case "activePlayerChange":
      dispatch({ type: "SET_ACTIVE_PLAYER", payload: msg.playerId || msg.activePlayerId });
      return;

    case "trickState": {
      const trickCards = (msg.playedCards || []).map((cd) =>
        !cd ? null : { player: cd.player, card: toCard(cd.card) }
      );
      dispatch({ type: "SET_TRICK_STATE", payload: trickCards });
      return;
    }

    case "kickedCard":
      dispatch({ type: "ADD_KICKED_CARD", payload: toCard(msg.card) });
      return;

    case "clearKickedCards":
      dispatch({ type: "SET_KICKED_CARDS", payload: [] });
      return;

    case "scores":
      if (msg.teamA && msg.teamB) {
        dispatch({ type: "PATCH_MATCH_STATE", payload: { teamA: msg.teamA, teamB: msg.teamB } });
      }
      return;

    case "playerPrompt":
      dispatch({
        type: "SET_PROMPT",
        payload: { playerId: msg.playerId, promptText: msg.promptText, buttonOptions: msg.buttonOptions },
      });
      return;

    case "cardPrompt":
      dispatch({
        type: "SET_CARD_PROMPT",
        payload: { playerId: msg.playerId, hand: (msg.hand || []).map(toCard) },
      });
      return;

    case "gameState": {
      const updatedPlayers = (msg.players || []).map((p) => ({
        ...p,
        hand: (p.hand || []).map(toCard),
      }));

      dispatch({ type: "SET_GAME_STATE", payload: { ...msg, players: updatedPlayers } });

      if (msg.currentDealer) {
        dispatch({ type: "PATCH_MATCH_STATE", payload: { currentDealer: msg.currentDealer } });
      }
      return;
    }

    case "leftRoom":
      overlay?.(msg.message || "Left room successfully");
      dispatch({ type: "RESET_TO_LOBBY" });
      dispatch({ type: "SET_LOBBY_STATE", payload: null });
      dispatch({ type: "SET_GAME_STATE", payload: null });
      dispatch({ type: "SET_TEAM_ASSIGNMENTS", payload: null });
      setTimeout(() => onReturnToMenu?.(), 1500);
      return;

    case "gameEnded":
      overlay?.(msg.message ? `Game ended: ${msg.message}` : "Game ended");
      dispatch({ type: "SET_GAME_STATE", payload: null });
      dispatch({ type: "SET_PROMPT", payload: null });
      dispatch({ type: "SET_CARD_PROMPT", payload: null });
      dispatch({ type: "SET_TRICK_STATE", payload: [] });
      return;

    default:
      dispatch({ type: "SET_GAME_STATE", payload: msg });
  }
}
