<?php

$pageidentity  = $_GET['id'];

if ( substr_count($pageidentity, $id_separator) !=2 && substr_count($pageidentity, $id_separator) !=3 )
{
  header("Location: /app/error.html");
  die();
}

if (substr_count($pageidentity, $id_separator)==3)
{
  $lecturer=explode($id_separator, $pageidentity)[0];
  $module=explode($id_separator, $pageidentity)[1];
  $folder=explode($id_separator, $pageidentity)[2];
  $file=explode($id_separator, $pageidentity)[3];
  if (!file_exists($base_dir.$lecturer.'/'.$module.'/'.$folder.'/'.$file.'.php'))
  {
    header("Location: /app/error.html");
    die();
  }
}
if (substr_count($pageidentity, $id_separator)==2) 
{
  $lecturer=explode($id_separator, $pageidentity)[0];
  $module=explode($id_separator, $pageidentity)[1];
  $file_id=explode($id_separator, $pageidentity)[2];

  if (file_exists($base_dir.$lecturer.'/'.$module.'/'.$file_id.'.php'))
  {
    $file=$file_id;
    $folder='';
  }
  else
  {
    $file='';
    $folder=$file_id;
    if (!file_exists($base_dir.$lecturer.'/'.$module.'/'.$folder))
    {
     header("Location: /app/error.html");
     die(); 
   }
 }
}

?>