// WebSocketGUIIO.js
// WebSocket version of GUIIO for server-side game management

export class GUIIO {
  constructor(players = []) {
    // players is an array of { ws, playerId, playerName }
    this.players = players;
    this.overlayQueue = [];
    this.isProcessingOverlay = false;
    this.overlayDelay = 2000;
    this.matchId = null;
    this.isMatchActive = () => true; // injected from server if you want
  }


  withMatch(payload) {
    return { ...(payload || {}), matchId: this.matchId };
  }


  /**
   * Update the player order to match the GameController's arranged order
   * Ensures trick card positioning works correctly
   */
  updatePlayerOrder(gameControllerPlayers) {
    console.log("🔄 UPDATING GUIIO player order to match GameController");
    console.log(
      "🔄 Old GUIIO order:",
      this.players.map((p) => `${p.playerName} (${p.playerId})`)
    );

    // Rearrange GUIIO players to match GameController player order
    const newPlayerOrder = [];
    gameControllerPlayers.forEach((gamePlayer) => {
      const wsPlayer = this.players.find(
        (p) => p.playerId === gamePlayer.getId()
      );
      if (wsPlayer) {
        newPlayerOrder.push(wsPlayer);
      } else {
        console.error(
          `⚠️ Could not find WS player for game player ${gamePlayer.getName()}`
        );
      }
    });

    this.players = newPlayerOrder;
    console.log(
      "🔄 New GUIIO order:",
      this.players.map((p) => `${p.playerName} (${p.playerId})`)
    );
  }

  /**
   * Broadcast message to all players in the room
   */
  broadcastToAll(type, payload) {
  if (!this.isMatchActive()) return;
  const finalPayload = this.withMatch(payload);

  this.players.forEach((player) => {
    if (player.ws.readyState === 1) {
      try {
        player.ws.send(JSON.stringify({ type, payload: finalPayload }));
      } catch (error) {
        console.error(`❌ Failed to send to player ${player.playerName}:`, error);
      }
    }
  });
}

  /**
   * Send message to a specific player
   */
  sendToPlayer(playerId, type, payload) {
    if (!this.isMatchActive()) return;
    const finalPayload = this.withMatch(payload);

    const player = this.players.find((p) => p.playerId === playerId);
    if (player && player.ws.readyState === 1) {
      try {
        console.log("📤 sendToPlayer:", { to: playerId, type, payload: finalPayload });
        player.ws.send(JSON.stringify({ type, payload: finalPayload }));
      } catch (error) {
        console.error(`❌ Failed to send to player ${playerId}:`, error);
      }
    }
  }


  /**
   * Show a message in the appropriate context
   */
  showMessage(message, context = "log") {
    const formatted = this.formatTeamNames(message);

    console.log(`📝 Game message (${context}): ${formatted}`);

    if (context === "log" || context === "both") {
      this.broadcastToAll("logMessage", { message: formatted });
    }

    if (context === "overlay" || context === "both") {
      this.addToOverlayQueue(formatted);
    }

    if (typeof context === "object" && context.privatePlayerId) {
      this.sendToPlayer(context.privatePlayerId, "privateMessage", {
        message: formatted,
        duration: 3000,
      });
    }
  }

  /**
   * Add message to overlay queue and process
   */
  addToOverlayQueue(message) {
    this.overlayQueue.push(message);
    if (!this.isProcessingOverlay) {
      this.processOverlayQueue();
    }
  }

  /**
   * Process overlay queue with delays
   */
  async processOverlayQueue() {
    this.isProcessingOverlay = true;

    while (this.overlayQueue.length > 0) {
      if (!this.isMatchActive()) {          // ✅ stop immediately if match ended
        this.overlayQueue = [];
        break;
      }
      const message = this.overlayQueue.shift();
      this.broadcastToAll("overlayMessage", { message });
      await new Promise((resolve) => setTimeout(resolve, this.overlayDelay));
    }

    this.isProcessingOverlay = false;
  }

  /**
   * Show kicked card to all players
   */
  showKickedCard(card) {
    console.log(`🃏 Showing kicked card: ${card.toString()}`);
    this.broadcastToAll("kickedCard", {
      card: {
        suit: card.getSuit(),
        rank: card.getRank(),
        toString: card.toString(),
      },
    });
  }

  /**
   * Clear kicked cards display
   */
  clearKickedCards() {
    console.log("🧼 Clearing kicked cards");
    this.broadcastToAll("clearKickedCards", {});
  }

  /**
   * Prompt a specific player for input
   */
  promptPlayer(player, promptText, buttonOptions = null) {
    return new Promise((resolve) => {
      console.log(`🤔 Prompting player ${player.getName()}: ${promptText}`);

      const playerId = player.getId();

      // Store the resolve function for this prompt
      this.pendingPrompts = this.pendingPrompts || {};
      this.pendingPrompts[playerId] = resolve;

      // Send prompt to specific player
      this.sendToPlayer(playerId, "playerPrompt", {
        promptText,
        buttonOptions,
        playerId,
      });
    });
  }

