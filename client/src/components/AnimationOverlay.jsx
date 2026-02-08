import { useRef, useEffect, useCallback } from 'react';
import '../styles/mystic-animations.css';

const AnimationOverlay = ({ animation, onAnimationEnd }) => {
    const overlayRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!animation) return;

        const timer = setTimeout(() => {
            if (onAnimationEnd) {
                onAnimationEnd();
            }
        }, getAnimationDuration(animation.type));

        return () => clearTimeout(timer);
    }, [animation, onAnimationEnd]);

    useEffect(() => {
        if (!animation || !animation.sound) return;

        const audio = new Audio(`/assets/sounds/analysis sound/${animation.sound}`);
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Audio play failed:', err));
    }, [animation]);

    if (!animation) return null;

    const getAnimationClass = (type) => {
        const classMap = {
            brilliant: 'animation-sensational',
            great: 'animation-hollow-purple',
            best: 'animation-flawless',
            excellent: 'animation-excellent',
            good: 'animation-domain',
            book: 'animation-bruh',
            inaccuracy: 'animation-objection',
            mistake: 'animation-faah',
            blunder: 'animation-finish-him',
            critical_blunder: 'animation-fatality',
            missed_win: 'animation-plankton',
        };
        return classMap[type] || '';
    };

    const getAnimationDuration = (type) => {
        const durations = {
            brilliant: 1500,
            great: 1200,
            best: 800,
            excellent: 1000,
            good: 1200,
            book: 600,
            inaccuracy: 800,
            mistake: 500,
            blunder: 1000,
            critical_blunder: 1200,
            missed_win: 1500,
        };
        return durations[type] || 1000;
    };

    const animationClass = getAnimationClass(animation.type);

    if (animation.type === 'mistake') {
        return (
            <>
                <div className={animationClass} ref={overlayRef} />
                <div className="animation-faah-shake" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 9
                }} />
            </>
        );
    }

    return <div className={animationClass} ref={overlayRef} />;
};

export default AnimationOverlay;
