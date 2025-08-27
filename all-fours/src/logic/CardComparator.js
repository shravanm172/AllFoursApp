// CardComparator.js

export class CardComparator {
  static rankOrder = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    Jack: 11,
    Queen: 12,
    King: 13,
    Ace: 14,
  };

  static compare(c1, c2) {
    const r1 = CardComparator.rankOrder[c1.getRank()];
    const r2 = CardComparator.rankOrder[c2.getRank()];
    return r1 - r2;
  }

  // 🔥 New method: card1 beats card2?
  static isWinningCard(card1, card2, trumpSuit, leadSuit) {
    const c1Trump = card1.getSuit() === trumpSuit;
    const c2Trump = card2.getSuit() === trumpSuit;

    if (c1Trump && !c2Trump) return true;
    if (!c1Trump && c2Trump) return false;

    if (!c1Trump && !c2Trump) {
      const c1Lead = card1.getSuit() === leadSuit;
      const c2Lead = card2.getSuit() === leadSuit;

      if (c1Lead && !c2Lead) return true;
      if (!c1Lead && c2Lead) return false;
    }

    // Both same suit or both trump/lead → compare rank
    return CardComparator.compare(card1, card2) > 0;
  }
}
