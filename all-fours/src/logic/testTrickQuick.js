// testTrickQuick.js
// Quick interactive test for Trick.js - simplified version for rapid testing

import { Trick } from "./Trick.js";
import { Player } from "./Player.js";
import { Card } from "./Card.js";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🃏 QUICK TRICK TEST");
console.log("==================");

// Create 4 players with specific hands for testing
const alice = new Player("Alice");
const bob = new Player("Bob");
const charlie = new Player("Charlie");
const diana = new Player("Diana");
const players = [alice, bob, charlie, diana];

// Set up a test scenario
const trumpSuit = "Hearts";
console.log(`🎺 Trump: ${trumpSuit}\n`);

// Give players specific cards for interesting gameplay
alice.addCard(new Card("Spades", "King"));
alice.addCard(new Card("Diamonds", "Ace"));
alice.addCard(new Card("Hearts", "3"));

bob.addCard(new Card("Spades", "Queen"));
bob.addCard(new Card("Clubs", "King"));
bob.addCard(new Card("Hearts", "Jack"));

charlie.addCard(new Card("Spades", "Ace"));
charlie.addCard(new Card("Diamonds", "King"));
charlie.addCard(new Card("Hearts", "Ace"));

diana.addCard(new Card("Clubs", "Ace"));
diana.addCard(new Card("Diamonds", "Queen"));
diana.addCard(new Card("Hearts", "2"));

// Show hands
console.log("📋 Player hands:");
players.forEach((player) => {
  console.log(
    `  ${player.getName()}: ${player
      .getHand()
      .map((c) => c.toString())
      .join(", ")}`
  );
});

// Create trick
const trick = new Trick(players, trumpSuit, alice);

// Quick play function
async function quickPlay() {
  console.log(`\n🎯 ${trick.getCurrentPlayer().getName()}'s turn`);

  const currentPlayer = trick.getCurrentPlayer();
  const hand = currentPlayer.getHand();

  console.log("Your cards:");
  hand.forEach((card, i) => {
    const valid = trick.canPlayCard(card, currentPlayer) ? "✅" : "❌";
    console.log(`  ${i + 1}. ${card.toString()} ${valid}`);
  });

  if (trick.playedCards.length > 0) {
    console.log("\nTrick so far:");
    trick.playedCards.forEach((entry) => {
      console.log(`  ${entry.player.getName()}: ${entry.card.toString()}`);
    });
  }

  return new Promise((resolve) => {
    rl.question(
      `\nChoose card (1-${hand.length}) or 'q' to quit: `,
      (input) => {
        if (input === "q") {
          rl.close();
          process.exit(0);
        }

        const choice = parseInt(input) - 1;
        if (choice >= 0 && choice < hand.length) {
          const card = hand[choice];

          try {
            const result = trick.playCard(card, currentPlayer);
            console.log(
              `✅ ${currentPlayer.getName()} plays ${card.toString()}`
            );

            if (result.isComplete) {
              console.log(`\n🏆 Winner: ${result.winner.getName()}`);
              console.log(`💰 Points: ${result.pointsEarned}`);
              if (trick.isJackPlayed()) {
                console.log(
                  `🃏 Jack played by: ${trick.getJackPlayer().getName()}`
                );
              }
              rl.close();
              return;
            }

            resolve();
          } catch (error) {
            console.log(`❌ ${error.message}`);
            resolve();
          }
        } else {
          console.log("❌ Invalid choice");
          resolve();
        }
      }
    );
  });
}

// Main loop
async function playLoop() {
  while (!trick.isComplete()) {
    await quickPlay();
  }
}

console.log("\n🚀 Starting quick test...");
playLoop().catch(console.error);
