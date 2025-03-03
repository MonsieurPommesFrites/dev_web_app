// drawing-utils.js - Utilities for the drawing feature

window.DrawingUtils = {
    // Path smoothing function
    smoothPath: (points, smoothingFactor, stepSize) => {
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
    },
    
    // Enhanced Pointer Down handler factory
    createPointerDownHandler: (canvasRef, setIsDrawing, setPathPoints, setSmoothedPath, setCurrentStroke, strokeColor, strokeWidth) => {
        return (e) => {
            // Check if it's a pen (Apple Pencil), touch, or mouse
            if (e.pointerType === 'pen' || e.pointerType === 'touch' || e.pointerType === 'mouse') {
                e.preventDefault();
                e.stopPropagation();
                
                if (!canvasRef.current) return;
                
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
    },
    
    // Enhanced Pointer Move handler factory
    createPointerMoveHandler: (isDrawing, canvasRef, pathPoints, setPathPoints, setSmoothedPath, setCurrentStroke, 
                               loadPageStrokes, smoothingFactor, smoothingInterval, strokeColor, strokeWidth) => {
        return (e) => {
            // Check drawing state first to avoid unnecessary processing
            if (!isDrawing || !canvasRef.current) return;
            
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
                    const smoothedPoints = window.DrawingUtils.smoothPath(
                        [...pathPoints, point], 
                        smoothingFactor, 
                        smoothingInterval
                    );
                    
                    setSmoothedPath(smoothedPoints);
                    
                    // Clear canvas and redraw the entire path
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                    
                    // Redraw all saved strokes first
                    loadPageStrokes();
                    
                    // Then draw the current smooth path
                    ctx.beginPath();
                    ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
                    
                    for (let i = 1; i < smoothedPoints.length; i++) {
                        const point = smoothedPoints[i];
                        const prevPoint = smoothedPoints[i - 1];
                        
                        // If we have four points, use bezier curve for smoother lines
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
    },
    
    // Enhanced Pointer Up handler factory
    createPointerUpHandler: (isDrawing, pathPoints, smoothedPath, setIsDrawing, setCurrentStroke, 
                             saveCurrentStroke, setPathPoints, setSmoothedPath) => {
        return (e) => {
            // Skip if not in drawing mode
            if (!isDrawing) return;
            
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
        };
    }
};