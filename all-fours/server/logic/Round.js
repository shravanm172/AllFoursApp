// Round.js
// Converted from Round.java
//
// This class handles a complete round of All Fours:
// 1. Dealing cards to players
// 2. Begging phase (beg/stand, give 1/run pack)
// 3. Playing all tricks (to be implemented later)
// 4. Awarding points for High, Low, Jack, Game
//
// Interactive version with CLI input for user decisions

import { Deck } from "./Deck.js";
import { CardComparator } from "./CardComparator.js";
import { Trick } from "./Trick.js";
// import * as readline from "readline";

export class Round {
  constructor(players, dealer, teamA, teamB, ioHandler) {
    this.io = ioHandler;
    this.players = players;
    this.dealer = dealer;
    this.teamA = teamA;
    this.teamB = teamB;
    this.dealerTeam = this.getTeamOfPlayer(dealer);
    this.trumpSuit = null;
    this.roundAborted = false;
    this.teamRanJack = null;
    this.teamHungJack = null;
    this.isBeggingPhase = true; // Track if we're in begging phase
    this.beggar = null; // Will be set when begging phase starts
  }

  // Main method to play a complete round
  async playRound() {
    this.io.showMessage(
      `Starting new round - ${this.dealer.getName()} is dealing...`,
      "log"
    );

    // Reset round state
    this.teamHungJack = null;
    this.teamRanJack = null;
    this.roundAborted = false;

    // Reset game scores for the new round
    this.teamA.resetGameScore();
    this.teamB.resetGameScore();
      this.io.showScores(this.teamA, this.teamB); // Update scoreboard after resetting game scores

    // Create and shuffle deck
    this.deck = new Deck();
    this.deck.shuffle();

    // Deal 6 cards to each player
    this.io.showMessage(`\n${this.dealer.getName()} deals...`, "log");
    const dealSuccess = this.deck.deal(this.players, 6);
    if (!dealSuccess) {
      this.io.showMessage(
        "Not enough cards to deal. Round aborting...",
        "both"
      );
      this.roundAborted = true;
      return;
    }

    // Kick the trump card
    const kickedCard = this.deck.kick();
    this.trumpSuit = kickedCard.getSuit();
    this.io.showKickedCard(kickedCard);
    // this.io.showMessage(`🎺 Trump suit for this round: ${this.trumpSuit}`);

    // Award points for kicked card (Ace=1, 6=2, Jack=3)
    this.awardKickPoints(kickedCard);

    // Check if game is won after kick points
    if (this.isGameWon()) {
      return;
    }

    // Set the beggar before showing hands (player to right of dealer)
    this.beggar = this.getPlayerToRight(this.dealer);

    // Show all player hands
    console.log("🔍 DEBUG ROUND - About to call showPlayerHands with:", {
      roundExists: !!this,
      isBeggingPhase: this.isBeggingPhase,
      beggar: this.beggar ? this.beggar.getName() : "no beggar",
      dealer: this.dealer ? this.dealer.getName() : "no dealer",
    });
    this.io.showPlayerHands(this.players, this, this.dealer);

    // Start begging phase
    this.io.showMessage("🙏 Begging Phase", "log");

    try {
      const beggingResult = await this.beggingPhase();

      if (beggingResult === "RESTART_ROUND") {
        this.io.showMessage("\n🔄 Pack ran out...", "both");

        this.io.clearKickedCards(); // Clear kicked cards

        // Clear all player hands before restarting
        for (const player of this.players) {
          player.hand = [];
        }

        // Recursively start a new round
        return await this.playRound();
      }

      if (beggingResult === true) {
        this.io.showMessage(
          "🔄 Round will restart due to insufficient cards to run pack.",
          "log"
        );
        this.roundAborted = true;
        return;
      }
    } catch (error) {
      this.io.showMessage(
        `Error during begging phase: ${error.message}`,
        "log"
      );
      return;
    }

    // Show updated hands after begging phase (still in begging phase for visibility)
    this.io.showPlayerHands(this.players, this, this.dealer);

    // Find high and low trump for reference
    const highTrump = this.findHighTrump();
    const lowTrump = this.findLowTrump();
    console.log(
      `\n🔝 High trump: ${highTrump ? highTrump.card.toString() : "None"}`
    );
    console.log(
      `🔻 Low trump: ${lowTrump ? lowTrump.card.toString() : "None"}`
    );

    // Play all tricks
    this.io.showMessage("🎯 Starting trick playing phase...", "log");

    // Begging phase ends when trick play begins
    this.isBeggingPhase = false;

    // Update hands to reflect new visibility rules (teammates can now see each other's cards)
    this.io.showPlayerHands(this.players, this, this.dealer);

    await this.playAllTricks();

    // Allocate end-of-round points
    this.allocateEndOfRoundPoints();

    this.io.showMessage("\n✅ Round completed successfully!", "log");
    return true; // Indicate round completed
  }

