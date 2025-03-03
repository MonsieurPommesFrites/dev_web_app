<?php
// Function to scan and get all available styles from the css/styles directory
function getAvailableStyles() {
    $stylesDir = __DIR__ . '/../css/styles';
    $stylesFiles = array_values(array_filter(scandir($stylesDir), function($file) use ($stylesDir) {
        return pathinfo($file, PATHINFO_EXTENSION) === 'css';
    }));
    return $stylesFiles;
}

// Switch theme based on user selection
if (isset($_GET['switch_theme'])) {
    $newTheme = $_GET['switch_theme'];
    setcookie('selectedTheme', $newTheme, time() + (10 * 365 * 24 * 60 * 60), "/");
    header("Location: " . $_SERVER['PHP_SELF']);
    exit();
}

// Function to get the selected theme file
function getSelectedThemeFile() {
    $availableStyles = getAvailableStyles();
    $defaultFile = '1-light.css';
    
    // Get the selected theme from the cookie
    $selectedTheme = isset($_COOKIE['selectedTheme']) ? $_COOKIE['selectedTheme'] : $defaultFile;

    // Ensure the selected theme exists
    if (!in_array($selectedTheme, $availableStyles)) {
        $selectedTheme = $defaultFile;
    }

    // Return the selected theme file path
    return 'css/styles/' . basename($selectedTheme);
}

// Function to get the next theme in the list for toggling
function getNextTheme() {
    $availableStyles = getAvailableStyles();
    $currentTheme = isset($_COOKIE['selectedTheme']) ? $_COOKIE['selectedTheme'] : '1-light.css';
    $currentIndex = array_search($currentTheme, $availableStyles);
    $nextIndex = ($currentIndex + 1) % count($availableStyles);
    return $availableStyles[$nextIndex];
}
?>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
  <meta name="theme-color" content="#FAFAFA">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <link rel="manifest" href="../manifest.json">
  
  <!-- Main stylesheet -->
  <link rel="stylesheet" href="css/style.css">
  <!-- Include the selected theme file directly -->
  <link rel="stylesheet" href="<?php echo getSelectedThemeFile(); ?>">

  <!-- MathJax for LaTeX rendering -->
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js" type="text/javascript"></script>
  
  <?php 
  if (empty($file) && empty($folder)) {
      echo "<title>UniDistance | Webapp </title>\n";
  } else {
      if (empty($file)) {
          echo "<title>UniDistance | " . $module . " " . $folder . "</title>\n";
      } else {
          echo "<title>UniDistance | " . $module . " " . str_replace('_', ' ', $file) . "</title>\n";
      } 
  }
  ?>
</head>