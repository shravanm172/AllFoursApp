public class Team {
    private String name;
    private Player player1;
    private Player player2;
    private int gameScore;
    private int matchScore; // chalk

    public Team(String name, Player player1, Player player2) {
        this.name = name;
        this.player1 = player1;
        this.player2 = player2;
        this.gameScore = 0;
        this.matchScore = 0;
    }

    public void addChalk(int points) {
        matchScore += points;
    }

    public void addGamePoints(int points) {
        gameScore += points;
    }

    public Player getPlayer1() {
        return player1;
    }

    public Player getPlayer2() {
        return player2;
    }

    public int getMatchScore() {
        return matchScore;
    }

    public int getGameScore() {
        return gameScore;
    }

    public void resetGameScore() {
        gameScore = 0;
    }

    public String getName() {
        return name;
    }
}
