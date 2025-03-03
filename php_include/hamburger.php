<div id="hamburger">
  <?php 
  include 'header.php';
  echo "<h1><a class='uncolored' href='content.php?id=".$lecturer.$id_separator.$module."-Home'>Home</a></h1>\n";
  $docs = preg_grep('/^([^.])/', scandir($path));
  natsort($docs);
  $docs = array_values($docs);
  for ($i = 0; $i <= count($docs)-1; $i++) 
  {
    $docname=str_replace('_',' ',str_replace('.php','',$docs[$i]));
    #if (str_contains($docs[$i],'.php') || is_dir($docs[$i])) {
    $docid=str_replace('.php','',$docs[$i]);
    if ($docname != 'Home' && $docname != 'files')
    {
      echo "<h1><a class='uncolored' href='content.php?id=".$lecturer.$id_separator.$module.$id_separator.$docid."'>".$docname."</a></h1>\n";  
    }
  }
  #}
  ?>
  <h1><a href="javascript:void(0);" class="uncolored" onclick="burger()">&#x2715;</a></h1>
</div>