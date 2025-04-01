// Elementos do jogo
const board = document.getElementById('board');
const score1Element = document.getElementById('score1');
const score2Element = document.getElementById('score2');
const restartBtn = document.getElementById('restart-btn');
const rulesBtn = document.getElementById('rules-btn');
const winnerModal = document.getElementById('winner-modal');
const winnerText = document.getElementById('winner-text');
const winnerIcon = document.getElementById('winner-icon');
const playAgainBtn = document.getElementById('play-again-btn');
const rulesModal = document.getElementById('rules-modal');
const closeRulesBtn = document.getElementById('close-rules-btn');

// Estado do jogo
let gameState = {
    board: Array(8).fill().map(() => Array(8).fill(null)),
    currentPlayer: 1,
    selectedPiece: null,
    possibleMoves: [],
    score: [0, 0],
    mandatoryCapture: null
};

// Inicializa o jogo
function initGame() {
    // Limpa o tabuleiro
    board.innerHTML = '';
    gameState.board = Array(8).fill().map(() => Array(8).fill(null));
    gameState.currentPlayer = 1;
    gameState.selectedPiece = null;
    gameState.possibleMoves = [];
    gameState.mandatoryCapture = null;
    
    // Cria as células do tabuleiro
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            cell.addEventListener('click', () => handleCellClick(row, col));
            
            board.appendChild(cell);
            
            // Coloca as peças iniciais
            if ((row + col) % 2 !== 0) {
                if (row < 3) {
                    gameState.board[row][col] = { player: 2, isKing: false };
                } else if (row > 4) {
                    gameState.board[row][col] = { player: 1, isKing: false };
                }
            }
        }
    }
    
    updateBoard();
    updateScores();
}

// Atualiza a exibição do tabuleiro
function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        // Remove peças e movimentos possíveis
        const existingPiece = cell.querySelector('.piece');
        if (existingPiece) cell.removeChild(existingPiece);
        
        const existingMove = cell.querySelector('.possible-move');
        if (existingMove) cell.removeChild(existingMove);
        
        // Adiciona peças atuais
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const piece = gameState.board[row][col];
        
        if (piece) {
            const pieceElement = document.createElement('div');
            pieceElement.className = `piece player${piece.player} ${piece.isKing ? 'king' : ''}`;
            cell.appendChild(pieceElement);
        }
    });
    
    // Mostra movimentos possíveis
    gameState.possibleMoves.forEach(move => {
        const cell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
        if (cell) {
            const moveIndicator = document.createElement('div');
            moveIndicator.className = 'possible-move';
            cell.appendChild(moveIndicator);
        }
    });
}

// Atualiza os placares
function updateScores() {
    score1Element.textContent = gameState.score[0];
    score2Element.textContent = gameState.score[1];
}

// Manipula cliques nas células
function handleCellClick(row, col) {
    // Verifica se é um movimento possível
    const isMove = gameState.possibleMoves.some(move => move.row === row && move.col === col);
    
    if (isMove) {
        movePiece(row, col);
        return;
    }
    
    // Verifica se há uma peça do jogador atual
    const piece = gameState.board[row][col];
    if (piece && piece.player === gameState.currentPlayer) {
        selectPiece(row, col);
    }
}

// Seleciona uma peça
function selectPiece(row, col) {
    gameState.selectedPiece = { row, col };
    gameState.possibleMoves = getPossibleMoves(row, col);
    
    // Verifica capturas obrigatórias
    if (gameState.mandatoryCapture) {
        if (!gameState.possibleMoves.some(move => move.isCapture)) {
            gameState.possibleMoves = [];
            return;
        }
        
        // Filtra apenas capturas
        gameState.possibleMoves = gameState.possibleMoves.filter(move => move.isCapture);
    }
    
    updateBoard();
}

