import java.util.ArrayList;
import java.util.List;
import java.util.Random;


/*
 * Need to implement throwdown logic
 * Cannot give 1 to team on 13
 */

public class GameController {
    private List<Player> players;
    private Team teamA;
    private Team teamB;
    private int dealerIndex;
    private Round currentRound;    // ⭐ NEW: store active round

    // Getter methods
    public List<Player> getPlayers() {
        return players;
    }

    public Player getCurrentDealer() {
        return players.get(dealerIndex);
    }

    public Team getTeamA() {
        return teamA;
    }

    public Team getTeamB() {
        return teamB;
    }

    public Round getCurrentRound() {   // ⭐ NEW: get current round
        return currentRound;
    }

    // Constructor
    public GameController() {
        players = new ArrayList<>();
    }

    public void setupGame() {
        Player p1 = new Player("Player 1");
        Player p2 = new Player("Player 2");
        Player p3 = new Player("Player 3");
        Player p4 = new Player("Player 4");

        players.add(p1);
        players.add(p2);
        players.add(p3);
        players.add(p4);

        teamA = new Team("Team A", p1, p3);
        teamB = new Team("Team B", p2, p4);

        Random rand = new Random();
        dealerIndex = rand.nextInt(4);

        System.out.println("Match setup complete. " + players.get(dealerIndex).getName() + " is the first dealer.");
    }

    public void startRound() {
        Player dealer = players.get(dealerIndex);
        currentRound = new Round(players, dealer, teamA, teamB);   // ⭐ STORE the round
        currentRound.playRound();
    }

    public void rotateDealer() {
        dealerIndex = (dealerIndex - 1 + players.size()) % players.size();
        System.out.println("Dealer passes to: " + players.get(dealerIndex).getName());
    }

    // ✅ Safe main method
    public static void main(String[] args) {
        GameController game = new GameController();
        game.setupGame();

        while (game.getTeamA().getMatchScore() < 14 && game.getTeamB().getMatchScore() < 14) {
            do {
                game.startRound();    // play until round is successful
            } while (game.getCurrentRound().wasRoundAborted());

            // Show match scores after round
            System.out.println("\nMatch scores after round:");
            System.out.println(game.getTeamA().getName() + ": " + game.getTeamA().getMatchScore() + " chalk");
            System.out.println(game.getTeamB().getName() + ": " + game.getTeamB().getMatchScore() + " chalk");

            // Rotate dealer for next round
            game.rotateDealer();
        }

        // Declare winner
        System.out.println("\n🏆 MATCH OVER 🏆");
        if (game.getTeamA().getMatchScore() >= 14) {
            System.out.println(game.getTeamA().getName() + " wins the match!");
        } else {
            System.out.println(game.getTeamB().getName() + " wins the match!");
        }
    }

}
