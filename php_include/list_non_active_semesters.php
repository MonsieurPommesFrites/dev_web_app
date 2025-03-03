<?php 
for ($k = 0; $k <= count($semesters_array_sorted)-1; $k++)
{ 
  $year_cur=explode('.',$semesters_array_sorted[$k])[0];
  $semester_int_cur=explode('.',$semesters_array_sorted[$k])[1];
  if ($semester_int_cur == '1') { $semester_cur='Spring'; } else { $semester_cur='Fall'; }
  if (!($semesters_array_sorted[$k]==$semester_id)) {
    echo "<h3><a href='".$php_module_file."?id=".$semesters_array_sorted[$k]."'>".$year_cur." ".$semester_cur." Semester</a></h3>\n";  
  }
}
?>