import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class Round {
    private Deck deck;
    private List<Player> players;
    private Player dealer;
    private Team dealerTeam;
    private Team teamA;
    private Team teamB;
    private String trumpSuit;
    private boolean roundAborted = false;
    private Team teamRanJack = null;
    private Team teamHungJack = null;

    public boolean wasRoundAborted() { // Didthe pack run out?
        return roundAborted;
    }

    public Round(List<Player> players, Player dealer, Team teamA, Team teamB) {
        this.players = players;
        this.dealer = dealer;
        this.teamA = teamA;
        this.teamB = teamB;
        this.dealerTeam = (dealer == teamA.getPlayer1() || dealer == teamA.getPlayer2()) ? teamA : teamB;
    }

    public void playRound() {
        teamHungJack = null;
        teamRanJack = null;

        deck = new Deck();
        deck.shuffle();

        System.out.println(dealer.getName() + " is dealing...");

        boolean success = deck.deal(players, 6);
        if (!success) {
            System.out.println("Not enough cards to deal. Round aborted.");
            return;
        }

        Card kickedCard = deck.kick();
        trumpSuit = kickedCard.getSuit();
        System.out.println("Kicked card: " + kickedCard);
        System.out.println("Trump suit for this round: " + trumpSuit);

        awardKickPoints(kickedCard);
        if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
            return;

        for (Player player : players) {
            player.showHand();
            System.out.println();
        }

        // Initiate begging phase
        if (beggingPhase()) {
            // If beggingPhase() returns true → pack ran out → abort round
            System.out.println("Round will restart due to insufficient cards to run pack.");
            roundAborted = true;
            return;
        }

        // Show all players' hands
        for (Player player : players) {
            player.showHand();
            System.out.println();
        }

        Card highTrump = findHighTrump();
        Card lowTrump = findLowTrump();
        Team highTeam = getTeamOfPlayer(findOwnerOfCard(highTrump));
        Team lowTeam = getTeamOfPlayer(findOwnerOfCard(lowTrump));

        playAllTricks();

        // After all tricks are played, allocate match points
        allocateEndOfRoundPoints(highTeam, lowTeam, highTrump, lowTrump);

        roundAborted = false; // The pack did not run out
    }

    public void allocateEndOfRoundPoints(Team highTeam, Team lowTeam, Card highTrump, Card lowTrump) {
        // Give point for High
        highTeam.addChalk(1); // Add 1 chalk to the team
        System.out.println(highTeam.getName() + " wins High (1 chalk) with " + highTrump);
        if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
            return;

        // Give point for Low
        lowTeam.addChalk(1); // Add 1 chalk to the team
        System.out.println(lowTeam.getName() + " wins Low (1 chalk) with " + lowTrump);
        if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
            return;

        if (teamRanJack != null) {
            teamRanJack.addChalk(1);
            System.out.println(teamRanJack.getName() + " runs away with Jack (1 chalk)");
            if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
                return;
        } else if (teamHungJack != null) {
            teamHungJack.addChalk(3);
            System.out.println(teamHungJack.getName() + " hangs Jack (3 chalks)");
            if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
                return;
        }

        // Give 2 points for game
        int teamAScore = teamA.getGameScore();
        int teamBScore = teamB.getGameScore();
        if (teamAScore > teamBScore) {
            teamA.addChalk(2);
            System.out.println(teamA.getName() + " wins Game (2 chalks)");
            if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
                return;
        } else if (teamBScore > teamAScore) {
            teamB.addChalk(2);
            System.out.println(teamB.getName() + " wins Game (2 chalks)");
            if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
                return;
        } else {
            // Tie → non-dealer team wins Game
            Team dealerTeam = getTeamOfPlayer(dealer);
            Team nonDealerTeam = (dealerTeam == teamA) ? teamB : teamA;
            nonDealerTeam.addChalk(2);
            System.out.println(nonDealerTeam.getName() + " wins Game (2 chalks) by tiebreaker");
            if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
                return;
        }
    }

    private Player getPlayerToRight(Player dealer) {
        int index = players.indexOf(dealer);
        int rightIndex = (index - 1 + players.size()) % players.size();
        return players.get(rightIndex);
    }

    private boolean beggingPhase() {
        Player beggingPlayer = getPlayerToRight(dealer);
        Scanner scanner = new Scanner(System.in);

        System.out.println(beggingPlayer.getName() + ", do you want to beg? (yes/no)");
        String response = scanner.nextLine().trim().toLowerCase();

        if (!response.equals("yes")) {
            return false; // Player stood → round continues
        }

        // Player begged → dealer must respond
        System.out.println(dealer.getName() + ", do you want to give 1 chalk? (yes/no)");
        String dealerResponse = scanner.nextLine().trim().toLowerCase();

        if (dealerResponse.equals("yes")) {
            // Dealer gives 1 chalk to begging team
            Team beggingTeam = getTeamOfPlayer(beggingPlayer);
            beggingTeam.addChalk(1);
            System.out.println(beggingTeam.getName() + " awarded 1 chalk for begging.");
            return false; // round continues
        }

        // Dealer chooses to run the pack
        System.out.println(dealer.getName() + " chooses to run the pack.");

        while (true) {
            // ⭐ Reuse Deck's safe deal() method
            boolean success = deck.deal(players, 3);
            if (!success) {
                System.out.println("Not enough cards to run pack. Round will be restarted.");
                return true; // Signal to GameController to restart round
            }

            // Kick new card + award dealer team if Ace/6/Jack
            Card kickedCard = deck.kick();
            String newTrump = kickedCard.getSuit();
            System.out.println("New kicked card: " + kickedCard);
            System.out.println("New trump suit: " + newTrump);

            awardKickPoints(kickedCard); // ⭐ Clean reusable method
            if (teamA.getMatchScore() >= 14 || teamB.getMatchScore() >= 14)
                return true;

            // Check if new trump is different
            if (!newTrump.equals(trumpSuit)) {
                trumpSuit = newTrump;
                break; // trump changed → continue round
            }

            // Otherwise → same trump → run pack again
            System.out.println("Same trump suit as before. Running pack again...");
        }

        return false; // Round continues normally
    }

    private void playAllTricks() {
        int numTricks = players.get(0).getHand().size();
        Player currentLeader = getPlayerToRight(dealer); // Player to the right of dealer is on top

        for (int i = 0; i < numTricks; i++) { // Plays all the tricks
            System.out.println("\nStarting Trick " + (i + 1));
            Trick trick = new Trick(players, trumpSuit, currentLeader);
            Player winner = trick.play();
            Team winnerTeam = getTeamOfPlayer(winner);
            winnerTeam.addGamePoints(trick.getPointsEarned());
            currentLeader = winner; // Winner is on top for next trick

            // Check for hangjack
            if (trick.isJackPlayed()) {
                if (getTeamOfPlayer(trick.getJackPlayer()) == winnerTeam) {
                    System.out.println(trick.getJackPlayer().getName() + "  has run with his Jack!");
                    teamRanJack = getTeamOfPlayer(trick.getJackPlayer());
                } else if (getTeamOfPlayer(trick.getJackPlayer()) != winnerTeam) {
                    System.out.println(trick.getJackPlayer().getName() + " has gotten his Jack hung!");
                    teamHungJack = winnerTeam;
                }
            }
        }
    }

    private Team getTeamOfPlayer(Player player) {
        return (player == teamA.getPlayer1() || player == teamA.getPlayer2()) ? teamA : teamB;
    }

    private Player findOwnerOfCard(Card targetCard) {
        for (Player player : players) {
            if (player.getHand().contains(targetCard)) {
                return player;
            }
        }
        // This should never happen unless zero trump is in play
        throw new IllegalStateException("Card not found in any player's hand: " + targetCard);
    }

    public String getTrumpSuit() {
        return trumpSuit;
    }

    // Return the highest trump card in the round
    private Card findHighTrump() {
        System.out.println("[DEBUG] trumpSuit = '" + trumpSuit + "'");
        Card highest = null;
        for (Player player : players) {
            for (Card card : player.getHand()) {
                if (card.getSuit().equals(trumpSuit)) {
                    if (highest == null || CardComparator.compare(card, highest) > 0) {
                        highest = card;
                    }
                }
            }
        }
        return highest;
    }

    // Return the lowest trump card in the round
    private Card findLowTrump() {
        Card lowest = null;
        for (Player player : players) {
            for (Card card : player.getHand()) {
                if (card.getSuit().equals(trumpSuit)) {
                    if (lowest == null || CardComparator.compare(card, lowest) < 0) {
                        lowest = card;
                    }
                }
            }
        }
        return lowest;
    }

    private void awardKickPoints(Card kickedCard) {
        String rank = kickedCard.getRank();
        int chalkPoints = 0;

        if (rank.equals("Ace"))
            chalkPoints = 1;
        else if (rank.equals("6"))
            chalkPoints = 2;
        else if (rank.equals("Jack"))
            chalkPoints = 3;

        if (chalkPoints > 0) {
            dealerTeam.addChalk(chalkPoints);
            System.out.println(dealerTeam.getName() + " earned " + chalkPoints + " chalk(s) from the kick.");
        }
    }
}
