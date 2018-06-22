const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const {generateMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');
const server = express();

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;


var httpServer = http.createServer(server);
var io = socketIO(httpServer);
var users = new Users();
server.use(express.static(publicPath));


io.on('connection', (socket)=>{
    console.log('New user connected');
  
        socket.on('disconnect', ()=>{
            var user = users.remove(socket.id);
            if(user){
                io.to(user.room).emit('updateUserList',users.getUserList(user.room));
                io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left`));
            }
        });
    
  
    socket.on('join', (params, callback)=>{
        if(!isRealString(params.name) || !isRealString(params.room)){
            return callback('Name and room name are required');
        }

        socket.join(params.room);
        users.remove(socket.id);
        users.addUser(socket.id, params.name, params.room);

        io.to(params.room).emit('updateUserList', users.getUserList(params.room));
        socket.emit('newMessage', generateMessage('Admin', 'Welcome to the iChat'));
        socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} has joined`));
        callback();
    });
    socket.on('createMessage', (newMessage, callback)=>{
        var user = users.getUser(socket.id);
        if(user && isRealString(newMessage.text)){
            io.to(user.room).emit('newMessage', generateMessage(user.name, newMessage.text));
        }
        
        callback();
       
    });
 
});
httpServer.listen(port, ()=>{
    console.log(`Server is up on PORT ${port}`);
});