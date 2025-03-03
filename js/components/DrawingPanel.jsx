// DrawingPanel.jsx - Component for drawing and note-taking

const DrawingPanel = ({ currentContentId, currentPage, setCurrentPage }) => {
    // Drawing state
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [currentStroke, setCurrentStroke] = React.useState([]);
    const [savedNotes, setSavedNotes] = React.useState({});
    const [strokeColor, setStrokeColor] = React.useState('#000000');
    const [strokeWidth, setStrokeWidth] = React.useState(2);
    
    // Path smoothing state
    const [pathPoints, setPathPoints] = React.useState([]);
    const [smoothedPath, setSmoothedPath] = React.useState([]);
    
    // Canvas ref
    const canvasRef = React.useRef(null);
    
    // Smoothing settings
    const smoothingFactor = 0.2; // Lower = smoother (0.1 to 0.3 is a good range)
    const smoothingInterval = 8; // Points per smoothing operation
    
    // Get current note ID (includes page number)
    const getCurrentNoteId = () => {
        return `${currentContentId}-page-${currentPage}`;
    };
    
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
    
    // Start drawing function with Apple Pencil support
    const startDrawing = (e) => {
        if (!canvasRef.current) return;
        
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
    
    // Drawing function with better touch handling and smoothing
    const draw = (e) => {
        if (!isDrawing || !canvasRef.current) return;
        
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
            // Apply smoothing from drawing utility
            const smoothedPoints = DrawingUtils.smoothPath(
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
    
    // Stop drawing function with better event handling
    const stopDrawing = (e) => {
        if (!isDrawing) return;
        
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
    
    // Enhanced Pointer events
    const handlePointerDown = DrawingUtils.createPointerDownHandler(
        canvasRef, 
        setIsDrawing, 
        setPathPoints, 
        setSmoothedPath, 
        setCurrentStroke, 
        strokeColor, 
        strokeWidth
    );
    
    const handlePointerMove = DrawingUtils.createPointerMoveHandler(
        isDrawing, 
        canvasRef, 
        pathPoints, 
        setPathPoints, 
        setSmoothedPath, 
        setCurrentStroke, 
        loadPageStrokes, 
        smoothingFactor, 
        smoothingInterval, 
        strokeColor, 
        strokeWidth
    );
    
    const handlePointerUp = DrawingUtils.createPointerUpHandler(
        isDrawing, 
        pathPoints, 
        smoothedPath, 
        setIsDrawing, 
        setCurrentStroke, 
        saveCurrentStroke, 
        setPathPoints, 
        setSmoothedPath
    );
    
    // Save current stroke to saved notes
    const saveCurrentStroke = (strokeToSave = null) => {
        const strokeData = strokeToSave || currentStroke;
        const noteId = getCurrentNoteId();
        
        setSavedNotes(prev => {
            const contentNotes = prev[currentContentId] || {};
            const pageStrokes = contentNotes[noteId] || [];
            const maxPage = Math.max(contentNotes.maxPage || 1, currentPage);
            
            return {
                ...prev,
                [currentContentId]: {
                    ...contentNotes,
                    [noteId]: [...pageStrokes, [...strokeData]],
                    maxPage
                }
            };
        });
        
        // Save notes to storage after updating state
        setTimeout(saveNotesToStorage, 50);
    };
    
    // Load page strokes with proper scaling
    const loadPageStrokes = () => {
        if (!canvasRef.current) return;
        
        const noteId = getCurrentNoteId();
        const contentNotes = savedNotes[currentContentId] || {};
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
        
        setSavedNotes(prev => {
            const contentNotes = prev[currentContentId] || {};
            
            // Create a new object without the current page's strokes
            const newContentNotes = { ...contentNotes };
            delete newContentNotes[noteId];
            
            return {
                ...prev,
                [currentContentId]: newContentNotes
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
        const contentNotes = savedNotes[currentContentId] || {};
        const maxPage = contentNotes.maxPage || 1;
        
        // If we're on the last page, create a new one
        if (currentPage >= maxPage) {
            // Update max page in saved notes
            setSavedNotes(prev => {
                const content = prev[currentContentId] || {};
                return {
                    ...prev,
                    [currentContentId]: {
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
        const contentNotes = savedNotes[currentContentId] || {};
        const maxPage = contentNotes.maxPage || 1;
        
        return {
            current: currentPage,
            total: maxPage
        };
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
            if (canvasRef.current) {
                initCanvas();
                loadPageStrokes();
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [savedNotes, currentPage]);
    
    // Set up canvas when component mounts
    React.useEffect(() => {
        setTimeout(() => {
            initCanvas();
            loadPageStrokes();
        }, 100);
    }, [currentContentId, currentPage]);
    
    // Save notes before unmounting
    React.useEffect(() => {
        return () => {
            if (currentStroke.length > 1) {
                saveCurrentStroke();
            }
            saveNotesToStorage();
        };
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
    
    return (
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
    );
};