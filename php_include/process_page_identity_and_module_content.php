<?php

$module_directories_on_server_array = glob($basic_dir.'/*/*');
$modules_array = array();
$lecturers_array = array();
$semesters_array = array();


if (!empty($_GET['id'])) {
    $pageidentity = $_GET['id'];
    $semester_id = $pageidentity;
    $year = explode('.', $semester_id)[0];
    $season_integer = explode('.', $semester_id)[1];
    if ($season_integer == '1') {
        $season = 'Spring';
    } else {
        $season = 'Fall';
    }
} else {
    $month = (int)date("m");
    
    // Fall semester: August through January (months 8-12 and 1)
    // Spring semester: February through July (months 2-7)
    if ($month >= 8 || $month == 1) {
        $season_integer = '2';
        $season = 'Fall';
        // If it's January, use previous year for Fall semester
        $year = ($month == 1) ? (string)(date("Y") - 1) : date("Y");
    } else {
        $season_integer = '1';
        $season = 'Spring';
        $year = date("Y");
    }
    
    $semester_id = $year . "." . $season_integer;
}


for ($i = 0; $i <= count($module_directories_on_server_array)-1; $i++) 
{
	$module_number=explode('/',$module_directories_on_server_array[$i])[3];
	$module_semester=explode('_',$module_number)[2];
	$module_lecturer=explode('/',$module_directories_on_server_array[$i])[2];
	if ( $module_semester == $semester_id) 
	{
		if ( !(in_array($module_number, $modules_array))) 
		{
			array_push($modules_array,$module_number);
		}
		if ( !(in_array($module_lecturer, $lecturers_array))) 
		{
			array_push($lecturers_array,$module_lecturer);
		}
	}
	if ( !(in_array($module_semester, $semesters_array))) 
	{
		array_push($semesters_array,$module_semester);
	}
}

natsort($semesters_array);

$semesters_array_sorted=array_reverse(array_values($semesters_array));

if (!(in_array($semester_id,$semesters_array))) 
{ 
	header("Location: /app/error.html"); 
	die(); 
}

natsort($modules_array);
$modules_array = array_values($modules_array);

?>