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
            linusmode: 0,
            scoretowin: 10
        },
        players: {}
    },

    //Keep track of last sync
    previous = Game,

    //Player object
    Player = {

        //Ask for name on load, could be done in the UI but easier on time to do it here
        "name": prompt("Enter your name (Max 8 characters)", "New001").substr(0,8),

        //Set initial view to the main menu
        "view": "main-menu",

        //If the player has started the game
        "started": false

    },

    //Update at glorious 60fps
    GameLoop = setInterval(loop, 1000 / 60);

function initialize() {

    //Connect to server, temp use localhost
    server = new WebSocket("ws://localhost:8082");

    //Let user know if socket cannot connect
    server.onerror = function() {
        alert("Unable to connect to server.");
    }

    //Initialize the connection to the server
    server.onopen = function(event) {
        let msg = {
            type: "connect",
            name: Player.name
        };
        server.send(JSON.stringify(msg));
    };

    //Recieve data from server
    server.onmessage = function(event) {

        //Parse as JSON
        let msg = JSON.parse(event.data);

        if (msg.type == "init") {

            //Initialize player with generated ID
            Player.ID = msg.id;

            //Show game code in lobby screen
            $('.game-code').text(msg.id);

        }

        //When the user successfully joins a lobby
        else if (msg.type == "lobbyJoined") {

            //Set lobby as the joined lobby
            Player.lobby = msg.lobbyID;

            //Reset hidden elements
            $('li[data-player]').show();

            //Hide unused elements
            $('li[data-player]').each(function() {
                let p = $(this).attr('data-player');
                if (p > msg.Game.maxplayers) {
                    $(this).hide();
                }
            });

            //Set game code
            $('.game-code').text(msg.lobbyID);

            //Remove start button, host only
            $('.start.host').remove();

            //Hide current menu and show lobby
            $('.showing').removeClass('showing');
            $('.lobby').addClass('showing');
            Player.view = "lobby";

        }

        //Recieve server list
        else if (msg.type == "list") {

            //Clear current list of servers
            $('.server-browser').empty();

            //Loop through each server in the list
            for (var s in msg.servers) {

                //Get server info and add element to the physical list
                let server = msg.servers[s];
                $('.server-browser').append('<div class="server" data-server="' + s + '"><div class="name">' + server.players[Object.keys(server.players)[0]].name + '</div><div class="players">' + server.current + '/' + server.maxplayers + '</div></div>')

            }

            //Bind hover sound effect
            $('.server').mouseover(function() {
                audio.hover.currentTime = 0;
                audio.hover.play();
            });

            //Bind click
            $('.server').click(function() {

                //Join lobby from data attribute
                joinLobby($(this).attr('data-server'));

                //Play success sound
                audio.click.currentTime = 0;
                audio.click.play();

            });

        }

        //Add player to their own lobby
        else if (msg.type == "lobbyCreated") {

            Player.lobby = Player.ID;

            //Update game code
            $('.game-code').text(Player.ID);

            //Add start button for host
            $('<span class="start host gray">Start</span>').click(startGame).appendTo('.view.lobby');

        }

        //Sync with the server
        else if (msg.type == "sync") {

            try {

                //Get new data
                Game = msg.Game;

                //If lobby has changed, sync it up
                if (!Object.is(Game, previous)) {
                    sync();
                    previous = Game;
                }

            } catch (e) {

                //Remove from lobby if connection is lost
                leaveLobby();

                //Return to main menu
                $('.showing').removeClass('showing');
                $('.main-menu').addClass('showing');
                Player.view = "main-menu";

                //Let the player know what happened
                alert("Lost connection to host.");

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
        $('.' + to).addClass('showing');
        Player.view = to;

    });

    // Get list of servers
    $('*[data-action="browse-servers"]').click(browseServers);

    // Create lobby on click
    $('*[data-action="start-lobby"]').click(createLobby);

    // Leave lobby on click
    $('*[data-action="leave-lobby"]').click(leaveLobby);

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
    if (Player.lobby) {
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

    //Before the game starts
    if(Game.status == "lobby") {

        //List players
        for(var i=0; i < 4; i++) {
            let keys = Object.keys(Game.players);

            if(typeof keys[i] != "undefined") {
                $('li[data-player='+(i+1)+']').text(Game.players[Object.keys(Game.players)[i]].name);
            } else {
                $('li[data-player='+(i+1)+']').text("Waiting...");
            }

        }

        //Update button text if lobby isn't full
        $('.start.host').text(Game.current == Game.maxplayers ? "Start" : "Need " + Game.maxplayers + " players to start");

        //Player count in the top right
        $('.player-count').text(Game.current + "/" + Game.maxplayers);

    }

    //During the game
    if(Game.status == "playing") {

        var keys = Object.keys(Game.players);

        //Make sure player is on the game screen
        if(Player.view != "tabletop") {
            $('.showing').removeClass('showing');
            $('.tabletop').addClass('showing');
            Player.view = "tabletop";
        }

        //Runs the first loop
        if(!Player.started) {

            Player.started = true;

            //Reset player rectangles
            $('.player').removeClass('two-players').show();

            if(Game.maxplayers == "2") {

                //Link players to their respective rectangle and scorebox
                $('.player.blue, .score.blue').attr('data-player',keys[0]);
                $('.player.purple, .score.purple').attr('data-player',keys[1]);

                //Move scoreboxes to center if there are two players
                $('.score.blue, .score.purple').addClass('two-players');

                //Hide unused elements
                $('.player.pink, .score.pink').hide();
                $('.player.orange, .score.orange').hide();
            }

            else if(Game.maxplayers == "3") {

                //Link players to their respective rectangle and scorebox
                $('.player.blue, .score.blue').attr('data-player',keys[0]);
                $('.player.purple, .score.purple').attr('data-player',keys[1]);
                $('.player.pink, .score.pink').attr('data-player',keys[2]);

                //Hide unused elements
                $('.player.orange, .score.orange').hide();

            }

            else {

                //Link players to their respective rectangle and scorebox
                $('.player.blue, .score.blue').attr('data-player',keys[0]);
                $('.player.purple, .score.purple').attr('data-player',keys[1]);
                $('.player.pink, .score.pink').attr('data-player',keys[2]);
                $('.player.orange, .score.orange').attr('data-player',keys[3]);

            }

        }

        //Done for each player in the game
        for(var i=0; i < keys.length; i++) {

            //Refer to player object as p from now on
            let p = Game.players[keys[i]];



            //Update scoreboxes
            $('.score[data-player='+keys[i]+'] .name').text(p.name);

            //padStart adds a zero to the front if score is one digit
            $('.score[data-player='+keys[i]+'] .points').text(p.score.toString().padStart(2,0));

        }

    }

}

function browseServers() {

    //Ask server for list
    server.send(JSON.stringify({
        type: "list"
    }));

}

function joinLobby(i) {

    //Join lobby with the code 'i'

    let msg = {
        type: "joinLobby",
        id: Player.ID,
        lobbyID: i
    };
    server.send(JSON.stringify(msg));

}

function leaveLobby() {

    let msg = {
        type: "leaveLobby",
        id: Player.ID,
    };
    server.send(JSON.stringify(msg));

    //Remove player from lobby client-side
    delete Player.lobby;

    //Reset Game object to default
    Game = {
        settings: {
            maxplayers: 4,
            visibility: 1,
            linusmode: 0
        },
        players: {}
    };

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


    //Reset hidden elements
    $('li[data-player]').show();

    //Hide unused elements
    $('li[data-player]').each(function() {
        let p = $(this).attr('data-player');
        if (p > Game.settings.maxplayers) {
            $(this).hide();
        }
    });

    //Add player to list
    $('li[data-player=1]').text(Player.ID);

}

function startGame() {

    //Only start if all players are present
    if(Game.current == Game.maxplayers) {

        let msg = {
            type: "startGame",
            //Use host's ID as lobbyID
            //Could be done better
            lobbyID: Player.ID,
        };

        server.send(JSON.stringify(msg));

    }

}

function quit() {

    //Close connection to server
    server.close();

}

// Runs initialize when the page loads
window.onload = initialize;

//Runs when the page is unloaded
window.onunload = quit;
