const express = require("express");
const app = express()

const http = require("http")
const path = require("path")

const socket = require("socket.io");
const { Chess } = require("chess.js")

// connecting the server to http and linking it to express
const server = http.createServer(app)
const io = socket(server)


// chess js stored in variable chess
const chess = new Chess()

let players = {}
let current_player = "w"

app.set("view engine", "ejs")

app.use(express.static(path.join(__dirname,"public")));

app.get("/", (req,res)=>{
    res.render("index",{ title: "Chess Game"});
});


io.on("connection", function (uniquesocket) {
    console.log("Connected");

    // uniquesocket.on("disconnect",function () {
    //     console.log("connected");
    // })

    

    // saving the white and black ids and first person who joins get white 
    if (!players.white) {
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w")
    }
    else if (!players.black) {
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b")
        
    }
    else{
        uniquesocket.wmit("spectatoRole")
    }

    // disconnecting black/white/spectator
    socket.on("disconnect",function () {
        if (uniquesocket.id === players.white) {
            delete players.white
        }
        else if (uniquesocket.id === players.black) {
            delete players.black
        }
    })

    // move peice function
    uniquesocket.on("move", (move)=> {
        try {
            // turn check so the one with not the turn cant move 
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) {
                return;
            }
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) {
                return;
            }

            const result = chess.move(move); // save the move


            if (result) {
                current_player = chess.turn()
                io.emit("move",move); // 

                io.emit("boardState",chess.fen())
            }

            else{
                console.log("invalid move:",move);
                uniquesocket.emit("invalidMove",move);
            }



        } catch (err) {
                console.log(err);
                uniquesocket.emit("invalid move:",move);
        }
    })

})



server.listen(3000, function () {
    
    console.log("The server is listening on port 3000")
})