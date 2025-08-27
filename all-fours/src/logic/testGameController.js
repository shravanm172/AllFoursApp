// testGameController.js
// Test script for GameController.js - Full All Fours Match Test
// Tests complete match gameplay from start to finish

import { GameController } from "./GameController.js";
import { CLIIO } from "../../../CLIIO.js";
import * as readline from "readline";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("=".repeat(70));
console.log("🎮 GAMECONTROLLER TEST - Full All Fours Match");
console.log("=".repeat(70));

// Function to get user input
function getInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to set test scores for quick testing
async function setupTestScenario() {
  console.log(`\n⚙️  Test Scenario Setup`);
  console.log(`This allows you to test specific game situations:`);
  console.log(`1. Normal match (start from 0-0)`);
  console.log(`2. Close match (start near winning scores)`);
  console.log(`3. Custom scores`);

  while (true) {
    const choice = await getInput(`\nChoose scenario (1-3): `);

    switch (choice) {
      case "1":
        return { teamAScore: 0, teamBScore: 0, description: "Normal match" };
      case "2":
        return {
          teamAScore: 12,
          teamBScore: 11,
          description: "Close match (12-11)",
        };
      case "3":
        const scoreA = await getInput(`Team A starting score (0-13): `);
        const scoreB = await getInput(`Team B starting score (0-13): `);
        const teamAScore = Math.max(0, Math.min(13, parseInt(scoreA) || 0));
        const teamBScore = Math.max(0, Math.min(13, parseInt(scoreB) || 0));
        return {
          teamAScore,
          teamBScore,
          description: `Custom match (${teamAScore}-${teamBScore})`,
        };
      default:
        console.log("❌ Invalid choice. Please enter 1, 2, or 3.");
    }
  }
}

// Function to run a single match test
async function runSingleMatch() {
  console.log(`\n🎯 Single Match Test Mode`);

  const scenario = await setupTestScenario();
  console.log(`\n✅ Selected: ${scenario.description}`);

  // Create GameIO instance
  const gameIO = new CLIIO();

  try {
    console.log(`\n🚀 Starting All Fours Match...`);
    console.log(`📋 The GameController will handle all game logic.`);
    console.log(`🎮 Follow the interactive prompts that appear.`);
    console.log(`⏳ Initializing match...`);

    // Create GameController and set up initial scores if needed
    const gameController = new GameController(gameIO);

    // If we need to set custom scores, we'll do it after setup
    if (scenario.teamAScore > 0 || scenario.teamBScore > 0) {
      console.log(`\n📊 Setting custom starting scores...`);

      // Set up the game first to create teams
      gameController.setupGame();

      // Manually set the scores
      for (let i = 0; i < scenario.teamAScore; i++) {
        gameController.teamA.addChalk(1);
      }
      for (let i = 0; i < scenario.teamBScore; i++) {
        gameController.teamB.addChalk(1);
      }

      console.log(`✅ Custom scores set!`);
      console.log(
        `${gameController.teamA.name}: ${gameController.teamA.matchScore} chalk`
      );
      console.log(
        `${gameController.teamB.name}: ${gameController.teamB.matchScore} chalk`
      );

      // Now run the match (it will skip setupGame since teams are already created)
      const winner = await gameController.playMatch();

      console.log(`\n🏆 Match completed!`);
      console.log(`Winner: ${winner.name}`);
    } else {
      // Normal match - let GameController handle everything
      const winner = await GameController.runMatch(gameIO);

      console.log(`\n🏆 Match completed!`);
      console.log(`Winner: ${winner.name}`);
    }
  } catch (error) {
    console.log(`\n❌ Error during match: ${error.message}`);
    console.log(`Stack trace:`, error.stack);
  }

  rl.close();
}

