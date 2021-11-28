const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const redis = require("redis");
const client = redis.createClient();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname,'public')));
const botName = 'ChatMates Bot';

//Run when client connects
io.on('connection',socket =>{

    socket.on('joinRoom', ({ username, room}) => {
    const user = userJoin(socket.id, username, room);
    
    socket.join(user.room);

    //client.rpush("messages",`${socket.id}:${username}:${room}`);

    //welcome current user
    socket.emit('message',formatMessage(botName, 'Welcome to ChatMates!'));

    //broadcast when a user connects
    socket.broadcast.to(user.room).emit(
    'message',
    formatMessage(botName, `${user.username} has joined the chat`));

    //send user and room info
    io.to(user.room).emit('roomUsers',{
      room: user.room,
      users:getRoomUsers(user.room)
    });

    });

    //Listen chatMessage
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id);
        
        // client.rpush("messages",`${socket.id}:${username}:${room}:${msg}`);

        io.to(user.room).emit('message',formatMessage(user.username,msg));

    });

    //runs when client disconnect
     socket.on('disconnect',() =>{
         const user = userLeave(socket.id);

         if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left 
            the chat`));
         }

    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
