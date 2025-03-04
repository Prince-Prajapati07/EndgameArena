const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const port = 8170;
const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let Players = {};
let Currplayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
    res.render("index", { title: "Master Chess" });
});

io.on("connection", function (uniquesocket){

    if (!Players.white) {
        Players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!Players.black) {
        Players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("Spectator");
    }

    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id === Players.white) {
            delete Players.white;
        } else if (uniquesocket.id === Players.black) {
            delete Players.black;
        }
    });

    uniquesocket.on("move", function (move) {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== Players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== Players.black) return;

            const result = chess.move(move);

            if (result) {
                if (chess.isCheckmate()) {
                    const winner = chess.turn() === 'w' ? 'Black' : 'White';
                    const winnerSocket = chess.turn() === 'w' ? Players.black : Players.white;
                    const loserSocket = chess.turn() === 'w' ? Players.white : Players.black;

                    io.to(winnerSocket).emit("gameOver", "You win by checkmate!");
                    io.to(loserSocket).emit("gameOver", "You lose by checkmate!");
                }

                Currplayer = chess.turn();
                io.emit("move", move);
                io.emit("Currboard", chess.fen());
            } else {
                uniquesocket.emit("Invalid Move", move);
            }
        } catch (err) {
            uniquesocket.emit("Invalid Move", move);
        }
    });

        
     

    uniquesocket.emit("Currboard", chess.fen());
});

server.listen(port, "0.0.0.0", function () {
    console.log(`Server running at http://192.168.200.181:${port}`);
});