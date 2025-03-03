// ContentDisplay.jsx - Component to display content based on type

const ContentDisplay = ({
    contentRef,
    activeType,
    currentItem,
    isVideo,
    videoRef,
    isNoteMode,
    hasHighlights,
    showHighlightsOnly,
    setShowHighlightsOnly,
    isMenuOpen,
    isHighlighterActive,
    isPlaying,
    handlePlayPause,
    processContent
}) => {
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
    
    return (
        <div 
            className={`content-section ${isNoteMode ? 'half-width' : 'full-width'}`}
            ref={contentRef}
        >
            <div className="media-container">
                {renderContent()}
            </div>
            
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
    );
};