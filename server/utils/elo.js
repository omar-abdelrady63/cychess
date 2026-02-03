
function calculateEloRating(rating, opponentRating, actualScore, kFactor = 32) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
    const newRating = rating + kFactor * (actualScore - expectedScore);
    return Math.round(newRating);
}

module.exports = { calculateEloRating };
