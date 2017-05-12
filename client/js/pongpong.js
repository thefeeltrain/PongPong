
//Audio handler
let audio = {
    synth: new Audio("audio/synth.mp3"),
    hover: new Audio("audio/ui-hover.wav"),
    click: new Audio("audio/ui-click.wav")
};

let Game = {
    settings: {
        maxplayers: 4,
        visibility: 1,
        linusmode: 0
    }
};

function initialize() {

    // Main music loop, volume is temp while settings are made
    audio.synth.loop = 1;
    audio.synth.volume = 0.25;
    audio.synth.play();

    // Bind UI hover sound effect to hover
    audio.hover.volume = 0.1;
    $('.main-menu > ul > li').mouseover(function() {
        audio.hover.currentTime = 0;
        audio.hover.play();
    });

    // Bind UI click sound effect to hover
    audio.click.volume = 0.1;
    $('.setting > ul > li').click(function() {
        audio.click.currentTime = 0;
        audio.click.play();
    });

    // Bind main menu view swaps
    $('li[data-view]').click(function() {
        let to = $(this).attr('data-view');
        // Hide current view, show new view
        $('.showing').fadeOut(400);
        $('.'+to).fadeIn(400);
    });

    // Bind quit to click event
    $('li[data-view="quit"]').click(quit);

    //Game creation settings
    $('.setting > ul > li').click(function() {

        //Get which setting and what to change it to
        let s = $(this).parents('.setting').attr('data-setting'),
            to = $(this).attr('data-value');

        //Change variable in the Game object
        Game.settings[s] = to;

        //Show change to the user by removing and readding class
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');

    });

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
