// src/logic/MockIO.js
import { GameIO } from "./GameIO.js";

export class MockIO extends GameIO {
  constructor() {
    super();
    this.messages = [];
    this.responses = [];
    this.responseIndex = 0;
  }

  // Set up predefined responses for testing
  setResponses(responses) {
    this.responses = responses;
    this.responseIndex = 0;
  }

  // Player interaction methods
  async promptPlayer(player, message) {
    this.messages.push(`PROMPT: ${player.getName()}, ${message}`);
    if (this.responseIndex < this.responses.length) {
      const response = this.responses[this.responseIndex++];
      this.messages.push(`RESPONSE: ${response}`);
      return response;
    }
    throw new Error("No more mock responses available");
  }

  async promptPlayerChoice(player, message, choices) {
    const choiceText = choices
      .map((choice, i) => `${i + 1}. ${choice}`)
      .join(", ");
    return this.promptPlayer(player, `${message} (${choiceText}): `);
  }

  // Display methods
  showMessage(message) {
    this.messages.push(`MESSAGE: ${message}`);
  }

  showError(message) {
    this.messages.push(`ERROR: ${message}`);
  }

  showHand(player, hand) {
    const cards = hand
      .map((card, i) => `${i + 1}. ${card.toString()}`)
      .join(", ");
    this.messages.push(`HAND: ${player.getName()}'s hand: ${cards}`);
  }

  showPlayerHands(players) {
    this.messages.push("PLAYER_HANDS: Player hands:");
    for (const player of players) {
      this.messages.push(
        `  ${player.getName()}: ${player
          .getHand()
          .map((c) => c.toString())
          .join(", ")}`
      );
    }
  }

  showTrickState(currentPlayer, hand, playedCards) {
    this.messages.push(`TRICK_STATE: ${currentPlayer.getName()}'s turn`);
    const cards = hand
      .map((card, i) => `${i + 1}. ${card.toString()}`)
      .join(", ");
    this.messages.push(`Your hand: ${cards}`);

    if (playedCards && playedCards.length > 0) {
      this.messages.push("Cards played this trick:");
      for (const entry of playedCards) {
        this.messages.push(
          `   ${entry.player.getName()}: ${entry.card.toString()}`
        );
      }
    }
  }

  showScores(teamA, teamB) {
    this.messages.push("SCORES: Current Scores:");
    this.messages.push(
      `   ${teamA.getName()}: ${teamA.getMatchScore()} points`
    );
    this.messages.push(
      `   ${teamB.getName()}: ${teamB.getMatchScore()} points`
    );
  }

  showGameHeader(message) {
    this.messages.push(`GAME_HEADER: ${message}`);
  }

  showSectionHeader(message) {
    this.messages.push(`SECTION_HEADER: ${message}`);
  }

  close() {
    this.messages.push("CLOSE: GameIO closed");
  }

  // Test utility methods
  getMessages() {
    return [...this.messages];
  }

  clearMessages() {
    this.messages = [];
  }

  getLastMessage() {
    return this.messages[this.messages.length - 1];
  }

  findMessages(pattern) {
    return this.messages.filter((msg) => msg.includes(pattern));
  }
}
