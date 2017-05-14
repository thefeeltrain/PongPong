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
                };

                //Player disconnects
                conn.on("close", function() {

                    //If player was in a lobby
                    if(typeof players[msg.id].lobby !== "undefined") {

                        //Remove player from the lobby
                        let l = players[msg.id].lobby;
                        delete lobbies[l].players[msg.id];

                        //Lower current player count
                        lobbies[l].current--;

                    }

                    //Delete player and their lobby
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

                    //Set current status to in-lobby
                    lobbies[data.id].status = "lobby";

                    //Create map of players and add host to it
                    lobbies[data.id].players = new Object();
                    lobbies[data.id].players[data.id] = {
                        name: players[data.id].name,
                        score: 0
                    };

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

                    //Make sure lobby is not full
                    if(lobbies[data.lobbyID].current < lobbies[data.lobbyID].maxplayers) {

                        //Add player to lobby
                        players[data.id].lobby = data.lobbyID;
                        lobbies[data.lobbyID].players[data.id] = {
                            name: players[data.id].name,
                            score: 0
                        };
                        lobbies[data.lobbyID].current++;

                        //Let the client know the join was successful
                        var msg = {
                            "type": "lobbyJoined",
                            "lobbyID": data.lobbyID,
                            //Send current lobby
                            "Game": lobbies[data.lobbyID]
                        };

                    }

                }

            }

            else if (data.type == "leaveLobby") {

                let l = players[data.id].lobby;

                //If lobby still exists
                if(typeof lobbies[l] !== "undefined") {

                    //Remove player from the lobby
                    delete lobbies[l].players[data.id];

                    //Lower current player count
                    lobbies[l].current--;

                    //If player is the host of the lobby
                    if(data.id == l) {

                        //Completely remove that lobby
                        delete lobbies[l];

                    }

                }

                //Reset player's lobby
                delete players[data.id].lobby;

            }

            else if (data.type == "startGame") {

                //Mark the game as in progress
                lobbies[data.lobbyID].status = "playing";

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
    console.log("# of Lobbies: " + Object.keys(lobbies).length + "\n");

    console.log(JSON.stringify(players));

    console.log("List of Lobbies:");
    console.log("Host\t\tPlayers\t\tStatus");
    for (var i = 0; i < Object.keys(lobbies).length; i++) {
        var e = Object.keys(lobbies)[i];
        console.log(e + "\t\t" + lobbies[e].current + "/" + lobbies[e].maxplayers + "\t\t" + lobbies[e].status.capitalize());
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

//Helper function to clear console
console.reset = function() {
    return process.stdout.write('\033c');
}

//Capitalize first letter of string
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
