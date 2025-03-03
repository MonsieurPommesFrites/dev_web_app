<div id="content">
  <?php 
  if(empty($file))
  { 
    $sub_files=glob($path.$folder.'/*.php'); 
    natsort($sub_files); 
    $sub_files_sorted = array_values($sub_files);
    for ($i = 0; $i <= count($sub_files)-1; $i++)
    {
      $file_from_list=str_replace('.php','',str_replace($path.$folder.'/','',$sub_files_sorted[$i]));
      echo "<h2><a class='uncolored' href='content.php?id=".$lecturer.$id_separator.$module.$id_separator.$folder.$id_separator.$file_from_list."'>".str_replace('_',' ',$file_from_list)."</a></h2>";
    }
  }
  else
  {
    if(empty($folder)) 
    {
      include ($path.$file.'.php');
    } 
    else
    {
      include ($path.$folder.'/'.$file.'.php');
    }
  } 
  ?>
</div>