// testRound.js

import { Player } from "./Player.js";
import { Team } from "./Team.js";
import { Round } from "./Round.js";
import { CLIIO } from "./CLIIO.js";

// Create players
const p1 = new Player("Alice");
const p2 = new Player("Bob");
const p3 = new Player("Charlie");
const p4 = new Player("Dana");

const players = [p1, p2, p3, p4];

// Create teams
const teamA = new Team("Team A", p1, p3); // Alice + Charlie
const teamB = new Team("Team B", p2, p4); // Bob + Dana

// Choose a dealer (e.g., Dana)
const dealer = p4;

// Create GameIO instance
const gameIO = new CLIIO();

// Create and play a round with GameIO
const round = new Round(players, dealer, teamA, teamB, gameIO);
round.playRound();

// Show match results
console.log("\nMatch Scores:");
console.log(`${teamA.getName()}: ${teamA.getMatchScore()} chalks`);
console.log(`${teamB.getName()}: ${teamB.getMatchScore()} chalks`);