  // Begging phase: player to right of dealer can beg or stand
  async beggingPhase() {
    const beggingPlayer = this.getPlayerToRight(this.dealer);
    // Note: this.beggar is already set in playRound() method

    // this.io.showMessage(
    //   `\n${beggingPlayer.getName()}, it's your turn to beg or stand.`,  "log"
    // );
    this.io.showMessage(`Current trump: ${this.trumpSuit}`, "log");

    // Check if begging player has any trump cards
    const beggingPlayerTrumpCount = this.countTrumpCards(beggingPlayer);

    // Always ask for input, but validate the response
    while (true) {
      const begResponse = await this.io.promptPlayer(
        beggingPlayer,
        "do you want to beg?",
        { yesText: "Beg", noText: "Stand" }
      );

      console.log("🙏 Begging response received:", begResponse);
      console.log("🙏 Response type:", typeof begResponse);
      console.log("🙏 Response toLowerCase():", begResponse?.toLowerCase());

      if (begResponse.toLowerCase() === "yes") {
        console.log("🙏 Player chose to beg");
        break; // Player begs - continue to dealer response
      } else if (begResponse.toLowerCase() === "no") {
        console.log("🙏 Player chose to stand");
        // Player wants to stand - check if they have trump
        if (beggingPlayerTrumpCount === 0) {
          console.log("🙏 Player cannot stand - no trump cards");
          this.io.showMessage(
            `${beggingPlayer.getName()} cannot stand with zero trump cards!`,
            { privatePlayerId: beggingPlayer.getId() }
          );
          // this.io.showMessage(`🙏 You must beg when you have no trump.`, "overlay");
          continue; // Ask again
        } else {
          console.log("🙏 Player stands successfully");
          this.io.showMessage(`${beggingPlayer.getName()} stands`, "both");
          return false; // Round continues normally
        }
      } else {
        console.log("🙏 Invalid response:", begResponse);
        this.io.showMessage(`Please enter 'yes' to beg or 'no' to stand.`, {
          privatePlayerId: beggingPlayer.getId(),
        });
        continue; // Ask again
      }
    }

    // Player begged - dealer must respond
    this.io.showMessage(`\n${beggingPlayer.getName()} begs!`, "both");
    const beggingTeam = this.getTeamOfPlayer(beggingPlayer);

    // Check if begging team has 13 points - dealer cannot give 1 chalk if so
    if (beggingTeam.getMatchScore() >= 13) {
      this.io.showMessage(
        `⚠️ ${beggingTeam.getName()} has ${beggingTeam.getMatchScore()} points.`,
        "log"
      );
      this.io.showMessage(
        `🚫 ${this.dealer.getName()} cannot give 1 chalk (would win the game for opponents).`,
        { privatePlayerId: this.dealer.getId() }
      );
      this.io.showMessage(
        `🔄 ${this.dealer.getName()} is forced to run the pack!`,
        "log"
      );
    } else {
      // Check if dealer has any trump cards
      const dealerTrumpCount = this.countTrumpCards(this.dealer);

      // Always ask for dealer input, but validate the response
      while (true) {
        const dealerResponse = await this.io.promptPlayer(
          this.dealer,
          `do you want to give 1 chalk to ${beggingTeam.getName()}?`,
          { yesText: "Give 1", noText: "Run Pack" }
        );

        if (dealerResponse.toLowerCase() === "yes") {
          // Dealer wants to give 1 chalk - check if they have trump
          if (dealerTrumpCount === 0) {
            this.io.showMessage(
              `${this.dealer.getName()} cannot give 1 chalk with zero trump cards!`,
              "both"
            );
            // this.io.showMessage(
            //   `🔄 You must run the pack when you have no trump.`
            // );
            continue; // Ask again
          } else {
            // Dealer gives 1 chalk
            beggingTeam.addChalk(1);
            this.io.showMessage(
              `✅ ${this.dealer.getName()} gives 1 chalk to ${beggingTeam.getName()}.`,
              "both"
            );
            this.io.showMessage(
              `${beggingTeam.getName()} score: ${beggingTeam.getMatchScore()}`,
              "log"
            );

            // Update scoreboard immediately after giving chalk
            this.io.showScores(this.teamA, this.teamB);

            return false; // Round continues
          }
        } else if (dealerResponse.toLowerCase() === "no") {
          break; // Dealer chooses to run pack - continue
        } else {
          this.io.showMessage(
            `Please enter 'yes' to give 1 chalk or 'no' to run the pack.`,
            { privatePlayerId: this.dealer.getId() }
          );
          continue; // Ask again
        }
      }
    }

    // Dealer chooses to run the pack
    this.io.showMessage(
      `\n${this.dealer.getName()} is running the pack...`,
      "both"
    );
    const runPackResult = await this.runPack();

    // Handle the special case where pack runs out and we need to restart
    if (runPackResult === "RESTART_ROUND") {
      return "RESTART_ROUND"; // Signal to main playRound method
    }

    return runPackResult;
  }

