const moveNumberElement = document.getElementById("moveNumber");
const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");


let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const isBlack = playerRole === "b";

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + colIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece && sourceSquare) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === 'b'){
        boardElement.classList.add("flipped");
    }else{
        boardElement.classList.remove("flipped");

    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };

    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        "K": "♔", 
        "Q": "♕", 
        "R": "♖",
        "B": "♗",
        "N": "♘", 
        "P": "♟",
        "k": "♚", 
        "q": "♛", 
        "r": "♜", 
        "b": "♝", 
        "n": "♞", 
        "p": "♙"
    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
    document.querySelectorAll('.piece').forEach(piece => {
        if (playerRole === piece.parentElement.classList.contains("white") ? "w" : "b") {
            piece.draggable = true; 
        }
    });
});

socket.on("Spectator", function () {
    playerRole = null;
    renderBoard();
});

socket.on("Currboard", function (fen) {
    chess.load(fen);
    renderBoard();
    const moveNumber = fen.split(' ')[5] || '1';
    moveNumberElement.textContent = `Move: ${moveNumber}`;
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

document.body.insertBefore(gameStatusElement, boardElement);

socket.on("gameOver", function (message) {
    gameStatusElement.textContent = message;
    gameStatusElement.className = message ? "game-over-message" : "";
    
    document.querySelectorAll('.piece').forEach(piece => {
        piece.draggable = false;
    });
});


socket.on("gameStarted", function(message) {
    gameStatusElement.textContent = message;
    gameStatusElement.className = "";
    moveNumberElement.textContent = "Move: 1";
    chess.reset();
    renderBoard();
    
    document.querySelectorAll('.piece').forEach(piece => {
        if (playerRole === (piece.classList.contains("white") ? "w" : "b")) {
            piece.draggable = true;
        } else {
            piece.draggable = false;
        }
    });
});



renderBoard();