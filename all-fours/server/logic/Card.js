// Card.js
// Converted from Card.java
//
// Attributes:
// - Card's suit: Hearts, Diamonds, Clubs, Spades
// - Card's rank: 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen, King, Ace
//
// Methods:
// - Constructor: Card(suit, rank)
// - getSuit(): Returns the card's suit
// - getRank(): Returns the card's rank
// - toString(): Returns a string representation of the card
// - equals(obj): Compares two cards for equality
// - hashCode(): Returns the hash code for the card

export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }

  getSuit() {
    return this.suit;
  }

  getRank() {
    return this.rank;
  }

  toString() {
    return `${this.rank} of ${this.suit}`;
  }

  equals(other) {
    if (this === other) return true;
    if (!other || this.constructor !== other.constructor) return false;
    return this.rank === other.rank && this.suit === other.suit;
  }
}

export default Card;