  // Run the pack until trump changes or pack runs out
  async runPack() {
    let attempts = 0;
    const maxAttempts = 10; // Safety limit

    while (attempts < maxAttempts) {
      attempts++;
      this.io.showMessage(`\n🔄 Running pack (attempt ${attempts})...`, "log");
      this.io.showMessage(
        `📦 Cards remaining in deck: ${this.deck.cardsRemaining()}`,
        "log"
      );

      // Check if we have at least 1 card to kick
      if (this.deck.cardsRemaining() < 1) {
        this.io.showMessage(`No cards left to kick. Pack has run out!`, "both");
        // this.io.showMessage("🔄 Starting new round with the same dealer.", "both");
        return "RESTART_ROUND";
      }

      // First, deal 3 cards to each player if we have enough
      const cardsNeededToDeal = this.players.length * 3; // 12 cards needed to deal
      if (this.deck.cardsRemaining() >= cardsNeededToDeal + 1) {
        // +1 for kick
        const dealSuccess = this.deck.deal(this.players, 3);
        if (!dealSuccess) {
          this.io.showMessage(
            "Unexpected error: deal() failed despite having enough cards.",
            "log"
          );
          return "RESTART_ROUND";
        }
      } else {
        // We don't have enough cards to deal, but we might have 1 card to kick
        this.io.showMessage(
          `⚠️ Only ${this.deck.cardsRemaining()} card(s) left - cannot deal but will kick first`,
          "log"
        );
      }

      // Always kick a card if one is available (this is the key fix!)
      const kickedCard = this.deck.kick();
      if (!kickedCard) {
        this.io.showMessage(
          `No card available to kick. Pack has run out!`,
          "log"
        );
        return "RESTART_ROUND";
      }

      const newTrump = kickedCard.getSuit();
      this.io.showKickedCard(kickedCard);
      this.io.showMessage(`🎺 New trump suit: ${newTrump}`, "log");

      // Award points for new kicked card
      this.awardKickPoints(kickedCard);

      // Check if game is won after kick points
      if (this.isGameWon()) {
        return true; // End round early
      }

      // Check if trump changed
      if (newTrump !== this.trumpSuit) {
        this.io.showMessage(
          `✅ Trump changed from ${this.trumpSuit} to ${newTrump}!`,
          "log"
        );
        this.trumpSuit = newTrump;
        return false; // Round continues with new trump
      }

      // Same trump - check if we can continue
      this.io.showMessage(`♻️ Same trump suit (${this.trumpSuit}).`, "log");

      // Check if this was the final card
      if (this.deck.cardsRemaining() === 0) {
        this.io.showMessage(
          `Same trump and no more cards available. Pack has run out!`,
          "both"
        );
        this.io.showMessage(
          "🔄 Starting new round with the same dealer.",
          "both"
        );
        return "RESTART_ROUND";
      }

      // Check if we have enough cards for the next pack run (deal + kick)
      const cardsNeededForNextRun = this.players.length * 3 + 1; // 13 cards
      if (this.deck.cardsRemaining() >= cardsNeededForNextRun) {
        this.io.showMessage(
          `🔄 Same trump but enough cards remain. Running pack again...`,
          "both"
        );
      } else {
        // We have some cards left but not enough for a full deal
        // Continue to next iteration which will skip dealing and just kick
        this.io.showMessage(
          `🔄 Same trump but only ${this.deck.cardsRemaining()} card(s) left. Will kick remaining card...`,
          "log"
        );
      }
    }

    this.io.showMessage(
      `Maximum pack running attempts reached. Aborting round.`,
      "log"
    );
    return true; // Abort round
  }

