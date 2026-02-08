

import { Chess } from 'chess.js';
import stockfishService from './stockfish-service';

export const MOVE_CLASSIFICATIONS = {
    SENSATIONAL: {
        name: 'SENSATIONAL!',
        type: 'brilliant',
        color: 'purple-gold',
        sound: 'SENSATIONAL.mp3',
        threshold: { type: 'gain', value: 150 }
    },
    HOLLOW_PURPLE: {
        name: 'Hollow Purple',
        type: 'great',
        color: 'purple',
        sound: 'imaginary-purple.mp3',
        threshold: { type: 'gain', min: 50, max: 150 }
    },
    FLAWLESS_VICTORY: {
        name: 'Flawless Victory',
        type: 'best',
        color: 'gold',
        sound: 'flawless-victory.mp3',
        threshold: { type: 'loss', value: 10 }
    },
    EXCELLENT: {
        name: 'Excellent',
        type: 'excellent',
        color: 'blue',
        sound: 'domain-expansion.mp3',
        threshold: { type: 'loss', min: 10, max: 25 }
    },
    DOMAIN_EXPANSION: {
        name: 'Domain Expansion',
        type: 'good',
        color: 'blue',
        sound: 'domain-expansion.mp3',
        threshold: { type: 'loss', min: 25, max: 50 }
    },
    BRUH: {
        name: 'Bruh',
        type: 'book',
        color: 'yellow',
        sound: 'bruh.mp3',
        threshold: { type: 'book' }
    },
    OBJECTION: {
        name: 'Objection!',
        type: 'inaccuracy',
        color: 'orange',
        sound: 'objection.mp3',
        threshold: { type: 'loss', min: 50, max: 100 }
    },
    FAAH: {
        name: 'Faah',
        type: 'mistake',
        color: 'orange',
        sound: 'faaah.mp3',
        threshold: { type: 'loss', min: 100, max: 200 }
    },
    FINISH_HIM: {
        name: 'Finish Him',
        type: 'blunder',
        color: 'red',
        sound: 'finishHim.mp3',
        threshold: { type: 'loss', min: 200, max: 400 }
    },
    FATALITY: {
        name: 'Fatality',
        type: 'critical_blunder',
        color: 'blood-red',
        sound: 'faitality.mp3',
        threshold: { type: 'loss', value: 400 }
    },
    PLANKTON_AUGH: {
        name: 'Plankton Augh',
        type: 'missed_win',
        color: 'green',
        sound: 'plankton-augh.mp3',
        threshold: { type: 'missed_mate' }
    }
};

function classifyMove(cpLoss, isBook, missedMate, bestMove, playedMove) {

    if (missedMate) {
        return MOVE_CLASSIFICATIONS.PLANKTON_AUGH;
    }

    if (isBook) {
        return MOVE_CLASSIFICATIONS.BRUH;
    }

    if (cpLoss <= -150) {
        return MOVE_CLASSIFICATIONS.SENSATIONAL;
    }

    if (cpLoss <= -50) {
        return MOVE_CLASSIFICATIONS.HOLLOW_PURPLE;
    }

    if (cpLoss >= -10 && cpLoss <= 10) {
        return MOVE_CLASSIFICATIONS.FLAWLESS_VICTORY;
    }

    if (cpLoss > 10 && cpLoss <= 25) {
        return MOVE_CLASSIFICATIONS.EXCELLENT;
    }

    if (cpLoss > 25 && cpLoss <= 50) {
        return MOVE_CLASSIFICATIONS.DOMAIN_EXPANSION;
    }

    if (cpLoss > 50 && cpLoss <= 100) {
        return MOVE_CLASSIFICATIONS.OBJECTION;
    }

    if (cpLoss > 100 && cpLoss <= 200) {
        return MOVE_CLASSIFICATIONS.FAAH;
    }

    if (cpLoss > 200 && cpLoss <= 400) {
        return MOVE_CLASSIFICATIONS.FINISH_HIM;
    }

    if (cpLoss > 400) {
        return MOVE_CLASSIFICATIONS.FATALITY;
    }

    return MOVE_CLASSIFICATIONS.DOMAIN_EXPANSION;
}

