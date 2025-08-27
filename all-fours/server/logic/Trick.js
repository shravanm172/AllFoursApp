// Trick.js
// Converted from Trick.java
//
// Attributes:
// - players: List of all players in the game
// - trumpSuit: The trump suit for this round
// - leader: The player who leads this trick
// - playedCards: Cards played in this trick
// - winner: Player who wins the trick
// - pointsEarned: Game points earned from this trick
// - jackPlayed: Whether Jack of trump was played
// - jackPlayer: Player who played Jack of trump
//
// Methods:
// - Constructor: Trick(players, trumpSuit, leader)
// - playCard(card, player): Adds a card to the trick (for interactive gameplay)
// - getCurrentPlayer(): Returns the next player who should play
// - isComplete(): Returns true if all 4 cards have been played
// - determineWinner(): Calculates and returns the winner after all cards played
// - canPlayCard(card, player): Validates if a card can be legally played
// - getPlayersInOrderStartingFrom(startPlayer): Returns players in order starting from specified player
// - isBetterCard(c1, c2, leadSuit): Determines if c1 is better than c2 based on trump/lead suit rules
// - calculateTrickPoints(): Calculates the points won in the trick
// - getPointsEarned(): Returns the number of points won in the trick
// - isJackPlayed(): Returns whether Jack of trump was played
// - getJackPlayer(): Returns the player who played Jack of trump
// - getLeadSuit(): Returns the suit of the first card played
// - reset(): Resets the trick for a new round

import { CardComparator } from "./CardComparator.js";

export class Trick {
  constructor(players, trumpSuit, leader) {
    this.players = players;
    this.trumpSuit = trumpSuit;
    this.leader = leader;
    this.playedCards = [];
    this.playerOrder = this.getPlayersInOrderStartingFrom(leader);
    this.currentPlayerIndex = 0;
    this.winner = null;
    this.pointsEarned = 0;
    this.jackPlayed = false;
    this.jackPlayer = null;
  }

  /*
   * Interactive method for frontend gameplay
   * Adds a card to the trick when a player makes their move
   */
  playCard(card, player) {
    // Validate it's the correct player's turn
    if (this.getCurrentPlayer() !== player) {
      throw new Error(`It's not ${player.getName()}'s turn to play`);
    }

    // Use Player class validation logic
    const leadSuit = this.getLeadSuit();
    const playedCardsArray = this.playedCards.map((entry) => entry.card);
    const validation = player.isValidPlay(
      card,
      leadSuit,
      this.trumpSuit,
      playedCardsArray
    );

    // Handle both boolean (first card) and object return types
    const isValid = validation === true || (validation && validation.valid);
    const errorReason =
      validation === true
        ? null
        : validation
          ? validation.reason
          : "Invalid play";

    if (!isValid) {
      throw new Error(errorReason || "Invalid play");
    }

    // Remove card from player's hand
    const cardIndex = player.hand.findIndex((c) => c.equals(card));
    if (cardIndex === -1) {
      throw new Error(`${player.getName()} doesn't have ${card.toString()}`);
    }
    player.hand.splice(cardIndex, 1);

    // Add card to played cards
    this.playedCards.push({ card, player });

    // Check if Jack of trump is played
    if (card.getRank() === "Jack" && card.getSuit() === this.trumpSuit) {
      this.jackPlayed = true;
      this.jackPlayer = player;
    }

    // Move to next player
    this.currentPlayerIndex++;

    // If trick is complete, determine winner
    if (this.isComplete()) {
      this.determineWinner();
    }

    return {
      card,
      player,
      isComplete: this.isComplete(),
      winner: this.winner,
      pointsEarned: this.pointsEarned,
    };
  }

  /*
   * Returns the player whose turn it is to play
   */
  getCurrentPlayer() {
    if (this.isComplete()) return null;
    return this.playerOrder[this.currentPlayerIndex];
  }

  /*
   * Returns true if all 4 cards have been played
   */
  isComplete() {
    return this.playedCards.length === this.players.length;
  }

  /*
   * Returns the player who leads this trick
   */
  getLeader() {
    return this.leader;
  }

  /*   * Returns the cards played in this trick
   */
  getPlayedCards() {
    return this.playedCards;
  }