  // Play all tricks in the round
  async playAllTricks() {
    // Precompute high and low trump before any cards are played
    const highResult = this.findHighTrump();
    const lowResult = this.findLowTrump();
    this.highTrumpCard = highResult.card;
    this.highTrumpPlayer = highResult.player;
    this.lowTrumpCard = lowResult.card;
    this.lowTrumpPlayer = lowResult.player;
    // Initialize game points
    this.teamAGamePoints = 0;
    this.teamBGamePoints = 0;
    // Determine number of tricks based on cards in hand
    const cardsPerPlayer = this.players[0].getHand().length;
    const totalTricks = cardsPerPlayer;

    this.io.showMessage(`🃏 Each player has ${cardsPerPlayer} cards`, "log");
    this.io.showMessage(`🎯 Playing ${totalTricks} tricks this round`, "log");

    // First trick is led by player to the right of dealer (counter-clockwise)
    let trickLeader = this.getPlayerToRight(this.dealer);

    // TRICK LOOP: Play each trick
    for (let trickNumber = 1; trickNumber <= totalTricks; trickNumber++) {
      // this.io.showMessage(`\n${"─".repeat(40)}`);
      this.io.showMessage(`🎯 Trick ${trickNumber} of ${totalTricks}`, "log");
      this.io.showMessage(
        `👤 ${trickLeader.getName()} leads this trick`,
        "log"
      );
      // this.io.showMessage(`${"─".repeat(40)}`);

      // Create new trick
      const trick = new Trick(this.players, this.trumpSuit, trickLeader);
      await this.playTrick(trick); // trick modifies itself

      const winner = trick.getWinner(); // You may expose this via getter
      const points = trick.getPointsEarned(); // already exposed

      if (trick.isJackPlayed()) {
        const jackPlayer = trick.getJackPlayer();
        const jackTeam = this.getTeamOfPlayer(jackPlayer);
        const winner = trick.getWinner();
        const winningTeam = this.getTeamOfPlayer(winner);

        if (jackTeam === winningTeam) {
          this.teamRanJack = jackTeam;
          this.io.showMessage(
            `🃏 JACK RUN: ${jackTeam.getName()} won the Jack of ${this.trumpSuit}`,
            "both"
          );
        } else {
          this.teamHungJack = winningTeam;
          this.io.showMessage(
            `🎯 JACK HUNG: ${winningTeam.getName()} hung the Jack of ${this.trumpSuit}`,
            "both"
          );
        }
      }

      const winningTeam = this.getTeamOfPlayer(winner);
      if (winningTeam === this.teamA) {
        this.teamAGamePoints += points;
        this.teamA.addGamePoints(points); // Update team's game score for display
      } else {
        this.teamBGamePoints += points;
        this.teamB.addGamePoints(points); // Update team's game score for display
      }

      // Show trick result
      this.io.showMessage(
        `\n🏆 Trick ${trickNumber} Winner: ${winner.getName()}`,
        "log"
      );
      this.io.showMessage(`💰 Points earned: ${points}`, "log");

      // Update scoreboard to show current game points during the round
      this.io.showScores(this.teamA, this.teamB);

      // Winner of this trick leads the next trick
      trickLeader = winner;

      // Show remaining cards count
      const remainingCards = this.players[0].getHand().length;
      if (remainingCards > 0) {
        this.io.showMessage(
          `🃏 ${remainingCards} cards remaining per player`,
          "log"
        );
      }
    }

    this.io.showMessage(`\n🎯 All ${totalTricks} tricks completed!`, "log");
  }

