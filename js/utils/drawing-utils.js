// drawing-utils.js - Paper.js based utilities for the drawing feature

window.DrawingUtils = {
    // Initialize Paper.js on the canvas
    initializePaper: (canvasElement, strokeColor, strokeWidth) => {
        if (!canvasElement) return null;
        
        try {
            // Set up paper.js on the canvas
            paper.setup(canvasElement);
            
            // Create configuration object
            const config = {
                strokeWidth: strokeWidth || 2,
                smoothingFactor: 4,
                pointSamplingThreshold: 0.5,
                strokeColor: strokeColor || 'black'
            };
            
            // Create a tool for drawing
            const tool = new paper.Tool();
            
            // When stylus/mouse is pressed
            tool.onMouseDown = function(event) {
                // Create a new path with current configuration
                this.path = new paper.Path({
                    segments: [event.point],
                    strokeColor: config.strokeColor,
                    strokeWidth: config.strokeWidth,
                    strokeCap: 'round',
                    strokeJoin: 'round'
                });
            };
            
            // When stylus/mouse is dragged
            tool.onMouseDrag = function(event) {
                // Make sure we have a path
                if (!this.path) return;
                
                // Point sampling based on threshold for better performance
                if (event.delta.length > config.pointSamplingThreshold) {
                    this.path.add(event.point);
                }
            };
            
            // When stylus/mouse is released
            tool.onMouseUp = function(event) {
                // Simplify the path with smoothing factor for better appearance
                if (this.path && this.path.segments.length > 1) {
                    this.path.simplify(config.smoothingFactor);
                }
                this.path = null;
            };
            
            // Handle touch events for mobile devices and tablets
            tool.onTouchStart = tool.onMouseDown;
            tool.onTouchMove = tool.onMouseDrag;
            tool.onTouchEnd = tool.onMouseUp;
            
            // Activate the tool
            tool.activate();
            
            console.log("Paper.js initialized with:", config);
            
            return {
                tool,
                config,
                paper
            };
        } catch (error) {
            console.error('Error initializing Paper.js:', error);
            return null;
        }
    },
    
    // Update drawing settings
    updateConfig: (paperInstance, settings) => {
        if (!paperInstance || !paperInstance.config) return;
        
        // Update the configuration object
        if (settings.strokeColor) {
            paperInstance.config.strokeColor = settings.strokeColor;
        }
        
        if (settings.strokeWidth) {
            paperInstance.config.strokeWidth = settings.strokeWidth;
        }
        
        if (settings.smoothingFactor !== undefined) {
            paperInstance.config.smoothingFactor = settings.smoothingFactor;
        }
        
        if (settings.pointSamplingThreshold !== undefined) {
            paperInstance.config.pointSamplingThreshold = settings.pointSamplingThreshold;
        }
        
        console.log("Drawing config updated:", paperInstance.config);
    },
    
    // Clear the canvas
    clearCanvas: (paperInstance) => {
        if (!paperInstance || !paperInstance.paper) return;
        
        paperInstance.paper.project.activeLayer.removeChildren();
        paperInstance.paper.view.draw();
    },
    
    // Export the drawing to a format compatible with the existing storage system
    exportDrawing: (paperInstance) => {
        if (!paperInstance || !paperInstance.paper) return [];
        
        // Convert Paper.js paths to the stroke format used in storage
        const strokes = [];
        const layer = paperInstance.paper.project.activeLayer;
        
        layer.children.forEach(path => {
            if (path instanceof paperInstance.paper.Path) {
                const points = path.segments.map(segment => ({
                    x: segment.point.x,
                    y: segment.point.y,
                    color: path.strokeColor.toCSS(true),
                    width: path.strokeWidth
                }));
                
                if (points.length > 1) {
                    strokes.push(points);
                }
            }
        });
        
        return strokes;
    },
    
    // Import saved strokes from storage format to Paper.js
    importDrawing: (paperInstance, strokes) => {
        if (!paperInstance || !paperInstance.paper || !strokes || !strokes.length) return;
        
        // Clear canvas before importing
        window.DrawingUtils.clearCanvas(paperInstance);
        
        // Create paths from saved strokes
        strokes.forEach(stroke => {
            if (stroke.length < 2) return;
            
            const path = new paperInstance.paper.Path({
                strokeColor: stroke[0].color || paperInstance.config.strokeColor,
                strokeWidth: stroke[0].width || paperInstance.config.strokeWidth,
                strokeCap: 'round',
                strokeJoin: 'round'
            });
            
            // Add all points to the path
            stroke.forEach(point => {
                path.add(new paperInstance.paper.Point(point.x, point.y));
            });
            
            // Apply smoothing to the imported path
            path.simplify(paperInstance.config.smoothingFactor);
        });
        
        // Update the view
        paperInstance.paper.view.draw();
    },
    
    // Handle resize events
    handleResize: (paperInstance) => {
        if (!paperInstance || !paperInstance.paper) return;
        
        paperInstance.paper.view.onResize = function() {
            paperInstance.paper.view.draw();
        };
    }
};