// app.js - Main application component without JSX

// App component
const App = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenMenu = urlParams.get('openMenu') === 'true';
    
    // Content types configuration
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

    // Find first available type
    const initialType = contentTypes.find(type => isContentAvailable(type.id));
    
    // State variables using React hooks
    const [activeType, setActiveType] = React.useState(initialType ? initialType.id : null);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isMenuOpen, setIsMenuOpen] = React.useState(shouldOpenMenu);
    const [showHighlightsOnly, setShowHighlightsOnly] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isNoteMode, setIsNoteMode] = React.useState(false);
    const [isHighlighterActive, setIsHighlighterActive] = React.useState(false);
    
    // Drawing state
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [currentStroke, setCurrentStroke] = React.useState([]);
    const [savedNotes, setSavedNotes] = React.useState({});
    const [strokeColor, setStrokeColor] = React.useState('#000000');
    const [strokeWidth, setStrokeWidth] = React.useState(2);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pathPoints, setPathPoints] = React.useState([]);
    const [smoothedPath, setSmoothedPath] = React.useState([]);
    
    // Refs
    const contentRef = React.useRef(null);
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const lastKnownMousePosition = React.useRef({ x: 0, y: 0 });
    
    // Smoothing settings for drawing
    const smoothingFactor = 0.2;
    const smoothingInterval = 8;
    
    // Get current content
    let currentContent = [];
    if (activeType === 'other') {
        currentContent = [
            ...(window.contentData['prop'] || []), 
            ...(window.contentData['lem'] || []), 
            ...(window.contentData['cor'] || [])
        ];
    } else if (window.contentData[activeType]) {
        currentContent = window.contentData[activeType];
    }
    
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
    
    // Check if content has highlights
    const hasHighlights = React.useMemo(() => {
        if (activeType === 'vis' || !currentItem?.content) return false;
        const content = currentItem.content;
        return content.includes('<strong>') && content.includes('•');
    }, [activeType, currentItem]);
    
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
    
    // Toggle highlighter
    const toggleHighlighter = () => {
        setIsHighlighterActive(!isHighlighterActive);
    };
    
    // Canvas initialization
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
    
    // Start drawing function
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
    
    // Draw function
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
            // Apply smoothing
            const smoothedPoints = window.DrawingUtils.smoothPath(
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
    
    // Stop drawing function
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
        
        // Save notes to storage
        setTimeout(saveNotesToStorage, 50);
    };
    
    // Load page strokes with proper scaling
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
            ctx.strokeStyle = firstPoint.color || strokeColor;
            ctx.lineWidth = firstPoint.width || strokeWidth;
            
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
        // Get max page for this content
        const contentId = getCurrentContentId();
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
    
    // Save all notes to localStorage
    const saveNotesToStorage = () => {
        try {
            localStorage.setItem('drawing-notes', JSON.stringify(savedNotes));
        } catch (error) {
            console.error('Error saving notes:', error);
        }
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
                toggleHighlighter();
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
    }, [currentIndex, currentContent.length, isVideo, isHighlighterActive, isNoteMode, currentPage]);

    // MathJax typesetting
    React.useEffect(() => {
        if (window.MathJax) {
            // Add a small delay to ensure content is fully rendered
            setTimeout(() => {
                window.MathJax.typesetClear();
                window.MathJax.typesetPromise().catch(error => {
                    console.error('MathJax typesetting failed:', error);
                });
            }, 100);
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
    
    // Save notes before unmounting
    React.useEffect(() => {
        return () => {
            if (currentStroke.length > 1) {
                saveCurrentStroke();
            }
            saveNotesToStorage();
        };
    }, []);
    
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
    
    // Disable context menu on canvas
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

    // If no content is available, render a message
    if (!activeType) {
        return React.createElement('div', { 
            className: 'flex items-center justify-center h-screen'
        }, 
            React.createElement('p', { 
                className: 'text-xl text-gray-600'
            }, 'No content available.')
        );
    }

    // Render content based on type
    let contentElement;
    if (activeType === 'vis') {
        if (currentItem.subtype === 'image') {
            contentElement = React.createElement('img', {
                src: currentItem.src,
                alt: currentItem.caption || "",
                className: "media-content"
            });
        } else {
            contentElement = React.createElement('video', {
                ref: videoRef,
                src: currentItem.src,
                className: "media-content"
            }, 'Your browser does not support the video tag.');
        }
    } else {
        const processedContent = processContent(currentItem.content);
        contentElement = React.createElement('div', {
            className: "p-4 overflow-auto max-h-full",
            dangerouslySetInnerHTML: { __html: processedContent }
        });
    }

    // Create buttons for controls
    const menuButton = React.createElement('button', {
        onClick: () => setIsMenuOpen(!isMenuOpen),
        className: 'control-button'
    }, React.createElement('i', { className: 'fa fa-bars text-xl' }));

    const noteButton = React.createElement('button', {
        onClick: toggleNoteMode,
        className: `control-button ${isNoteMode ? 'active' : ''}`,
        title: isNoteMode ? "Hide Drawing Panel" : "Show Drawing Panel"
    }, React.createElement('i', { 
        className: `fa fa-${isNoteMode ? 'compress' : 'pencil-alt'} text-xl` 
    }));

    const closeButton = React.createElement('button', {
        onClick: () => {
            // Save notes before navigating away
            if (isNoteMode && currentStroke.length > 1) {
                saveCurrentStroke();
            }
            saveNotesToStorage();
            
            const currentUrl = window.location.href;
            const newUrl = currentUrl.replace('filter.php', 'content.php');
            window.location.href = newUrl;
        },
        className: 'control-button'
    }, React.createElement('i', { className: 'fa fa-times text-2xl' }));

    // Create navigation buttons
    const prevButton = React.createElement('button', {
        onClick: handlePrevious,
        disabled: currentIndex === 0,
        className: 'control-button'
    }, React.createElement('i', { className: 'fa fa-arrow-circle-left text-2xl' }));

    const nextButton = React.createElement('button', {
        onClick: handleNext,
        disabled: currentIndex === currentContent.length - 1,
        className: 'control-button'
    }, React.createElement('i', { className: 'fa fa-arrow-circle-right text-2xl' }));

    // Create menu dropdown
    const menuDropdown = isMenuOpen ? React.createElement('div', { className: 'dropdown-menu' },
        contentTypes.map(({id, label}) => {
            const available = isContentAvailable(id);
            return React.createElement('button', {
                key: id,
                onClick: () => available && handleTypeChange(id),
                className: `dropdown-item ${available ? '' : 'unavailable'}`,
                disabled: !available
            }, label);
        }),
        React.createElement('button', {
            onClick: () => setIsMenuOpen(false),
            className: 'dropdown-item close-menu'
        }, React.createElement('i', { className: 'fa fa-times' }))
    ) : null;

    // Create highlights toggle button
    const highlightsButton = !isMenuOpen && hasHighlights ? React.createElement('button', {
        onClick: () => setShowHighlightsOnly(!showHighlightsOnly),
        className: `highlight-button ${showHighlightsOnly ? 'active' : ''}`
    }, React.createElement('i', { 
        className: `fa fa-${showHighlightsOnly ? 'eye' : 'eye-slash'}` 
    })) : null;

    // Create video control button
    const videoButton = !isMenuOpen && isVideo ? React.createElement('button', {
        onClick: handlePlayPause,
        className: 'video-button'
    }, React.createElement('i', { 
        className: `fa fa-${isPlaying ? 'pause' : 'play'}` 
    })) : null;
    
    // Create Drawing Panel
    const renderDrawingPanel = () => {
        if (!isNoteMode) return null;
        
        // Page info
        const pageInfo = getPageInfo();
        
        // Clear button
        const clearButton = React.createElement('button', {
            className: 'drawing-tool-btn',
            onClick: clearCanvas,
            title: 'Clear Current Page',
            onTouchStart: (e) => e.stopPropagation()
        }, React.createElement('i', { className: 'fa fa-eraser' }));
        
        // Color buttons
        const colorButtons = [
            { color: '#000000', title: 'Black' },
            { color: '#ff0000', title: 'Red' },
            { color: '#0000ff', title: 'Blue' },
            { color: '#008000', title: 'Green' }
        ].map(({color, title}) => 
            React.createElement('button', {
                key: color,
                className: `color-btn ${strokeColor === color ? 'active' : ''}`,
                onClick: () => setStrokeColor(color),
                title: title,
                style: { backgroundColor: color },
                onTouchStart: (e) => e.stopPropagation()
            })
        );
        
        const colorPicker = React.createElement('div', { className: 'color-picker' }, ...colorButtons);
        
        // Size buttons
        const sizeButtons = [
            { size: 1, className: 'size-thin', title: 'Thin' },
            { size: 3, className: 'size-medium', title: 'Medium' },
            { size: 5, className: 'size-thick', title: 'Thick' }
        ].map(({size, className, title}) => 
            React.createElement('button', {
                key: size,
                className: `size-btn ${strokeWidth === size ? 'active' : ''}`,
                onClick: () => setStrokeWidth(size),
                title: title,
                onTouchStart: (e) => e.stopPropagation()
            }, React.createElement('div', { className: `size-indicator ${className}` }))
        );
        
        const sizeSelector = React.createElement('div', { className: 'pen-size' }, ...sizeButtons);
        
        // Page navigation
        const prevPageButton = React.createElement('button', {
            className: 'page-nav-btn',
            onClick: prevPage,
            disabled: currentPage <= 1,
            title: 'Previous Page',
            onTouchStart: (e) => e.stopPropagation()
        }, React.createElement('i', { className: 'fa fa-arrow-up' }));
        
        const nextPageButton = React.createElement('button', {
            className: 'page-nav-btn',
            onClick: nextPage,
            title: 'Next Page',
            onTouchStart: (e) => e.stopPropagation()
        }, React.createElement('i', { className: 'fa fa-arrow-down' }));
        
        const pageIndicator = React.createElement('span', {
            className: 'page-indicator',
            style: {
                userSelect: 'none',
                pointerEvents: isDrawing ? 'none' : 'auto'
            }
        }, `${pageInfo.current} / ${pageInfo.total}`);
        
        const pageNavigation = React.createElement('div', { className: 'page-navigation' },
            prevPageButton,
            pageIndicator,
            nextPageButton
        );
        
        // Drawing canvas
        const canvas = React.createElement('canvas', {
            ref: canvasRef,
            className: 'drawing-canvas',
            onMouseDown: startDrawing,
            onMouseMove: draw,
            onMouseUp: stopDrawing,
            onMouseLeave: stopDrawing,
            onTouchStart: startDrawing,
            onTouchMove: draw,
            onTouchEnd: stopDrawing,
            onTouchCancel: stopDrawing,
            style: {
                touchAction: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                msUserSelect: 'none',
                userSelect: 'none'
            }
        });
        
        // Drawing area container
        const drawingArea = React.createElement('div', { className: 'drawing-area' }, canvas);
        
        // Toolbar
        const toolbar = React.createElement('div', { className: 'drawing-toolbar' },
            clearButton,
            colorPicker,
            sizeSelector,
            pageNavigation
        );
        
        // Drawing panel
        return React.createElement('div', { className: 'drawing-section' },
            toolbar,
            drawingArea
        );
    };

    // Main render structure
    return React.createElement('div', { className: 'content-wrapper' },
        // Content container
        React.createElement('div', { 
            className: `content-container ${isHighlighterActive ? 'highlighter-active' : ''} ${isNoteMode ? 'split-view' : ''}` 
        },
            // Content section
            React.createElement('div', { 
                className: `content-section ${isNoteMode ? 'half-width' : 'full-width'}`,
                ref: contentRef,
                onMouseMove: isHighlighterActive ? (e) => {
                    if (window.HighlighterUtils && window.HighlighterUtils.handleMouseMove) {
                        const state = {
                            isHighlighterActive,
                            pathPoints: [],
                            fixedYPosition: null,
                            pathTimeoutRef: { current: null },
                            autoDeactivateTimeoutRef: null,
                            lastActivityTime: Date.now()
                        };
                        const setState = (key, value) => {
                            // Simple state setting function
                            if (key === 'isHighlighterActive') setIsHighlighterActive(value);
                        };
                        window.HighlighterUtils.handleMouseMove(e, state, setState, contentRef);
                    }
                } : null,
                onMouseUp: isHighlighterActive ? () => {
                    if (window.HighlighterUtils && window.HighlighterUtils.handleMouseUp) {
                        const state = {
                            isHighlighterActive,
                            currentPath: '',
                            pathTimeoutRef: { current: null }
                        };
                        const setState = (key, value) => {
                            // Simple state setting function
                            if (key === 'isHighlighterActive') setIsHighlighterActive(value);
                        };
                        window.HighlighterUtils.handleMouseUp(state, setState);
                    }
                } : null,
                onMouseLeave: isHighlighterActive ? () => {
                    if (window.HighlighterUtils && window.HighlighterUtils.handleMouseUp) {
                        const state = {
                            isHighlighterActive,
                            currentPath: '',
                            pathTimeoutRef: { current: null }
                        };
                        const setState = (key, value) => {
                            // Simple state setting function
                            if (key === 'isHighlighterActive') setIsHighlighterActive(value);
                        };
                        window.HighlighterUtils.handleMouseUp(state, setState);
                    }
                } : null
            },
                // Media container
                React.createElement('div', { className: 'media-container' },
                    contentElement
                ),
                // Buttons that overlay the content
                highlightsButton,
                videoButton
            ),
            // Drawing panel (will be null if isNoteMode is false)
            renderDrawingPanel()
        ),
        
        // Controls wrapper
        React.createElement('div', { className: 'controls-wrapper' },
            // Top controls
            React.createElement('div', { className: 'top-controls' },
                // Menu controls
                React.createElement('div', { className: 'menu-controls relative' },
                    menuButton,
                    menuDropdown
                ),
                // Book controls
                React.createElement('div', { className: 'book-controls' },
                    noteButton,
                    closeButton
                )
            ),
            // Side controls
            React.createElement('div', { className: 'side-controls' },
                prevButton,
                nextButton
            )
        )
    );
};

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.createRoot(document.getElementById('root')).render(
        React.createElement(App)
    );
    console.log('Application initialized');
});