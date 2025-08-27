// testRoundManual.js
// Manual interactive test script for Round.js class
// Tests complete round gameplay including begging phase and all tricks

import { Round } from "./Round.js";
import { Player } from "./Player.js";
import { Team } from "./Team.js";
import { CLIIO } from "../../../CLIIO.js";
import * as readline from "readline";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("=".repeat(60));
console.log("🎮 MANUAL ROUND TEST - All Fours");
console.log("=".repeat(60));

// Create 4 players
const alice = new Player("Alice");
const bob = new Player("Bob");
const charlie = new Player("Charlie");
const diana = new Player("Diana");
const players = [alice, bob, charlie, diana];

// Create teams (North-South vs East-West)
const teamNorthSouth = new Team("North-South", alice, charlie);
const teamEastWest = new Team("East-West", bob, diana);

console.log(`\n👥 Teams:`);
console.log(
  `   🔵 ${teamNorthSouth.getName()}: ${alice.getName()} & ${charlie.getName()}`
);
console.log(
  `   🔴 ${teamEastWest.getName()}: ${bob.getName()} & ${diana.getName()}`
);

// Function to get user input
function getInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to display current scores
function displayScores() {
  console.log(`\n📊 Current Match Scores:`);
  console.log(
    `   🔵 ${teamNorthSouth.getName()}: ${teamNorthSouth.getMatchScore()} points`
  );
  console.log(
    `   🔴 ${teamEastWest.getName()}: ${teamEastWest.getMatchScore()} points`
  );
  console.log(`   🎯 First to 14 points wins!`);
}

// Function to choose initial dealer
async function chooseDealer() {
  console.log(`\n🃏 Who should be the first dealer?`);
  players.forEach((player, index) => {
    console.log(`   ${index + 1}. ${player.getName()}`);
  });

  while (true) {
    const choice = await getInput(`Choose dealer (1-4): `);
    const dealerIndex = parseInt(choice) - 1;

    if (dealerIndex >= 0 && dealerIndex < players.length) {
      return players[dealerIndex];
    } else {
      console.log("❌ Invalid choice. Please enter 1, 2, 3, or 4.");
    }
  }
}

// Function to set initial scores for testing scenarios
async function setTestScores() {
  const setScores = await getInput(
    `\n⚙️  Set custom starting scores for testing? (y/n): `
  );

  if (setScores.toLowerCase() === "y" || setScores.toLowerCase() === "yes") {
    console.log(`\n📝 Enter starting scores (0-13):`);

    const score1 = await getInput(`${teamNorthSouth.getName()} score: `);
    const score2 = await getInput(`${teamEastWest.getName()} score: `);

    const scoreA = Math.max(0, Math.min(13, parseInt(score1) || 0));
    const scoreB = Math.max(0, Math.min(13, parseInt(score2) || 0));

    // Manually set scores for testing
    for (let i = 0; i < scoreA; i++) {
      teamNorthSouth.addChalk(1);
    }
    for (let i = 0; i < scoreB; i++) {
      teamEastWest.addChalk(1);
    }

    console.log(`✅ Scores set!`);
    displayScores();
  }
}

