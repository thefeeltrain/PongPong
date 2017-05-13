//Helper function to clear console
console.reset = function() {
    return process.stdout.write('\033c');
}

//Initialize players and lobbies
var players = {},
    lobbies = {},
    IDs = [],
    //Loop console output every second
    looping = setInterval(loop, 1000);

//Create websocket
var ws = require("nodejs-websocket"),
    server = ws.createServer(function(conn) {

        //Socket handler
        conn.on("text", function(str) {

            //Parse data as JSON
            let data = JSON.parse(str);

            //Event when a player connects
            if (data.type == "connect") {
                var msg = {
                    "type": "init",
                    //Give each player a unique identifier
                    "id": generateUID()
                }

                //Connect name to ID and create the player object
                players[msg.id] = {
                    name: data.name,
                    //Method for sending data to the client later
                    emit: function(j) {
                        conn.sendText(JSON.stringify(j));
                    }
                };

                //Remove player and their lobby if they disconnect
                conn.on("close", function() {
                    delete players[msg.id];
                    delete lobbies[msg.id];
                });

            }

            //Main client update method
            else if (data.type == "sync") {

                //Make sure the player exists and is in a lobby
                if (IDs.includes(data.id) && data.lobbyID != null) {

                    var msg = {
                        "type": "sync",
                        "Game": lobbies[data.lobbyID]
                    }

                }

                //Let the player know that their ID is invalid
                else {
                    var msg = {
                        "type": "error",
                        "text": "Your ID is invalid."
                    }
                }

            }

            //When the user requests a list of current servers
            else if (data.type == "list") {

                var msg = {
                    "type": "list",
                    "servers": lobbies
                }

            }

            //When the player wants to create a lobby
            else if (data.type == "createLobby") {

                //Make sure the player exists
                if (IDs.includes(data.id) && players[data.id].lobby == null) {

                    //Add new lobby to the list
                    lobbies[data.id] = data.settings;

                    //Add player to their own lobby
                    players[data.id].lobby = data.id;

                    //Set current player count to 1
                    lobbies[data.id].current = 1;

                    //Create array of players and add host to it
                    lobbies[data.id].players = new Array(data.id);

                    //Let the player know the lobby was created successfully
                    var msg = {
                        "type": "lobbyCreated"
                    };

                }

                //Let the client know that their ID is invalid
                else {
                    var msg = {
                        "type": "error",
                        "text": "Your ID is invalid."
                    };
                }
            }

            else if (data.type == "joinLobby") {

                //Make sure player is not already in a lobby
                if(players[data.id].lobby == null) {

                    //Add player to lobby
                    players[data.id].lobby == data.lobbyID;
                    lobbies[data.lobbyID].players.push(data.id);
                    lobbies[data.lobbyID].current++;

                    //Let each player in the lobby know a new player has joined
                    for(var i=0; i < lobbies[data.lobbyID].players.length; i++) {

                        let m = {
                            "type": "playerJoined",
                            "players": lobbies[data.lobbyID].players
                        };

                        players[ lobbies[data.lobbyID].players[i] ].emit(m);
                    }

                    //Let the client know the join was successful
                    var msg = {
                        "type": "lobbyJoined",
                        "lobbyID": data.lobbyID,
                        //Send current player list
                        "players": lobbies[data.lobbyID].players
                    };

                }

            }


            //Send the generated message if it exists
            if (msg) {
                conn.sendText(JSON.stringify(msg));
            }

        })

    }).listen(8082);

function loop() {
    //Reset console and output various metrics
    console.reset();
    console.log("PongPong Server\n");
    console.log("# of Players: " + Object.keys(players).length);
    console.log("List of IDs: " + IDs);
    console.log("# of Lobbies: " + Object.keys(lobbies).length + "\n");
    console.log("List of Lobbies:");
    console.log("Host\t\tPlayers\t\tPublic");
    for (var i = 0; i < Object.keys(lobbies).length; i++) {
        var e = Object.keys(lobbies)[i];
        console.log(e + "\t\t" + lobbies[e].current + "/" + lobbies[e].maxplayers + "\t\t" + lobbies[e].visibility);
    }
}

function generateUID(length = 4) {

    //Generate random unique indentifier
    let uid = Math.random().toString(36).substring(2, length + 2).toUpperCase();

    //Make sure it is unique, regenerate if not
    while (IDs.includes(uid)) {
        uid = Math.random().toString(36).substring(2, length + 2).toUpperCase();
    }

    //Keep a list of all IDs
    IDs.push(uid);

    return uid;
}