// Function to run multiple matches for stress testing
async function runMultipleMatches() {
  console.log(`\n🔥 Multiple Match Stress Test`);

  const numMatches = await getInput(`How many matches to run? (1-10): `);
  const matchCount = Math.max(1, Math.min(10, parseInt(numMatches) || 1));

  console.log(`\n🚀 Running ${matchCount} matches...`);

  const results = [];

  for (let i = 1; i <= matchCount; i++) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎮 MATCH ${i} of ${matchCount}`);
    console.log(`${"=".repeat(50)}`);

    try {
      // Create fresh GameIO for each match
      const gameIO = new CLIIO();

      const startTime = Date.now();
      const winner = await GameController.runMatch(gameIO);
      const endTime = Date.now();

      const matchResult = {
        matchNumber: i,
        winner: winner.name,
        winnerScore: winner.matchScore,
        duration: endTime - startTime,
        success: true,
      };

      results.push(matchResult);

      console.log(`✅ Match ${i} completed - Winner: ${winner.name}`);
    } catch (error) {
      console.log(`❌ Match ${i} failed: ${error.message}`);
      results.push({
        matchNumber: i,
        error: error.message,
        success: false,
      });
    }
  }

  // Display summary
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📊 STRESS TEST SUMMARY`);
  console.log(`${"=".repeat(70)}`);

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful matches: ${successful.length}/${matchCount}`);
  console.log(`❌ Failed matches: ${failed.length}/${matchCount}`);

  if (successful.length > 0) {
    const avgDuration =
      successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(
      `⏱️  Average match duration: ${(avgDuration / 1000).toFixed(2)} seconds`
    );

    console.log(`\n🏆 Match Winners:`);
    successful.forEach((result) => {
      console.log(
        `   Match ${result.matchNumber}: ${result.winner} (${result.winnerScore} chalk)`
      );
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed Matches:`);
    failed.forEach((result) => {
      console.log(`   Match ${result.matchNumber}: ${result.error}`);
    });
  }

  rl.close();
}

// Function to test GameController methods individually
async function testGameControllerMethods() {
  console.log(`\n🔧 GameController Methods Test`);

  // Create GameIO instance
  const gameIO = new CLIIO();
  const gameController = new GameController(gameIO);

  console.log(`\n📋 Testing individual methods...`);

  try {
    // Test setup methods
    console.log(`\n1. Testing setupPlayers()...`);
    gameController.setupPlayers();
    console.log(
      `✅ Players created: ${gameController
        .getPlayers()
        .map((p) => p.name)
        .join(", ")}`
    );

    console.log(`\n2. Testing setupTeams()...`);
    gameController.setupTeams();
    console.log(
      `✅ Team A: ${gameController.getTeamA().name} - ${gameController.getTeamA().player1.name} & ${gameController.getTeamA().player2.name}`
    );
    console.log(
      `✅ Team B: ${gameController.getTeamB().name} - ${gameController.getTeamB().player1.name} & ${gameController.getTeamB().player2.name}`
    );

    console.log(`\n3. Testing dealer methods...`);
    console.log(
      `✅ Initial dealer: ${gameController.getCurrentDealer().name} (index: ${gameController.getDealerIndex()})`
    );

    gameController.rotateDealer();
    console.log(
      `✅ After rotation: ${gameController.getCurrentDealer().name} (index: ${gameController.getDealerIndex()})`
    );

    console.log(`\n4. Testing game state methods...`);
    console.log(`✅ Match over: ${gameController.isMatchOver()}`);
    console.log(
      `✅ Winning team: ${gameController.getWinningTeam()?.name || "None"}`
    );

    console.log(`\n5. Testing match state getter...`);
    const matchState = gameController.getMatchState();
    console.log(`✅ Match state:`, JSON.stringify(matchState, null, 2));

    console.log(`\n6. Testing toString method...`);
    console.log(`✅ toString: ${gameController.toString()}`);

    console.log(`\n✅ All method tests passed!`);
  } catch (error) {
    console.log(`❌ Method test failed: ${error.message}`);
  }

  rl.close();
}

// Main menu function
async function main() {
  console.log(`\n🎯 GameController Test Options:`);
  console.log(`1. Run single interactive match`);
  console.log(`2. Run multiple matches (stress test)`);
  console.log(`3. Test GameController methods only`);
  console.log(`4. Exit`);

  while (true) {
    const choice = await getInput(`\nChoose test type (1-4): `);

    switch (choice) {
      case "1":
        await runSingleMatch();
        return;
      case "2":
        await runMultipleMatches();
        return;
      case "3":
        await testGameControllerMethods();
        return;
      case "4":
        console.log(`\n👋 Exiting GameController test.`);
        rl.close();
        return;
      default:
        console.log("❌ Invalid choice. Please enter 1, 2, 3, or 4.");
    }
  }
}

// Start the test
main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  rl.close();
});
