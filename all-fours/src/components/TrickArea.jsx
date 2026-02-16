// src/components/TrickArea.jsx
import React from 'react';
import '../styles/trick_area.css';
import { getCardComponent } from '../utils/getCardComponent';
import { log } from '../utils/logger.js';

export const TrickArea = ({ trickCards }) => {
  // Expecting trickCards = [{ player: {id, name}, card: {toString, suit, rank} }] (up to 4 entries)
  // The server rotates the cards so index 0 = bottom (self), 1 = left, 2 = top, 3 = right

  log('🎯 TrickArea rendered with trickCards:', trickCards);
  log('🎯 TrickCards length:', trickCards?.length || 0);

  return (
    <div className="trick-area">
      {['top', 'left', 'center', 'right', 'bottom'].map((slot) => {
        // Always render the center slot as empty
        if (slot === 'center') {
          return <div key="center" className="trick-center" />;
        }

        // Find the trick card for this position using direct array index
        // Array index directly maps to visual position: 0=bottom, 1=left, 2=top, 3=right
        const positionIndex = ['bottom', 'left', 'top', 'right'].indexOf(slot);
        const trick =
          positionIndex >= 0 && trickCards?.[positionIndex] ? trickCards[positionIndex] : null;
        return (
          <div key={slot} className={`trick-slot ${slot}`}>
            {trick ? (
              // Show the card if present
              <div className="trick-card">
                {(() => {
                  const { card } = trick;
                  // Handle both Card instances and plain objects
                  const cardSuit = card.getSuit ? card.getSuit() : card.suit;
                  const cardRank = card.getRank ? card.getRank() : card.rank;
                  const cardString = card.toString ? card.toString() : `${cardRank} of ${cardSuit}`;

                  const CardComponent = getCardComponent(cardSuit, cardRank);

                  return (
                    <>
                      {CardComponent ? (
                        <CardComponent style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <div className="card-text">{cardString}</div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              // Show empty placeholder if no card
              <div className="trick-card placeholder">
                {/* <div className="placeholder-text">Waiting...</div> */}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
