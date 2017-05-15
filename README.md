# PongPong

Connects players together to play the classic game of Pong with up to 4 people in a game.

Built for FloatPlane Club in HTML, CSS, JavaScript, and NodeJS from scratch in about 3 days.

&nbsp;

## Testing

A version of the game can be played at http://pongpong.thefeeltra.in.

Be aware it is hosted in San Francisco so distance may cause lag and ping related issues.

&nbsp;

## Features

- 2-4 Players per game
- Lobbies
- ~Lobby chat~ Cut due to time constraints
- Server browser
- Player stats
- Settings

&nbsp;

## Running Your Own Server

By default, the game connects to my test server here in California. This may cause some lag/ping related issues. In an ideal situation there would be dedicated servers for different regions.

Before attempting to run a server make sure you have NodeJS installed.

```
cd /path/to/PongPong/server
node pingping.js
```

I recommend you use foreverjs if you need it to run it well, forever.
```
npm install forever -g
forever start pingping.js
```

&nbsp;

## Hosting a Lobby

Lobbies can be easily created from the in-game menus. Just click "Create Game" and choose your settings. Click start to add yourself to the server list. You can start the game once your lobby is full.

## Joining a Lobby

Same as creating a lobby, joining one is relatively simple. Click "Join Game" and you will recieve a list of available servers. Click on any of them to join.

&nbsp;

## Additions to Pong

One of the coolest additions, in my opinion, is that the ball changes colors depending on who last hit it, letting you know who will get the point if it gets past another player.

If the ball is green, it means a player has not touched it yet. A green ball does not count against you, but simply resets in the direction of the player opposite you instead.

There is also Linus mode, which changes the ball into a PNG of Linus' head. Simply amazing.
