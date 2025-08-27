// src/logic/GameIO.js
export class GameIO {
  // Player interaction methods
  async promptPlayer(player, message) {
    throw new Error("promptPlayer not implemented");
  }

  async promptPlayerChoice(player, message, choices) {
    throw new Error("promptPlayerChoice not implemented");
  }

  // Display methods
  showMessage(message) {
    throw new Error("showMessage not implemented");
  }

  //Replaced with showMessage
  //   showError(message) {
  //     throw new Error("showError not implemented");
  //   }

  showKickedCard(card) {
    // In React: maybe call setKickedCards(prev => [...prev, card])
  }

  showHand(player, hand) {
    throw new Error("showHand not implemented");
  }

  showPlayerHands(players) {
    throw new Error("showPlayerHands not implemented");
  }

  showTrickState(currentPlayer, hand, playedCards) {
    throw new Error("showTrickState not implemented");
  }

  showScores(teamA, teamB) {
    throw new Error("showScores not implemented");
  }

  showGameHeader(message) {
    throw new Error("showGameHeader not implemented");
  }

  showSectionHeader(message) {
    throw new Error("showSectionHeader not implemented");
  }

  setActivePlayer(playerId) {
    throw new Error("setActivePlayer not implemented");
  }

  close() {
    // Optional override
  }
}
