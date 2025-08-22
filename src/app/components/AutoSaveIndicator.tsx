'use client';
import React, { useState, useEffect } from 'react';

interface AutoSaveIndicatorProps {
    isActive: boolean;
    className?: string;
}

export default function AutoSaveIndicator({ isActive, className = '' }: AutoSaveIndicatorProps) {
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        if (isActive) {
            setSaveStatus('saving');

            // Simulate save completion after 2.5 seconds (slightly longer than debounce)
            const timer = setTimeout(() => {
                setSaveStatus('saved');

                // Reset to idle after showing "saved" for 2 seconds
                const resetTimer = setTimeout(() => {
                    setSaveStatus('idle');
                }, 2000);

                return () => clearTimeout(resetTimer);
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
            {saveStatus === 'saving' && (
                <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                    <span className="text-blue-600">Saving progress...</span>
                </>
            )}
            {saveStatus === 'saved' && (
                <>
                    <div className="text-green-500">✅</div>
                    <span className="text-green-600">Progress saved</span>
                </>
            )}
        </div>
    );
}
