var server,

    //Audio handler, keeps audio objects together
    audio = {
        synth: new Audio("audio/synth.mp3"),
        hover: new Audio("audio/ui-hover.wav"),
        click: new Audio("audio/ui-click.wav")
    },

    //Game object
    Game = {
        //Settings related to the game, can be changed on the "Create Game" screen
        settings: {
            maxplayers: 4,
            visibility: 1,
            linusmode: 0
        },
        players: {}
    },

    //Keep track of last sync
    previous = Game,

    //Player object
    Player = {
        "name": localStorage.getItem('username') || "New001"
    },

    //Update at glorious 60fps
    GameLoop = setInterval(loop,1000/60);

function initialize() {

    //Connect to server, temp use localhost
    server = new WebSocket("ws://localhost:8082");

    //Let user know if socket cannot connect
    server.onerror = function() {
        alert("Unable to connect to server.");
    }

    //Initialize the connection to the server
    server.onopen = function (event) {
        let msg = {
            type: "connect",
            name: Player.name
        };
        server.send(JSON.stringify(msg));
    };

    //Recieve data from server
    server.onmessage = function (event) {

        //Parse as JSON
        let msg = JSON.parse(event.data);

        if(msg.type == "init") {

            //Initialize player with generated ID
            Player.ID = msg.id;

            //Show game code in lobby screen
            $('.game-code').text(msg.id);

        }

        //When the user successfully joins a lobby
        else if(msg.type == "lobbyJoined") {

            //Set lobby as the joined lobby
            Player.lobby = msg.lobbyID;

            //Create blank objects for each player
            for(var i=0; i < msg.players.length; i++) {

                //Fix a bug that adds undefined to the player list
                if(msg.players[i] != undefined) {
                    Game.players[msg.players[i]] = {};
                }

            }

        }

        //When a new player conneccts to the lobby
        else if(msg.type == "playerJoined") {

            //Add connected player to the list
            Game.players[msg.id] = {
                name: msg.name
            };

            //Add to lobby list
            let e = Object.keys(Game.players).length;
            $('li[data-player='+e+']').text(msg.id);

        }

        //Add player to their own lobby
        else if(msg.type == "lobbyCreated") {
            Player.lobby = Player.ID;
            console.log("Lobby created successfully.");
        }

        //Sync with the server
        else if(msg.type == "sync") {

            Game = msg.Game;

            //If lobby has changed, sync it up
            if(Game != previous) {
                sync();
                console.log("SYNC?");
                previous = Game;
            }

        }

        //Catch any data sent for testing
        else {
            console.log(msg);
        }

    }

    // Main music loop, volume is temp while settings are made
    audio.synth.loop = 1;
    audio.synth.volume = 0.25;
    audio.synth.play();

    // Bind UI hover sound effect to hover
    audio.hover.volume = 0.1;
    $('.main-menu > ul > li, .setting > ul > li, .start, .back').mouseover(function() {

        //Restart and play sound effect
        audio.hover.currentTime = 0;
        audio.hover.play();

    });

    // Bind UI click sound effect to click
    audio.click.volume = 0.1;
    $('.setting > ul > li').click(function() {

        //Restart and play sound effect
        audio.click.currentTime = 0;
        audio.click.play();

    });

    // Bind main menu view swaps
    $('*[data-view]').click(function() {

        //Get view to change to
        let to = $(this).attr('data-view');

        // Hide current view, show new view
        $('.showing').removeClass('showing');
        $('.'+to).addClass('showing');

    });

    // Create lobby on click
    $('*[data-action="start-lobby"]').click(createLobby);

    // Bind quit to click event
    $('*[data-action="quit"]').click(quit);

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

function loop() {

    //If the player is in a lobby, sync with server
    if(Player.lobby) {
        let msg = {
            type: "sync",
            id: Player.ID,
            lobbyID: Player.lobby
        };
        server.send(JSON.stringify(msg));
    }

}

//Updates using server data
function sync() {

    $('li[data-player=1]').text(Game.players[0]);
    $('li[data-player=2]').text(Game.players[1] || "Waiting...");
    $('li[data-player=3]').text(Game.players[2] || "Waiting...");
    $('li[data-player=4]').text(Game.players[3] || "Waiting...");
}

function createLobby() {

    //Let the server know this ID wants to create a lobby
    let msg = {
        type: "createLobby",
        id: Player.ID,
        settings: Game.settings
    };

    server.send(JSON.stringify(msg));

    //Set game host as yourself
    Game.host = Player.ID;

    //Create new player object in lobby
    Game.players[Player.ID] = {
        name: Player.name
    };

    //Hide unused elements
    $('li[data-player]').each(function() {
        let p = $(this).attr('data-player');
        if(p > Game.settings.maxplayers) {
            $(this).hide();
        }
    });

    //Add player to list
    $('li[data-player=1]').text(Player.ID);

}

function quit() {

    //Close connection to server
    server.close();

}

// Runs initialize when the page loads
window.onload = initialize;

//Runs when the page is unloaded
window.onunload = quit;
