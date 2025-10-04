/**
 * Virtual Scroll Component
 * 
 * Virtual scrolling for large task lists.
 * Renders only visible items for performance.
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface VirtualScrollProps {
    items: any[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: any, index: number) => React.ReactNode;
    onScroll?: (scrollTop: number) => void;
}

export function VirtualScroll({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    onScroll
}: VirtualScrollProps) {
    const [scrollTop, setScrollTop] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate visible range
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
    );

    // Calculate visible items
    const visibleItems = items.slice(startIndex, endIndex);

    // Calculate total height
    const totalHeight = items.length * itemHeight;

    // Calculate offset
    const offsetY = startIndex * itemHeight;

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = e.currentTarget.scrollTop;
        setScrollTop(newScrollTop);
        onScroll?.(newScrollTop);

        // Set scrolling state
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 150);
    }, [onScroll]);

    // Handle scroll to top
    const scrollToTop = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, []);

    // Handle scroll to bottom
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // Handle scroll to item
    const scrollToItem = useCallback((index: number) => {
        if (scrollRef.current) {
            const targetScrollTop = index * itemHeight;
            scrollRef.current.scrollTop = targetScrollTop;
        }
    }, [itemHeight]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Render placeholder for non-visible items
    const renderPlaceholder = useCallback((height: number) => (
        <div style={{ height }} />
    ), []);

    return (
        <div className="relative">
            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="overflow-auto"
                style={{ height: containerHeight }}
                onScroll={handleScroll}
            >
                {/* Total Height Spacer */}
                <div style={{ height: totalHeight, position: 'relative' }}>
                    {/* Top Spacer */}
                    {offsetY > 0 && renderPlaceholder(offsetY)}

                    {/* Visible Items */}
                    <div style={{ position: 'relative' }}>
                        {visibleItems.map((item, index) => (
                            <div
                                key={startIndex + index}
                                style={{ height: itemHeight }}
                            >
                                {renderItem(item, startIndex + index)}
                            </div>
                        ))}
                    </div>

                    {/* Bottom Spacer */}
                    {endIndex < items.length && renderPlaceholder((items.length - endIndex) * itemHeight)}
                </div>
            </div>

            {/* Scroll Indicators */}
            {scrollTop > 100 && (
                <button
                    onClick={scrollToTop}
                    className="absolute top-4 right-4 p-2 bg-white border border-gray-300 rounded-full shadow-lg hover:bg-gray-50 z-10"
                    title="Scroll to top"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            )}

            {scrollTop < totalHeight - containerHeight - 100 && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 p-2 bg-white border border-gray-300 rounded-full shadow-lg hover:bg-gray-50 z-10"
                    title="Scroll to bottom"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </button>
            )}

            {/* Scroll Progress */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                <div
                    className="h-full bg-blue-600 transition-all duration-150"
                    style={{
                        width: `${(scrollTop / (totalHeight - containerHeight)) * 100}%`
                    }}
                />
            </div>

            {/* Scroll Status */}
            {isScrolling && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                    {startIndex + 1}-{endIndex} of {items.length}
                </div>
            )}
        </div>
    );
}
