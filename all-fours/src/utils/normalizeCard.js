import { Card } from "../logic/Card.js";

export function toCard(cardData) {
  if (!cardData) return null;

  // Already a Card-like object
  if (cardData.getSuit && cardData.getRank && typeof cardData.toString === "function") {
    return cardData;
  }

  // Plain object { suit, rank }
  if (cardData.suit && cardData.rank) {
    return new Card(cardData.suit, cardData.rank);
  }

  // Sometimes might receive { toString: "Ace of Spades" }
  if (typeof cardData.toString === "string") {
    const parts = cardData.toString.split(" of ");
    if (parts.length === 2) return new Card(parts[1], parts[0]);
  }

  // Last resort: return as-is 
  return cardData;
}
