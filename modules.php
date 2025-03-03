<!DOCTYPE html>
<?php

session_start();

$basic_dir='modules/';
$php_module_file='modules.php';
$php_content_file='content.php';
include 'php_include/teach_data.php';
include 'php_include/process_page_identity_and_module_content.php';
?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="" xml:lang="">
<?php 
include 'php_include/head.php';
?>
<body>
  <div id="page">
    <header>
      <div class='text'>UniDistance Suisse</div><div><img src="graphic/LogoFernUni.svg"></div>
    </header>
    <div id="content">
      <div class="modulelist">
        <div class="title-container">
    <h1>Study modules</h1>
       <?php include 'php_include/settings_button.php'; ?>
    </div>
        <?php 
        include 'php_include/list_modules_active_semester.php';
        ?>
        <h2>Other semesters</h2>
        <?php
        include 'php_include/list_non_active_semesters.php';
        ?>
      </div>
      </div>
    </div>
  </div>
</body>
</html>