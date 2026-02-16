// src/utils/getCardComponent.js
// Just a UI rendering utility
import * as Cards from "@letele/playing-cards";

export function getCardComponent(suit, rank) {
  if (!suit || !rank) return null;

  const suitMap = {
    Hearts: "H",
    Diamonds: "D",
    Clubs: "C",
    Spades: "S",
  };

  const rankMap = {
    Ace: "a",
    Jack: "j",
    Queen: "q",
    King: "k",
    // for 2–10, keep as-is
  };

  const suitLetter = suitMap[suit];
  const rankLetter = rankMap[rank] || rank;

  const componentKey = `${suitLetter}${rankLetter}`; // e.g. H2, Dj, Sk
  return Cards[componentKey] || null;
}
