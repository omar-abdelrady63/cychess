const { v4: uuidv4 } = require('uuid');
const Tournament = require('../models/Tournament');
const TournamentParticipant = require('../models/TournamentParticipant');
const TournamentMatch = require('../models/TournamentMatch');
const Game = require('../models/Game');

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

async function getMatchHistory(tournamentId, participantId) {
    const matches = await TournamentMatch.find({
        tournament_id: tournamentId,
        $or: [
            { white_participant: participantId },
            { black_participant: participantId }
        ]
    }).populate('white_participant black_participant');

    const opponents = new Set();
    matches.forEach(match => {
        if (match.white_participant._id.toString() === participantId.toString()) {
            if (match.black_participant) {
                opponents.add(match.black_participant._id.toString());
            }
        } else {
            opponents.add(match.white_participant._id.toString());
        }
    });

    return opponents;
}

async function pairPlayersForRound(tournamentId, roundNumber) {
    try {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }

        const participants = await TournamentParticipant.find({ tournament_id: tournamentId })
            .populate('user_id', 'username rating avatar')
            .sort({ total_points: -1, wins: -1 });

        if (participants.length < 2) {
            throw new Error('Not enough participants to create pairings');
        }

        const matches = [];
        const paired = new Set();
        let byeParticipant = null;

        if (participants.length % 2 === 1) {

            for (let i = participants.length - 1; i >= 0; i--) {
                if (!participants[i].has_bye) {
                    byeParticipant = participants[i];
                    break;
                }
            }

            if (!byeParticipant) {
                byeParticipant = participants[participants.length - 1];
            }

            byeParticipant.total_points += 1;
            byeParticipant.has_bye = true;
            await byeParticipant.save();

            const byeMatch = new TournamentMatch({
                tournament_id: tournamentId,
                round_number: roundNumber,
                white_participant: byeParticipant._id,
                black_participant: null,
                is_bye: true,
                status: 'completed',
                result: 'white_win'
            });
            await byeMatch.save();
            matches.push(byeMatch);

            paired.add(byeParticipant._id.toString());
        }

        if (roundNumber === 1) {
            const availableParticipants = participants.filter(p => !paired.has(p._id.toString()));
            const shuffled = shuffleArray(availableParticipants);

            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    const match = await createMatch(
                        tournamentId,
                        roundNumber,
                        shuffled[i],
                        shuffled[i + 1],
                        tournament.time_control
                    );
                    matches.push(match);
                }
            }
        } else {

            const availableParticipants = participants.filter(p => !paired.has(p._id.toString()));

            const pointGroups = {};
            availableParticipants.forEach(p => {
                const points = p.total_points;
                if (!pointGroups[points]) {
                    pointGroups[points] = [];
                }
                pointGroups[points].push(p);
            });

            const sortedPoints = Object.keys(pointGroups).sort((a, b) => parseFloat(b) - parseFloat(a));

            for (const points of sortedPoints) {
                const group = pointGroups[points];
                const unpaired = group.filter(p => !paired.has(p._id.toString()));

                while (unpaired.length >= 2) {
                    const player1 = unpaired.shift();
                    paired.add(player1._id.toString());

                    const opponents = await getMatchHistory(tournamentId, player1._id);

                    let player2 = null;
                    let player2Index = -1;

                    for (let i = 0; i < unpaired.length; i++) {
                        if (!opponents.has(unpaired[i]._id.toString())) {
                            player2 = unpaired[i];
                            player2Index = i;
                            break;
                        }
                    }

                    if (!player2 && unpaired.length > 0) {
                        player2 = unpaired[0];
                        player2Index = 0;
                    }

                    if (player2) {
                        unpaired.splice(player2Index, 1);
                        paired.add(player2._id.toString());

                        const match = await createMatch(
                            tournamentId,
                            roundNumber,
                            player1,
                            player2,
                            tournament.time_control
                        );
                        matches.push(match);
                    }
                }
            }
        }

        console.log(`✓ Created ${matches.length} pairings for tournament ${tournamentId}, round ${roundNumber}`);
        return matches;

    } catch (error) {
        console.error('Error in pairPlayersForRound:', error);
        throw error;
    }
}

async function createMatch(tournamentId, roundNumber, participant1, participant2, timeControl) {

    const isPlayer1White = Math.random() < 0.5;
    const whiteParticipant = isPlayer1White ? participant1 : participant2;
    const blackParticipant = isPlayer1White ? participant2 : participant1;

    const game = new Game({
        room_id: uuidv4(),
        white_player: whiteParticipant.user_id._id,
        black_player: blackParticipant.user_id._id,
        time_control: timeControl,
        white_time: timeControl.initial,
        black_time: timeControl.initial,
        status: 'active',
        last_move_time: new Date()
    });
    await game.save();

    const tournamentMatch = new TournamentMatch({
        tournament_id: tournamentId,
        round_number: roundNumber,
        game_id: game._id,
        white_participant: whiteParticipant._id,
        black_participant: blackParticipant._id,
        status: 'pending'
    });
    await tournamentMatch.save();

    return tournamentMatch;
}

async function updateTournamentStandings(gameId) {
    try {
        const tournamentMatch = await TournamentMatch.findOne({ game_id: gameId })
            .populate('white_participant black_participant tournament_id');

        if (!tournamentMatch) {

            return null;
        }

        const game = await Game.findById(gameId);
        if (!game || game.status !== 'completed') {
            return null;
        }

        tournamentMatch.status = 'completed';
        tournamentMatch.result = game.result;
        tournamentMatch.completed_at = new Date();
        await tournamentMatch.save();

        const whiteParticipant = tournamentMatch.white_participant;
        const blackParticipant = tournamentMatch.black_participant;

        if (game.result === 'white_win') {
            whiteParticipant.total_points += 1;
            whiteParticipant.wins += 1;
            blackParticipant.losses += 1;
        } else if (game.result === 'black_win') {
            blackParticipant.total_points += 1;
            blackParticipant.wins += 1;
            whiteParticipant.losses += 1;
        } else if (game.result === 'draw') {
            whiteParticipant.total_points += 0.5;
            blackParticipant.total_points += 0.5;
            whiteParticipant.draws += 1;
            blackParticipant.draws += 1;
        }

        await whiteParticipant.save();
        await blackParticipant.save();

        console.log(`✓ Updated tournament standings for match ${tournamentMatch._id}`);

        return {
            tournamentId: tournamentMatch.tournament_id._id,
            matchId: tournamentMatch._id,
            whiteParticipant,
            blackParticipant
        };

    } catch (error) {
        console.error('Error updating tournament standings:', error);
        throw error;
    }
}

async function isRoundComplete(tournamentId, roundNumber) {
    const matches = await TournamentMatch.find({
        tournament_id: tournamentId,
        round_number: roundNumber
    });

    return matches.every(match => match.status === 'completed');
}

module.exports = {
    pairPlayersForRound,
    updateTournamentStandings,
    isRoundComplete
};