export async function analyzeGame(pgn, onMoveAnalyzed = null, signal = null, startIndex = 0) {
    const chess = new Chess();

    try {
        chess.loadPgn(pgn);
    } catch (error) {
        throw new Error('Invalid PGN format');
    }

    const history = chess.history({ verbose: true });

    if (startIndex < 0 || startIndex >= history.length) {
        if (startIndex === 0 && history.length === 0) return []; 
        if (startIndex >= history.length) return []; 
    }

    const analyzedMoves = [];

    if (!stockfishService.isReady) {
        await stockfishService.init();
    }

    chess.reset();
    for (let i = 0; i < startIndex; i++) {
        chess.move(history[i]);
    }

    for (let i = startIndex; i < history.length; i++) {

        if (signal && signal.aborted) {
            console.log('Analysis aborted at move', i);
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 0));

        try {
            const move = history[i];

            const fenBefore = chess.fen();

            const evalBefore = await stockfishService.analyzePosition(fenBefore, 15, 10000);

            chess.move(move); 

            const fenAfter = chess.fen();

            const evalAfter = await stockfishService.analyzePosition(fenAfter, 15, 10000);

            const isWhite = move.color === 'w';
            const scoreBefore = isWhite ? evalBefore.score : -evalBefore.score;
            const scoreAfter = isWhite ? -evalAfter.score : evalAfter.score;
            const cpLoss = scoreBefore - scoreAfter;

            const bestMove = evalBefore.bestMove ? evalBefore.bestMove.toLowerCase() : '';
            const playedMove = (move.from + move.to + (move.promotion || '')).toLowerCase();
            const isBestMove = bestMove === playedMove;

            const missedMate = evalBefore.isMate && evalBefore.mateIn > 0 && !isBestMove;

            const isBook = i < 10 && Math.abs(cpLoss) < 20;

            const classification = classifyMove(cpLoss, isBook, missedMate, bestMove, playedMove);

            const moveData = {
                moveNumber: Math.floor(i / 2) + 1,
                color: move.color,
                san: move.san,
                from: move.from,
                to: move.to,
                promotion: move.promotion,
                fen: fenAfter,
                evalBefore: evalBefore.score,
                evalAfter: evalAfter.score,
                cpLoss: Math.round(cpLoss),
                bestMove,
                isBestMove,
                classification: classification.name,
                classificationType: classification.type,
                classificationColor: classification.color,
                sound: classification.sound
            };

            analyzedMoves.push(moveData);

            if (onMoveAnalyzed) {
                onMoveAnalyzed(moveData, i);
            }

        } catch (err) {
            console.error(`Error analyzing move ${i + 1}:`, err);

            if (err.message.includes('terminated') || err.message.includes('timeout')) {

                console.error('Critical analysis error, stopping loop');
                break;
            }
        }
    }

    return analyzedMoves;
}

export function getAnalysisSummary(analyzedMoves) {
    const summary = {
        totalMoves: analyzedMoves.length,
        white: {
            sensational: 0,
            hollowPurple: 0,
            flawlessVictory: 0,
            excellent: 0,
            domainExpansion: 0,
            bruh: 0,
            objection: 0,
            faah: 0,
            finishHim: 0,
            fatality: 0,
            planktonAugh: 0,
            avgCpLoss: 0
        },
        black: {
            sensational: 0,
            hollowPurple: 0,
            flawlessVictory: 0,
            excellent: 0,
            domainExpansion: 0,
            bruh: 0,
            objection: 0,
            faah: 0,
            finishHim: 0,
            fatality: 0,
            planktonAugh: 0,
            avgCpLoss: 0
        }
    };

    let whiteCpTotal = 0;
    let blackCpTotal = 0;
    let whiteMoves = 0;
    let blackMoves = 0;

    analyzedMoves.forEach(move => {
        const side = move.color === 'w' ? 'white' : 'black';

        if (move.color === 'w') {
            whiteCpTotal += move.cpLoss;
            whiteMoves++;
        } else {
            blackCpTotal += move.cpLoss;
            blackMoves++;
        }

        switch (move.classificationType) {
            case 'brilliant': summary[side].sensational++; break;
            case 'great': summary[side].hollowPurple++; break;
            case 'best': summary[side].flawlessVictory++; break;
            case 'excellent': summary[side].excellent++; break;
            case 'good': summary[side].domainExpansion++; break;
            case 'book': summary[side].bruh++; break;
            case 'inaccuracy': summary[side].objection++; break;
            case 'mistake': summary[side].faah++; break;
            case 'blunder': summary[side].finishHim++; break;
            case 'critical_blunder': summary[side].fatality++; break;
            case 'missed_win': summary[side].planktonAugh++; break;
        }
    });

    summary.white.avgCpLoss = whiteMoves > 0 ? Math.round(whiteCpTotal / whiteMoves) : 0;
    summary.black.avgCpLoss = blackMoves > 0 ? Math.round(blackCpTotal / blackMoves) : 0;

    return summary;
}
