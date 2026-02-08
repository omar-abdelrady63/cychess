import { useRef, useEffect } from 'react';
import '../styles/mystic-timeline.css';

const getClassificationIcon = (classificationType) => {
    const icons = {
        brilliant: 'auto_awesome',
        great: 'circle',
        best: 'emoji_events',
        excellent: 'star',
        good: 'change_history',
        book: 'menu_book',
        inaccuracy: 'warning',
        mistake: 'sentiment_dissatisfied',
        blunder: 'priority_high',
        critical_blunder: 'dangerous',
        missed_win: 'face_retouching_off',
    };
    return icons[classificationType] || 'circle';
};

const MysticTimeline = ({ moves, currentMoveIndex, onMoveClick, onMoveHover }) => {
    const timelineRef = useRef(null);
    const activeMoveRef = useRef(null);

    useEffect(() => {
        if (activeMoveRef.current && timelineRef.current) {
            const timeline = timelineRef.current;
            const activeMove = activeMoveRef.current;

            const timelineRect = timeline.getBoundingClientRect();
            const activeMoveRect = activeMove.getBoundingClientRect();

            if (
                activeMoveRect.left < timelineRect.left ||
                activeMoveRect.right > timelineRect.right
            ) {
                const scrollLeft = activeMove.offsetLeft - (timeline.offsetWidth / 2) + (activeMove.offsetWidth / 2);
                timeline.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentMoveIndex]);

    if (!moves || moves.length === 0) {
        return null;
    }

    return (
        <div className="mystic-timeline-container">
            <div className="mystic-timeline-header">
                <h3 className="mystic-timeline-title">Mystic Analysis Timeline</h3>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                    {moves.length} moves analyzed
                </span>
            </div>

            <div className="mystic-timeline-scroll" ref={timelineRef}>
                <div className="mystic-timeline-track">
                    {moves.map((move, index) => (
                        <div
                            key={index}
                            ref={currentMoveIndex === index ? activeMoveRef : null}
                            className={`timeline-move-item ${currentMoveIndex === index ? 'active' : ''}`}
                            data-classification={move.classificationType}
                            onClick={() => onMoveClick(index)}
                            onMouseEnter={() => onMoveHover && onMoveHover(index, move)}
                            onMouseLeave={() => onMoveHover && onMoveHover(null, null)}
                        >
                            <div className="timeline-move-number">
                                {move.moveNumber}{move.color === 'w' ? '.' : '...'}
                            </div>
                            <div className={`timeline-move-icon icon-${move.classificationType}`}>
                                <span className="material-icons">{getClassificationIcon(move.classificationType)}</span>
                            </div>
                            <div className="timeline-move-san">{move.san}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MysticTimeline;
