let audio = {
    hover: new Audio("audio/ui-hover.wav")
};

function initialize() {
    // Bind UI sound effect to hover
    audio.hover.volume = 0.1;
    $('.main-menu > ul > li').mouseover(function() {
        audio.hover.currentTime = 0;
        audio.hover.play();
    });
    // Bind quit to click event
    $('[data-view="quit"]').click(quit);
}

function quit() {
    // Make sure the user actually wants to leave
    let yes = confirm("Are you sure you want to quit PongPong?");
    if(yes) {
        //Does not actually work in-browser, purely theoretical
        window.close();
    }
}

// Runs initialize when the page loads
window.onload = initialize;
