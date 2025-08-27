// testRoundInteractive.js - Interactive test for Round.js dealing and begging phases

import { Player } from "./Player.js";
import { Team } from "./Team.js";
import { Round } from "./Round.js";

console.log("=== Interactive Round Test (Dealing + Begging) ===\n");

// Create 4 players
const alice = new Player("Alice");
const bob = new Player("Bob");
const charlie = new Player("Charlie");
const diana = new Player("Diana");

const players = [alice, bob, charlie, diana];

// Create teams
const teamA = new Team("Team Red", alice, charlie);
const teamB = new Team("Team Blue", bob, diana);

console.log("🎮 Game Setup:");
console.log(
  `${teamA.getName()}: ${teamA.getPlayer1().getName()} & ${teamA.getPlayer2().getName()}`
);
console.log(
  `${teamB.getName()}: ${teamB.getPlayer1().getName()} & ${teamB.getPlayer2().getName()}`
);

// Set dealer (Alice for this test)
const dealer = alice;
console.log(`\n🎯 Dealer: ${dealer.getName()}`);

// Show initial team scores
console.log(`\n📊 Initial Scores:`);
console.log(`${teamA.getName()}: ${teamA.getMatchScore()} points`);
console.log(`${teamB.getName()}: ${teamB.getMatchScore()} points`);

// Create and start round
const round = new Round(players, dealer, teamA, teamB);

console.log(`\n${"=".repeat(60)}`);
console.log("🎲 Starting Interactive Round Test");
console.log("This will test:");
console.log("✓ Dealing 6 cards to each player");
console.log("✓ Kicking trump card and awarding points");
console.log("✓ Interactive begging phase (beg/stand, give 1/run pack)");
console.log("✓ Running pack if dealer chooses to");
console.log(`${"=".repeat(60)}`);

// Start the round
round
  .playRound()
  .then(() => {
    console.log(`\n📊 Final Scores:`);
    console.log(`${teamA.getName()}: ${teamA.getMatchScore()} points`);
    console.log(`${teamB.getName()}: ${teamB.getMatchScore()} points`);

    if (round.wasRoundAborted()) {
      console.log("\n⚠️ Round was aborted due to insufficient cards.");
    } else {
      console.log("\n✅ Round completed successfully!");
      console.log(`Final trump suit: ${round.getTrumpSuit()}`);
    }

    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ Error during round: ${error.message}`);
    process.exit(1);
  });
