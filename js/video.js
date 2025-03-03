var acc = document.getElementsByClassName('accordion');
var panel = document.getElementsByClassName('panel');
var videos = document.getElementsByClassName('video_wrapper');

function stopVideo(element) {
    var iframe = element.querySelector( 'iframe');
    var video = element.querySelector( 'video' );
    if ( iframe ) {
        var iframeSrc = iframe.src;
        iframe.src = iframeSrc;
    }
    if ( video ) {
        video.pause();
    }
};

for (var i = 0; i < acc.length; i++) {
    acc[i].onclick = function() {
        for (var j =0; j < videos.length; j++) {
            stopVideo(videos[j]);
        }
    	var setClasses = !this.classList.contains('active');
        setClass(acc, 'active', 'remove');
        setClass(panel, 'show', 'remove');


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
