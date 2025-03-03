// highlighter-utils.js - Utilities for the highlighter feature

window.HighlighterUtils = {
    initializeState: () => ({
        isHighlighterActive: false,
        highlighterPosition: { x: 0, y: 0 },
        pathPoints: [],
        currentPath: '',
        allPaths: [],
        fixedYPosition: null,
        lastKnownMousePosition: { x: 0, y: 0 },
        pathTimeoutRef: null,
        autoDeactivateTimeoutRef: null,
        lastActivityTime: 0
    }),
    
    trackMousePosition: (e, contentRef, lastKnownMousePosition) => {
        if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                lastKnownMousePosition.current = { x, y };
                return { x, y };
            }
        }
        return null;
    },
    
    handleMouseMove: (e, state, setState, contentRef) => {
        const { isHighlighterActive, pathPoints, fixedYPosition, pathTimeoutRef } = state;
        
        if (!isHighlighterActive || !contentRef.current) return;
        
        const rect = contentRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // Record the time of this movement
        setState('lastActivityTime', Date.now());
        
        // Always use the fixed Y position once it's set
        if (fixedYPosition === null) {
            // First activation - lock in the Y coordinate
            const y = e.clientY - rect.top;
            setState('fixedYPosition', y);
            setState('pathPoints', [{ x, y }]);
            setState('currentPath', `M ${x} ${y}`);
        } else {
            // Y coordinate already locked - only update X
            setState('highlighterPosition', { x, y: fixedYPosition });
            
            if (pathPoints.length === 0) {
                // Start a new path after pause
                setState('pathPoints', [{ x, y: fixedYPosition }]);
                setState('currentPath', `M ${x} ${fixedYPosition}`);
            } else {
                // Continue current path
                const newPoints = [pathPoints[0], { x, y: fixedYPosition }];
                setState('pathPoints', newPoints);
                setState('currentPath', `M ${newPoints[0].x} ${newPoints[0].y} L ${newPoints[1].x} ${newPoints[1].y}`);
            }
        }
        
        // Cancel any existing auto-deactivation
        if (state.autoDeactivateTimeoutRef) {
            clearTimeout(state.autoDeactivateTimeoutRef);
            setState('autoDeactivateTimeoutRef', null);
        }
        
        // Clear any existing timeout for path completion
        if (pathTimeoutRef && pathTimeoutRef.current) clearTimeout(pathTimeoutRef.current);
        
        // Set a new timeout for path completion
        const timeoutId = setTimeout(() => {
            const currentPath = state.currentPath;
            if (currentPath) {
                const pathId = Date.now();
                setState('allPaths', [...state.allPaths, { path: currentPath, id: pathId }]);
                
                // Schedule path removal after fade time
                setTimeout(() => {
                    setState('allPaths', prev => prev.filter(p => p.id !== pathId));
                }, 2500);
                
                // Reset current path but keep Y position fixed
                setState('pathPoints', []);
                setState('currentPath', '');
                
                // Set auto-deactivation timer - will turn off highlighter if no activity occurs
                const deactivateTimeout = setTimeout(() => {
                    const timeSinceLastActivity = Date.now() - state.lastActivityTime;
                    
                    // If it's been at least 1.5 seconds since last activity
                    if (timeSinceLastActivity >= 2500) {
                        setState('isHighlighterActive', false);
                        setState('fixedYPosition', null);
                        setState('pathPoints', []);
                        setState('currentPath', '');
                        setState('allPaths', []);
                    }
                }, 2500);
                
                setState('autoDeactivateTimeoutRef', deactivateTimeout);
            }
        }, 200);
        
        if (pathTimeoutRef) {
            setState('pathTimeoutRef', timeoutId);
        }
    },
    
    handleMouseUp: (state, setState) => {
        const { isHighlighterActive, currentPath, pathTimeoutRef } = state;
        
        if (!isHighlighterActive || !currentPath) return;
        
        // Record the time of this activity
        setState('lastActivityTime', Date.now());
        
        const pathId = Date.now();
        setState('allPaths', [...state.allPaths, { path: currentPath, id: pathId }]);
        
        // Schedule path removal after fade time
        setTimeout(() => {
            setState('allPaths', prev => prev.filter(p => p.id !== pathId));
        }, 2500);
        
        // Reset current path but keep Y position fixed
        setState('pathPoints', []);
        setState('currentPath', '');
        
        // Cancel any existing auto-deactivation
        if (state.autoDeactivateTimeoutRef) {
            clearTimeout(state.autoDeactivateTimeoutRef);
        }
        
        // Set auto-deactivation timer - will turn off highlighter if no activity occurs
        const deactivateTimeout = setTimeout(() => {
            const timeSinceLastActivity = Date.now() - state.lastActivityTime;
            
            // If it's been at least 1.5 seconds since last activity
            if (timeSinceLastActivity >= 2500) {
                setState('isHighlighterActive', false);
                setState('fixedYPosition', null);
                setState('pathPoints', []);
                setState('currentPath', '');
                setState('allPaths', []);
            }
        }, 2500);
        
        setState('autoDeactivateTimeoutRef', deactivateTimeout);
        
        if (pathTimeoutRef && pathTimeoutRef.current) {
            clearTimeout(pathTimeoutRef.current);
            setState('pathTimeoutRef', null);
        }
    },
    
    toggleHighlighter: (state, setState) => {
        const newActive = !state.isHighlighterActive;
        setState('isHighlighterActive', newActive);
        
        if (newActive) {
            // Activating - reset Y position to be set on first mouse move
            setState('fixedYPosition', null);
            setState('highlighterPosition', state.lastKnownMousePosition.current);
            setState('pathPoints', []);
            setState('currentPath', '');
            setState('allPaths', []);
            setState('lastActivityTime', Date.now());
            
            // Clear any auto-deactivate timers
            if (state.autoDeactivateTimeoutRef) {
                clearTimeout(state.autoDeactivateTimeoutRef);
                setState('autoDeactivateTimeoutRef', null);
            }
            
            if (state.pathTimeoutRef && state.pathTimeoutRef.current) {
                clearTimeout(state.pathTimeoutRef.current);
                setState('pathTimeoutRef', null);
            }
        } else {
            // Deactivating - clear everything
            setState('pathPoints', []);
            setState('currentPath', '');
            setState('allPaths', []);
            setState('fixedYPosition', null);
            
            if (state.pathTimeoutRef && state.pathTimeoutRef.current) {
                clearTimeout(state.pathTimeoutRef.current);
                setState('pathTimeoutRef', null);
            }
            
            if (state.autoDeactivateTimeoutRef) {
                clearTimeout(state.autoDeactivateTimeoutRef);
                setState('autoDeactivateTimeoutRef', null);
            }
        }
    },
    
    renderHighlighter: (state) => {
        const { isHighlighterActive, currentPath, allPaths } = state;
        
        if (!isHighlighterActive) return null;
        
        return React.createElement(React.Fragment, null,
            React.createElement('svg', { 
                className: "highlighter-line", 
                xmlns: "http://www.w3.org/2000/svg" 
            },
                currentPath && React.createElement('path', {
                    className: "highlighter-line-path",
                    d: currentPath
                }),
                
                allPaths.map(path => React.createElement('path', {
                    key: path.id,
                    className: "highlighter-line-path",
                    d: path.path,
                    style: {
                        opacity: Math.max(0, (path.id + 2500 - Date.now()) / 2500)
                    }
                }))
            )
        );
    }
};