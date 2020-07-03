var x = Math.floor(Math.random() * window.innerWidth)
var y = Math.floor(Math.random() * window.innerHeight);
var xSpeed = 2;
var ySpeed = 2;
var logoImgSrc = '/branding/logo.png';
var vewPoint;

var timer;
var intervalId;
var screenOffTime = 1; //ms

let currentFrameCb;
let shown = false;

var logoImg = new Image();

logoImg.onload = function(){
    vewPoint = document.getElementById('screensaver');
    vewPoint.appendChild(logoImg);
};

logoImg.src = logoImgSrc;
logoImg.style.cssText = 'width:20%; position:absolute; left:0px; top:0px;'

var logoAnimate = function(){
    x += xSpeed;
    if (((x + logoImg.width) > window.innerWidth) || (x < 0)) xSpeed *= -1;
    if ((x + logoImg.width) > window.innerWidth) x=window.innerWidth-logoImg.width;
    if (x < 0) x=0;
    // logoImg.style.left = x+"px";

    y += ySpeed;
    if (((y + logoImg.height) > window.innerHeight) || (y < 0)) ySpeed *= -1;
    if ((y + logoImg.height) > window.innerHeight) y=window.innerHeight-logoImg.height;
    if (y < 0) y=0;
    // logoImg.style.top = y+"px";
    logoImg.style.transform = "translate(" + x + "px, " + y + "px)";
    currentFrameCb = window.requestAnimationFrame(logoAnimate);
};

// var fadeIn = function(element, time, callback) {
//     var fadeTime     = (time) ? time : 400,
//         keyFrame     = 144,
//         stepTime     = fadeTime / keyFrame,
//         maxOpacity   = 1,
//         stepOpacity  = maxOpacity / keyFrame,
//         opacityValue = 0,
//         sId          = '';
 
//     if (!element) return;
 
//     if (element.getAttribute('data-fade-stock-display') !== undefined &&
//         element.getAttribute('data-fade-stock-display') !== null) {
//         element.style.display = element.getAttribute('data-fade-stock-display');
//     }
 
//     var setOpacity = function(setNumber) {
//         if ('opacity' in element.style) {
//             element.style.opacity = setNumber;
//         } else {
//             element.style.filter = 'alpha(opacity=' + (setNumber * 100) + ')';
 
//             if (navigator.userAgent.toLowerCase().match(/msie/) &&
//                 !window.opera && !element.currentStyle.hasLayout) {
//                 element.style.zoom = 1;
//             }
//         }
//     };
 
//     if (!callback || typeof callback !== 'function') {
//         callback = function() {};
//     }
 
//     setOpacity(0);
 
//     sId = setInterval(function() {
//         opacityValue = Number((opacityValue + stepOpacity).toFixed(12));
 
//         if (opacityValue > maxOpacity) {
//             opacityValue = maxOpacity;
//             clearInterval(sId);
//         }
 
//         setOpacity(opacityValue);
 
//         if (opacityValue === maxOpacity) {
//             callback();
//         }
//     }, stepTime);
 
//     return element;
// };

function startScreensaver() {
    shown = true;
    document.getElementById("screensaver").style.display = "block";
    // fadeIn(vewPoint, 500);
    // intervalId = setInterval(logoAnimate, 7);
    // vewPoint.style.display = "block";
    currentFrameCb = window.requestAnimationFrame(logoAnimate);
    window.requestAnimationFrame(() => {
        fadeInDiv(true);
    });
    return true;
}

function stopScreensaver() {
    if (shown == false) return;  // Don't run if already animating out
    shown = false;
    // vewPoint.style.opacity = 0;
    vewPoint.addEventListener('transitionend', function (){
        console.log("oof");
        document.getElementById("screensaver").style.display = "none";
        window.cancelAnimationFrame(currentFrameCb);
    }, {once: true});
    fadeInDiv(false);
    return true;
}

function fadeInDiv(visible) {
    let screensaverElement = document.getElementById('screensaver');
    if (visible) {
        screensaverElement.classList.remove("fadeOutDiv");
    } else {
        screensaverElement.classList.add("fadeOutDiv");
    }
}