// App.jsx - Main application component

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
    const [currentPage, setCurrentPage] = React.useState(1);
    
    // Highlighter state (simplified, detailed state in Highlighter component)
    const [isHighlighterActive, setIsHighlighterActive] = React.useState(false);
    
    // Refs
    const contentRef = React.useRef(null);
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
        setIsNoteMode(!isNoteMode);
    };
    
    // Toggle highlighter
    const toggleHighlighter = () => {
        setIsHighlighterActive(!isHighlighterActive);
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
    }, [currentIndex, currentContent, isVideo, isHighlighterActive, isNoteMode]);

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
                {/* Content Display Component */}
                <ContentDisplay 
                    contentRef={contentRef}
                    activeType={activeType}
                    currentItem={currentItem}
                    isVideo={isVideo}
                    videoRef={videoRef}
                    isNoteMode={isNoteMode}
                    hasHighlights={hasHighlights}
                    showHighlightsOnly={showHighlightsOnly}
                    setShowHighlightsOnly={setShowHighlightsOnly}
                    isMenuOpen={isMenuOpen}
                    isHighlighterActive={isHighlighterActive}
                    isPlaying={isPlaying}
                    handlePlayPause={handlePlayPause}
                    processContent={processContent}
                />
                
                {/* Drawing Panel Component (conditionally rendered) */}
                {isNoteMode && (
                    <DrawingPanel 
                        currentContentId={getCurrentContentId()}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                    />
                )}
            </div>

            {/* Navigation Component */}
            <Navigation 
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                contentTypes={contentTypes}
                isContentAvailable={isContentAvailable}
                handleTypeChange={handleTypeChange}
                isNoteMode={isNoteMode}
                toggleNoteMode={toggleNoteMode}
                currentIndex={currentIndex}
                contentLength={currentContent.length}
                handlePrevious={handlePrevious}
                handleNext={handleNext}
            />
            
            {/* Highlighter Component */}
            {isHighlighterActive && (
                <Highlighter
                    contentRef={contentRef}
                    isActive={isHighlighterActive}
                />
            )}
        </div>
    );
};