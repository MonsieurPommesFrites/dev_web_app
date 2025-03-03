function burger() {
  var x = document.getElementById("hamburger");
  var y = document.getElementById("header");
  if (x.style.display === "block") {
    x.style.display = "none";
    y.style.display = "block";
  } else {
    x.style.display = "block";
    y.style.display = "none";
  }
}