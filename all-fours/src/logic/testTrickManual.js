// testTrickManual.js
// Manual interactive test script for Trick.js class
// Tests the actual interactive playCard() functionality with user input

import { Trick } from "./Trick.js";
import { Player } from "./Player.js";
import { Deck } from "./Deck.js";
import * as readline from "readline";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("=".repeat(60));
console.log("🃏 MANUAL INTERACTIVE TRICK TEST");
console.log("=".repeat(60));

// Create 4 players
const alice = new Player("Alice");
const bob = new Player("Bob");
const charlie = new Player("Charlie");
const diana = new Player("Diana");
const players = [alice, bob, charlie, diana];

// Set trump suit
const trumpSuit = "Hearts";
console.log(`🎺 Trump suit: ${trumpSuit}\n`);

// Create and shuffle deck
const deck = new Deck();
deck.shuffle();

// Deal 6 cards to each player for testing
console.log("📋 Dealing 6 cards to each player...\n");
deck.deal(players, 6);

// Show initial hands
console.log("Initial player hands:");
players.forEach((player) => {
  console.log(
    `  ${player.getName()}: ${player
      .getHand()
      .map((c) => c.toString())
      .join(", ")}`
  );
});

// Create trick with Alice as leader
let currentTrick = new Trick(players, trumpSuit, alice);

console.log(`\n🎯 Starting manual trick test...`);
console.log(
  `👤 ${currentTrick.getCurrentPlayer().getName()} will lead this trick`
);

// Function to display current player's turn info
function displayPlayerTurn(player) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`👤 ${player.getName()}'s Turn`);
  console.log(`${"─".repeat(50)}`);

  const hand = player.getHand();
  console.log(`🃏 Your hand (${hand.length} cards):`);
  hand.forEach((card, index) => {
    const isValid = currentTrick.canPlayCard(card, player);
    const validIcon = isValid ? "✅" : "❌";
    console.log(`  ${index + 1}. ${card.toString()} ${validIcon}`);
  });

  // Show current trick state
  if (currentTrick.playedCards.length > 0) {
    console.log(`\n🎴 Cards already played this trick:`);
    currentTrick.playedCards.forEach((entry, index) => {
      const leadIcon = index === 0 ? "🔥" : "  ";
      console.log(
        `  ${leadIcon} ${entry.player.getName()}: ${entry.card.toString()}`
      );
    });
    console.log(`🎯 Lead suit: ${currentTrick.getLeadSuit()}`);
  }

  // Show gameplay hints
  console.log(`\n💡 Gameplay reminders:`);
  if (currentTrick.getLeadSuit()) {
    console.log(
      `   • Must follow ${currentTrick.getLeadSuit()} if you have it`
    );
  } else {
    console.log(`   • You're leading - any card is valid`);
  }
  console.log(`   • Trump (${trumpSuit}) beats non-trump`);
  console.log(`   • Cannot undertrump if you have other suits`);
}

// Function to get user's card selection
function getUserCardChoice(player) {
  return new Promise((resolve) => {
    const hand = player.getHand();

    function askForInput() {
      rl.question(
        `\n${player.getName()}, select a card (1-${hand.length}) or type 'quit': `,
        (input) => {
          if (input.toLowerCase() === "quit") {
            console.log("👋 Goodbye!");
            rl.close();
            process.exit(0);
          }

          const choice = parseInt(input.trim());

          if (isNaN(choice) || choice < 1 || choice > hand.length) {
            console.log(
              `❌ Invalid input. Please enter a number between 1 and ${hand.length}`
            );
            askForInput(); // Try again
            return;
          }

          const selectedCard = hand[choice - 1];
          resolve(selectedCard);
        }
      );
    }

    askForInput();
  });
}

