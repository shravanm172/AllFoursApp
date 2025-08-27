// Deck.js
// Converted from Deck.java

import { Card } from "./Card.js";

export class Deck {
  constructor() {
    this.cards = []; // Using array instead of LinkedList
    const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    const ranks = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "Jack",
      "Queen",
      "King",
      "Ace",
    ];

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push(new Card(suit, rank));
      }
    }
  }

  // Shuffles the deck
  shuffle() {
    // Fisher-Yates shuffle algorithm (equivalent to Collections.shuffle)
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  // Deals n cards to each player, returns false if pack has run out
  deal(players, n) {
    if (n * players.length > this.cards.length) {
      return false;
    }

    for (const player of players) {
      for (let i = 0; i < n; i++) {
        player.addCard(this.cards.shift()); // shift() removes from beginning like removeFirst()
      }
      player.sortHand(); // Sort hand after dealing
    }
    return true;
  }

  // Kicks the top card from the deck
  kick() {
    if (this.cards.length === 0) return null;
    return this.cards.shift(); // removes and returns first card
  }

  // Returns the number of cards remaining in the deck
  cardsRemaining() {
    return this.cards.length;
  }
}
