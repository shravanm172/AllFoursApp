import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Trick {
    private List<Player> players;
    private String trumpSuit;
    private Player leader;
    private List<Card> playedCards;
    private Player winner;
    private int pointsEarned;
    private boolean jackPlayed;
    private Player jackPlayer;

    public Trick(List<Player> players, String trumpSuit, Player leader) {
        this.players = players;
        this.trumpSuit = trumpSuit;
        this.leader = leader;
        this.playedCards = new ArrayList<>();
        this.winner = null;
        this.pointsEarned = 0;
    }

   
    /*
     * Runs an entire trick, where each player plays one card
     * 
     * @return The player who wins the trick
     */
    public Player play() {
        List<Player> playOrder = getPlayersInOrderStartingFrom(leader); // Defines the order in which players play
        String leadSuit = null;
        Card highestCard = null;

        System.out.println("\nStarting new trick.");

        for (Player player : playOrder) { // Each player plays one card
            Card played = player.chooseCardToPlay(leadSuit, trumpSuit, playedCards);
            System.out.println(player.getName() + " played " + played);
            playedCards.add(played); // Keep track of played cards

            // Check if Jack of trump is played
            if (played.getRank().equals("Jack") && played.getSuit().equals(trumpSuit)) {
                jackPlayed = true;
                jackPlayer = player;
            }

            // Suit called is the lead suit
            if (leadSuit == null) { 
                leadSuit = played.getSuit();
            }

            // Check if the played card is better than the current highest card
            if (highestCard == null || isBetterCard(played, highestCard, leadSuit)) {
                highestCard = played;
                winner = player;
            }
        }

        pointsEarned = calculateTrickPoints(); // Calculate points won in the trick
        System.out.println(winner.getName() + " wins the trick and earns " + pointsEarned + " game points.");

        return winner;
    }

    private List<Player> getPlayersInOrderStartingFrom(Player startPlayer) {
        List<Player> ordered = new ArrayList<>();
        int startIndex = players.indexOf(startPlayer);

        for (int i = 0; i < players.size(); i++) {
            ordered.add(players.get((startIndex - i + players.size()) % players.size()));
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

    
    private boolean isBetterCard(Card c1, Card c2, String leadSuit) {
        boolean c1Trump = c1.getSuit().equals(trumpSuit);
        boolean c2Trump = c2.getSuit().equals(trumpSuit);

        if (c1Trump && !c2Trump) return true; // If c1 is trump and c2 is not, c1 wins
        if (!c1Trump && c2Trump) return false; // If c2 is trump and c1 is not, c2 wins

        if (!c1Trump && !c2Trump) { 
            boolean c1Lead = c1.getSuit().equals(leadSuit);
            boolean c2Lead = c2.getSuit().equals(leadSuit);

            if (c1Lead && !c2Lead) return true;
            if (!c1Lead && c2Lead) return false;
        }

        return CardComparator.compare(c1, c2) > 0;
    }

    // Calculates the points won in the trick
    private int calculateTrickPoints() {
        int total = 0;

        for (Card card : playedCards) {
            switch (card.getRank()) {
                case "Ace": total += 4; break;
                case "King": total += 3; break;
                case "Queen": total += 2; break;
                case "Jack": total += 1; break;
                case "10": total += 10; break;
                default: break;
            }
        }

        return total;
    }

    // Getter for the number of points won in the trick 
    public int getPointsEarned() {
        return pointsEarned;
    }

    // Getter for whether Jack of trump was played
    public boolean isJackPlayed() {
        return jackPlayed;
    }

    // Getter for the player who played the Jack of trump
    public Player getJackPlayer() {
        return jackPlayer;
    }
}