import java.util.Arrays;
import java.util.List;

public class CardComparator {
    private static final List<String> rankOrder = Arrays.asList(
            "2", "3", "4", "5", "6", "7", "8", "9", "10",
            "Jack", "Queen", "King", "Ace");

    // Compare two cards by rank
    public static int compare(Card c1, Card c2) {
        return Integer.compare(
                rankOrder.indexOf(c1.getRank()),
                rankOrder.indexOf(c2.getRank()));
    }
}
