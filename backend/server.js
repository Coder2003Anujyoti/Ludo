const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});
const { v4: uuidv4 } = require('uuid');
const crypto=require("crypto")
const rooms={}
const turn={}
const game={}
const count={}
const options={}
io.on("connection", (socket) => {
socket.on('join-room', (msg) => {
const birds=["Birds/Red.webp","Birds/Blues.webp","Birds/Chuck.webp"]
const name=msg.name
let assignedRoom=null;
for (const roomID in rooms) {
const existingPlayer = rooms[roomID].find(p => p.name === name);
if (existingPlayer) {
socket.emit("wait", "Already joined in another room...");
return;
}
}
for(const roomID in rooms){
if(rooms[roomID].length<2){
  assignedRoom=roomID;
        break;
      }
    }
    if(!assignedRoom){
      assignedRoom=uuidv4();
      rooms[assignedRoom]=[]
      let rand=Math.floor(Math.random()*birds.length)
      options[assignedRoom]=birds.slice(rand,rand+2)
    }
    rooms[assignedRoom].push({ id: socket.id, name,position:0,move:0,image:options[assignedRoom][rooms[assignedRoom].length]});
    console.log(rooms[assignedRoom])
    socket.join(assignedRoom);
    console.log(`${name} joined room ${assignedRoom}`);
  if (rooms[assignedRoom].length === 1) {
      io.to(assignedRoom).emit('wait', 'Waiting for another player...');
    }
    if (rooms[assignedRoom].length === 2) {
      const players = rooms[assignedRoom];
      const positions = [];
      for (let row = 0; row < 8; row++) {
        const usedCols = new Set();
        const forbiddenCols = new Set();
        if (row === 0) forbiddenCols.add(0);
        if (row === 7) forbiddenCols.add(7);
        while (usedCols.size < 2) {
          const col = Math.floor(Math.random() * 8);
          const index = row * 8 + col;
          if (
            !forbiddenCols.has(col) &&
            !usedCols.has(col) &&
            !usedCols.has(col - 1) &&
            !usedCols.has(col + 1)
          ) {
            usedCols.add(col);
            positions.push(index);
          }
        }
      }
       turn[assignedRoom]=Math.floor(Math.random()*2);
       count[assignedRoom]=0
       game[assignedRoom]={
         positions,
         locations:{
           [players[0].name]:0,
           [players[1].name]:0
         },
         result:""
       }
      io.to(assignedRoom).emit('start-game', {
        roomId: assignedRoom,
        players,
        game:game[assignedRoom]
      });
       io.to(players[turn[assignedRoom]].id).emit('choice-turn',"Your Turn")
     io.to(players[(turn[assignedRoom]+1)%2].id).emit('choice-turn',"Opposition Turn")
    }
    socket.roomId = assignedRoom;
  })
socket.on("start-roll",(msg)=>{
  const val=msg.name
const id=socket.roomId
const player=rooms[id].find((i)=>i.name != val)
if(!player) return
io.to(player.id).emit("show-roll",{name:val,players:rooms[id]})
})
socket.on("round-done",(msg)=>{
  const id=socket.roomId
  const players=rooms[id]
  const loc=game[id].positions
  const player=rooms[id].find((i)=>i.name==msg.name)
  player.move=msg.move
  if(player.position+player.move > 63 || loc.includes(player.position+player.move)){
    player.position=player.position
  }
else if(player.position+player.move == 63){
  player.position+=player.move
  game[id].result= player.name
}
else{
  player.position+=player.move
}
  io.to(id).emit("result-round", {
       roomId:id,
        players:rooms[id],
        game:game[id]
      })
  count[id]++
  if(count[id]%2 != 0){
  io.to(players[turn[id]].id).emit('choice-turn',"Opposition Turn")
     io.to(players[(turn[id]+1)%2].id).emit('choice-turn',"Your Turn")
  }
  else{
    io.to(players[turn[id]].id).emit('choice-turn',"Your Turn")
     io.to(players[(turn[id]+1)%2].id).emit('choice-turn',"Opposition Turn")
  }
if(game[id].result != ""){
  delete rooms[id]
  delete game[id]
  delete turn[id]
  delete count[id]
  delete options[id]
  io.in(id).socketsLeave(id);
  return ;
}
})
socket.once('disconnect', () => {
  console.log("Player disconnected:", socket.id);
    for (const roomId in rooms) {
      const index = rooms[roomId].findIndex(p => p.id === socket.id);
      if (index !== -1) {
        rooms[roomId].splice(index, 1);
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        } else {
          socket.to(roomId).emit("wait", "A player has been disconnected...");
        }
        break; 
      }
    } // or just reuse logic
    console.log(rooms)
});
});
server.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});