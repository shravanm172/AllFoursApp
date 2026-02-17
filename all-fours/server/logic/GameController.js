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
  constructor(gameIO, playerData = null, teamAssignments = null) {
    this.players = [];
    this.teamA = null;
    this.teamB = null;
    this.dealerIndex = 0;
    this.currentRound = null;
    this.io = gameIO; // Use the provided IO handler for user interaction
    this.playerData = playerData; // Array of {playerId, playerName} objects for multiplayer
    this.teamAssignments = teamAssignments; // Team assignments from server
    this.matchTargetScore = 3;
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
    if (this.playerData && this.playerData.length === 4) {
      console.log("🔍 DEBUGGING setupPlayers():");
      console.log(
        "Original playerData order:",
        this.playerData.map((p) => `${p.playerName} (${p.playerId})`)
      );
      console.log(
        "teamAssignments after setupPlayers():",
        JSON.stringify(this.teamAssignments, null, 2)
      );

      // Store original player order for UI purposes (trick card positioning, etc.)
      this.originalPlayerData = [...this.playerData];

      if (this.teamAssignments) {
        // Arrange players according to team assignments so teammates sit opposite (0&2, 1&3)
        const team1Ids = this.teamAssignments.team1;
        const team2Ids = this.teamAssignments.team2;

        // Find player data for each team
        const team1PlayerData = team1Ids.map((id) =>
          this.playerData.find((p) => p.playerId === id)
        );
        const team2PlayerData = team2Ids.map((id) =>
          this.playerData.find((p) => p.playerId === id)
        );

        console.log(
          "team1PlayerData:",
          team1PlayerData.map((p) => `${p?.playerName} (${p?.playerId})`)
        );
        console.log(
          "team2PlayerData:",
          team2PlayerData.map((p) => `${p?.playerName} (${p?.playerId})`)
        );

        // Arrange as: [team1[0], team2[0], team1[1], team2[1]] so teammates are at 0&2, 1&3
        const arrangedPlayerData = [
          team1PlayerData[0], // Position 0: Team 1 player 1
          team2PlayerData[0], // Position 1: Team 2 player 1
          team1PlayerData[1], // Position 2: Team 1 player 2 (teammate of position 0)
          team2PlayerData[1], // Position 3: Team 2 player 2 (teammate of position 1)
        ];

        console.log(
          "arrangedPlayerData:",
          arrangedPlayerData.map((p) => `${p?.playerName} (${p?.playerId})`)
        );

        // Create Player objects in the arranged order
        const p1 = new Player(
          arrangedPlayerData[0].playerName,
          arrangedPlayerData[0].playerId
        );
        const p2 = new Player(
          arrangedPlayerData[1].playerName,
          arrangedPlayerData[1].playerId
        );
        const p3 = new Player(
          arrangedPlayerData[2].playerName,
          arrangedPlayerData[2].playerId
        );
        const p4 = new Player(
          arrangedPlayerData[3].playerName,
          arrangedPlayerData[3].playerId
        );

        this.players = [p1, p2, p3, p4];

        console.log("✅ Players arranged for team seating:");
        console.log("Position 0:", p1.getName(), "(Team 1)");
        console.log("Position 1:", p2.getName(), "(Team 2)");
        console.log("Position 2:", p3.getName(), "(Team 1 - teammate of 0)");
        console.log("Position 3:", p4.getName(), "(Team 2 - teammate of 1)");
      } else {
        // No team assignments, use original order
        console.log("⚠️ No team assignments, using original join order");
        const p1 = new Player(
          this.playerData[0].playerName,
          this.playerData[0].playerId
        );
        const p2 = new Player(
          this.playerData[1].playerName,
          this.playerData[1].playerId
        );
        const p3 = new Player(
          this.playerData[2].playerName,
          this.playerData[2].playerId
        );
        const p4 = new Player(
          this.playerData[3].playerName,
          this.playerData[3].playerId
        );
        this.players = [p1, p2, p3, p4];
      }
    } else {
      // Fallback to default names for local games
      const p1 = new Player("Player 1", "P1");
      const p2 = new Player("Player 2", "P2");
      const p3 = new Player("Player 3", "P3");
      const p4 = new Player("Player 4", "P4");
      this.players = [p1, p2, p3, p4];
    }
  }

  getPlayersArray() {
    return this.players;
  }

  setupTeams() {
    console.log("🔍 DEBUGGING setupTeams():");
    console.log(
      "teamAssignments:",
      JSON.stringify(this.teamAssignments, null, 2)
    );
    console.log(
      "players array:",
      this.players.map((p) => `${p.getName()} (ID: ${p.getId()})`)
    );

    if (this.teamAssignments) {
      console.log("✅ Using server team assignments");

      // Since setupPlayers() already arranged players correctly,
      // teammates should be at positions 0&2 and 1&3
      this.teamA = new Team("Team A", this.players[0], this.players[2]);
      this.teamB = new Team("Team B", this.players[1], this.players[3]);

      console.log("✅ Teams set up using arranged player positions:");
      console.log(
        `Team A: ${this.players[0].getName()} & ${this.players[2].getName()}`
      );
      console.log(
        `Team B: ${this.players[1].getName()} & ${this.players[3].getName()}`
      );
    } else {
      // Fallback to old logic for backwards compatibility
      console.log("⚠️ No teamAssignments provided, using fallback");
      this.teamA = new Team("Team A", this.players[0], this.players[2]);
      this.teamB = new Team("Team B", this.players[1], this.players[3]);
      console.log("⚠️ Using fallback team assignment (order-based)");
    }

    console.log("🏁 FINAL TEAMS:");
    console.log(
      `Team A: ${this.teamA.player1.getName()} (${this.teamA.player1.getId()}) & ${this.teamA.player2.getName()} (${this.teamA.player2.getId()})`
    );
    console.log(
      `Team B: ${this.teamB.player1.getName()} (${this.teamB.player1.getId()}) & ${this.teamB.player2.getName()} (${this.teamB.player2.getId()})`
    );
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
    return (
      this.teamA.matchScore >= this.matchTargetScore ||
      this.teamB.matchScore >= this.matchTargetScore
    );
  }

  getWinningTeam() {
    if (this.teamA.matchScore >= this.matchTargetScore) return this.teamA;
    if (this.teamB.matchScore >= this.matchTargetScore) return this.teamB;
    return null;
  }

  /*
   * Main Game Loop - equivalent to main() method in Java
   */
  async playMatch(testMode = false) {
    // this.io.showGameHeader("🎮 STARTING ALL FOURS MATCH 🎮");
    // this.io.showMessage("First team to 14 chalk wins!");

    // setupGame() is called externally before playMatch()

    let roundNumber = 1;

    while (!this.isMatchOver()) {
      console.log(`🎯 Starting round ${roundNumber}`);
      this.io.showMessage(`ROUND ${roundNumber}`, "log");

      // Play rounds until one completes successfully (not aborted)
      let roundCompleted = false;
      do {
        console.log(`🎯 About to call startRound() for round ${roundNumber}`);
        roundCompleted = await this.startRound(testMode);
        console.log(`🎯 startRound() returned: ${roundCompleted}`);
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

    if (typeof this.io.close === "function") {
      this.io.close();
    }
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
      matchTargetScore: this.matchTargetScore,
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
