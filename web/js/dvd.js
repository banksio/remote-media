var x = Math.floor(Math.random() * window.innerWidth);
var y = Math.floor(Math.random() * window.innerHeight);
var xSpeed = 120;
var ySpeed = 120;
var vewPoint;
var colours = ['rgb(0, 0, 255)', 'rgb(0, 255, 0)', 'rgb(0, 128, 128)', 'rgb(255, 0, 0)', 'rgb(128, 0, 128)', 'rgb(128, 128, 0)'];

var timer;
var intervalId;
var screenOffTime = 1; //ms

let currentFrameCb;
let shown = false;
let lastTS;

var logoImg = document.getElementById("screensaver-logo");

logoImg.onload = function(){
    vewPoint = document.getElementById('screensaver');
    vewPoint.appendChild(logoImg);
};

logoImg.style.cssText = 'width:20%; position:absolute; left:0px; top:0px;';
logoImg.style.fill = colours[Math.floor(Math.random() * colours.length)];

// Animate the logo
var logoAnimate = function(timestamp){
    if (lastTS === undefined){
        lastTS = timestamp;
    }
    let delta = (timestamp - lastTS) / 1000;
    let xMove = xSpeed * delta;
    let yMove = ySpeed * delta;
    x += xMove;
    if (((x + logoImg.clientWidth) > window.innerWidth) || (x < 0)) {
        xSpeed *= -1;
        logoImg.style.fill = colours[(colours.indexOf(logoImg.style.fill) + 1) % colours.length];
    };
    if ((x + logoImg.clientWidth) > window.innerWidth) x=window.innerWidth-logoImg.clientWidth;
    if (x < 0) x=0;

    y += yMove;
    if (((y + logoImg.clientHeight) > window.innerHeight) || (y < 0)) {
        ySpeed *= -1;
        logoImg.style.fill = colours[(colours.indexOf(logoImg.style.fill) + 1) % colours.length];
    }
    if ((y + logoImg.clientHeight) > window.innerHeight) y=window.innerHeight-logoImg.clientHeight;
    if (y < 0) y=0;
    
    logoImg.style.transform = "translate(" + x + "px, " + y + "px)";
    lastTS = timestamp;
    currentFrameCb = window.requestAnimationFrame(logoAnimate);
};

function startScreensaver() {
    // Start and show the animation
    shown = true;
    document.getElementById("screensaver").style.display = "block";

    currentFrameCb = window.requestAnimationFrame(logoAnimate);
    window.requestAnimationFrame(() => {
        fadeInDiv(true);
    });
    return true;
}

function stopScreensaver() {
    if (shown == false) return;  // Don't run if already animating out
    
    // Hide and stop the animation
    shown = false;

    vewPoint.addEventListener('transitionend', function (){
        console.log("The screensaver has faded out.");
        document.getElementById("screensaver").style.display = "none";
        window.cancelAnimationFrame(currentFrameCb);
    }, {once: true});
    fadeInDiv(false);
    return true;
}

// Fade in/out div
function fadeInDiv(visible) {
    let screensaverElement = document.getElementById('screensaver');
    if (visible) screensaverElement.classList.remove("fadeOutDiv");
    else screensaverElement.classList.add("fadeOutDiv");
}