  /**
   * Handle player response (called from server.js)
   */
  handlePlayerResponse(playerId, response) {
    if (this.pendingPrompts && this.pendingPrompts[playerId]) {
      const resolve = this.pendingPrompts[playerId];
      delete this.pendingPrompts[playerId];
      resolve(response);
    }
  }

  /**
   * Prompt player to select a card
   */
  promptCard(player, hand) {
    return new Promise((resolve) => {
      console.log(`🃏 Prompting ${player.getName()} to select a card`);

      const playerId = player.getId();

      // Store the resolve function
      this.pendingCardPrompts = this.pendingCardPrompts || {};
      this.pendingCardPrompts[playerId] = resolve;

      // Send card prompt to player
      this.sendToPlayer(playerId, "cardPrompt", {
        hand: hand.map((card) => ({
          suit: card.getSuit(),
          rank: card.getRank(),
          toString: card.toString(),
        })),
        playerId,
      });
    });
  }

  /**
   * Handle card selection (called from server.js)
   */
  handleCardSelection(playerId, cardIndex) {
    if (this.pendingCardPrompts && this.pendingCardPrompts[playerId]) {
      const resolve = this.pendingCardPrompts[playerId];
      delete this.pendingCardPrompts[playerId];
      resolve(cardIndex);
    }
  }

  /**
   * Set active player
   */
  setActivePlayer(playerId) {
    console.log(`👆 Setting active player: ${playerId}`);
    this.broadcastToAll("activePlayerChange", { playerId });
  }

  /**
   * Show player hands to all players
   */
  showPlayerHands(players, currentRound = null, currentDealer = null) {
    // Send each player their own hand and visiblty info about others
    this.players.forEach((clientPlayer) => {
      // Rotate the player array so this client is always at index 0 (bottom)
      const rotatedPlayers = this.rotatePlayersForClient(
        players,
        clientPlayer.playerId
      );

      const gameData = {
        players: rotatedPlayers.map((gamePlayer) => {
          // Send all players' cards to all clients
          // Let the client decide what to show based on visibility rules
          const playerData = {
            id: gamePlayer.getId(),
            name: gamePlayer.getName(),
            handSize: gamePlayer.getHand().length,
            hand: gamePlayer.getHand().map((card) => ({
              suit: card.getSuit(),
              rank: card.getRank(),
              toString: card.toString(),
            })),
          };

          // Debug: Log what we're sending for each player
          console.log(
            `🔍 DEBUGGING what the GUIIO sending for ${gamePlayer.getName()} to ${clientPlayer.playerName}:`,
            {
              id: playerData.id,
              name: playerData.name,
              handSize: playerData.handSize,
              actualCardsCount: playerData.hand.length,
              sampleCards: playerData.hand.slice(0, 2).map((c) => c.toString),
            }
          );

          return playerData;
        }),
        // Add round information for client-side visibility logic
        currentDealer: currentDealer ? currentDealer.getName() : null,
        isBeggingPhase: currentRound ? currentRound.isBeggingPhase : false,
        beggarId:
          currentRound && currentRound.beggar
            ? currentRound.beggar.getId()
            : null,
      };

      console.log(
        `🔍 SERVER - Sending game data to ${clientPlayer.playerName}:`,
        {
          currentDealer: gameData.currentDealer,
          isBeggingPhase: gameData.isBeggingPhase,
          beggarId: gameData.beggarId,
        }
      );

      this.sendToPlayer(clientPlayer.playerId, "gameState", gameData);
    });
  }

  /**
   * Rotate player array so the specified client is always at index 0
   * This ensures each client sees themselves at the bottom position
   */
  rotatePlayersForClient(players, clientPlayerId) {
    // Find the index of the client player in the original array
    const clientIndex = players.findIndex(
      (player) => player.getId() === clientPlayerId
    );

    if (clientIndex === -1) {
      console.warn(
        `⚠️ Client player ${clientPlayerId} not found in players array`
      );
      return players; // Return original array if client not found
    }

    // Rotate the array so client is at index 0
    // Example: if client is at index 2, result will be [2, 3, 0, 1]
    const rotated = [
      ...players.slice(clientIndex), // From client to end
      ...players.slice(0, clientIndex), // From start to client (excluding client)
    ];

    console.log(
      `🔄 Rotated players for ${clientPlayerId}:`,
      rotated.map((p) => p.getName())
    );
    return rotated;
  }

  /**
   * Show current trick state
   */
  showTrickState(playedCards) {
    console.log("🎯 Updating trick state");

    // Send personalized trick state to each client (rotate cards to match player rotation)
    this.players.forEach((player) => {
      if (player.ws.readyState === 1) {
        // Rotate the played cards array to match the rotated player perspective
        const rotatedCards = this.rotateTrickCardsForClient(
          playedCards,
          player.playerId
        );

        const trickData = rotatedCards.map((cardData) => {
          if (!cardData) return null; // Preserve null slots

          return {
            player: {
              id: cardData.player?.getId?.(),
              name: cardData.player?.getName?.(),
            },
            card: {
              suit: cardData.card?.getSuit?.(),
              rank: cardData.card?.getRank?.(),
              toString: cardData.card?.toString?.(),
            },
          };
        });

        // Send personalized trick state to this specific client
        this.sendToPlayer(player.playerId, "trickState", {
          playedCards: trickData,
        });
      }
    });
  }

