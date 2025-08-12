/*
 * Attributes:
 * - Card's suit: Hearts, Diamonds, Clubs, Spades
 * - Card's rank: 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen, King, Ace
 * 
 * Methods:
 * - Constructor: Card(String rank, String suit)
 * - getSuit(): Returns the card's suit
 * - getRank(): Returns the card's rank
 * - toString(): Returns a string representation of the card
 * - equals(Object obj): Compares two cards for equality
 * - hashCode(): Returns the hash code for the card
 */

public class Card {
    private String suit;
    private String rank;

    public Card(String rank, String suit) {
        this.rank = rank;
        this.suit = suit;
    }

    public String getSuit() {
        return suit;
    }

    public String getRank() {
        return rank;
    }

    @Override
    public String toString() {
        return rank + " of " + suit;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Card card = (Card) obj;
        return rank.equals(card.rank) && suit.equals(card.suit);
    }

    @Override
    public int hashCode() {
        return rank.hashCode() * 31 + suit.hashCode();
    }
}
