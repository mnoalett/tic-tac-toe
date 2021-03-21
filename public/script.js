var board
const ws = new WebSocket("ws://localhost:1337", "protocolOne");

let me = undefined
let turn = undefined
const cellElements = document.querySelectorAll('.cell')
const playerName = prompt("Come ti chiami?")

ws.onerror = () => { 
  let el = document.querySelector("#error-message")
  el.style.display = 'block'
  el.innerText = "Error: cannot connect to the server"
}

ws.onopen = () => ws.send(JSON.stringify({'type':'new-user', 'text':playerName}));

ws.onmessage = (message) => {
	let action = JSON.parse(message.data);
	console.log(action);
	switch(action.type){
    case 'start':
      document.querySelector('.game-board').style.display = "block"
      document.querySelector('.spinner').style.display = "none"
      me == turn ? document.querySelector('.table-header').innerHTML = "Your Turn" :  document.querySelector('.table-header').innerHTML = "waiting..."
      break
    case 'init':
      board = action.board
      turn = action.turn
      me = action.playerID
      updateGame();
      break;
    case 'update':
      board = action.board
      turn = action.turn
      me == turn ? document.querySelector('.table-header').innerText = "Your turn" : document.querySelector('.table-header').innerText = "waiting..."
      updateGame();
      break;
    case 'end':
      updateGame();
      action.status=='win' ? gameOver(false, action.player) : gameOver(true, null)
      break;
    case 'left':
      alert('Player has left')
      break
    default:
			console.log("operation not supported")
	}
};

function updateGame(){
  document.getElementById('winning-message').style["display"]="none";
  for(cell in board) {
    if(board[cell] == 'x' || board[cell] == 'o'){
      cellElements[cell].innerText = board[cell]
      cellElements[cell].style.setProperty('cursor','not-allowed')
      cellElements[cell].removeEventListener('click', doClick)
    } else {
      cellElements[cell].innerText = ''
      cellElements[cell].style.setProperty('cursor','pointer')
      cellElements[cell].addEventListener('click', doClick, false)
    }
  }
}

function doClick(cell){
  let state = {
    type: 'move',
    player: me,
    cell: cell.target.id
  }
  ws.send(JSON.stringify(state))
}

function gameOver(isDraw, player){
  if(isDraw) {
    document.getElementById('winning-message').style["display"]="block";
    document.getElementById('message').innerText = "Pareggio";
  } else {
    if(player==='x'){
      document.getElementById('winning-message').style["display"]="block";
      document.getElementById('message').innerText = "Vittoria di X";
    } else {
      document.getElementById('winning-message').style["display"]="block";
      document.getElementById('message').innerText = "Vittoria di O";
    }
  }
}

function replay(){
  ws.send(JSON.stringify({type:'restart'}))
}