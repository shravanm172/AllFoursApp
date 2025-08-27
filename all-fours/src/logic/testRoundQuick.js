// testRoundQuick.js
// Quick interactive test for Round.js - simplified version

import { Round } from "./Round.js";
import { Player } from "./Player.js";
import { Team } from "./Team.js";

console.log("🎮 QUICK ROUND TEST");
console.log("==================");

// Create players and teams quickly
const alice = new Player("Alice");
const bob = new Player("Bob");
const charlie = new Player("Charlie");
const diana = new Player("Diana");
const players = [alice, bob, charlie, diana];

const teamA = new Team("Team A", alice, charlie);
const teamB = new Team("Team B", bob, diana);

console.log(`\n👥 Teams:`);
console.log(`   Team A: ${alice.getName()} & ${charlie.getName()}`);
console.log(`   Team B: ${bob.getName()} & ${diana.getName()}`);

// Quick test function
async function quickRoundTest() {
  console.log(`\n🎯 Starting quick round test...`);
  console.log(`🃏 Alice will be the dealer`);
  console.log(`📊 Both teams start at 0 points`);

  console.log(`\n💡 What this tests:`);
  console.log(`   • Card dealing and trump kicking`);
  console.log(`   • Interactive begging phase`);
  console.log(`   • Manual trick playing`);
  console.log(`   • Automatic scoring`);

  try {
    const round = new Round(players, alice, teamA, teamB);
    await round.playRound();

    console.log(`\n✅ Round completed successfully!`);
    console.log(`📊 Final scores:`);
    console.log(`   Team A: ${teamA.getMatchScore()} points`);
    console.log(`   Team B: ${teamB.getMatchScore()} points`);
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
  }
}

// Start the quick test
console.log(`\n🚀 This will run one complete interactive round.`);
console.log(`🎮 Follow the prompts for begging and card playing.`);

quickRoundTest();
