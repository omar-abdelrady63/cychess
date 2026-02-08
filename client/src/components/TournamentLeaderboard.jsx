import { useEffect } from 'react';

const TournamentLeaderboard = ({ participants, currentUserId, highlightUser = true }) => {

    const sortedParticipants = [...participants].sort((a, b) => {
        if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points;
        }
        if (b.wins !== a.wins) {
            return b.wins - a.wins;
        }
        return b.draws - a.draws;
    });

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-ranking-star" style={{ marginRight: '8px', color: 'var(--accent)' }}></i>
                Leaderboard
            </h3>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {sortedParticipants.map((participant, index) => {
                    const isCurrentUser = participant.user?.id === currentUserId || participant.user?._id === currentUserId;
                    const rank = index + 1;

                    return (
                        <div
                            key={participant.id}
                            style={{
                                padding: 'var(--spacing-md)',
                                borderBottom: '1px solid var(--bg-tertiary)',
                                backgroundColor: highlightUser && isCurrentUser ? 'rgba(var(--accent), 0.1)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {}
                            <div style={{
                                width: '35px',
                                height: '35px',
                                borderRadius: '50%',
                                backgroundColor: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : 'var(--bg-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                flexShrink: 0
                            }}>
                                {rank <= 3 ? (
                                    <i className="fa-solid fa-trophy" style={{ color: rank === 1 ? '#fff' : '#000' }}></i>
                                ) : (
                                    rank
                                )}
                            </div>

                            {}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: isCurrentUser ? 'bold' : 'normal',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {participant.user?.username}
                                    {isCurrentUser && (
                                        <span style={{ marginLeft: '6px', fontSize: '0.8rem', color: 'var(--accent)' }}>
                                            (You)
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {participant.wins}W - {participant.draws}D - {participant.losses}L
                                </div>
                            </div>

                            {}
                            <div style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: 'var(--accent)',
                                flexShrink: 0
                            }}>
                                {participant.total_points}
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedParticipants.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl)',
                    color: 'var(--text-secondary)'
                }}>
                    No participants yet
                </div>
            )}
        </div>
    );
};

export default TournamentLeaderboard;
