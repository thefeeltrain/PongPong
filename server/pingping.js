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
                if (IDs.includes(data.id) && data.lobby != null) {

                    var msg = {
                        "type": "sync",
                        "lobby": lobbies[data.lobby]
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

            //When the player wants to create a lobby
            else if (data.type == "createLobby") {

                //Make sure the player exists
                if (IDs.includes(data.id)) {

                    //Add new lobby to the list
                    lobbies[data.id] = data.settings;

                    //Set current player count to 1
                    lobbies[data.id].current = 1;

                    //Let the player know the lobby was created successfully
                    var msg = {
                        "type": "lobbyCreated"
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
