// testLocalGame.js
// Test script for the LocalTestGameController

import { LocalTestGameController } from "./all-fours/src/logic/LocalTestGameController.js";
import { CLIIO } from "./all-fours/src/logic/CLIIO.js";

console.log("🃏 Testing Local Game with AI opponents...\n");

async function testLocalGame() {
  try {
    // Create CLI IO for testing
    const gameIO = new CLIIO();

    console.log("Starting local test match...");

    // Run the local test
    const winner = await LocalTestGameController.runLocalTest(gameIO);

    console.log(`\n🏆 Test completed! Winner: ${winner?.name}`);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

testLocalGame();
