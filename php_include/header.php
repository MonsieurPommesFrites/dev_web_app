<header>
      <?php 
      if (strlen($module_name_list[$study_dir_mod_nr]) > 23) 
            {echo "<div class='mediumtext'><a class='uncolored' href='modules.php'>".$module_name_list[$study_dir_mod_nr]."</a></div>";} 
      else 
            {echo "<div class='text'><a class='uncolored' href='modules.php'>".$module_name_list[$study_dir_mod_nr]."</a></div>";}
      ?>
</header>