// Main interactive game loop
async function playManualTrick() {
  console.log(`\n🎮 Manual trick gameplay started!`);
  console.log(`🎯 Players will take turns selecting cards to play`);
  console.log(`📏 The trick follows standard All Fours rules\n`);

  let trickCount = 1;

  while (!currentTrick.isComplete()) {
    const currentPlayer = currentTrick.getCurrentPlayer();

    // Display current player's options
    displayPlayerTurn(currentPlayer);

    // Get player's card choice
    try {
      const chosenCard = await getUserCardChoice(currentPlayer);

      // Try to play the card using the interactive Trick.playCard() method
      console.log(`\n🎯 Attempting to play ${chosenCard.toString()}...`);

      const result = currentTrick.playCard(chosenCard, currentPlayer);

      // Success - show what happened
      console.log(
        `✅ SUCCESS! ${currentPlayer.getName()} plays ${result.card.toString()}`
      );

      // Show updated trick state
      console.log(`\n📊 Current trick state:`);
      const playedCards = currentTrick.playedCards;
      const latestCardIndex = playedCards.length - 1;

      playedCards.forEach((entry, index) => {
        const position = index === 0 ? " (LEAD)" : "";
        const isLatest = index === latestCardIndex ? "← JUST PLAYED" : "";
        console.log(
          `  ${entry.player.getName()}: ${entry.card.toString()}${position} ${isLatest}`
        );
      });

      // Check if trick is complete
      if (result.isComplete) {
        console.log(`\n🎉 TRICK ${trickCount} COMPLETE!`);
        console.log(`${"=".repeat(60)}`);
        console.log(`🏆 WINNER: ${result.winner.getName()}`);
        console.log(`💰 POINTS EARNED: ${result.pointsEarned}`);

        // Check for Jack of trump
        if (currentTrick.isJackPlayed()) {
          const jackPlayer = currentTrick.getJackPlayer();
          const winner = result.winner;
          const jackStatus = jackPlayer === winner ? "RAN JACK" : "HUNG JACK";
          console.log(
            `🃏 ${jackPlayer.getName()} played Jack of ${trumpSuit} - ${jackStatus}!`
          );
        }

        console.log(`${"=".repeat(60)}`);

        // Show final trick summary
        console.log(`\n📋 Final trick summary:`);
        currentTrick.playedCards.forEach((entry, index) => {
          const position = index === 0 ? " (Lead)" : "";
          const isWinner = entry.player === result.winner ? " 🏆" : "";
          console.log(
            `  ${entry.player.getName()}: ${entry.card.toString()}${position}${isWinner}`
          );
        });

        // Show remaining cards
        console.log(`\n🃏 Cards remaining:`);
        players.forEach((player) => {
          const count = player.getHand().length;
          console.log(`  ${player.getName()}: ${count} cards`);
        });

        await askForNextAction();
        break;
      }
    } catch (error) {
      // Show validation error and let player try again
      console.log(`\n❌ INVALID PLAY: ${error.message}`);
      console.log(`🔄 Please select a different card.`);
      // The loop will continue, asking the same player to choose again
    }
  }
}

// Function to ask what to do next
function askForNextAction() {
  return new Promise((resolve) => {
    // Check if another trick is possible
    const playersWithCards = players.filter((p) => p.getHand().length > 0);

    if (
      playersWithCards.length === 4 &&
      playersWithCards.every((p) => p.getHand().length > 0)
    ) {
      rl.question("\n🎮 Play another trick? (y/n): ", (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          // Start new trick with previous winner as leader
          const newLeader = currentTrick.getWinner();
          currentTrick = new Trick(players, trumpSuit, newLeader);
          console.log(
            `\n🔄 Starting new trick with ${newLeader.getName()} leading...`
          );
          playManualTrick().then(() => resolve());
        } else {
          console.log("\n👋 Thanks for testing! Goodbye!");
          rl.close();
          resolve();
        }
      });
    } else {
      console.log(
        "\n🃏 No more complete tricks possible (some players out of cards)"
      );
      console.log("👋 Thanks for testing! Goodbye!");
      rl.close();
      resolve();
    }
  });
}

// Start the manual test
console.log(`\n🚀 Ready to start manual testing!`);
console.log(`📝 Instructions:`);
console.log(`   • Each player will be prompted to select a card`);
console.log(`   • Valid cards are marked with ✅, invalid with ❌`);
console.log(`   • The system will validate your play using Trick.playCard()`);
console.log(`   • Type 'quit' anytime to exit`);

playManualTrick().catch((error) => {
  console.error("❌ Error during manual test:", error);
  rl.close();
});
