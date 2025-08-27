// testGameIO.js
// Simple test to demonstrate the GameIO system

import { CLIIO } from "../../../CLIIO.js";
import { MockIO } from "./MockIO.js";
import { Player } from "./Player.js";
import { Card } from "./Card.js";

console.log("=".repeat(60));
console.log("TESTING GAMEIO SYSTEM");
console.log("=".repeat(60));

// Create test player
const alice = new Player("Alice");
alice.addCard(new Card("Hearts", "Ace"));
alice.addCard(new Card("Spades", "King"));
alice.addCard(new Card("Diamonds", "Queen"));

// Test MockIO
console.log("\n🧪 Testing MockIO...");
const mockIO = new MockIO();

// Set up mock responses
mockIO.setResponses(["yes", "1", "no"]);

// Test various methods
mockIO.showGameHeader("Test Game Started");
mockIO.showMessage("Welcome to All Fours!");
mockIO.showHand(alice, alice.getHand());

// Simulate player interactions
try {
  const response1 = await mockIO.promptPlayer(
    alice,
    "do you want to beg? (yes/no): "
  );
  console.log(`Alice responded: ${response1}`);

  const response2 = await mockIO.promptPlayer(alice, "choose a card (1-3): ");
  console.log(`Alice chose: ${response2}`);
} catch (error) {
  console.log(`Error: ${error.message}`);
}

mockIO.showError("This is a test error");
mockIO.close();

// Show all captured messages
console.log("\n📝 Captured Messages:");
mockIO.getMessages().forEach((msg, i) => {
  console.log(`${i + 1}. ${msg}`);
});

console.log("\n✅ GameIO system is working!");
console.log("\nTo use in Round.js:");
console.log("1. Pass GameIO instance to Round constructor");
console.log("2. Replace console.log() with this.io.showMessage()");
console.log("3. Replace this.getInput() with this.io.promptPlayer()");
console.log("4. Use specific methods like showHand(), showScores(), etc.");
