// GameController.js
// Converted from GameController.java

import { Player } from "./Player.js";
import { Team } from "./Team.js";
import { Round } from "./Round.js";

/*
 * Main game controller for All Fours card game
 *
 * Manages:
 * - Game setup (players, teams, dealer selection)
 * - Round management and rotation
 * - Match progression until 14 chalk victory
 * - Game state tracking
 *
 * Contains the main game loop that was in runGame.js
 */

export class GameController {
  constructor(gameIO) {
    this.players = [];
    this.teamA = null;
    this.teamB = null;
    this.dealerIndex = 0;
    this.currentRound = null;
    this.io = gameIO; // Use the provided IO handler for user interaction
  }

  /*
   * Getter Methods
   */
  getPlayers() {
    return this.players;
  }

  getCurrentTrickLeader() {
    return this.round?.currentTrick?.getLeader?.();
  }

  getCurrentTrickPlayedCards() {
    return this.round?.currentTrick?.getPlayedCards?.();
  }

  getCurrentDealer() {
    return this.players[this.dealerIndex];
  }

  getTeamA() {
    return this.teamA;
  }

  getTeamB() {
    return this.teamB;
  }

  getSelfId() {
    return this.selfPlayer.getId();
  }
  getTeammateId() {
    return this.getTeammate(this.selfPlayer).getId();
  }

  getCurrentRound() {
    return this.currentRound;
  }

  setupPlayers() {
    const p1 = new Player("Player 1", "P1");
    const p2 = new Player("Player 2", "P2");
    const p3 = new Player("Player 3", "P3");
    const p4 = new Player("Player 4", "P4");
    this.players = [p1, p2, p3, p4];
  }

  getPlayersArray() {
    return this.players;
  }

  setupTeams() {
    this.teamA = new Team("Team A", this.players[0], this.players[2]);
    this.teamB = new Team("Team B", this.players[1], this.players[3]);

    // Keep display names consistent with multiplayer scoreboard naming.
    this.teamA.name = `${this.teamA.player1.getName()} & ${this.teamA.player2.getName()}`;
    this.teamB.name = `${this.teamB.player1.getName()} & ${this.teamB.player2.getName()}`;
  }

  /*
   * Game Setup
   */
  setupGame() {
    // this.io.showGameHeader("Setting up All Fours Match");
    this.setupPlayers();
    this.setupTeams();

    this.selfPlayer = this.players[0]; // 👈 TEMP: Assume local player is Player 1
    this.getTeammate = () => this.players[2]; // teammate is Player 3

    // Random dealer selection
    this.dealerIndex = Math.floor(Math.random() * 4);

    this.io.showMessage(
      `Match setup complete. ${this.getCurrentDealer().name} is the first dealer.`,
      "log"
    );
    this.io.showMessage(
      `${this.teamA.name}: ${this.teamA.player1.name} & ${this.teamA.player2.name}`,
      "log"
    );
    this.io.showMessage(
      `${this.teamB.name}: ${this.teamB.player1.name} & ${this.teamB.player2.name}`,
      "log"
    );
  }

  /*
   * Round Management
   */
  // For interactive mode, only set up the round and return the round object
  async startRound(testMode = false) {
    const dealer = this.getCurrentDealer();
    this.currentRound = new Round(
      this.players,
      dealer,
      this.teamA,
      this.teamB,
      this.io
    );
    // Reset team game scores for new round
    this.teamA.resetGameScore();
    this.teamB.resetGameScore();

    try {
      await this.currentRound.playRound(testMode);
      // Round completed successfully if not aborted
      const completed = !this.currentRound.wasRoundAborted();
      console.log(
        "🔍 startRound returning:",
        completed,
        "wasRoundAborted:",
        this.currentRound.wasRoundAborted()
      );
      return completed;
    } catch (error) {
      this.io.showMessage(`Round failed: ${error.message}`, "log");
      console.log("🔍 startRound returning false due to error:", error.message);
      return false;
    }
  }

  rotateDealer() {
    this.dealerIndex =
      (this.dealerIndex - 1 + this.players.length) % this.players.length;
    this.io.showMessage(
      `Dealer passes to: ${this.getCurrentDealer().name}`,
      "log"
    );
  }

  getDealerIndex() {
    return this.dealerIndex;
  }

  /*
   * Game State Checks
   */
  isMatchOver() {
    return this.teamA.matchScore >= 14 || this.teamB.matchScore >= 14;
  }

