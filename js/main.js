// Test if React is working
document.addEventListener('DOMContentLoaded', () => {
    const element = React.createElement('div', { 
        style: { 
            padding: '20px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '5px',
            margin: '20px'
        } 
    }, 'Hello World! React is working.');
    
    ReactDOM.createRoot(document.getElementById('root')).render(element);
    console.log('React test initialized');
});