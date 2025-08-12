// src/logic/CLIIO.js
import * as readline from "readline";
import { GameIO } from "./all-fours/src/logic/GameIO.js";

export class CLIIO extends GameIO {
  constructor() {
    super();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  // Player interaction methods
  async promptPlayer(player, message) {
    return new Promise((resolve) => {
      this.rl.question(`${player.getName()}, ${message}`, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async promptPlayerChoice(player, message, choices) {
    const choiceText = choices
      .map((choice, i) => `${i + 1}. ${choice}`)
      .join(", ");
    return this.promptPlayer(player, `${message} (${choiceText}): `);
  }

  // Display methods
  showMessage(message) {
    console.log(message);
  }

  showError(message) {
    console.log(`❌ ${message}`);
  }

  showHand(player, hand) {
    const cards = hand
      .map((card, i) => `${i + 1}. ${card.toString()}`)
      .join(", ");
    console.log(`🃏 ${player.getName()}'s hand: ${cards}`);
  }

  showPlayerHands(players) {
    console.log("\n📋 Player hands:");
    for (const player of players) {
      console.log(
        `  ${player.getName()}: ${player
          .getHand()
          .map((c) => c.toString())
          .join(", ")}`
      );
    }
  }

  showTrickState(currentPlayer, hand, playedCards) {
    console.log(`\n👤 ${currentPlayer.getName()}'s turn`);
    const cards = hand
      .map((card, i) => `${i + 1}. ${card.toString()}`)
      .join(", ");
    console.log(`🃏 Your hand: ${cards}`);

    if (playedCards && playedCards.length > 0) {
      console.log("🎴 Cards played this trick:");
      for (const entry of playedCards) {
        console.log(`   ${entry.player.getName()}: ${entry.card.toString()}`);
      }
    }
  }

  showScores(teamA, teamB) {
    console.log(`\n📊 Current Scores:`);
    console.log(`   ${teamA.getName()}: ${teamA.getMatchScore()} points`);
    console.log(`   ${teamB.getName()}: ${teamB.getMatchScore()} points`);
  }

  showGameHeader(message) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(message);
    console.log(`${"=".repeat(50)}`);
  }

  showSectionHeader(message) {
    console.log(`\n${message}`);
    console.log(`${"=".repeat(Math.min(message.length, 30))}`);
  }

  close() {
    this.rl.close();
  }
}
