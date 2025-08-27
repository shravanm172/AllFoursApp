// Team.js
// Converted from Team.java

/*
 * Attributes:
 * - Team name
 * - Player 1
 * - Player 2
 * - Game score (points earned in current round)
 * - Match score (chalk - points earned across rounds)
 *
 * Methods:
 * - addChalk(int points): Adds points to the team's match score (chalk)
 * - addGamePoints(int points): Adds points to the team's game score
 * - getPlayer1(): Returns the first player
 * - getPlayer2(): Returns the second player
 * - getMatchScore(): Returns the team's match score (chalk)
 * - getGameScore(): Returns the team's game score
 * - resetGameScore(): Resets the game score to 0
 * - getName(): Returns the team's name
 */

export class Team {
  constructor(name, player1, player2) {
    this.name = name;
    this.player1 = player1;
    this.player2 = player2;
    this.gameScore = 0; // Points earned in current round
    this.matchScore = 0; // Chalk - points earned across rounds
  }

  // Adds points to the team's match score (chalk)
  addChalk(points) {
    if (typeof points !== "number") throw new Error("Chalk must be a number");
    this.matchScore += points;
  }

  // Adds points to the team's game score for current round
  addGamePoints(points) {
    if (typeof points !== "number")
      throw new Error("Game points must be a number");
    this.gameScore += points;
  }

  getPlayer1() {
    return this.player1;
  }

  getPlayer2() {
    return this.player2;
  }

  getMatchScore() {
    return this.matchScore;
  }

  getGameScore() {
    return this.gameScore;
  }

  // Resets game score at the end of each round
  resetGameScore() {
    this.gameScore = 0;
  }

  getName() {
    return this.name;
  }

  // Additional helper method - check if team contains a specific player
  hasPlayer(player) {
    return this.player1 === player || this.player2 === player;
  }

  // Additional helper method - get the other player on the team
  getPartner(player) {
    if (this.player1 === player) return this.player2;
    if (this.player2 === player) return this.player1;
    return null; // Player not on this team
  }

  // String representation for debugging/logging
  toString() {
    return `${this.name} (${this.player1.getName()} & ${this.player2.getName()}) - Game: ${this.gameScore}, Chalk: ${this.matchScore}`;
  }
}
