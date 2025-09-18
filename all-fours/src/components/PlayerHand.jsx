import React, { useState, useEffect } from "react";
import { getCardComponent } from "../utils/getCardComponent";
import { B1 } from "@letele/playing-cards"; // Add at top
import { Card } from "../logic/Card.js"; // Import Card class
import "../styles/player_hand.css"; // create if needed

export const PlayerHand = ({
  player,
  isPromptingCard,
  onCardClick,
  selfId,
  teammateId,
  layout = "column",
  playerIndex, // Add playerIndex prop to identify top player
  isBeggingPhase, // Use boolean instead of gamePhase
  beggarId, // Add beggar ID prop
  dealerId, // Add dealer ID prop
}) => {
  const cards = player.getHand();
  const playerId = player.getId();
  const isSelf = playerId === selfId;
  const isTeammate = playerId === teammateId;
  const isDealer = playerId === dealerId;
  const isBeggar = playerId === beggarId;

  let isVisible = false; // Default visibility to false

  // Debug logging
  console.log(`🔍 PlayerHand visibility check for ${player.getName()}:`, {
    playerId,
    selfId,
    teammateId,
    isBeggingPhase,
    isSelf,
    isTeammate,
    isBeggar,
    isDealer,
    handLength: cards.length,
    actualCards: cards.map((c) => {
      if (!c) return "null";
      if (typeof c.toString === "function") {
        try {
          return c.toString();
        } catch (e) {
          return "toString error";
        }
      }
      return typeof c;
    }),
  });

  if (isBeggingPhase) {
    // During begging phase: only show cards if this player is the beggar or dealer
    if (
      (isBeggar && (isSelf || isTeammate)) ||
      (isDealer && (isSelf || isTeammate))
    ) {
      isVisible = true;
      console.log(
        `👁️ Visible during begging: ${player.getName()} is ${isBeggar ? "beggar" : "dealer"}`
      );
    }
  } else {
    // During trick play: show own cards and teammate's cards
    isVisible = isSelf || isTeammate;
    console.log(
      `👁️ Visible during trick play: ${player.getName()}, isSelf=${isSelf}, isTeammate=${isTeammate}, isVisible=${isVisible}`
    );
  }

  // Helper function to ensure we have a proper Card instance
  const ensureCardInstance = (card) => {
    if (!card) return null;

    // If it's already a Card instance with methods, return as-is
    if (card.getSuit && card.getRank && card.toString) {
      return card;
    }

    // If it's a plain object, convert to Card instance
    if (card.suit && card.rank) {
      return new Card(card.suit, card.rank);
    }

    console.warn("Invalid card object in PlayerHand:", card);
    return null;
  };

  // Convert all cards to ensure they're Card instances
  const ensuredCards = cards
    .map(ensureCardInstance)
    .filter((card) => card !== null);

  // State for tracking selected card (for double-click confirmation)
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);

  // Auto-clear selection after 5 seconds
  useEffect(() => {
    if (selectedCardIndex !== null) {
      const timer = setTimeout(() => {
        setSelectedCardIndex(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [selectedCardIndex]);

  // Clear selection when no longer prompting for card
  useEffect(() => {
    if (!isPromptingCard) {
      setSelectedCardIndex(null);
    }
  }, [isPromptingCard]);

  // Determine fan effect class based on card count
  let fanEffectClass = "";
  if (ensuredCards.length > 6 && ensuredCards.length <= 9) {
    fanEffectClass = "fan-effect-nine";
  } else if (ensuredCards.length > 9 && ensuredCards.length <= 12) {
    fanEffectClass = "fan-effect-twelve";
  }

  // Helper function to safely get card properties (now guaranteed to be Card instances)
  const getCardSuit = (card) => card.getSuit();
  const getCardRank = (card) => card.getRank();
  const getCardString = (card) => card.toString();

  const handleCardClick = (index) => {
    if (!isSelf || !isPromptingCard) return;

    if (selectedCardIndex === index) {
      // Second click on same card - play it
      onCardClick(index);
      setSelectedCardIndex(null); // Reset selection
    } else {
      // First click or different card - select it
      setSelectedCardIndex(index);
    }
  };

  return (
    <div className="player-hand-container">
      <div
        className={`player-hand ${layout === "row" ? "horizontal" : ""} ${
          isSelf ? "self" : isTeammate ? "teammate" : "opponent"
        } ${fanEffectClass}`}
      >
        {isVisible
          ? ensuredCards.map((card, index) => (
              <div
                key={`${player.getId()}-${getCardString(card)}-${index}`}
                className={`card ${isSelf && isPromptingCard ? "clickable" : ""} ${fanEffectClass} ${
                  isSelf && selectedCardIndex === index ? "selected" : ""
                }`}
                onClick={() => handleCardClick(index)}
              >
                {getCardComponent(getCardSuit(card), getCardRank(card))
                  ? getCardComponent(
                      getCardSuit(card),
                      getCardRank(card)
                    )({
                      style: { width: "100%", height: "100%" },
                    })
                  : getCardString(card)}
              </div>
            ))
          : ensuredCards.map((_, index) => (
              <div
                key={`${player.getId()}-hidden-${index}`}
                className={`card ${fanEffectClass}`}
                style={{ zIndex: index }}
              >
                <B1 style={{ width: "100%", height: "100%" }} />
              </div>
            ))}
      </div>
    </div>
  );
};
