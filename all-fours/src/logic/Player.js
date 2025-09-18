// Player.js
// Converted from Player.java

import { CardComparator } from "./CardComparator.js";
// import readline from "readline";

/*
 * Attributes:
 * - Player's name
 * - Player's hand
 *
 * Methods:
 * - addCard(Card card): Adds a card to the player's hand
 * - getHand(): Returns the player's hand
 * - getName(): Returns the player's name
 * - showHand(): Displays the player's hand
 * - chooseCardToPlay(String leadSuit, String trumpSuit, Array playedCards): prompts the player to choose a card to play
 * - playCard(Card card): Removes and returns a specific card from hand (for React integration)
 */

export class Player {
  constructor(name, id) {
    this.name = name;
    this.hand = []; // Using array instead of LinkedList
    this.id = id;
  }

  addCard(card) {
    this.hand.push(card);
  }

  getHand() {
    return this.hand;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  showHand() {
    this.sortHand();
    console.log(`${this.name}'s hand:`);
    for (const card of this.hand) {
      console.log(`  ${card.toString()}`);
    }
  }

  // For React integration - removes a specific card from hand
  playCard(card) {
    const index = this.hand.findIndex((c) => c.equals(card));

    if (index !== -1) {
      return this.hand.splice(index, 1)[0]; // remove and return card
    }
    return null;
  }

  // Removes a specific card from hand
  removeCard(card) {
    const index = this.hand.findIndex((c) => c.equals(card));
    if (index !== -1) {
      return this.hand.splice(index, 1)[0];
    }
    return null;
  }

  /*
   * @param leadSuit The suit of the card called in the trick
   * @param trumpSuit The trump suit for the round
   * @param playedCards The cards already played in the trick
   * @param testMode If true, automatically selects a valid card for testing
   * @return The card chosen by the player
   *
   * Prompts the player to choose a card to play from their hand.
   * The card must follow the suit called, unless it is trump
   * However, the player cannot undertrump unless they are down to trump
   *
   * NOTE: This method is for CLI/console gameplay. For React integration,
   * the validation logic should be extracted to a separate method.
   */
  // async chooseCardToPlayCLI(leadSuit, trumpSuit, playedCards) {
  //   this.sortHand();
  //   console.log(`\n${this.name}, your hand:`);
  //   this.hand.forEach((card, i) => {
  //     console.log(`${i + 1}. ${card.toString()}`);
  //   });

  //   const rl = readline.createInterface({
  //     input: process.stdin,
  //     output: process.stdout,
  //   });

  //   const ask = (query) =>
  //     new Promise((resolve) => rl.question(query, resolve));

  //   while (true) {
  //     const input = await ask(
  //       `Select a card to play (1-${this.hand.length}): `
  //     );
  //     const choice = parseInt(input);

  //     if (isNaN(choice) || choice < 1 || choice > this.hand.length) {
  //       console.log("Invalid choice. Try again.");
  //       continue;
  //     }

  //     const selected = this.hand[choice - 1];
  //     const result = this.isValidPlay(
  //       selected,
  //       leadSuit,
  //       trumpSuit,
  //       playedCards
  //     );

  //     if (!result.valid) {
  //       console.log(`${result.reason} Try again.`);
  //       continue;
  //     }

  //     rl.close();
  //     this.removeCard(selected);
  //     return selected;
  //   }
  // }

  async chooseCardToPlay(leadSuit, trumpSuit, playedCards, io) {
    const hand = this.getHand();
    while (true) {
      const cardIndex = await io.promptCard(this, hand);
      const selected = hand[cardIndex];
      const result = this.isValidPlay(
        selected,
        leadSuit,
        trumpSuit,
        playedCards
      );

      if (result.valid) {
        this.removeCard(selected);
        return selected;
      }

      io.showMessage(result.reason, { privatePlayerId: this.getId() });
    }
  }

  // Validation method for React - checks if a card play is legal
  isValidPlay(card, leadSuit, trumpSuit, playedCards) {
    if (leadSuit === null) return true; // First card of trick is always valid

    const hasLeadSuit = this.hand.some((c) => c.getSuit() === leadSuit);
    const isTrump = card.getSuit() === trumpSuit;

    // Must follow suit if possible
    if (card.getSuit() !== leadSuit && hasLeadSuit && !isTrump) {
      return { valid: false, reason: "You must follow suit if you have it." };
    }

    // ⭐ Undertrump check
    if (leadSuit !== trumpSuit) {
      const trumpAlreadyPlayed = playedCards.some(
        (c) => c.getSuit() === trumpSuit
      );
      const playerPlaysTrump = card.getSuit() === trumpSuit;

      if (trumpAlreadyPlayed && playerPlaysTrump) {
        const highestTrump = playedCards
          .filter((c) => c.getSuit() === trumpSuit)
          .reduce(
            (max, c) => (!max || CardComparator.compare(c, max) > 0 ? c : max),
            null
          );

        const playerUndertrumps =
          CardComparator.compare(card, highestTrump) < 0;
        const hasNonTrump = this.hand.some((c) => c.getSuit() !== trumpSuit);

        if (playerUndertrumps && hasNonTrump) {
          return {
            valid: false,
            reason: "You cannot undertrump if you have other suits.",
          };
        }
      }
    }

    return { valid: true, reason: null };
  }

  sortHand() {
    this.hand.sort((c1, c2) => {
      const suitCompare = c1.getSuit().localeCompare(c2.getSuit());
      if (suitCompare !== 0) return suitCompare;
      return CardComparator.compare(c1, c2);
    });
  }
}