  // Play a single trick with interactive input
  async playTrick(trick, trickNumber) {
    console.log("🚨🚨🚨 ROUND.JS playTrick IS WORKING! 🚨🚨🚨");
    console.log("🎮 [DEBUG] Entered playTrick()");
    while (!trick.isComplete()) {
      const currentPlayer = trick.getCurrentPlayer();
      // Set active player in GameIO for GUI mode !!!!PROBLEMATIC
      this.io.setActivePlayer?.(currentPlayer.getId?.());
      const hand = currentPlayer.getHand();

      // Show current trick state using GameIO
      console.log(
        "🎯 Round.playTrick - showing trick state:",
        trick.playedCards
      );
      console.log(
        "🎯 Round.playTrick - playedCards length:",
        trick.playedCards?.length || 0
      );
      // Log the detailed structure of each played card
      trick.playedCards.forEach((cardData, index) => {
        console.log(`🎯 Round.playTrick - card ${index}:`, {
          player: cardData.player?.getName?.(),
          card: cardData.card?.toString?.(),
          fullObject: cardData,
        });
      });
      this.io.showTrickState([...trick.playedCards]);

      // Get and attempt to play the card
      const cardIndex = await this.io.promptCard(currentPlayer, hand);

      // if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= hand.length) {
      //   this.io.showMessage(`Invalid choice. Try again.`, { privatePlayerId: currentPlayer.getId() });
      //   continue;
      // }

      const chosenCard = hand[cardIndex];

      try {
        trick.playCard(chosenCard, currentPlayer);
        this.io.showMessage(
          `✅ ${currentPlayer.getName()} plays ${chosenCard.toString()}`,
          "log"
        );

        // 👇 Update trick state immediately after card is played
        console.log(
          "🎯 BEFORE showTrickState - playedCards:",
          trick.playedCards.length,
          trick.playedCards.map(
            (entry) => `${entry.player.getName()}: ${entry.card.toString()}`
          )
        );
        this.io.showTrickState([...trick.playedCards]);
        console.log(
          "🎯 AFTER showTrickState - trick complete?",
          trick.isComplete()
        );

        // 👇 Give UI time to render the card before continuing
        if (this.io.constructor.name === "GUIIO") {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay for UI rendering
        }

        // 👇 Update frontend hands
        this.io.showPlayerHands(this.players, this, this.dealer);
        // 🐛 DEBUG: Show all player hands after play
        console.log("🖐️ Updated hands after play:");
        this.players.forEach((p) => {
          const handStrings = p
            .getHand()
            .map((c) => c.toString())
            .join(", ");
          console.log(`   ${p.getName()}: ${handStrings}`);
        });
      } catch (err) {
        this.io.showMessage(`${err.message}`, {
          privatePlayerId: currentPlayer.getId(),
        });
      }
    }

    // Ensure final trick state is shown after loop exits
    console.log("🎯 Trick completed - showing final state before delay");
    console.log(
      "🎯 Final playedCards:",
      trick.playedCards.length,
      trick.playedCards.map(
        (entry) => `${entry.player.getName()}: ${entry.card.toString()}`
      )
    );
    this.io.showTrickState([...trick.playedCards]);

    // Give UI time to render the final trick state
    if (this.io.constructor.name === "GUIIO") {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Extra delay to ensure final card is rendered
    }

    // Give users time to see the trick result before clearing (only in GUI mode)
    if (this.io.constructor.name === "GUIIO") {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 3 second delay
    }

    this.io.showTrickState([]); //Clear the trick in trick area for next trick

    return {
      trickNumber,
      winner: trick.winner,
      pointsEarned: trick.getPointsEarned(),
      playedCards: [...trick.playedCards],
      jackPlayed: trick.isJackPlayed(),
      jackPlayer: trick.getJackPlayer(),
    };
  }

