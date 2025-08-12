// testTrick.js

import { Player } from "./all-fours/src/logic/Player.js";
import { Card } from "./all-fours/src/logic/Card.js";
import { Suit } from "./all-fours/src/logic/enums/Suit.js";
import { Rank } from "./all-fours/src/logic/enums/Rank.js";
import { Trick } from "./all-fours/src/logic/Trick.js";

// Create 4 players
const p1 = new Player("Alice");
const p2 = new Player("Bob");
const p3 = new Player("Charlie");
const p4 = new Player("Dana");

const players = [p1, p2, p3, p4];

// Assign cards manually
p1.addCard(new Card(Suit.SPADES, Rank.QUEEN));
p2.addCard(new Card(Suit.SPADES, Rank.THREE));
p3.addCard(new Card(Suit.SPADES, Rank.JACK)); // trump jack
p4.addCard(new Card(Suit.SPADES, Rank.ACE));
p1.addCard(new Card(Suit.DIAMONDS, Rank.TEN));
p2.addCard(new Card(Suit.CLUBS, Rank.SIX));
p3.addCard(new Card(Suit.HEARTS, Rank.KING));
p4.addCard(new Card(Suit.DIAMONDS, Rank.FIVE));

// Set trump suit and leader
const trumpSuit = Suit.SPADES;
const leader = p1; // Alice leads

// Create and play the trick
const trick = new Trick(players, trumpSuit, leader);
const winner = trick.play();

// Results
console.log(`\nTrick result: ${winner.getName()} wins the trick.`);
console.log(`Points earned: ${trick.getPointsEarned()}`);
if (trick.isJackPlayed()) {
  console.log(
    `Jack of trump was played by: ${trick.getJackPlayer().getName()}`
  );
}
