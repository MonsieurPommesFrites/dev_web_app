// App.js - Main application component without JSX

// Define App component
const App = () => {
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
            const otherContent = [
                ...(window.contentData['prop'] || []), 
                ...(window.contentData['lem'] || []), 
                ...(window.contentData['cor'] || [])
            ];
            return otherContent.length > 0;
        }
        return window.contentData[type] && window.contentData[type].length > 0;
    };

    // Find first available type
    const activeType = contentTypes.find(type => isContentAvailable(type.id))?.id;
    
    // Get current content
    const currentContent = activeType === 'other' 
        ? [...(window.contentData['prop'] || []), 
           ...(window.contentData['lem'] || []), 
           ...(window.contentData['cor'] || [])]
        : window.contentData[activeType] || [];
    
    const currentItem = currentContent.length > 0 ? currentContent[0] : null;
    
    // No content available
    if (!activeType || !currentItem) {
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
                src: currentItem.src,
                className: "media-content",
                controls: true
            }, 'Your browser does not support the video tag.');
        }
    } else {
        contentElement = React.createElement('div', {
            className: "p-4 overflow-auto max-h-full",
            dangerouslySetInnerHTML: { __html: currentItem.content }
        });
    }

    // Main render
    return React.createElement('div', { className: 'content-wrapper' },
        React.createElement('div', { className: 'content-container' },
            React.createElement('div', { className: 'content-section full-width' },
                React.createElement('div', { className: 'media-container' },
                    contentElement
                )
            )
        )
    );
};