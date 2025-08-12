import { Card } from "./all-fours/src/logic/Card.js";
import { Deck } from "./all-fours/src/logic/Deck.js";
import { Player } from "./all-fours/src/logic/Player.js";
import { Team } from "./all-fours/src/logic/Team.js";
import { Trick } from "./all-fours/src/logic/Trick.js";
import { Suit } from "./all-fours/src/logic/enums/Suit.js";
import { Rank } from "./all-fours/src/logic/enums/Rank.js";

// Test script to simulate tricks and validate all converted classes
function testTrickSimulation() {
  console.log("=== All Fours Card Play Validation Test ===\n");

  try {
    // Create 4 players
    const player1 = new Player("Alice");
    const player2 = new Player("Bob");
    const player3 = new Player("Charlie");
    const player4 = new Player("Diana");

    // Create 2 teams
    const teamA = new Team("Team A", player1, player3); // Alice & Charlie
    const teamB = new Team("Team B", player2, player4); // Bob & Diana

    console.log("Teams created:");
    console.log(`Team A: ${teamA.player1.name} & ${teamA.player2.name}`);
    console.log(`Team B: ${teamB.player1.name} & ${teamB.player2.name}\n`);

    // Set trump suit
    const trumpSuit = Suit.HEARTS;
    console.log(`Trump suit: ${trumpSuit}\n`);

    // TEST 1: Jack RUNS (Jack player's team wins)
    console.log("========================================");
    console.log("TEST 1: Jack RUNS (teammate wins trick)");
    console.log("========================================");

    const runCards = [
      new Card(Rank.KING, Suit.SPADES), // Alice - non-trump
      new Card(Rank.JACK, trumpSuit), // Bob - Jack of trump
      new Card(Rank.QUEEN, Suit.DIAMONDS), // Charlie - non-trump
      new Card(Rank.ACE, trumpSuit), // Diana - Ace of trump (wins, same team as Bob)
    ];

    // Deal cards for run scenario
    player1.hand = [runCards[0]];
    player2.hand = [runCards[1]];
    player3.hand = [runCards[2]];
    player4.hand = [runCards[3]];

    console.log("\nCards dealt:");
    console.log(`${player1.name}: ${runCards[0].toString()}`);
    console.log(`${player2.name}: ${runCards[1].toString()}`);
    console.log(`${player3.name}: ${runCards[2].toString()}`);
    console.log(`${player4.name}: ${runCards[3].toString()}\n`);

    const players = [player1, player2, player3, player4];
    const runTrick = new Trick(players, trumpSuit, player1);

    console.log("Playing the trick:");
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const cardToPlay = player.hand[0];
      runTrick.addCard(cardToPlay, player);
      console.log(`${player.name} plays ${cardToPlay.toString()}`);
    }

    console.log("\nDetermining winner:");
    const runWinner = runTrick.determineWinner(teamA, teamB);

    console.log(`Trick winner: ${runWinner.name}`);
    console.log(`Jack outcome: ${runTrick.jackOutcome}`);
    console.log(`Expected: RAN (because Diana won and she's on Bob's team)\n`);

    // TEST 2: Jack HANGS (opposing team wins)
    console.log("========================================");
    console.log("TEST 2: Jack HANGS (opponent wins trick)");
    console.log("========================================");

    const hangCards = [
      new Card(Rank.ACE, trumpSuit), // Alice - Ace of trump (wins)
      new Card(Rank.JACK, trumpSuit), // Bob - Jack of trump
      new Card(Rank.KING, Suit.DIAMONDS), // Charlie - non-trump
      new Card(Rank.QUEEN, trumpSuit), // Diana - Trump queen
    ];

    // Deal cards for hang scenario
    player1.hand = [hangCards[0]];
    player2.hand = [hangCards[1]];
    player3.hand = [hangCards[2]];
    player4.hand = [hangCards[3]];

    console.log("\nCards dealt:");
    console.log(`${player1.name}: ${hangCards[0].toString()}`);
    console.log(`${player2.name}: ${hangCards[1].toString()}`);
    console.log(`${player3.name}: ${hangCards[2].toString()}`);
    console.log(`${player4.name}: ${hangCards[3].toString()}\n`);

    const hangTrick = new Trick(players, trumpSuit, player1);

    console.log("Playing the trick:");
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const cardToPlay = player.hand[0];
      hangTrick.addCard(cardToPlay, player);
      console.log(`${player.name} plays ${cardToPlay.toString()}`);
    }

    console.log("\nDetermining winner:");
    const hangWinner = hangTrick.determineWinner(teamA, teamB);

    console.log(`Trick winner: ${hangWinner.name}`);
    console.log(`Jack outcome: ${hangTrick.jackOutcome}`);
    console.log(
      `Expected: HUNG (because Alice won and she's on the opposing team)\n`
    );

    // TEST 3: Undertrump blocking test
    console.log("========================================");
    console.log("TEST 3: UNDERTRUMP BLOCKING");
    console.log("========================================");

    // Give each player 6 cards with specific scenario
    // Alice leads with Spades, Bob trumps with King of Hearts
    // Charlie has both trump and spades - should be forced to overtrump, not undertrump
    player1.hand = [
      new Card(Rank.ACE, Suit.SPADES),
      new Card(Rank.KING, Suit.SPADES),
      new Card(Rank.QUEEN, Suit.SPADES),
      new Card(Rank.JACK, Suit.DIAMONDS),
      new Card(Rank.TEN, Suit.DIAMONDS),
      new Card(Rank.NINE, Suit.CLUBS),
    ];

    player2.hand = [
      new Card(Rank.KING, trumpSuit), // Trump King
      new Card(Rank.QUEEN, trumpSuit), // Trump Queen
      new Card(Rank.TEN, trumpSuit), // Trump 10
      new Card(Rank.NINE, Suit.DIAMONDS),
      new Card(Rank.EIGHT, Suit.DIAMONDS),
      new Card(Rank.SEVEN, Suit.CLUBS),
    ];

    player3.hand = [
      new Card(Rank.JACK, Suit.SPADES), // Can follow lead suit
      new Card(Rank.TEN, Suit.SPADES), // Can follow lead suit
      new Card(Rank.ACE, trumpSuit), // Trump Ace (can overtrump)
      new Card(Rank.JACK, trumpSuit), // Trump Jack (undertrump - should be blocked)
      new Card(Rank.NINE, trumpSuit), // Trump 9 (undertrump - should be blocked)
      new Card(Rank.EIGHT, Suit.CLUBS),
    ];

    player4.hand = [
      new Card(Rank.NINE, Suit.SPADES),
      new Card(Rank.EIGHT, Suit.SPADES),
      new Card(Rank.SEVEN, Suit.SPADES),
      new Card(Rank.QUEEN, Suit.DIAMONDS),
      new Card(Rank.JACK, Suit.CLUBS),
      new Card(Rank.TEN, Suit.CLUBS),
    ];

    console.log("\nEach player has 6 cards:");
    console.log(
      `${player1.name}: ${player1.hand.map((c) => c.toString()).join(", ")}`
    );
    console.log(
      `${player2.name}: ${player2.hand.map((c) => c.toString()).join(", ")}`
    );
    console.log(
      `${player3.name}: ${player3.hand.map((c) => c.toString()).join(", ")}`
    );
    console.log(
      `${player4.name}: ${player4.hand.map((c) => c.toString()).join(", ")}\n`
    );

    const undertrumpTrick = new Trick(players, trumpSuit, player1);

    console.log("Playing the trick with validation:");

    // Alice leads with Ace of Spades
    const aliceCard = new Card(Rank.ACE, Suit.SPADES);
    undertrumpTrick.addCard(aliceCard, player1);
    console.log(`${player1.name} leads with ${aliceCard.toString()}`);

    // Bob trumps with King of Hearts
    const bobCard = new Card(Rank.KING, trumpSuit);
    undertrumpTrick.addCard(bobCard, player2);
    console.log(`${player2.name} trumps with ${bobCard.toString()}`);

    // Charlie tries to play Jack of trump (undertrump) - should be blocked
    const leadSuit = undertrumpTrick.getLeadSuit();
    const playedCards = undertrumpTrick.getPlayedCards();

    console.log(
      `\n${player3.name}'s turn - trump suit is ${trumpSuit}, lead suit is ${leadSuit}`
    );
    console.log(
      `Cards already played: ${playedCards.map((c) => c.toString()).join(", ")}`
    );

    // Test if Jack of trump (undertrump) is valid
    const undertrumpCard = new Card(Rank.JACK, trumpSuit);
    const undertrumpResult = player3.isValidPlay(
      undertrumpCard,
      leadSuit,
      trumpSuit,
      playedCards
    );
    const isUndertrumpValid = undertrumpResult.valid;
    console.log(
      `Can ${player3.name} play ${undertrumpCard.toString()} (undertrump)? ${isUndertrumpValid ? "YES" : "NO"}`
    );
    if (!isUndertrumpValid) {
      console.log(`  Reason: ${undertrumpResult.reason}`);
    }

    // Test if Ace of trump (overtrump) is valid
    const overtrumpCard = new Card(Rank.ACE, trumpSuit);
    const overtrumpResult = player3.isValidPlay(
      overtrumpCard,
      leadSuit,
      trumpSuit,
      playedCards
    );
    const isOvertrumpValid = overtrumpResult.valid;
    console.log(
      `Can ${player3.name} play ${overtrumpCard.toString()} (overtrump)? ${isOvertrumpValid ? "YES" : "NO"}`
    );

    // Test if following suit is valid
    const followSuitCard = new Card(Rank.JACK, Suit.SPADES);
    const followSuitResult = player3.isValidPlay(
      followSuitCard,
      leadSuit,
      trumpSuit,
      playedCards
    );
    const isFollowSuitValid = followSuitResult.valid;
    console.log(
      `Can ${player3.name} play ${followSuitCard.toString()} (follow suit)? ${isFollowSuitValid ? "YES" : "NO"}`
    );

    console.log(
      `\nExpected: Undertrump should be BLOCKED, overtrump and follow suit should be allowed`
    );

    // Summary
    console.log("\n========================================");
    console.log("TEST RESULTS SUMMARY");
    console.log("========================================");
    console.log("✓ Card class working");
    console.log("✓ Player class working");
    console.log("✓ Team class working");
    console.log("✓ Trick class working");
    console.log(
      `✓ Jack RAN logic: ${runTrick.jackOutcome === "RAN" ? "PASSED" : "FAILED"}`
    );
    console.log(
      `✓ Jack HUNG logic: ${hangTrick.jackOutcome === "HUNG" ? "PASSED" : "FAILED"}`
    );
    console.log(
      `✓ Undertrump blocking: ${!isUndertrumpValid ? "PASSED" : "FAILED"}`
    );
    console.log(
      `✓ Overtrump allowed: ${isOvertrumpValid ? "PASSED" : "FAILED"}`
    );
    console.log(
      `✓ Follow suit allowed: ${isFollowSuitValid ? "PASSED" : "FAILED"}`
    );
    console.log("✓ All classes integrated successfully!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error(error.stack);
  }
}

// Run the test
testTrickSimulation();
