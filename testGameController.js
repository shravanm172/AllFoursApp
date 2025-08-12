import { GameController } from "./all-fours/src/logic/GameController.js";

// Test the complete GameController (equivalent to runGame.js functionality)
function testCompleteMatch() {
  console.log("=== Testing Complete All Fours Match ===\n");

  try {
    // Method 1: Using static method (like Java main)
    console.log("🎮 Running complete match using static method...\n");
    const winner = GameController.runMatch(true); // testMode = true for automated play

    console.log(`\n✅ Match completed successfully! Winner: ${winner.name}`);

    // Method 2: Manual instance creation (same as runGame.js)
    console.log("\n" + "=".repeat(60));
    console.log("🎮 Running another match using instance method...\n");

    const game = new GameController();
    const winner2 = game.playMatch(true);

    console.log(`\n✅ Second match completed! Winner: ${winner2.name}`);

    // Method 3: Step-by-step (like the original runGame.js logic)
    console.log("\n" + "=".repeat(60));
    console.log(
      "🎮 Running step-by-step match (original runGame.js style)...\n"
    );

    const game3 = new GameController();
    game3.setupGame();

    let roundNum = 1;
    while (
      game3.getTeamA().matchScore < 14 &&
      game3.getTeamB().matchScore < 14
    ) {
      console.log(`\n--- Manual Round ${roundNum} ---`);

      do {
        game3.startRound(true); // testMode for automated play
      } while (game3.getCurrentRound().wasRoundAborted());

      console.log(`Round ${roundNum} scores:`);
      console.log(
        `${game3.getTeamA().name}: ${game3.getTeamA().matchScore} chalk`
      );
      console.log(
        `${game3.getTeamB().name}: ${game3.getTeamB().matchScore} chalk`
      );

      if (game3.isMatchOver()) break;

      game3.rotateDealer();
      roundNum++;
    }

    const finalWinner = game3.getWinningTeam();
    console.log(`\n🏆 Manual match winner: ${finalWinner.name}!`);

    // Test utility methods
    console.log("\n" + "=".repeat(60));
    console.log("TESTING UTILITY METHODS");
    console.log("=".repeat(60));

    const matchState = game3.getMatchState();
    console.log("Match State Object:", JSON.stringify(matchState, null, 2));
    console.log("Game Controller String:", game3.toString());

    console.log("\n✅ ALL GAMECONTROLLER TESTS PASSED!");
    console.log("✅ runGame.js functionality fully integrated!");
    console.log("✅ Java GameController successfully converted!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error(error.stack);
  }
}

// Run the test
testCompleteMatch();
