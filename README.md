This is a web app that runs a multiplayer card game based on the popular Trinidadian card game "All Fours". It allows friends to join a room and play with each other online. 


## Architecture: 
App (routing + home screen)
        ↓
MultiplayerGameBoard (UI + state owner)
        ↓
WebSocketClient (transport + protocol adapter)
        ↓
server.js (room + game engine)
        ↓
GameController + GUIIO