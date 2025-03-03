// main.js - Entry point for the application without JSX

// Import our components (done in the HTML through script tags)
// App component is defined in app.js

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Render the main App component
    ReactDOM.createRoot(document.getElementById('root')).render(
        React.createElement(App)
    );
    console.log('Application initialized');
});