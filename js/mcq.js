function handleClick(cb) {
  var parent = cb.parentElement;
  while ( parent.className != 'mcq' ) {
    var parent = parent.parentElement }
  var children = parent.getElementsByClassName('true')
  for (var i = 0; i < children.length; i++) {
    children[i].classList.add("highlight");
  }
}