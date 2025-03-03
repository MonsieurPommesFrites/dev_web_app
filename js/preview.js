var preview = document.getElementsByClassName('preview');
var popup = document.getElementsByClassName('popup');

for (var i = 0; i < preview.length; i++) {
    preview[i].onclick = function() {
        for (var j =0; j < videos.length; j++) {
            stopVideo(videos[j]);
        }
    	var setClasses = !this.classList.contains('active');
        setClass(preview, 'active', 'remove');
        setClass(popup, 'show', 'remove');


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
