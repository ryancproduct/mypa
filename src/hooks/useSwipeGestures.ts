import { useRef, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  preventScroll?: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

export const useSwipeGestures = (config: SwipeConfig) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 100,
    preventScroll = false
  } = config;

  const touchDataRef = useRef<TouchData | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
    };

    if (preventScroll) {
      e.preventDefault();
    }
  }, [preventScroll]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchDataRef.current) return;

    const touch = e.touches[0];
    touchDataRef.current.currentX = touch.clientX;
    touchDataRef.current.currentY = touch.clientY;

    // Calculate distances
    const deltaX = Math.abs(touch.clientX - touchDataRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchDataRef.current.startY);

    // If horizontal movement is greater than vertical, it's likely a swipe
    if (deltaX > deltaY && deltaX > 20) {
      if (preventScroll) {
        e.preventDefault();
      }
    }
  }, [preventScroll]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchDataRef.current) return;

    const touchData = touchDataRef.current;
    const deltaX = touchData.currentX - touchData.startX;
    const deltaY = Math.abs(touchData.currentY - touchData.startY);
    const deltaTime = Date.now() - touchData.startTime;

    // Reset touch data
    touchDataRef.current = null;

    // Check if it's a valid swipe (horizontal movement, quick gesture, not too much vertical movement)
    const isValidSwipe =
      Math.abs(deltaX) > threshold &&
      deltaY < 100 &&
      deltaTime < 500;

    if (!isValidSwipe) return;

    // Determine swipe direction and call appropriate handler
    if (deltaX > 0 && onSwipeRight) {
      e.preventDefault();
      onSwipeRight();
    } else if (deltaX < 0 && onSwipeLeft) {
      e.preventDefault();
      onSwipeLeft();
    }
  }, [threshold, onSwipeLeft, onSwipeRight]);

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    swipeHandlers,
    elementRef,
  };
};