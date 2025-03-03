<?php
require_once('php_include/content_extractor.php');
$id = $_GET['id'] ?? '';
if (empty($id)) die('No ID provided');

$parts = explode('-', $id);
$filepath = 'modules/' . implode('/', $parts) . '.php';
if (!file_exists($filepath)) die('File not found: ' . $filepath);

$content = file_get_contents($filepath);
$contentData = extractContent($content);
$contentJson = json_encode($contentData);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Simple Test</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.20.7/babel.min.js"></script>
    <link href="css/main.css" rel="stylesheet">
</head>
<body>
    <div id="root"></div>
    
    <script>
        window.contentData = <?php echo $contentJson ?? '{}'; ?>;
    </script>
    
    <script type="text/babel">
        // Simple test component
        const SimpleApp = () => {
            // Find first available content type
            const contentTypes = ['defn', 'thm', 'exmp', 'rmk', 'vis', 'prop', 'lem', 'cor'];
            const availableType = contentTypes.find(type => 
                window.contentData[type] && window.contentData[type].length > 0
            );
            
            if (!availableType) {
                return <div>No content available</div>;
            }
            
            const content = window.contentData[availableType][0];
            
            return (
                <div style={{padding: '20px', backgroundColor: 'white', margin: '20px'}}>
                    <h2>Content Type: {availableType}</h2>
                    {content.type === 'visual' ? (
                        content.subtype === 'image' ? (
                            <img src={content.src} alt={content.caption || ""} style={{maxWidth: '100%'}} />
                        ) : (
                            <video src={content.src} controls style={{maxWidth: '100%'}} />
                        )
                    ) : (
                        <div dangerouslySetInnerHTML={{__html: content.content}} />
                    )}
                </div>
            );
        };
        
        // Render the app
        document.addEventListener('DOMContentLoaded', () => {
            ReactDOM.createRoot(document.getElementById('root')).render(<SimpleApp />);
            console.log('Simple test app initialized');
        });
    </script>
</body>
</html>