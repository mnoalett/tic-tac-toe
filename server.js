const WebSocket = require('ws');
const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.static('public'));

const winningCombination =  [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
]

var board = Array.from(Array(9).keys());
const webSocketServer = new WebSocket.Server({ port: 1337 });
var client = []
var currentPlayer = 'x'
var opponent = 'o'

function checkWin(board, player){
  let combos = board.reduce((a,e,i)=> (e===player) ? a.concat(i) : a,[])
  return winningCombination.some(el =>  el.every(index => combos.includes(index)) )
}

function isDraw(board) {
  return board.every(cell => cell === 'x' || cell === 'o')
}

function swapTurn(game, webSocket){
  console.log('currentPlayer: ' + game.player + ', turn: ' + currentPlayer)
  if(game.player != currentPlayer){
    let message = {
      type: 'error',
      message: 'Not your turn'
    }
    webSocket.send(JSON.stringify(message));
  } else {
    board[game.cell]=game.player
    let message = ""
    if(checkWin(board, game.player)){
      message = {
        type: 'end',
        status: 'win',
        player: game.player
      }
    } else if(isDraw(board)){
      message = {
        type: 'end',
        status: 'draw'
      }
    } else {
      turn = currentPlayer = currentPlayer == 'x' ? 'o':'x'
      message = {
        type: 'update',
        board: board,
        turn: turn
      }
    }
    client.forEach(ws => {
      ws.send(JSON.stringify(message));  
    });
  }
}

webSocketServer.on('connection', (webSocket,req) => {
  console.log('new client connected ' + req.headers['sec-websocket-key']);
  webSocket.id = req.headers['sec-websocket-key'];
  webSocket.on('message', message => {
    console.log('Received:', message);
    message = JSON.parse(message)
    switch(message.type){
      case 'new-user':
        webSocket.name = message.text;
        client.push(webSocket);
        console.log('New user:', webSocket.name);
        console.log(client.length + " clients connected");
        turn = currentPlayer
        opponent = opponent == 'x' ? 'o' : 'x'
        let payload = {
          type: 'init',
          playerID: opponent,
          turn: turn,
          board: board
        }
        webSocket.send(JSON.stringify(payload));
        if(client.length>1){
          client.forEach(ws => {
            ws.send(JSON.stringify({type:'start'}));  
          });
        }
        break
      case 'move':
        console.log(message)
        swapTurn(message, webSocket)
        break
      case 'restart':
        board = Array.from(Array(9).keys());
        turn = currentPlayer
        opponent = opponent == 'x' ? 'o' : 'x'
        let msg = {
          type: 'init',
          playerID: opponent,
          turn: turn,
          board: board
        }
        client.forEach(ws => {
          ws.send(JSON.stringify(msg));  
          msg.playerID = opponent == 'x' ? 'o' : 'x'
        });
        break
      default:
       console.log('operation not supported');
    } 
  });
  webSocket.on('close', () => {
    console.log('client disconnected: ' + webSocket.name);
    let index = client.indexOf(webSocket);
    client.splice(index,1);
    client.forEach(ws => {
      ws.send(JSON.stringify({type:'left'})); 
    })
  });
});


app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));