  /**
   * Rotate trick cards array to match the rotated player perspective
   * This ensures trick cards appear in front of the correct players for each client
   *
   * SIMPLE APPROACH: For each played card, find the exact seat position of the player
   * who played it in the client's rotated view, then place the card there directly.
   */
  rotateTrickCardsForClient(playedCards, clientPlayerId) {
    if (!playedCards || playedCards.length === 0) {
      return [];
    }

    console.log("🔍 SIMPLE TRICK ROTATION for client", clientPlayerId);
    console.log(
      "🔍 Current players in GUIIO:",
      this.players.map((p, idx) => `${idx}: ${p.playerName} (${p.playerId})`)
    );
    console.log(
      "🔍 PlayedCards:",
      playedCards.map((card, i) =>
        card
          ? `${i}: ${card.player?.getName?.()} played ${card.card?.toString?.()}`
          : `${i}: null`
      )
    );

    // Find where the client player is positioned in our current players array
    const clientIndex = this.players.findIndex(
      (player) => player.playerId === clientPlayerId
    );

    if (clientIndex === -1) {
      console.warn(
        `⚠️ Client player ${clientPlayerId} not found in players array`
      );
      return playedCards; // fallback to original
    }

    console.log(
      `🔍 Client ${clientPlayerId} is at seat position ${clientIndex}`
    );

    // Create result array: [bottom, left, top, right] positions
    const resultCards = new Array(4).fill(null);

    // For each played card, find where it should be positioned
    playedCards.forEach((cardData, playOrderIndex) => {
      if (!cardData || !cardData.player) {
        console.log(
          `🔍 Skipping null/invalid card at play index ${playOrderIndex}`
        );
        return;
      }

      // Find which seat this player occupies in our current arrangement
      const playerSeatIndex = this.players.findIndex(
        (player) => player.playerId === cardData.player.getId()
      );

      if (playerSeatIndex === -1) {
        console.log(
          `⚠️ Player ${cardData.player.getName()} not found in current seating`
        );
        return;
      }

      // Calculate visual position relative to client
      // clientIndex=0 means client sees themselves at bottom (position 0)
      // If clientIndex=2, then:
      //   - seat 2 (client) -> position 0 (bottom)
      //   - seat 3 -> position 1 (left)
      //   - seat 0 -> position 2 (top)
      //   - seat 1 -> position 3 (right)
      let visualPosition = (playerSeatIndex - clientIndex + 4) % 4;

      console.log(
        `🔍 Player ${cardData.player.getName()} at seat ${playerSeatIndex} -> visual position ${visualPosition} (${["bottom", "left", "top", "right"][visualPosition]})`
      );

      // Place the card at the calculated visual position
      resultCards[visualPosition] = cardData;
    });

    console.log(
      `🔄 FINAL SIMPLE RESULT for client ${clientPlayerId}:`,
      resultCards.map((card, index) => ({
        position: ["bottom", "left", "top", "right"][index],
        playerName: card?.player?.getName?.() || "empty",
        cardPlayed: card?.card?.toString?.() || "none",
        hasCard: !!card,
      }))
    );

    return resultCards;
  }

  /**
   * Show team scores
   */
  showScores(teamA, teamB) {
    console.log("📊 Showing scores");

    const scoresData = {
      teamA: {
        name: teamA.name,
        gameScore: teamA.gameScore,
        matchScore: teamA.matchScore,
      },
      teamB: {
        name: teamB.name,
        gameScore: teamB.gameScore,
        matchScore: teamB.matchScore,
      },
    };

    this.broadcastToAll("scores", scoresData);

    // Also send as log message
    const message = `📊 Round Scores:\n${teamA.name}: ${teamA.gameScore} points\n${teamB.name}: ${teamB.gameScore} points`;
    this.showMessage(message, "log");
  }

  /**
   * Wait for overlay queue to clear
   */
  async waitForOverlayQueueToClear() {
    return new Promise((resolve) => {
      const checkQueue = () => {
        if (this.overlayQueue.length === 0 && !this.isProcessingOverlay) {
          resolve();
        } else {
          setTimeout(checkQueue, 1000);
        }
      };
      checkQueue();
    });
  }
  
  // Helper to get team display name based on seating order
  getTeamDisplayNames() {
    // players is your WS seating order: [0,1,2,3]
    const p = this.players || [];
    const seatName = (i) => p[i]?.playerName || `P${i + 1}`;

    const teamA = `${seatName(0)} & ${seatName(2)}`;
    const teamB = `${seatName(1)} & ${seatName(3)}`;

    return { teamA, teamB };
  }
  // Helper to format display name of teams
  formatTeamNames(text) {
    if (typeof text !== "string") return text;
    if (!this.players || this.players.length !== 4) return text;

    const { teamA, teamB } = this.getTeamDisplayNames();
    return text.replaceAll("Team A", teamA).replaceAll("Team B", teamB);
  }
}


