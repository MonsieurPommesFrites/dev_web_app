// Navigation.jsx - Component for app navigation elements

const Navigation = ({
    isMenuOpen,
    setIsMenuOpen,
    contentTypes,
    isContentAvailable,
    handleTypeChange,
    isNoteMode,
    toggleNoteMode,
    currentIndex,
    contentLength,
    handlePrevious,
    handleNext
}) => {
    return (
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
                            // Navigate back to content page
                            const currentUrl = window.location.href;
                            const newUrl = currentUrl.replace('index.php', 'content.php');
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
                    disabled={currentIndex === contentLength - 1}
                    className="control-button"
                >
                    <i className="fa fa-arrow-circle-right text-2xl"></i>
                </button>
            </div>
        </div>
    );
};