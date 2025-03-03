var soltitle = document.getElementsByClassName('soltitle');
var sol = document.getElementsByClassName('sol');

for (var i = 0; i < soltitle.length; i++) {
    soltitle[i].onclick = function() {
        for (var j =0; j < videos.length; j++) {
            stopVideo(videos[j]);
        }
    	var setClasses = !this.classList.contains('active');
        setClass(soltitle, 'active', 'remove');
        setClass(sol, 'show', 'remove');


       	if (setClasses) {
            this.classList.toggle("active");
            this.nextElementSibling.classList.toggle("show");
        }
    }
}

function setClass(els, className, fnName) {
    for (var i = 0; i < els.length; i++) {
        els[i].classList[fnName](className);
        els[i].style['font-style'] = 'normal';
    }
}
