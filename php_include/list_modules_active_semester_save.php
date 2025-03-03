<?php 
echo "<h2>".$year." ".$season." Semester</h2>\r\n";

for ($k = 0; $k <= count($study_directions)-1; $k++) 
{
  echo "<h3>".explode("-",$study_directions[$k])[1]."</h3>\r\n";
  for ($i = 0; $i <= count($modules_array)-1; $i++) 
  {
    $module_number_and_name=explode("_",substr($modules_array[$i],0,-7))[1]." ".$module_name_list[substr($modules_array[$i],0,-7)];
    for ($j = 0; $j <= count($lecturers_array)-1; $j++) 
    {
      if( file_exists($basic_dir.'/'.$lecturers_array[$j].'/'.$modules_array[$i]) && str_contains($modules_array[$i],explode("-",$study_directions[$k])[0]) ) {  
        if(file_exists($basic_dir.'/'.$lecturers_array[$j].'/'.$modules_array[$i].'/index.html')) 
        {
          echo "<p><a href='".$basic_dir.$lecturers_array[$j]."/".$modules_array[$i]."/index.html'>".$module_number_and_name."</a> &#8212; ".$lecturer_name_list[$lecturers_array[$j]]."</p>";
        }
        else 
        { 
          echo "<p><a href='".$php_content_file."?id=".$lecturers_array[$j]."-".$modules_array[$i]."-Home'>".$module_number_and_name."</a> &#8212; ".$lecturer_name_list[$lecturers_array[$j]]."</p>\n";
        }
      }
    }
  }
}
?>