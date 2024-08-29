const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join_team', (teamId) => {
    socket.join(teamId);
    console.log(`Client joined team ${teamId}`);
  });

  socket.on('message', (data) => {
    io.to(data.teamId).emit('message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
