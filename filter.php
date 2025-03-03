<?php
// filter.php - Main file for the content filtering interface
header('Content-Type: text/html');
require_once('php_include/content_extractor.php');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get and process content
$id = $_GET['id'] ?? '';
if (empty($id)) die('No ID provided');

$parts = explode('-', $id);
$filepath = 'modules/' . implode('/', $parts) . '.php';
if (!file_exists($filepath)) die('File not found: ' . $filepath);

$content = file_get_contents($filepath);
$contentData = extractContent($content);
$contentJson = json_encode($contentData);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Content Presentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no" />
    <meta name="msapplication-tap-highlight" content="no" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    <link href="css/filter.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.20.7/babel.min.js"></script>
    <script>
        window.MathJax = {
            tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']], processEscapes: true, processEnvironments: true },
            options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] }
        };
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-mml-chtml.js"></script>
</head>
<body class="bg-gray-100">
    <div id="root"></div>
    
    <script>
        // Define content data globally
        window.contentData = <?php echo $contentJson ?? '{}'; ?>;
        
        // Highlighter utilities - fixed auto-deactivation
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
                if (pathTimeoutRef.current) clearTimeout(pathTimeoutRef.current);
                
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
                
                setState('pathTimeoutRef', timeoutId);
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
                
                if (pathTimeoutRef.current) {
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
                    
                    if (state.pathTimeoutRef.current) {
                        clearTimeout(state.pathTimeoutRef.current);
                        setState('pathTimeoutRef', null);
                    }
                } else {
                    // Deactivating - clear everything
                    setState('pathPoints', []);
                    setState('currentPath', '');
                    setState('allPaths', []);
                    setState('fixedYPosition', null);
                    
                    if (state.pathTimeoutRef.current) {
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
    </script>
    
    <script type="text/babel">
        const ContentPresentation = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const shouldOpenMenu = urlParams.get('openMenu') === 'true';
            
            const contentTypes = [
                {id: 'defn', label: 'Definitions', className: 'defn', key: 'd'},
                {id: 'thm', label: 'Theorems', className: 'thm', key: 't'},
                {id: 'other', label: 'Other statements', className: 'prop', contents: ['prop', 'lem', 'cor'], key: 'o'},
                {id: 'exmp', label: 'Examples', className: 'exmp', key: 'e'},
                {id: 'rmk', label: 'Remarks', className: 'rmk', key: 'r'},
                {id: 'vis', label: 'Graphics', className: 'thm', key: 'g'}
            ];

            // Helper function to check if content type is available
            const isContentAvailable = (type) => {
                if (type === 'other') {
                    const otherContent = [...(window.contentData['prop'] || []), 
                                          ...(window.contentData['lem'] || []), 
                                          ...(window.contentData['cor'] || [])];
                    return otherContent.length > 0;
                }
                return window.contentData[type] && window.contentData[type].length > 0;
            };

            // State variables
            const [activeType, setActiveType] = React.useState(() => {
                const availableType = contentTypes.find(type => isContentAvailable(type.id));
                return availableType ? availableType.id : null;
            });
            const [currentIndex, setCurrentIndex] = React.useState(0);
            const [isMenuOpen, setIsMenuOpen] = React.useState(shouldOpenMenu);
            const [showHighlightsOnly, setShowHighlightsOnly] = React.useState(false);
            const [isPlaying, setIsPlaying] = React.useState(false);
            
            // Note-taking state
            const [isNoteMode, setIsNoteMode] = React.useState(false);
            const [isDrawing, setIsDrawing] = React.useState(false);
            const [currentStroke, setCurrentStroke] = React.useState([]);
            const [savedNotes, setSavedNotes] = React.useState({});
            const [strokeColor, setStrokeColor] = React.useState('#000000');
            const [strokeWidth, setStrokeWidth] = React.useState(2);
            const [currentPage, setCurrentPage] = React.useState(1);
            
            // Path smoothing data structures
            const [pathPoints, setPathPoints] = React.useState([]);
            const [smoothedPath, setSmoothedPath] = React.useState([]);
            
            // Smoothing settings
            const smoothingFactor = 0.2; // Lower = smoother (0.1 to 0.3 is a good range)
            const smoothingInterval = 8; // Points per smoothing operation
            
            // Initialize highlighter state
            const highlighterState = window.HighlighterUtils.initializeState();
            const [isHighlighterActive, setIsHighlighterActive] = React.useState(highlighterState.isHighlighterActive);
            const [highlighterPosition, setHighlighterPosition] = React.useState(highlighterState.highlighterPosition);
            const [pathPointsHighlighter, setPathPointsHighlighter] = React.useState(highlighterState.pathPoints);
            const [currentPath, setCurrentPath] = React.useState(highlighterState.currentPath);
            const [allPaths, setAllPaths] = React.useState(highlighterState.allPaths);
            const [fixedYPosition, setFixedYPosition] = React.useState(highlighterState.fixedYPosition);
            const [lastActivityTime, setLastActivityTime] = React.useState(highlighterState.lastActivityTime);
            
            // Refs
            const contentRef = React.useRef(null);
            const canvasRef = React.useRef(null);
            const pathTimeoutRef = React.useRef(null);
            const autoDeactivateTimeoutRef = React.useRef(null);
            const lastKnownMousePosition = React.useRef({ x: 0, y: 0 });
            const videoRef = React.useRef(null);
            
            // Get current content
            const currentContent = activeType === 'other' 
                ? [...(window.contentData['prop'] || []), 
                   ...(window.contentData['lem'] || []), 
                   ...(window.contentData['cor'] || [])]
                : window.contentData[activeType] || [];
            const currentItem = currentContent[currentIndex];
            const isVideo = activeType === 'vis' && currentItem?.subtype === 'video';
            
            // Get current content ID for storing notes
            const getCurrentContentId = () => {
                return `${activeType}-${currentIndex}`;
            };
            
            // Get current note ID (includes page number)
            const getCurrentNoteId = () => {
                return `${getCurrentContentId()}-page-${currentPage}`;
            };

            // Helper function to update specific state values for highlighter
            const setHighlighterState = (key, value) => {
                switch (key) {
                    case 'isHighlighterActive': setIsHighlighterActive(value); break;
                    case 'highlighterPosition': setHighlighterPosition(value); break;
                    case 'pathPoints': setPathPointsHighlighter(value); break;
                    case 'currentPath': setCurrentPath(value); break;
                    case 'allPaths': setAllPaths(value); break;
                    case 'fixedYPosition': setFixedYPosition(value); break;
                    case 'lastActivityTime': setLastActivityTime(value); break;
                    case 'pathTimeoutRef': pathTimeoutRef.current = value; break;
                    case 'autoDeactivateTimeoutRef': autoDeactivateTimeoutRef.current = value; break;
                    default: break;
                }
            };
            
            // Build the current state object for the highlighter
            const getCurrentHighlighterState = () => ({
                isHighlighterActive, highlighterPosition,
                pathPoints: pathPointsHighlighter, currentPath, allPaths, fixedYPosition, lastActivityTime,
                lastKnownMousePosition, pathTimeoutRef, autoDeactivateTimeoutRef
            });

            // Check if content has highlights
            const hasHighlights = React.useMemo(() => {
                if (activeType === 'vis' || !currentItem?.content) return false;
                const content = currentItem.content;
                return content.includes('<strong>') && content.includes('•');
            }, [currentItem, activeType]);

            // Process content for highlights-only mode
            const processContent = (content) => {
                if (!showHighlightsOnly || !hasHighlights) return content;
                const matches = content.match(/<strong>[^<]*•[^<]*<\/strong>/g) || [];
                return matches.join(' ');
            };

            // Navigation handlers
            const handlePrevious = () => {
                setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
            };
            
            const handleNext = () => {
                setCurrentIndex(prev => (prev < currentContent.length - 1 ? prev + 1 : prev));
            };

            const handleTypeChange = (type) => {
                if (isContentAvailable(type)) {
                    setActiveType(type);
                    setCurrentIndex(0);
                    setIsMenuOpen(false);
                    setIsPlaying(false);
                }
            };

            const handlePlayPause = () => {
                if (videoRef.current) {
                    if (videoRef.current.paused) {
                        videoRef.current.play();
                        setIsPlaying(true);
                    } else {
                        videoRef.current.pause();
                        setIsPlaying(false);
                    }
                }
            };
            
            // Toggle note-taking mode
            const toggleNoteMode = () => {
                // Save current strokes if any before toggling
                if (isNoteMode && currentStroke.length > 1) {
                    saveCurrentStroke();
                }
                
                // Always save notes before toggling
                saveNotesToStorage();
                
                setIsNoteMode(!isNoteMode);
                
                // If turning on note mode, initialize canvas
                if (!isNoteMode) {
                    setTimeout(() => {
                        initCanvas();
                        loadPageStrokes();
                    }, 100);
                }
            };
            
            // Page navigation for notes
            const goToPage = (page) => {
                // Save current strokes before changing page
                if (currentStroke.length > 1) {
                    saveCurrentStroke();
                }
                
                // Save all notes before changing page
                saveNotesToStorage();
                
                setCurrentPage(page);
                
                // Load strokes for the new page
                setTimeout(() => {
                    loadPageStrokes();
                }, 50);
            };
            
            const nextPage = () => {
                // Get the content ID
                const contentId = getCurrentContentId();
                
                // Get max page for this content
                const contentNotes = savedNotes[contentId] || {};
                const maxPage = contentNotes.maxPage || 1;
                
                // If we're on the last page, create a new one
                if (currentPage >= maxPage) {
                    // Update max page in saved notes
                    setSavedNotes(prev => {
                        const content = prev[contentId] || {};
                        return {
                            ...prev,
                            [contentId]: {
                                ...content,
                                maxPage: currentPage + 1
                            }
                        };
                    });
                }
                
                goToPage(currentPage + 1);
            };
            
            const prevPage = () => {
                if (currentPage > 1) {
                    goToPage(currentPage - 1);
                }
            };
            
            // Disable context menu
            React.useEffect(() => {
                const disableContextMenu = (e) => {
                    e.preventDefault();
                    return false;
                };
                
                if (canvasRef.current) {
                    canvasRef.current.addEventListener('contextmenu', disableContextMenu);
                    return () => {
                        if (canvasRef.current) {
                            canvasRef.current.removeEventListener('contextmenu', disableContextMenu);
                        }
                    };
                }
            }, [canvasRef.current]);
            
            // Disable text selection globally during drawing mode
            React.useEffect(() => {
                if (isNoteMode) {
                    // Disable all selection and callout menus when in note mode
                    document.body.style.webkitUserSelect = 'none';
                    document.body.style.webkitTouchCallout = 'none';
                    document.body.style.userSelect = 'none';
                    
                    // Re-enable when exiting note mode
                    return () => {
                        document.body.style.webkitUserSelect = '';
                        document.body.style.webkitTouchCallout = '';
                        document.body.style.userSelect = '';
                    };
                }
            }, [isNoteMode]);
            
            // IMPROVED: Canvas initialization with better resolution handling
            const initCanvas = () => {
                if (!canvasRef.current) return;
                
                const canvas = canvasRef.current;
                const container = canvas.parentElement;
                
                // Get the display pixel ratio for better rendering on high-DPI displays
                const dpr = window.devicePixelRatio || 1;
                
                // Set canvas dimensions to match container with pixel ratio adjustment
                canvas.width = container.clientWidth * dpr;
                canvas.height = container.clientHeight * dpr;
                
                // Set CSS size
                canvas.style.width = `${container.clientWidth}px`;
                canvas.style.height = `${container.clientHeight}px`;
                
                // Set up canvas context with adjusted scaling
                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
            };
            
            // Path smoothing function
            const smoothPath = (points, smoothingFactor, stepSize) => {
                if (points.length < 3) return points;
                
                const smoothed = [points[0]]; // Start with the first point
                
                // Apply Catmull-Rom spline smoothing
                for (let i = 1; i < points.length - 1; i++) {
                    const prev = points[i - 1];
                    const curr = points[i];
                    const next = points[i + 1];
                    
                    // Calculate control points for Catmull-Rom curve
                    const nextX = curr.x + ((next.x - prev.x) * smoothingFactor);
                    const nextY = curr.y + ((next.y - prev.y) * smoothingFactor);
                    
                    // Create new smoothed point
                    smoothed.push({
                        ...curr,
                        x: nextX,
                        y: nextY
                    });
                    
                    // Skip points for performance if needed
                    i += (stepSize > 1) ? (stepSize - 1) : 0;
                }
                
                // Add the last point
                if (points.length > 1) {
                    smoothed.push(points[points.length - 1]);
                }
                
                return smoothed;
            };
            
            // Draw the smooth path on canvas
            const drawSmoothPath = (smoothedPoints) => {
                if (!canvasRef.current || smoothedPoints.length < 2) return;
                
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const dpr = window.devicePixelRatio || 1;
                
                // Clear canvas and redraw the entire path
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                
                // Redraw all saved strokes first
                loadPageStrokes();
                
                // Then draw the current smooth path
                ctx.beginPath();
                ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
                
                for (let i = 1; i < smoothedPoints.length; i++) {
                    const point = smoothedPoints[i];
                    const prevPoint = smoothedPoints[i - 1];
                    
                    // If we have four points, we can do cubic Bezier curve
                    if (i >= 2 && i < smoothedPoints.length - 1) {
                        const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
                        const cp1y = prevPoint.y + (point.y - prevPoint.y) / 3;
                        const cp2x = point.x - (point.x - prevPoint.x) / 3;
                        const cp2y = point.y - (point.y - prevPoint.y) / 3;
                        
                        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                    }
                }
                
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.stroke();
            };
            
            // IMPROVED: Start drawing function with Apple Pencil support
            const startDrawing = (e) => {
                if (!canvasRef.current || !isNoteMode) return;
                
                // Prevent default behavior to avoid scrolling and other interactions
                e.preventDefault();
                e.stopPropagation();
                
                setIsDrawing(true);
                
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                
                // Get pointer position with improved touch handling
                let x, y;
                
                if (e.touches && e.touches.length > 0) {
                    // Touch event (including Apple Pencil)
                    x = e.touches[0].clientX - rect.left;
                    y = e.touches[0].clientY - rect.top;
                } else {
                    // Mouse event
                    x = e.clientX - rect.left;
                    y = e.clientY - rect.top;
                }
                
                // Scale coordinates according to canvas resolution vs display size
                x = x * (canvas.width / rect.width / dpr);
                y = y * (canvas.height / rect.height / dpr);
                
                // Create point object
                const point = { 
                    x, 
                    y, 
                    color: strokeColor, 
                    width: strokeWidth
                };
                
                // Initialize path points array for smoothing
                setPathPoints([point]);
                setSmoothedPath([point]);
                setCurrentStroke([point]);
                
                // Start drawing on canvas
                const ctx = canvas.getContext('2d');
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y); // Draw a point
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.stroke();
            };
            
            // IMPROVED: Drawing function with better touch handling and smoothing
            const draw = (e) => {
                if (!isDrawing || !canvasRef.current || !isNoteMode) return;
                
                // Always prevent default to stop scrolling and other interactions
                e.preventDefault();
                e.stopPropagation();
                
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                
                // Get pointer position with improved touch handling
                let x, y;
                
                if (e.touches && e.touches.length > 0) {
                    // Touch event (including Apple Pencil)
                    x = e.touches[0].clientX - rect.left;
                    y = e.touches[0].clientY - rect.top;
                } else {
                    // Mouse event
                    x = e.clientX - rect.left;
                    y = e.clientY - rect.top;
                }
                
                // Scale coordinates according to canvas resolution vs display size
                x = x * (canvas.width / rect.width / dpr);
                y = y * (canvas.height / rect.height / dpr);
                
                // Create point
                const point = { x, y, color: strokeColor, width: strokeWidth };
                
                // Add point to raw path points
                setPathPoints(prev => [...prev, point]);
                
                // Apply smoothing if we have enough points
                if (pathPoints.length >= 3) {
                    // Apply Catmull-Rom spline smoothing
                    const smoothedPoints = smoothPath(
                        [...pathPoints, point], 
                        smoothingFactor, 
                        smoothingInterval
                    );
                    
                    setSmoothedPath(smoothedPoints);
                    
                    // Redraw the entire smooth path
                    drawSmoothPath(smoothedPoints);
                } else {
                    // Not enough points yet, just add to the current stroke
                    setCurrentStroke(prev => [...prev, point]);
                    
                    // Draw line on canvas
                    const ctx = canvas.getContext('2d');
                    const prevPoint = pathPoints[pathPoints.length - 1];
                    
                    ctx.beginPath();
                    ctx.moveTo(prevPoint.x, prevPoint.y);
                    ctx.lineTo(x, y);
                    
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = strokeWidth;
                    ctx.stroke();
                }
            };
            
            // IMPROVED: Stop drawing function with better event handling
            const stopDrawing = (e) => {
                if (!isDrawing || !isNoteMode) return;
                
                // Prevent default behavior
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                setIsDrawing(false);
                
                // Finalize the smoothed path
                const finalStroke = smoothedPath.length > 1 ? smoothedPath : pathPoints;
                
                if (finalStroke.length > 1) {
                    // Save the stroke if it has points
                    saveCurrentStroke(finalStroke);
                }
                
                // Reset path data
                setPathPoints([]);
                setSmoothedPath([]);
                setCurrentStroke([]);
            };
            
            // Enhanced Pointer Down with timeout prevention
            const handlePointerDown = (e) => {
                // Check if it's a pen (Apple Pencil)
                if (e.pointerType === 'pen' || e.pointerType === 'touch' || e.pointerType === 'mouse') {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!canvasRef.current || !isNoteMode) return;
                    
                    // Prevent context menu and selection on all related elements
                    e.currentTarget.style.webkitUserSelect = 'none';
                    e.currentTarget.style.webkitTouchCallout = 'none';
                    e.currentTarget.style.touchAction = 'none';
                    
                    const canvas = canvasRef.current;
                    const rect = canvas.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    
                    // Calculate coordinates with proper scaling
                    const x = (e.clientX - rect.left) * (canvas.width / rect.width / dpr);
                    const y = (e.clientY - rect.top) * (canvas.height / rect.height / dpr);
                    
                    // Start new stroke
                    setIsDrawing(true);
                    
                    // Initialize path points array for smoothing
                    const point = { 
                        x, 
                        y, 
                        color: strokeColor, 
                        width: strokeWidth, 
                        pressure: e.pressure || 1 
                    };
                    
                    setPathPoints([point]);
                    setSmoothedPath([point]);
                    setCurrentStroke([point]);
                    
                    // Draw initial point
                    const ctx = canvas.getContext('2d');
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    // Use pressure for line width if available
                    const adjustedWidth = e.pressure ? strokeWidth * e.pressure * 2 : strokeWidth;
                    
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = adjustedWidth;
                    ctx.stroke();
                }
            };
            
            // Enhanced Pointer Move with path smoothing
            const handlePointerMove = (e) => {
                if (!isDrawing || !canvasRef.current || !isNoteMode) return;
                
                // Handle all pointer types but focus on pen
                if (e.pointerType === 'pen' || e.pointerType === 'touch' || e.pointerType === 'mouse') {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const canvas = canvasRef.current;
                    const rect = canvas.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    
                    // Calculate coordinates with proper scaling
                    const x = (e.clientX - rect.left) * (canvas.width / rect.width / dpr);
                    const y = (e.clientY - rect.top) * (canvas.height / rect.height / dpr);
                    
                    // Store pressure value for variable line width
                    const pressure = e.pressure || 1;
                    const point = { x, y, color: strokeColor, width: strokeWidth, pressure };
                    
                    // Add point to raw path points
                    setPathPoints(prev => [...prev, point]);
                    
                    // Apply smoothing if we have enough points
                    if (pathPoints.length >= 3) {
                        // Simple Catmull-Rom spline smoothing
                        const smoothedPoints = smoothPath(
                            [...pathPoints, point], 
                            smoothingFactor, 
                            smoothingInterval
                        );
                        
                        setSmoothedPath(smoothedPoints);
                        
                        // Redraw the entire smooth path
                        drawSmoothPath(smoothedPoints);
                    } else {
                        // Not enough points yet, just add to the current stroke
                        setCurrentStroke(prev => [...prev, point]);
                        
                        // Draw line on canvas
                        const ctx = canvas.getContext('2d');
                        const prevPoint = pathPoints[pathPoints.length - 1];
                        
                        ctx.beginPath();
                        ctx.moveTo(prevPoint.x, prevPoint.y);
                        ctx.lineTo(x, y);
                        
                        // Use pressure for line width
                        const adjustedWidth = pressure ? strokeWidth * pressure * 2 : strokeWidth;
                        
                        ctx.strokeStyle = strokeColor;
                        ctx.lineWidth = adjustedWidth;
                        ctx.stroke();
                    }
                }
            };
            
            // Enhanced Pointer Up with touchend handling
            const handlePointerUp = (e) => {
                if (!isDrawing || !isNoteMode) return;
                
                // Handle all pointer types
                if (e && (e.pointerType === 'pen' || e.pointerType === 'touch' || e.pointerType === 'mouse')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                // Finalize the smoothed path
                const finalStroke = smoothedPath.length > 1 ? smoothedPath : pathPoints;
                setCurrentStroke(finalStroke);
                
                setIsDrawing(false);
                
                // Save the stroke if it has points
                if ((smoothedPath.length > 1) || (pathPoints.length > 1)) {
                    saveCurrentStroke(finalStroke);
                }
                
                // Reset path data
                setPathPoints([]);
                setSmoothedPath([]);
                setCurrentStroke([]);
            };
            
            // Save current stroke to saved notes
            const saveCurrentStroke = (strokeToSave = null) => {
                const strokeData = strokeToSave || currentStroke;
                const noteId = getCurrentNoteId();
                
                setSavedNotes(prev => {
                    const contentId = getCurrentContentId();
                    const contentNotes = prev[contentId] || {};
                    const pageStrokes = contentNotes[noteId] || [];
                    const maxPage = Math.max(contentNotes.maxPage || 1, currentPage);
                    
                    return {
                        ...prev,
                        [contentId]: {
                            ...contentNotes,
                            [noteId]: [...pageStrokes, [...strokeData]],
                            maxPage
                        }
                    };
                });
            };
            
            // IMPROVED: Load page strokes with proper scaling
            const loadPageStrokes = () => {
                if (!canvasRef.current) return;
                
                const noteId = getCurrentNoteId();
                const contentId = getCurrentContentId();
                const contentNotes = savedNotes[contentId] || {};
                const strokes = contentNotes[noteId] || [];
                
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const dpr = window.devicePixelRatio || 1;
                
                // Clear canvas using the proper DPI-adjusted dimensions
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                
                // Draw each saved stroke
                strokes.forEach(stroke => {
                    if (stroke.length < 2) return;
                    
                    const firstPoint = stroke[0];
                    
                    ctx.beginPath();
                    ctx.moveTo(firstPoint.x, firstPoint.y);
                    ctx.strokeStyle = firstPoint.color;
                    ctx.lineWidth = firstPoint.width;
                    
                    // Draw rest of the points
                    for (let i = 1; i < stroke.length; i++) {
                        ctx.lineTo(stroke[i].x, stroke[i].y);
                    }
                    
                    ctx.stroke();
                });
            };
            
            // Clear canvas (current page only)
            const clearCanvas = () => {
                if (!canvasRef.current) return;
                
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const dpr = window.devicePixelRatio || 1;
                
                // Clear canvas with proper DPI scaling
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                
                // Clear saved strokes for current page
                const noteId = getCurrentNoteId();
                const contentId = getCurrentContentId();
                
                setSavedNotes(prev => {
                    const contentNotes = prev[contentId] || {};
                    
                    // Create a new object without the current page's strokes
                    const newContentNotes = { ...contentNotes };
                    delete newContentNotes[noteId];
                    
                    return {
                        ...prev,
                        [contentId]: newContentNotes
                    };
                });
                
                // Save cleared state
                setTimeout(saveNotesToStorage, 100);
            };
            
            // Save all notes to localStorage
            const saveNotesToStorage = () => {
                try {
                    localStorage.setItem('drawing-notes', JSON.stringify(savedNotes));
                } catch (error) {
                    console.error('Error saving notes:', error);
                }
            };
            
            // Load notes from localStorage
            React.useEffect(() => {
                try {
                    const savedDrawings = localStorage.getItem('drawing-notes');
                    if (savedDrawings) {
                        setSavedNotes(JSON.parse(savedDrawings));
                    }
                } catch (error) {
                    console.error('Error loading saved drawings:', error);
                }
            }, []);
            
            // Handle window resize for canvas
            React.useEffect(() => {
                const handleResize = () => {
                    if (isNoteMode && canvasRef.current) {
                        initCanvas();
                        loadPageStrokes();
                    }
                };
                
                window.addEventListener('resize', handleResize);
                return () => window.removeEventListener('resize', handleResize);
            }, [isNoteMode, savedNotes, currentPage]);
            
            // Set up canvas when content or page changes
            React.useEffect(() => {
                if (isNoteMode && canvasRef.current) {
                    setTimeout(() => {
                        initCanvas();
                        loadPageStrokes();
                    }, 100);
                }
                
                // Set current page to 1 when content changes
                if (!isNoteMode) {
                    setCurrentPage(1);
                }
            }, [currentIndex, activeType, isNoteMode, currentPage]);
            
            // Save notes before unmounting
            React.useEffect(() => {
                return () => {
                    if (currentStroke.length > 1) {
                        saveCurrentStroke();
                    }
                    saveNotesToStorage();
                };
            }, []);
            
            // Mouse position tracking
            React.useEffect(() => {
                const trackMousePosition = (e) => {
                    const position = window.HighlighterUtils.trackMousePosition(e, contentRef, lastKnownMousePosition);
                    if (position) lastKnownMousePosition.current = position;
                };
                
                document.addEventListener('mousemove', trackMousePosition);
                return () => document.removeEventListener('mousemove', trackMousePosition);
            }, []);
            
            // Initialize highlighter position
            React.useEffect(() => {
                if (contentRef.current) {
                    const rect = contentRef.current.getBoundingClientRect();
                    lastKnownMousePosition.current = { x: rect.width / 2, y: rect.height / 2 };
                }
            }, []);
            
            // Mouse event handlers for highlighter
            const handleMouseMove = (e) => {
                window.HighlighterUtils.handleMouseMove(e, getCurrentHighlighterState(), setHighlighterState, contentRef);
            };
            
            const handleMouseUp = () => {
                window.HighlighterUtils.handleMouseUp(getCurrentHighlighterState(), setHighlighterState);
            };

            // Keyboard shortcuts
            React.useEffect(() => {
                const handleKeyPress = (event) => {
                    if (event.key === 'ArrowLeft' && currentIndex > 0) {
                        setCurrentIndex(currentIndex - 1);
                    } else if (event.key === 'ArrowRight' && currentIndex < currentContent.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                    } else if (event.key === ' ' && isVideo) {
                        event.preventDefault();
                        handlePlayPause();
                    } else if (event.key.toLowerCase() === 'h') {
                        window.HighlighterUtils.toggleHighlighter(getCurrentHighlighterState(), setHighlighterState);
                    } else if (event.key.toLowerCase() === 'n') {
                        toggleNoteMode();
                    } else if (event.key.toLowerCase() === 'c' && isNoteMode) {
                        clearCanvas();
                    } else if (event.key === 'ArrowUp' && isNoteMode) {
                        prevPage();
                    } else if (event.key === 'ArrowDown' && isNoteMode) {
                        nextPage();
                    } else {
                        contentTypes.forEach(type => {
                            if (event.key.toLowerCase() === type.key && isContentAvailable(type.id)) {
                                handleTypeChange(type.id);
                            }
                        });
                    }
                };

                window.addEventListener('keydown', handleKeyPress);
                return () => window.removeEventListener('keydown', handleKeyPress);
            }, [currentIndex, currentContent, isVideo, isHighlighterActive, isNoteMode, currentPage]);

            // MathJax typesetting
            React.useEffect(() => {
                if (window.MathJax) {
                    window.MathJax.typesetClear();
                    window.MathJax.typesetPromise();
                }
            }, [currentIndex, activeType, showHighlightsOnly]);

            // Video ended event
            React.useEffect(() => {
                const video = videoRef.current;
                if (video) {
                    const handleEnded = () => setIsPlaying(false);
                    video.addEventListener('ended', handleEnded);
                    return () => video.removeEventListener('ended', handleEnded);
                }
            }, [currentIndex, activeType]);
            
            // Cleanup timeouts
            React.useEffect(() => {
                return () => { 
                    if (pathTimeoutRef.current) clearTimeout(pathTimeoutRef.current);
                    if (autoDeactivateTimeoutRef.current) clearTimeout(autoDeactivateTimeoutRef.current);
                };
            }, []);
            
            // Render content based on type
            const renderContent = () => {
                if (activeType === 'vis') {
                    return currentItem.subtype === 'image' ? (
                        <img 
                            src={currentItem.src}
                            alt={currentItem.caption || ""}
                            className="media-content"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            src={currentItem.src}
                            className="media-content"
                        >
                            Your browser does not support the video tag.
                        </video>
                    );
                } else {
                    const processedContent = processContent(currentItem.content);
                    return (
                        <div 
                            className="p-4 overflow-auto max-h-full"
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />
                    );
                }
            };
            
            // Get page info for current content
            const getPageInfo = () => {
                const contentId = getCurrentContentId();
                const contentNotes = savedNotes[contentId] || {};
                const maxPage = contentNotes.maxPage || 1;
                
                return {
                    current: currentPage,
                    total: maxPage
                };
            };

            // No content available
            if (!activeType) {
                return (
                    <div className="flex items-center justify-center h-screen">
                        <p className="text-xl text-gray-600">No content available.</p>
                    </div>
                );
            }

            // Main render
            return (
                <div className="content-wrapper">
                    <div className={`content-container ${isHighlighterActive ? 'highlighter-active' : ''} ${isNoteMode ? 'split-view' : ''}`}>
                        <div 
                            className={`content-section ${isNoteMode ? 'half-width' : 'full-width'}`}
                            ref={contentRef}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div className="media-container">
                                {renderContent()}
                            </div>
                            
                            {window.HighlighterUtils.renderHighlighter(getCurrentHighlighterState())}

                            {!isMenuOpen && hasHighlights && (
                                <button
                                    onClick={() => setShowHighlightsOnly(!showHighlightsOnly)}
                                    className={`highlight-button ${showHighlightsOnly ? 'active' : ''}`}
                                >
                                    <i className={`fa fa-${showHighlightsOnly ? 'eye' : 'eye-slash'}`}></i>
                                </button>
                            )}

                            {!isMenuOpen && isVideo && (
                                <button
                                    onClick={handlePlayPause}
                                    className="video-button"
                                >
                                    <i className={`fa fa-${isPlaying ? 'pause' : 'play'}`}></i>
                                </button>
                            )}
                        </div>
                        
                        {isNoteMode && (
                            <div className="drawing-section">
                                <div className="drawing-toolbar">
                                    <button 
                                        className="drawing-tool-btn"
                                        onClick={clearCanvas}
                                        title="Clear Current Page"
                                        onTouchStart={(e) => e.stopPropagation()}
                                    >
                                        <i className="fa fa-eraser"></i>
                                    </button>
                                    
                                    <div className="color-picker">
                                        <button 
                                            className={`color-btn ${strokeColor === '#000000' ? 'active' : ''}`}
                                            onClick={() => setStrokeColor('#000000')}
                                            title="Black"
                                            style={{backgroundColor: '#000000'}}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        ></button>
                                        <button 
                                            className={`color-btn ${strokeColor === '#ff0000' ? 'active' : ''}`}
                                            onClick={() => setStrokeColor('#ff0000')}
                                            title="Red"
                                            style={{backgroundColor: '#ff0000'}}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        ></button>
                                        <button 
                                            className={`color-btn ${strokeColor === '#0000ff' ? 'active' : ''}`}
                                            onClick={() => setStrokeColor('#0000ff')}
                                            title="Blue"
                                            style={{backgroundColor: '#0000ff'}}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        ></button>
                                        <button 
                                            className={`color-btn ${strokeColor === '#008000' ? 'active' : ''}`}
                                            onClick={() => setStrokeColor('#008000')}
                                            title="Green"
                                            style={{backgroundColor: '#008000'}}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        ></button>
                                    </div>
                                    
                                    <div className="pen-size">
                                        <button 
                                            className={`size-btn ${strokeWidth === 1 ? 'active' : ''}`}
                                            onClick={() => setStrokeWidth(1)}
                                            title="Thin"
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <div className="size-indicator size-thin"></div>
                                        </button>
                                        <button 
                                            className={`size-btn ${strokeWidth === 3 ? 'active' : ''}`}
                                            onClick={() => setStrokeWidth(3)}
                                            title="Medium"
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <div className="size-indicator size-medium"></div>
                                        </button>
                                        <button 
                                            className={`size-btn ${strokeWidth === 5 ? 'active' : ''}`}
                                            onClick={() => setStrokeWidth(5)}
                                            title="Thick"
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <div className="size-indicator size-thick"></div>
                                        </button>
                                    </div>
                                    
                                    <div className="page-navigation">
                                        <button 
                                            className="page-nav-btn"
                                            onClick={prevPage}
                                            disabled={currentPage <= 1}
                                            title="Previous Page"
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <i className="fa fa-arrow-up"></i>
                                        </button>
                                        <span 
                                            className="page-indicator"
                                            style={{
                                                userSelect: 'none',
                                                pointerEvents: isDrawing ? 'none' : 'auto'
                                            }}
                                        >
                                            {currentPage} / {getPageInfo().total}
                                        </span>
                                        <button 
                                            className="page-nav-btn"
                                            onClick={nextPage}
                                            title="Next Page"
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <i className="fa fa-arrow-down"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="drawing-area">
                                    <canvas
                                        ref={canvasRef}
                                        className="drawing-canvas"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                        onTouchCancel={stopDrawing}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                        onPointerLeave={handlePointerUp}
                                        style={{
                                            touchAction: 'none',
                                            WebkitUserSelect: 'none',
                                            WebkitTouchCallout: 'none',
                                            msUserSelect: 'none',
                                            userSelect: 'none'
                                        }}
                                    ></canvas>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="controls-wrapper">
                        {/* Top controls */}
                        <div className="top-controls">
                            <div className="menu-controls relative">
                                <button 
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="control-button"
                                >
                                    <i className="fa fa-bars text-xl"></i>
                                </button>
                                
                                {isMenuOpen && (
                                    <div className="dropdown-menu">
                                        {contentTypes.map(({id, label, className}) => {
                                            const available = isContentAvailable(id);
                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => available && handleTypeChange(id)}
                                                    className={`dropdown-item ${available ? '' : 'unavailable'}`}
                                                    disabled={!available}
                                                >
                                                    {label}
                                                    {!available && <span className="unavailable-indicator"></span>}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setIsMenuOpen(false)}
                                            className="dropdown-item close-menu"
                                        >
                                            <i className="fa fa-times"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="book-controls">
                                <button 
                                    onClick={toggleNoteMode}
                                    className={`control-button ${isNoteMode ? 'active' : ''}`}
                                    title={isNoteMode ? "Hide Drawing Panel" : "Show Drawing Panel"}
                                >
                                    <i className={`fa fa-${isNoteMode ? 'compress' : 'pencil-alt'} text-xl`}></i>
                                </button>
                                <button 
                                    onClick={() => {
                                        // Save notes before navigating away
                                        if (isNoteMode && currentStroke.length > 1) {
                                            saveCurrentStroke();
                                        }
                                        saveNotesToStorage();
                                        
                                        const currentUrl = window.location.href;
                                        const newUrl = currentUrl.replace('filter.php', 'content.php');
                                        window.location.href = newUrl;
                                    }}
                                    className="control-button"
                                >
                                    <i className="fa fa-times text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        {/* Navigation arrows */}
                        <div className="side-controls">
                            <button
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                className="control-button"
                            >
                                <i className="fa fa-arrow-circle-left text-2xl"></i>
                            </button>
                            
                            <button
                                onClick={handleNext}
                                disabled={currentIndex === currentContent.length - 1}
                                className="control-button"
                            >
                                <i className="fa fa-arrow-circle-right text-2xl"></i>
                            </button>
                        </div>

                        <div className="bottom-controls">
                            <div className="video-controls">
                                {/* Controls moved to corner */}
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        // Render the component
        ReactDOM.createRoot(document.getElementById('root')).render(<ContentPresentation />);
    </script>
</body>
</html>