  // Allocate end-of-round points (High, Low, Jack, Game - each worth 1 point)
  // Note: This is different from kick points which are awarded immediately during begging phase
  allocateEndOfRoundPoints() {
    this.io.showMessage("🏆 End of Round - Point Allocation", "log");

    let gameEnded = false;

    // 1. HIGH: Team with highest trump card played in tricks
    const highResult = this.awardHighPoint();
    if (highResult.awarded) {
      this.io.showMessage(
        `\n🔝 HIGH: ${highResult.team.getName()} wins 1 point for ${highResult.card.toString()}`,
        "both"
      );
      this.io.showMessage(
        `   ${highResult.team.getName()} score: ${highResult.team.getMatchScore()}`,
        "log"
      );

      // Update scoreboard after awarding HIGH point
      this.io.showScores(this.teamA, this.teamB);

      if (this.isGameWon()) {
        gameEnded = true;
        return;
      }
    } else {
      this.io.showMessage(`\n🔝 HIGH: No trump cards played in tricks`, "both");
    }

    // 2. LOW: Team with lowest trump card played in tricks
    if (!gameEnded) {
      const lowResult = this.awardLowPoint();
      if (lowResult.awarded) {
        this.io.showMessage(
          `\n🔻 LOW: ${lowResult.team.getName()} wins 1 point for ${lowResult.card.toString()}`,
          "both"
        );
        this.io.showMessage(
          `   ${lowResult.team.getName()} score: ${lowResult.team.getMatchScore()}`,
          "log"
        );

        // Update scoreboard after awarding LOW point
        this.io.showScores(this.teamA, this.teamB);

        if (this.isGameWon()) {
          gameEnded = true;
          return;
        }
      } else {
        this.io.showMessage(
          `\n🔻 LOW: No trump cards played in tricks`,
          "both"
        );
      }
    }

    // 3. JACK: Team that won the trick containing Jack of trump (if played)
    if (!gameEnded) {
      const jackResult = this.awardJackPoint();
      if (jackResult.awarded) {
        this.io.showMessage(
          `\n🃏 JACK: ${jackResult.team.getName()} wins 1 point for Jack of ${this.trumpSuit}`,
          "both"
        );
        this.io.showMessage(
          `   ${jackResult.team.getName()} score: ${jackResult.team.getMatchScore()}`,
          "log"
        );

        // Update scoreboard after awarding JACK point
        this.io.showScores(this.teamA, this.teamB);

        if (this.isGameWon()) {
          gameEnded = true;
          return;
        }
      } else {
        console.log(`\n� JACK: Jack of ${this.trumpSuit} was not played`);
      }
    }

    // 4. GAME: Team with most game points from tricks (Ace=4, King=3, Queen=2, Jack=1, 10=10)
    // Tiebreaker: Non-dealer team wins if tied
    if (!gameEnded) {
      const gameResult = this.awardGamePoint();
      if (gameResult.awarded) {
        const reason = gameResult.tied
          ? " (won tiebreaker as non-dealer team)"
          : "";
        this.io.showMessage(
          `\n🎯 GAME: ${gameResult.team.getName()} wins 2 points (${gameResult.points} game points${reason})`,
          "both"
        );
        this.io.showMessage(
          `   Game point totals: ${this.teamA.getName()}=${gameResult.teamAPoints}, ${this.teamB.getName()}=${gameResult.teamBPoints}`,
          "log"
        );
        this.io.showMessage(
          `   ${gameResult.team.getName()} score: ${gameResult.team.getMatchScore()}`,
          "log"
        );

        // Update scoreboard after awarding GAME points
        this.io.showScores(this.teamA, this.teamB);

        if (this.isGameWon()) {
          gameEnded = true;
          return;
        }
      } else {
        this.io.showMessage(
          `\n🎯 GAME: No game points earned (no Ace/King/Queen/Jack/10 played)`,
          "both"
        );
      }
    }

    // Display final scores if game hasn't ended
    if (!gameEnded) {
      this.io.showScores(this.teamA, this.teamB);
    }
  }

  // Award kick points immediately during begging phase (Ace=1, 6=2, Jack=3)
  // Note: These are different from end-of-round points (High, Low, Jack, Game) which are each worth 1 point
  awardKickPoints(kickedCard) {
    const rank = kickedCard.getRank();
    let chalkPoints = 0;

    switch (rank) {
      case "Ace":
        chalkPoints = 1;
        break;
      case "6":
        chalkPoints = 2;
        break;
      case "Jack":
        chalkPoints = 3;
        break;
      default:
        chalkPoints = 0;
    }

    if (chalkPoints > 0) {
      this.dealerTeam.addChalk(chalkPoints);
      this.io.showMessage(
        `🎯 ${this.dealerTeam.getName()} earned ${chalkPoints} KICK POINT(S) from kicking ${kickedCard.toString()}`,
        "both"
      );
      this.io.showMessage(
        `   ${this.dealerTeam.getName()} score: ${this.dealerTeam.getMatchScore()}`,
        "log"
      );

      // Update scoreboard immediately after awarding kick points
      this.io.showScores(this.teamA, this.teamB);

      // Emphasize if this could win the game
      if (this.dealerTeam.getMatchScore() >= 14) {
        this.io.showMessage(
          `   🏆 ${this.dealer.getName()} kicks out the game!`,
          "both"
        );
      }
    }
  }

