import java.util.Comparator;
import java.util.LinkedList;
import java.util.List;
import java.util.Scanner;

/*
 * Attributes:
 * - Player's name
 * - Player's hand
 * 
 * Methods:
 * - addCard(Card card): Adds a card to the player's hand
 * - getHand(): Returns the player's hand
 * - getName(): Returns the player's name
 * - showHand(): Displays the player's hand
 * - chooseCardToPlay(String leadSuit, String trumpSuit, List<Card> playedCards): prompts the player to choose a card to play
 */

public class Player {
    private String name;
    private LinkedList<Card> hand;

    public Player(String name) {
        this.name = name;
        this.hand = new LinkedList<>();
    }

    public void addCard(Card card) {
        hand.add(card);
    }

    public LinkedList<Card> getHand() {
        return hand;
    }

    public String getName() {
        return name;
    }

    public void showHand() {
        sortHand();
        System.out.println(name + "'s hand:");
        for (Card card : hand) {
            System.out.println("  " + card);
        }
    }

    /*
     * @param leadSuit The suit of the card called in the trick
     * 
     * @param trumpSuit The trump suit for the round
     * 
     * @param playedCards The cards already played in the trick
     * 
     * @return The card chosen by the player
     * 
     * Prompts the player to choose a card to play from their hand.
     * The card must follow the suit called, unless it is trump
     * However, the player cannot undertrump unless they are down to trump
     */
    public Card chooseCardToPlay(String leadSuit, String trumpSuit, List<Card> playedCards) {
        Scanner scanner = new Scanner(System.in);

        while (true) {
            System.out.println("\n" + name + ", your hand:");
            int index = 1;
            for (Card card : hand) {
                System.out.println(index + ". " + card);
                index++;
            }

            System.out.print("Select a card to play (1-" + hand.size() + "): ");
            int choice = scanner.nextInt();

            if (choice < 1 || choice > hand.size()) {
                System.out.println("Invalid choice. Try again.");
                continue;
            }

            Card selected = hand.get(choice - 1);

            // ⭐ Rule enforcement
            if (leadSuit != null) {
                boolean hasLeadSuit = hand.stream().anyMatch(card -> card.getSuit().equals(leadSuit));
                boolean isTrump = selected.getSuit().equals(trumpSuit);

                // Must follow suit if possible
                if (!selected.getSuit().equals(leadSuit) && hasLeadSuit && !isTrump) {
                    System.out.println("You must follow suit if you have it. Try again.");
                    continue;
                }

                // ⭐ Undertrump check
                if (!leadSuit.equals(trumpSuit)) {
                    boolean trumpAlreadyPlayed = playedCards.stream()
                            .anyMatch(c -> c.getSuit().equals(trumpSuit));
                    boolean playerPlaysTrump = selected.getSuit().equals(trumpSuit);

                    if (trumpAlreadyPlayed && playerPlaysTrump) {
                        // find highest trump rank already played
                        Card highestTrump = playedCards.stream()
                                .filter(c -> c.getSuit().equals(trumpSuit))
                                .max((c1, c2) -> CardComparator.compare(c1, c2))
                                .orElse(null);

                        boolean playerUndertrumps = (CardComparator.compare(selected, highestTrump) < 0);

                        if (playerUndertrumps) {
                            boolean hasNonTrump = hand.stream()
                                    .anyMatch(c -> !c.getSuit().equals(trumpSuit));

                            if (hasNonTrump) {
                                System.out.println("You cannot undertrump if you have other suits. Try again.");
                                continue;
                            }
                        }
                    }
                }
            }

            // All rules passed → legal play
            hand.remove(selected);
            return selected;
        }
    }

    public void sortHand() {
        hand.sort(new Comparator<Card>() {
            @Override
            public int compare(Card c1, Card c2) {
                int suitCompare = c1.getSuit().compareTo(c2.getSuit());
                if (suitCompare != 0)
                    return suitCompare;
                return CardComparator.compare(c1, c2);
            }
        });
    }
}
