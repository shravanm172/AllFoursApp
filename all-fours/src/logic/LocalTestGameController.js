// LocalTestGameController.js
// Extended GameController for local single-player testing
// Player 1 = Human, Players 2-4 = Auto/AI

import { GameController } from "./GameController.js";
import { Player } from "./Player.js";
import { Round } from "./Round.js";

export class LocalTestGameController extends GameController {
  constructor(gameIO) {
    super(gameIO);
    this.humanPlayerId = null; // Will be set to Player 1's ID
    this.autoPlayDelay = 1500; // 1.5 second delay for auto plays
  }

  setupPlayers() {
    // Create players with specific roles
    const human = new Player("You", "P1");
    const ai1 = new Player("AI Left", "P2");
    const ai2 = new Player("AI Top", "P3");
    const ai3 = new Player("AI Right", "P4");

    this.players = [human, ai1, ai2, ai3];
    this.humanPlayerId = human.getId();

    // Mark AI players
    ai1.isAI = true;
    ai2.isAI = true;
    ai3.isAI = true;
  }

  // Override the GameIO to handle AI players automatically
  async startRound(testMode = false) {
    const dealer = this.getCurrentDealer();

    // Create a wrapped GameIO that handles AI responses
    const wrappedIO = this.createAIWrapper(this.io);

    this.currentRound = new Round(
      this.players,
      dealer,
      this.teamA,
      this.teamB,
      wrappedIO
    );

    // Reset team game scores for new round
    this.teamA.resetGameScore();
    this.teamB.resetGameScore();

    try {
      await this.currentRound.playRound(testMode);
      return !this.currentRound.wasRoundAborted();
    } catch (error) {
      this.io.showMessage(`Round failed: ${error.message}`, "log");
      return false;
    }
  }

  createAIWrapper(originalIO) {
    const self = this;

    return {
      // Pass through the methods that actually exist in GUIIO
      showMessage: (msg, target) => originalIO.showMessage(msg, target),
      showKickedCard: (card) => originalIO.showKickedCard(card),
      showPlayerHands: (players) => originalIO.showPlayerHands(players),
      showTrickState: (playedCards) => originalIO.showTrickState(playedCards),
      showScores: (teamA, teamB) => originalIO.showScores(teamA, teamB),
      clearKickedCards: () => originalIO.clearKickedCards(),
      setActivePlayer: (playerId) => originalIO.setActivePlayer?.(playerId),
      waitForOverlayQueueToClear: () =>
        originalIO.waitForOverlayQueueToClear?.(),

      // Add stub method for close since GUI doesn't need it
      close: () => {
        // GUI doesn't need to close like CLI does
        console.log("close() called (GUI mode - ignored)");
      },

      // Wrap promptPlayer to handle AI automatically
      async promptPlayer(player, promptText, buttonOptions) {
        if (player.isAI) {
          // Auto-respond for AI players
          await self.delay(self.autoPlayDelay);
          return self.getAIResponse(player, promptText);
        } else {
          // Human player - use original IO with button options
          return await originalIO.promptPlayer(
            player,
            promptText,
            buttonOptions
          );
        }
      },

      // Wrap promptCard to handle AI card selection
      async promptCard(player, hand) {
        if (player.isAI) {
          // Auto-select card for AI players
          await self.delay(self.autoPlayDelay);
          return self.getAICardChoice(player, hand);
        } else {
          // Human player - use original IO
          return await originalIO.promptCard(player, hand);
        }
      },
    };
  }

  // Simple AI logic for responses
  getAIResponse(player, promptText) {
    const lowerPrompt = promptText.toLowerCase();

    if (lowerPrompt.includes("beg")) {
      // AI begs 30% of the time
      const shouldBeg = Math.random() < 0.3;
      this.io.showMessage(
        `${player.getName()} ${shouldBeg ? "begs" : "stands"} (AI decision)`,
        "log"
      );
      return shouldBeg ? "yes" : "no";
    }

    if (lowerPrompt.includes("give 1 chalk")) {
      // AI gives 1 chalk 40% of the time
      const shouldGive = Math.random() < 0.4;
      this.io.showMessage(
        `${player.getName()} ${shouldGive ? "gives 1 chalk" : "runs the pack"} (AI decision)`,
        "log"
      );
      return shouldGive ? "yes" : "no";
    }

    if (lowerPrompt.includes("choose a card")) {
      // For card selection, we'll need a different approach
      // This will be handled in the trick playing logic
      return "1"; // Default to first card
    }

    // Default response
    return Math.random() < 0.5 ? "yes" : "no";
  }

  // AI card selection logic
  getAICardChoice(player, hand) {
    if (!hand || hand.length === 0) {
      console.warn(`AI ${player.getName()} has no cards to choose from`);
      return null;
    }

    // Simple AI: choose a random valid card
    const randomIndex = Math.floor(Math.random() * hand.length);
    const selectedCard = hand[randomIndex];

    this.io.showMessage(
      `${player.getName()} plays ${selectedCard.toString()} (AI decision)`,
      "log"
    );

    return randomIndex; // Return the index, not the card
  }

  // Utility method for delays
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get which player is human (for UI highlighting)
  getHumanPlayer() {
    return this.players?.find((p) => !p.isAI);
  }

  // Get human player's teammate
  getHumanTeammate() {
    const humanPlayer = this.getHumanPlayer();
    if (!humanPlayer) return null;

    const humanTeam = this.getTeamOfPlayer(humanPlayer);
    return humanTeam?.getPlayer1() === humanPlayer
      ? humanTeam?.getPlayer2()
      : humanTeam?.getPlayer1();
  }

  // Methods that GameBoard expects
  getSelfId() {
    const humanPlayer = this.getHumanPlayer();
    return humanPlayer?.getId();
  }

  getTeammateId() {
    const teammate = this.getHumanTeammate();
    return teammate?.getId();
  }

  // Helper to determine which team a player belongs to
  getTeamOfPlayer(player) {
    if (
      player === this.teamA.getPlayer1() ||
      player === this.teamA.getPlayer2()
    ) {
      return this.teamA;
    }
    return this.teamB;
  }

  // Override setupGame to show local test info
  setupGame() {
    this.io.showMessage("🏠 LOCAL TEST MODE - Single Player vs AI", "log");

    this.setupPlayers();
    this.setupTeams();

    // Random dealer selection
    this.dealerIndex = Math.floor(Math.random() * 4);

    this.io.showMessage(
      `Match setup complete. ${this.getCurrentDealer().getName()} is the first dealer.`
    );
    this.io.showMessage(
      `Your team: ${this.getHumanTeammate()?.getName() || "Unknown"} & You`
    );
    this.io.showMessage(
      `AI team: ${
        this.teamA === this.getTeamOfPlayer(this.getHumanPlayer())
          ? `${this.teamB.getPlayer1().getName()} & ${this.teamB.getPlayer2().getName()}`
          : `${this.teamA.getPlayer1().getName()} & ${this.teamA.getPlayer2().getName()}`
      }`
    );
  }

  // Static method to run a local test match
  static async runLocalTest(gameIO) {
    const game = new LocalTestGameController(gameIO);
    return await game.playMatch();
  }
}