  // Award HIGH point: Team with highest trump card played in tricks
  awardHighPoint() {
    const card = this.highTrumpCard;
    const player = this.highTrumpPlayer;
    if (card && player) {
      const team = this.getTeamOfPlayer(player);
      team.addChalk(1);
      return { awarded: true, team, player, card };
    }
    return { awarded: false };
  }

  // Award LOW point: Team with lowest trump card played in tricks
  awardLowPoint() {
    const card = this.lowTrumpCard;
    const player = this.lowTrumpPlayer;
    if (card && player) {
      const team = this.getTeamOfPlayer(player);
      team.addChalk(1);
      return { awarded: true, team, player, card };
    }
    return { awarded: false };
  }

  // Award JACK point: Team that won the trick containing Jack of trump
  awardJackPoint() {
    if (this.teamHungJack) {
      this.teamHungJack.addChalk(3);
      return { awarded: true, team: this.teamHungJack };
    }

    if (this.teamRanJack) {
      this.teamRanJack.addChalk(1);
      return { awarded: true, team: this.teamRanJack };
    }

    return { awarded: false };
  }

  // Award GAME point: Team with most game points from tricks
  // Game points: Ace=4, King=3, Queen=2, Jack=1, 10=10
  // Tiebreaker: Non-dealer team wins if tied
  awardGamePoint() {
    let winningTeam = null;
    let tied = false;
    if (this.teamAGamePoints > this.teamBGamePoints) {
      winningTeam = this.teamA;
    } else if (this.teamBGamePoints > this.teamAGamePoints) {
      winningTeam = this.teamB;
    } else if (this.teamAGamePoints > 0) {
      // Tie: Non-dealer wins if tied and both > 0
      winningTeam = this.dealerTeam === this.teamA ? this.teamB : this.teamA;
      tied = true;
    }

    if (winningTeam) {
      winningTeam.addChalk(2);
      return {
        awarded: true,
        team: winningTeam,
        points:
          winningTeam === this.teamA
            ? this.teamAGamePoints
            : this.teamBGamePoints,
        teamAPoints: this.teamAGamePoints,
        teamBPoints: this.teamBGamePoints,
        tied: tied,
      };
    }

    return { awarded: false };
  }

  // Helper method to count trump cards in a player's hand
  countTrumpCards(player) {
    let count = 0;
    for (const card of player.getHand()) {
      if (card.getSuit() === this.trumpSuit) {
        count++;
      }
    }
    return count;
  }

  // Get player to the right of given player (counter-clockwise)
  getPlayerToRight(player) {
    const index = this.players.indexOf(player);
    const rightIndex = (index - 1 + this.players.length) % this.players.length;
    return this.players[rightIndex];
  }

  // Determine which team a player belongs to
  getTeamOfPlayer(player) {
    if (
      player === this.teamA.getPlayer1() ||
      player === this.teamA.getPlayer2()
    ) {
      return this.teamA;
    }
    return this.teamB;
  }

  // Check if either team has won the game (14+ points)
  isGameWon() {
    if (this.teamA.getMatchScore() >= 14) {
      this.io.showMessage(
        `🏆 ${this.teamA.getName()} wins the game with ${this.teamA.getMatchScore()} points!`,
        "both"
      );
      return true;
    }
    if (this.teamB.getMatchScore() >= 14) {
      this.io.showMessage(
        `🏆 ${this.teamB.getName()} wins the game with ${this.teamB.getMatchScore()} points!`,
        "both"
      );
      return true;
    }
    return false;
  }

  // Find highest trump card in all players' hands
  findHighTrump() {
    let highest = null;
    let owner = null;
    for (const player of this.players) {
      for (const card of player.getHand()) {
        if (card.getSuit() === this.trumpSuit) {
          if (highest === null || CardComparator.compare(card, highest) > 0) {
            highest = card;
            owner = player;
          }
        }
      }
    }
    return { card: highest, player: owner };
  }

  // Find lowest trump card in all players' hands
  findLowTrump() {
    let lowest = null;
    let owner = null;
    for (const player of this.players) {
      for (const card of player.getHand()) {
        if (card.getSuit() === this.trumpSuit) {
          if (lowest === null || CardComparator.compare(card, lowest) < 0) {
            lowest = card;
            owner = player;
          }
        }
      }
    }
    return { card: lowest, player: owner };
  }

  // Getters
  getTrumpSuit() {
    return this.trumpSuit;
  }

  wasRoundAborted() {
    return this.roundAborted;
  }
}

export default Round;