// Main function to play rounds
async function playRounds() {
  let roundNumber = 1;
  let currentDealer = await chooseDealer();

  await setTestScores();

  console.log(`\n🎯 Starting All Fours game!`);
  console.log(`🃏 First dealer: ${currentDealer.getName()}`);
  console.log(`\n💡 Game Instructions:`);
  console.log(`   • Each round includes dealing, begging, and 6 tricks`);
  console.log(`   • Follow prompts for begging decisions`);
  console.log(`   • Play cards manually during tricks`);
  console.log(`   • Points are awarded automatically`);
  console.log(`   • First team to 14 points wins!`);

  while (true) {
    // Check if game is already won
    if (teamNorthSouth.getMatchScore() >= 14) {
      console.log(`\n🎉 GAME OVER! ${teamNorthSouth.getName()} wins!`);
      displayScores();
      break;
    }
    if (teamEastWest.getMatchScore() >= 14) {
      console.log(`\n🎉 GAME OVER! ${teamEastWest.getName()} wins!`);
      displayScores();
      break;
    }

    // Start new round
    console.log(`\n${"═".repeat(60)}`);
    console.log(`🎮 ROUND ${roundNumber}`);
    console.log(`🃏 Dealer: ${currentDealer.getName()}`);
    console.log(`${"═".repeat(60)}`);

    displayScores();

    // Ask if user wants to continue
    if (roundNumber > 1) {
      const continueGame = await getInput(
        `\n▶️  Continue to Round ${roundNumber}? (y/n): `
      );
      if (
        continueGame.toLowerCase() !== "y" &&
        continueGame.toLowerCase() !== "yes"
      ) {
        console.log(`\n👋 Game ended by user.`);
        displayScores();
        break;
      }
    }

    try {
      // Create GameIO instance
      const gameIO = new CLIIO();

      // Create and play the round
      console.log(`\n🚀 Initializing Round ${roundNumber}...`);
      const round = new Round(
        players,
        currentDealer,
        teamNorthSouth,
        teamEastWest,
        gameIO
      );

      console.log(`📋 The Round class will now handle all game logic.`);
      console.log(`🎮 Follow the interactive prompts that appear.`);
      console.log(`⏳ Starting round...`);

      // This will run the full interactive round
      await round.playRound();

      // Round completed
      console.log(`\n✅ Round ${roundNumber} completed!`);

      // Display detailed round results
      console.log(`\n📋 Round ${roundNumber} Summary:`);
      console.log(`   🎺 Trump suit was: ${round.getTrumpSuit()}`);
      console.log(
        `   🃏 Round aborted: ${round.wasRoundAborted() ? "Yes" : "No"}`
      );

      // Show updated scores
      displayScores();

      // Check for game winner
      if (teamNorthSouth.getMatchScore() >= 14) {
        console.log(`\n🏆 ${teamNorthSouth.getName()} WINS THE GAME!`);
        break;
      }
      if (teamEastWest.getMatchScore() >= 14) {
        console.log(`\n🏆 ${teamEastWest.getName()} WINS THE GAME!`);
        break;
      }

      // Move to next dealer (clockwise)
      const dealerIndex = players.indexOf(currentDealer);
      currentDealer = players[(dealerIndex + 1) % players.length];
      roundNumber++;
    } catch (error) {
      console.log(`\n❌ Error during Round ${roundNumber}: ${error.message}`);
      console.log(
        `📍 This might be due to pack running out or other game conditions.`
      );

      const retry = await getInput(`🔄 Try this round again? (y/n): `);
      if (retry.toLowerCase() === "y" || retry.toLowerCase() === "yes") {
        console.log(`🔄 Retrying Round ${roundNumber}...`);
        continue; // Try the same round again
      } else {
        console.log(`\n⏹️  Stopping game.`);
        displayScores();
        break;
      }
    }
  }

  console.log(`\n🎯 Final Scores:`);
  displayScores();
  console.log(`\n👋 Thanks for testing the Round class!`);
  rl.close();
}

// Function for single round testing
async function playSingleRound() {
  const dealer = await chooseDealer();
  await setTestScores();

  console.log(`\n🎯 Single Round Test Mode`);
  console.log(`🃏 Dealer: ${dealer.getName()}`);

  displayScores();

  try {
    // Create GameIO instance
    const gameIO = new CLIIO();

    console.log(`\n🚀 Starting single round...`);
    const round = new Round(
      players,
      dealer,
      teamNorthSouth,
      teamEastWest,
      gameIO
    );

    await round.playRound();

    console.log(`\n✅ Single round test completed!`);
    displayScores();
  } catch (error) {
    console.log(`\n❌ Error during single round: ${error.message}`);
  }

  rl.close();
}

// Main menu
async function showMainMenu() {
  console.log(`\n🎮 Choose test mode:`);
  console.log(`   1. 🎯 Single Round Test (test one complete round)`);
  console.log(`   2. 🏆 Full Game Test (play until someone wins)`);
  console.log(`   3. ❌ Exit`);

  const choice = await getInput(`\nEnter your choice (1-3): `);

  switch (choice) {
    case "1":
      console.log(`\n🎯 Single Round Mode selected`);
      await playSingleRound();
      break;
    case "2":
      console.log(`\n🏆 Full Game Mode selected`);
      await playRounds();
      break;
    case "3":
      console.log(`\n👋 Goodbye!`);
      rl.close();
      break;
    default:
      console.log(`❌ Invalid choice. Please enter 1, 2, or 3.`);
      await showMainMenu();
      break;
  }
}

// Welcome message
console.log(`\n📋 ROUND CLASS TEST FEATURES:`);
console.log(`   ✅ Complete round flow (dealing → begging → tricks → scoring)`);
console.log(`   ✅ Interactive begging phase (beg/stand decisions)`);
console.log(`   ✅ Pack running when trump doesn't change`);
console.log(`   ✅ Manual trick playing with rule validation`);
console.log(`   ✅ Automatic point allocation (High/Low/Jack/Game)`);
console.log(`   ✅ Game completion detection (14 points)`);
console.log(`   ✅ Error handling and recovery`);

console.log(`\n🎮 This test uses your actual Round.playRound() method!`);
console.log(`🎯 You'll experience the full interactive All Fours gameplay.`);

// Start the application
showMainMenu().catch((error) => {
  console.error("❌ Error in main menu:", error);
  rl.close();
});