  /*
   * Determines the winner after all cards have been played
   */
  determineWinner() {
    if (!this.isComplete()) return null;

    const leadSuit = this.playedCards[0].card.getSuit();
    let highestCard = this.playedCards[0].card;
    let winnerEntry = this.playedCards[0];

    for (let i = 1; i < this.playedCards.length; i++) {
      const entry = this.playedCards[i];
      if (
        CardComparator.isWinningCard(
          entry.card,
          highestCard,
          this.trumpSuit,
          leadSuit
        )
      ) {
        highestCard = entry.card;
        winnerEntry = entry;
      }
    }

    this.winner = winnerEntry.player;
    this.pointsEarned = this.calculateTrickPoints();
    return this.winner;
  }

  /*
   * Validates if a card can be legally played by a player
   * Uses Player class validation logic for comprehensive rule checking
   */
  canPlayCard(card, player) {
    const leadSuit = this.getLeadSuit();
    const playedCardsArray = this.playedCards.map((entry) => entry.card);
    const validation = player.isValidPlay(
      card,
      leadSuit,
      this.trumpSuit,
      playedCardsArray
    );

    // Handle both boolean (first card) and object return types
    return validation === true || (validation && validation.valid);
  }

  /*
   * Returns the suit of the first card played (lead suit)
   */
  getLeadSuit() {
    return this.playedCards.length > 0
      ? this.playedCards[0].card.getSuit()
      : null;
  }

  /*
   * Resets the trick for a new round
   */
  reset(newLeader = null) {
    if (newLeader) {
      this.leader = newLeader;
      this.playerOrder = this.getPlayersInOrderStartingFrom(newLeader);
    }
    this.playedCards = [];
    this.currentPlayerIndex = 0;
    this.winner = null;
    this.pointsEarned = 0;
    this.jackPlayed = false;
    this.jackPlayer = null;
  }

  getPlayersInOrderStartingFrom(startPlayer) {
    const ordered = [];
    const startIndex = this.players.indexOf(startPlayer);

    for (let i = 0; i < this.players.length; i++) {
      ordered.push(
        this.players[
          (startIndex - i + this.players.length) % this.players.length // Counter-clockwise (to the right)
        ]
      );
    }

    return ordered;
  }

  /*
   * Determines if the card played is better than the current winning card
   *
   * @param c1 The card played
   * @param c2 The current winning card
   * @param leadSuit The suit of the card called in the trick
   * @return true if c1 is better than c2, false otherwise
   */
  // isBetterCard(c1, c2, leadSuit) {
  //   const c1Trump = c1.getSuit() === this.trumpSuit;
  //   const c2Trump = c2.getSuit() === this.trumpSuit;

  //   if (c1Trump && !c2Trump) return true; // If c1 is trump and c2 is not, c1 wins
  //   if (!c1Trump && c2Trump) return false; // If c2 is trump and c1 is not, c2 wins

  //   if (!c1Trump && !c2Trump) {
  //     const c1Lead = c1.getSuit() === leadSuit;
  //     const c2Lead = c2.getSuit() === leadSuit;

  //     if (c1Lead && !c2Lead) return true;
  //     if (!c1Lead && c2Lead) return false;
  //   }

  //   return CardComparator.compare(c1, c2) > 0;
  // }

  // Calculates the points won in the trick
  calculateTrickPoints() {
    let total = 0;

    for (const entry of this.playedCards) {
      const card = entry.card || entry; // Handle both {card, player} and direct card formats
      switch (card.getRank()) {
        case "Ace":
          total += 4;
          break;
        case "King":
          total += 3;
          break;
        case "Queen":
          total += 2;
          break;
        case "Jack":
          total += 1;
          break;
        case "10":
          total += 10;
          break;
        default:
          break;
      }
    }

    return total;
  }

  // Getter for the number of points won in the trick
  getPointsEarned() {
    return this.pointsEarned;
  }

  // Getter for whether Jack of trump was played
  isJackPlayed() {
    return this.jackPlayed;
  }

  // Getter for the player who played the Jack of trump
  getJackPlayer() {
    return this.jackPlayer;
  }

  // Getter for the lead suit of the trick
  getWinner() {
    return this.winner;
  }
}

export default Trick;
