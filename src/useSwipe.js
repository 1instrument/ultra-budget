import { useState, useEffect } from 'react';

export const useSwipe = ({ onSwipeLeft, onSwipeRight, threshold = 50 }) => {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const [touchStartY, setTouchStartY] = useState(null);
    const [touchEndY, setTouchEndY] = useState(null);

    // Reset touch end on start
    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setTouchEndY(null);
        setTouchStartY(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
        setTouchEndY(e.targetTouches[0].clientY);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd || !touchStartY || !touchEndY) return;

        const distanceX = touchStart - touchEnd;
        const distanceY = touchStartY - touchEndY;
        const isLeftSwipe = distanceX > threshold;
        const isRightSwipe = distanceX < -threshold;

        // Only trigger if horizontal swipe is dominant (more X movement than Y)
        if (Math.abs(distanceX) > Math.abs(distanceY)) {
            if (isLeftSwipe && onSwipeLeft) {
                onSwipeLeft();
            }
            if (isRightSwipe && onSwipeRight) {
                onSwipeRight();
            }
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};