// Obtém movimentos possíveis para uma peça
function getPossibleMoves(row, col) {
    const piece = gameState.board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const directions = [];
    
    // Direções baseadas no tipo de peça
    if (piece.isKing) {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    } else {
        if (piece.player === 1) {
            directions.push([-1, -1], [-1, 1]); // Peppa move para cima
        } else {
            directions.push([1, -1], [1, 1]); // George move para baixo
        }
    }
    
    // Verifica movimentos simples e capturas
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (isValidPosition(newRow, newCol)) {
            if (!gameState.board[newRow][newCol]) {
                // Movimento simples
                moves.push({ row: newRow, col: newCol, isCapture: false });
            } else if (gameState.board[newRow][newCol].player !== piece.player) {
                // Possível captura
                const captureRow = newRow + dr;
                const captureCol = newCol + dc;
                
                if (isValidPosition(captureRow, captureCol) && !gameState.board[captureRow][captureCol]) {
                    moves.push({ 
                        row: captureRow, 
                        col: captureCol, 
                        isCapture: true,
                        capturedRow: newRow,
                        capturedCol: newCol
                    });
                }
            }
        }
    }
    
    return moves;
}

// Move uma peça
function movePiece(row, col) {
    const { selectedPiece, possibleMoves } = gameState;
    const move = possibleMoves.find(m => m.row === row && m.col === col);
    
    if (!move || !selectedPiece) return;
    
    const piece = gameState.board[selectedPiece.row][selectedPiece.col];
    
    // Move a peça
    gameState.board[row][col] = piece;
    gameState.board[selectedPiece.row][selectedPiece.col] = null;
    
    // Verifica se virou dama
    if (!piece.isKing) {
        if ((piece.player === 1 && row === 0) || (piece.player === 2 && row === 7)) {
            piece.isKing = true;
        }
    }
    
    // Captura peça adversária se necessário
    if (move.isCapture) {
        gameState.board[move.capturedRow][move.capturedCol] = null;
        gameState.score[piece.player - 1]++;
        
        // Verifica se há mais capturas possíveis
        const nextCaptures = getPossibleMoves(row, col).filter(m => m.isCapture);
        
        if (nextCaptures.length > 0) {
            gameState.mandatoryCapture = true;
            selectPiece(row, col);
            return;
        }
    }
    
    // Próximo jogador
    gameState.mandatoryCapture = false;
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.selectedPiece = null;
    gameState.possibleMoves = [];
    
    // Verifica se o jogo terminou
    if (isGameOver()) {
        showWinner();
    }
    
    updateBoard();
    updateScores();
}

// Verifica se a posição é válida
function isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Verifica se o jogo terminou
function isGameOver() {
    let player1Pieces = 0;
    let player1CanMove = false;
    let player2Pieces = 0;
    let player2CanMove = false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece) {
                if (piece.player === 1) {
                    player1Pieces++;
                    if (getPossibleMoves(row, col).length > 0) {
                        player1CanMove = true;
                    }
                } else {
                    player2Pieces++;
                    if (getPossibleMoves(row, col).length > 0) {
                        player2CanMove = true;
                    }
                }
            }
        }
    }
    
    return (player1Pieces === 0 || !player1CanMove) || (player2Pieces === 0 || !player2CanMove);
}

// Mostra o vencedor
function showWinner() {
    const player1Pieces = countPieces(1);
    const player2Pieces = countPieces(2);
    
    if (player1Pieces === 0 || (player2Pieces > 0 && player1Pieces > 0 && !canPlayerMove(1))) {
        winnerText.textContent = 'George Venceu!';
        winnerIcon.className = 'winner-icon winner-george';
    } else {
        winnerText.textContent = 'Peppa Venceu!';
        winnerIcon.className = 'winner-icon winner-peppa';
    }
    
    winnerModal.style.display = 'flex';
}

// Conta peças de um jogador
function countPieces(player) {
    let count = 0;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.player === player) {
                count++;
            }
        }
    }
    
    return count;
}

// Verifica se um jogador pode mover
function canPlayerMove(player) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.player === player && getPossibleMoves(row, col).length > 0) {
                return true;
            }
        }
    }
    
    return false;
}

// Event listeners
restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', () => {
    winnerModal.style.display = 'none';
    initGame();
});

rulesBtn.addEventListener('click', () => {
    rulesModal.style.display = 'flex';
});

closeRulesBtn.addEventListener('click', () => {
    rulesModal.style.display = 'none';
});

// Inicia o jogo
initGame();
