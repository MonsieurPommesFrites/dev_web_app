<?php
// filter.php - Main file for the content filtering interface
header('Content-Type: text/html');
require_once('php_include/content_extractor.php');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get and process content
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
    <title>Content Presentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no" />
    <meta name="msapplication-tap-highlight" content="no" />
    
    <!-- External Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js"></script>
    <!-- Add this line in the head section after other scripts -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    
    <!-- MathJax Configuration -->
    <script>
        window.MathJax = {
            tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']], processEscapes: true, processEnvironments: true },
            options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] }
        };
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-mml-chtml.js"></script>
    
    <!-- Application Stylesheets -->
    <link href="css/main.css" rel="stylesheet">
    <link href="css/components/content.css" rel="stylesheet">
    <link href="css/components/drawing.css" rel="stylesheet">
    <link href="css/components/controls.css" rel="stylesheet">
    <link href="css/components/highlighter.css" rel="stylesheet">
    <link href="css/responsive.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div id="root"></div>
    
    <script>
        // Define content data globally
        window.contentData = <?php echo $contentJson ?? '{}'; ?>;
    </script>
    
    <!-- Utility modules -->
    <script src="js/utils/highlighter-utils.js"></script>
    <script src="js/utils/drawing-utils.js"></script>
    
    <!-- Main application (no JSX) -->
    <script src="js/app.js"></script>
</body>
</html>