<?php
// Function to check if current file contains special div classes
function hasSpecialDivs($path, $folder, $file) {
    if (empty($file)) {
        return false;
    }
    
    $file_path = empty($folder) ? $path . $file . '.php' : $path . $folder . '/' . $file . '.php';
    
    if (!file_exists($file_path)) {
        return false;
    }
    
    $content = file_get_contents($file_path);
    $special_classes = ['thm', 'prop', 'lem', 'rmk', 'exmp', 'defn'];
    
    foreach ($special_classes as $class) {
        if (strpos($content, 'class="' . $class . '"') !== false) {
            return true;
        }
    }
    
    return false;
}

// Check if current page has special divs
$has_special_divs = hasSpecialDivs($path, $folder, $file);

// Get current script name and determine if we're in filter view
$current_page = basename($_SERVER['PHP_SELF']);
$is_filter_view = ($current_page == 'filter.php');
?>

<div id='navbar'>
  <div>
    <a href='javascript:void(0);' class='uncolored' onclick='burger()'><i class='fa fa-bars'></i></a>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $module_short." &#x2014; ".$season." ".$year; ?>
  </div>

  <?php if($file==''): ?>
    <div><?php echo str_replace('_',' ',$folder); ?></div>
  <?php else: ?>
    <div>
      <?php if($folder!=''): ?>
        <a class='uncolored' href='<?php echo $current_page; ?>?id=<?php echo $lecturer.$id_separator.$module.$id_separator.$folder; ?>'><?php echo str_replace('_',' ',$file); ?></a>
      <?php else: ?>
        <?php echo str_replace('_',' ',$file); ?>
      <?php endif; ?>
      <?php if ($has_special_divs): ?>
        &nbsp;&nbsp;<a href='javascript:void(0);' onclick='toggleView()' class='uncolored'><i class='fa <?php echo $is_filter_view ? 'fa-list-ul' : 'fa-dot-circle-o'; ?>'></i></a>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</div>

<script>
function toggleView() {
    const currentUrl = window.location.href;
    const newUrl = currentUrl.replace(
        /(content|filter)\.php/,
        currentUrl.includes('content.php') ? 'filter.php' : 'content.php'
    );
    window.location.href = newUrl;
}
</script>