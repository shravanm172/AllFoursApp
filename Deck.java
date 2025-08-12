import java.util.*;

public class Deck {
    private LinkedList<Card> cards;

    public Deck() {
        cards = new LinkedList<>();
        String[] suits = {"Hearts", "Diamonds", "Clubs", "Spades"};
        String[] ranks = {"2", "3", "4", "5", "6", "7", "8", "9", "10", 
                          "Jack", "Queen", "King", "Ace"};

        for (String suit : suits) {
            for (String rank : ranks) {
                cards.add(new Card(rank, suit));
            }
        }
    }

    // Shuffles the deck
    public void shuffle() {
        Collections.shuffle(cards);
    }

    // Deals n cards to each player, returns false if pack has run out
    public boolean deal(List<Player> players, int n) {
        if (n * 4 > cards.size()) {
            return false;
        }

        for (Player player : players) {
            for (int i = 0; i < n; i++) {
                player.addCard(cards.removeFirst());
            }
        }
        return true;
    }

    //Kicks the top card from the deck
    public Card kick() {
        if (cards.isEmpty()) return null;
        return cards.removeFirst();
    }

    // Returns the number of cards remaining in the deck
    public int cardsRemaining() {
        return cards.size();
    }
}
