<!DOCTYPE html>

<?php 

session_start();

$home_php='content.php';
$base_dir='modules/';
$id_separator='-';

include 'php_include/teach_data.php';

include 'php_include/redirect_invalid_page_ids.php';

$module_short=explode('_',$module)[1];
$semester_id=explode('_',$module)[2];
$year=substr(explode('.',$semester_id)[0],-2);
$season_integer=explode('.',$semester_id)[1];
if ($season_integer == '1') 
{ 
  $season='Spring'; 
} 
else 
{ 
  $season='Fall'; 
};
$study_direction=explode('_',$module)[0];
$study_dir_mod_nr=$study_direction."_".$module_short;
$path=$base_dir.$lecturer.'/'.$module.'/';

?>

<html lang="en" xml:lang="en">
<?php include 'php_include/head.php';?> 
<body>
  <div id='page'>
    <?php 
    include 'php_include/header.php';
    include 'php_include/navbar.php';
    include 'php_include/display_file_content.php';
    include 'php_include/hamburger.php';
    ?>
  </div>
  <?php include 'php_include/java.php';?>
</body>
</html>
