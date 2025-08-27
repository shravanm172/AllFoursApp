// GUIIO.js
// This defines the frontend user interface

export class GUIIO {
  constructor(callbacks = {}) {
    // Callbacks should be functions passed from React components
    this.callbacks = {
      onLogMessage: callbacks.onLogMessage || (() => {}),
      onOverlayMessage: callbacks.onOverlayMessage || (() => {}),
      onPrivateOverlayMessage: callbacks.onPrivateOverlayMessage || (() => {}),
      onKickedCard: callbacks.onKickedCard || (() => {}),
      onClearKickedCards: callbacks.onClearKickedCards || (() => {}),
      onPromptPlayer: callbacks.onPromptPlayer || (() => {}),
      onPromptCard: callbacks.onPromptCard || (() => {}),
      onShowPlayerHands: callbacks.onShowPlayerHands || (() => {}),
      onTrickStateUpdate: callbacks.onTrickStateUpdate || (() => {}),
      onActivePlayerChange: null,
    };

    // Queue for overlay messages to show them with delays
    this.overlayQueue = [];
    this.isProcessingOverlay = false;
    this.overlayDelay = 2000; // 2 seconds between overlay messages
    this.privateMessageDelay = 3000; // 3 seconds for private messages to auto-clear
  }

  /**
   * Show a message in the appropriate UI layer based on context
   * @param {string} message - The message to display
   * @param {string} context - Where to display: "log", "overlay", "both", or private overlay message for a specific player
   */
  showMessage(message, context = "log") {
    if (context === "log" || context === "both") {
      this.callbacks.onLogMessage(message);
    }
    if (context === "overlay" || context === "both") {
      // Add to overlay queue instead of showing immediately
      this.addToOverlayQueue(message);
    }
    if (typeof context === "object" && context.privatePlayerId) {
      this.callbacks.onPrivateOverlayMessage?.(
        message,
        context.privatePlayerId
      );

      // Auto-clear private message after delay
      setTimeout(() => {
        this.callbacks.onPrivateOverlayMessage?.(null, context.privatePlayerId);
      }, this.privateMessageDelay);
    }
  }

  /**
   * Add message to overlay queue and process if not already processing
   * @param {string} message - The message to queue
   */
  addToOverlayQueue(message) {
    this.overlayQueue.push(message);
    if (!this.isProcessingOverlay) {
      this.processOverlayQueue();
    }
  }

  /**
   * Process overlay queue with delays between messages
   */
  async processOverlayQueue() {
    this.isProcessingOverlay = true;

    while (this.overlayQueue.length > 0) {
      const message = this.overlayQueue.shift();
      this.callbacks.onOverlayMessage(message);

      // Wait for the delay before showing the next message
      if (this.overlayQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.overlayDelay));
      }
    }

    this.isProcessingOverlay = false;
  }

  /**
   * Check if overlay queue is empty and not processing
   * @returns {boolean} - True if overlay queue is clear
   */
  isOverlayQueueClear() {
    return this.overlayQueue.length === 0 && !this.isProcessingOverlay;
  }

  /**
   * Wait for overlay queue to clear completely
   * @returns {Promise} - Resolves when overlay queue is empty and not processing
   */
  async waitForOverlayQueueToClear() {
    return new Promise((resolve) => {
      const checkQueue = () => {
        if (this.isOverlayQueueClear()) {
          resolve();
        } else {
          setTimeout(checkQueue, 100); // Check every 100ms
        }
      };
      checkQueue();
    });
  }
  /**
   * Show the kicked card visually by updating UI stack
   * @param {Card} card - The kicked card to display
   */
  showKickedCard(card) {
    this.callbacks.onKickedCard(card); // ✅ Correct usage
  }

  /**
   * Prompt the player for input and return a Promise that resolves with their choice
   * @param {Player} player - The player being prompted
   * @param {string} promptText - The text to display in the prompt
   * @param {Object} buttonOptions - Optional custom button text { yesText: "Custom Yes", noText: "Custom No" }
   * @returns {Promise<string>} - Resolves with the player's choice
   */
  promptPlayer(player, promptText, buttonOptions = null) {
    return new Promise((resolve) => {
      if (this.callbacks.onPromptPlayer) {
        this.callbacks.onPromptPlayer(
          player.getId(),
          promptText,
          resolve,
          buttonOptions
        );
      }
    });
  }

  /**
   * Set the active player, i.e., the player whose turn it is
   * this method is used to update the UI to reflect the current active player
   * @param {*} playerId
   */
  setActivePlayer(playerId) {
    if (this.callbacks?.onActivePlayerChange) {
      this.callbacks.onActivePlayerChange(playerId);
    }
  }

  /**
   * Prompt the player to select a card from their hand
   * @param {Player} player - The player being prompted
   * @param {Array<Card>} hand - The player's hand of cards
   * @returns {Promise<Card>} - Resolves with the selected card
   */
  promptCard(player, hand) {
    return new Promise((resolve) => {
      if (this.callbacks.onPromptCard) {
        this.callbacks.onPromptCard(player.getId(), hand, resolve);
      }
    });
  }

  /**
   * Show the hands of all players
   * @param {*} players - The list of players and their hands
   */
  showPlayerHands(players) {
    this.callbacks.onShowPlayerHands(players);
  }

  /**
   * Show the current trick state (cards played so far)
   * @param {Array} playedCards - Array of played cards with player info
   */
  showTrickState(playedCards) {
    // Serialize the data to plain objects for React state compatibility
    const serializedCards = playedCards.map((cardData) => ({
      player: {
        id: cardData.player?.getId?.() || cardData.player?.id,
        name: cardData.player?.getName?.() || cardData.player?.name,
      },
      card: {
        string:
          cardData.card?.toString?.() ||
          `${cardData.card?.rank} of ${cardData.card?.suit}`,
        suit: cardData.card?.getSuit?.() || cardData.card?.suit,
        rank: cardData.card?.getRank?.() || cardData.card?.rank,
      },
    }));

    console.log("🎯 GUIIO.showTrickState - serialized cards:", serializedCards);
    this.callbacks.onTrickStateUpdate(serializedCards);
  }

  /**
   * Clear the kicked cards display
   */
  clearKickedCards() {
    console.log("🧼 GUIIO.clearKickedCards() called");
    this.callbacks.onClearKickedCards();
  }

  /**
   * Show team scores at end of round
   */
  showScores(teamA, teamB) {
    console.log("📊 GUIIO.showScores() called");
    const scoresMessage = `📊 Round Scores:\n${teamA.name}: ${teamA.gameScore} points\n${teamB.name}: ${teamB.gameScore} points`;
    this.showMessage(scoresMessage, "log");
  }
}