  getWinningTeam() {
    if (this.teamA.matchScore >= 14) return this.teamA;
    if (this.teamB.matchScore >= 14) return this.teamB;
    return null;
  }

  /*
   * Main Game Loop - equivalent to main() method in Java
   */
  async playMatch(testMode = false) {
    // this.io.showGameHeader("🎮 STARTING ALL FOURS MATCH 🎮");
    // this.io.showMessage("First team to 14 chalk wins!");

    this.setupGame();

    let roundNumber = 1;

    while (!this.isMatchOver()) {
      this.io.showMessage(`ROUND ${roundNumber}`, "log");

      // Play rounds until one completes successfully (not aborted)
      let roundCompleted = false;
      do {
        roundCompleted = await this.startRound(testMode);
        if (!roundCompleted) {
          this.io.showMessage(
            "Round was aborted, starting new round with same dealer...",
            "log"
          );
        }
      } while (!roundCompleted);

      console.log("🔁 Round completed:", roundCompleted);
      if (roundCompleted) {
        console.log("🧹 About to call io.clearKickedCards()");
        this.io.clearKickedCards();
        console.log("🧹 Called io.clearKickedCards() after round completion");
      }

      // Show match scores after round
      this.io.showMessage(
        `\n📊 Match scores after Round ${roundNumber}:`,
        "log"
      );
      this.io.showMessage(
        `${this.teamA.name}: ${this.teamA.matchScore} chalk`,
        "log"
      );
      this.io.showMessage(
        `${this.teamB.name}: ${this.teamB.matchScore} chalk`,
        "log"
      );

      // Check if match is over
      if (this.isMatchOver()) {
        break;
      }

      // Wait for overlay messages to finish before starting next round
      if (this.io.waitForOverlayQueueToClear) {
        await this.io.waitForOverlayQueueToClear();
      }

      // Rotate dealer for next round
      this.rotateDealer();
      roundNumber++;

      // maybe add return true here
    }

    // Declare winner
    // this.io.showGameHeader("🏆 MATCH OVER! 🏆");

    const winner = this.getWinningTeam();
    this.io.showMessage(
      `${winner.name} wins the match with ${winner.matchScore} chalk!`,
      "both"
    );
    this.io.showMessage(`Final scores:`, "both");
    this.io.showMessage(
      `${this.teamA.name}: ${this.teamA.matchScore} chalk`,
      "log"
    );
    this.io.showMessage(
      `${this.teamB.name}: ${this.teamB.matchScore} chalk`,
      "log"
    );

    this.io.close();
    return winner;
  }

  /*
   * Static method to run a complete match (equivalent to Java main method)
   */
  static async runMatch(gameIO, testMode = false) {
    const game = new GameController(gameIO);
    return await game.playMatch(testMode);
  }

  /*
   * Utility Methods for React Integration
   */
  getMatchState() {
    return {
      teamA: {
        name: this.teamA.name,
        matchScore: this.teamA.matchScore,
        gameScore: this.teamA.gameScore,
        players: [this.teamA.player1.name, this.teamA.player2.name],
      },
      teamB: {
        name: this.teamB.name,
        matchScore: this.teamB.matchScore,
        gameScore: this.teamB.gameScore,
        players: [this.teamB.player1.name, this.teamB.player2.name],
      },
      currentDealer: this.getCurrentDealer().name,
      isMatchOver: this.isMatchOver(),
      winner: this.getWinningTeam()?.name || null,
    };
  }

  // For debugging and testing
  toString() {
    return `GameController: ${this.teamA.name}(${this.teamA.matchScore}) vs ${this.teamB.name}(${this.teamB.matchScore}), Dealer: ${this.getCurrentDealer().name}`;
  }
}

/*
 * Main execution - equivalent to Java's main() method
 * This runs when the file is executed directly with: node GameController.js
 * Skip this check in browser environments
 */
// if (
//   typeof process !== "undefined" &&
//   import.meta.url === `file://${process.argv[1]}`
// ) {
//   // Import GameIO for direct execution
//   import("../../../CLIIO.js").then(({ CLIIO }) => {
//     const gameIO = new CLIIO();
//     console.log("🃏 Running All Fours Match Directly 🃏\n");
//     GameController.runMatch(gameIO, true); // Run in test mode
//   });
// }
