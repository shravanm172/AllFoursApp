// testPlayer.js

import { Player } from './Player.js';
import { Card } from './Card.js';
import { Suit } from './enums/Suit.js';
import { Rank } from './enums/Rank.js';

const player = new Player("Shravan");

// Simulated hand
player.addCard(new Card(Suit.HEARTS, Rank.TEN));
player.addCard(new Card(Suit.HEARTS, Rank.ACE));
player.addCard(new Card(Suit.CLUBS, Rank.TWO));
player.addCard(new Card(Suit.SPADES, Rank.JACK));
player.addCard(new Card(Suit.SPADES, Rank.KING));
player.addCard(new Card(Suit.DIAMONDS, Rank.QUEEN));

// Cards already played in the trick
const playedCards = [
  new Card(Suit.HEARTS, Rank.THREE), // lead
  new Card(Suit.SPADES, Rank.SIX),
  new Card(Suit.DIAMONDS, Rank.FIVE)
];

const leadSuit = Suit.HEARTS;
const trumpSuit = Suit.SPADES;

const played = player.chooseCardToPlay(leadSuit, trumpSuit, playedCards);
console.log(`\n${player.getName()} played: ${played.toString()}`);
