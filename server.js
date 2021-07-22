// const express = require("express");
// const socketio = require("socket.io");
// const http = require("http");

// const PORT = process.env.PORT || 4000;

// const router = require("./router");

// const app = express();
// const server = http.createServer(app);
// const io = socketio(server);

// app.use(router);
// server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
var app = require("express")();
// var path = require('path');
var http = require("http");
var server = http.createServer(app);
const socketio = require("socket.io");
// var io = socketio(http);
const port = process.env.PORT || 4000; //process.env.NODE_ENV === "production" ? 3000 : 3001;

const router = require("./router");

const cors = require("cors");

app.use(router);
app.use(cors());

const io = socketio(server);
// const io = socketio(server, {
//   cors: {
//     // origin: "https://chatella.herokuapp.com/",
//     origin: "localhost:3000",
//   },
// });

var onlineUsers = [];
var userGoogleIdList = [];
var googleIdToSocketId = {};
// let i = 0;
// Initialize appication with route / (that means root of the application)
// app.get('/', function(req, res){
//     var express=require('express');
//     app.use(express.static(path.join(__dirname)));
//     res.sendFile(path.join(__dirname, 'index.html'));
// });
//
// // // Have Node serve the files for our built React app
// app.use(express.static(path.resolve(__dirname, '../front_end/build')));

// Register events on socket connection

io.on("connection", function (socket) {
  // console.log(i);
  // i++;
  // console.log('connected')

  // Listen to chantMessage event sent by client and emit a chatMessage to the client
  socket.on("chatMessage", function (message) {
    if (message !== null || message !== undefined) {
      message.receiver.forEach(function (socketId) {
        io.to(socketId).emit("chatMessage", message);
      });
      console.log("msg sender arr size: " + message.sender.length);
      console.log("msg receiver arr size: " + message.receiver.length);
      console.log("this socketid: " + socket.id);
      console.log("msg sender arr" + JSON.stringify(message.sender));
      if (Array.isArray(message.sender)) {
        //send msg to other windows of same google account
        message.sender.forEach(function (socketId) {
          if (socketId !== socket.id) {
            //msg came from different socket but same google acc
            //redirect message sent from window1 to 2 both same google acc
            message.origin = socket.id;
            message.destination = socketId;
            io.to(socketId).emit("updateChat", message);
            console.log("update chat fired");
          }
        });
      }
    }
    //io.to(message.receiver).emit('chatMessage', message);
  });

  // Listen to notifyTyping event sent by client and emit a notifyTyping to the client
  socket.on("notifyTyping", function (sender, receiver) {
    receiver.id.forEach(function (socketId) {
      io.to(socketId).emit("notifyTyping", sender, receiver);
    });
  });

  // Listen to newUser event sent by client and emit a newUser to the client with new list of online user
  socket.once("newUser", function (user) {
    console.log("newUser registered");
    console.log(user.name);
    console.log(user.googleId);
    var newUser = { id: [socket.id], name: user.name, googleId: user.googleId };
    console.log(newUser.id);
    if (onlineUsers.length === 0) {
      //for first user or new unique user
      onlineUsers.push(newUser);
      userGoogleIdList.push(newUser.googleId);
      googleIdToSocketId[newUser.googleId] = [];
      googleIdToSocketId[newUser.googleId].push(socket.id);
    } else if (userGoogleIdList.includes(newUser.googleId)) {
      //multiple user with same google ID : repeat accs
      googleIdToSocketId[newUser.googleId].push(socket.id);

      for (let i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].googleId === newUser.googleId) {
          //find the old user with same google acc
          onlineUsers[i].id.push(socket.id);
          newUser.id = onlineUsers[i].id;
          console.log("onlineUsers repeat acc: " + onlineUsers[i].id.length);
        }
      }
    } else {
      //new unique user
      onlineUsers.push(newUser);
      userGoogleIdList.push(newUser.googleId);
      googleIdToSocketId[newUser.googleId] = [];
      googleIdToSocketId[newUser.googleId].push(socket.id);
    }

    console.log(googleIdToSocketId[newUser.googleId].length);
    googleIdToSocketId[newUser.googleId].forEach(function (socketId) {
      console.log("server emit newuser length: " + newUser.id.length);

      io.to(socketId).emit("newUser", newUser);
    });
    console.log("onlineusers length: " + onlineUsers.length);
    io.emit("onlineUsers", onlineUsers);
  });

  // Listen to disconnect event sent by client and emit userIsDisconnected and onlineUsers (with new list of online users) to the client
  socket.on("disconnect", function () {
    onlineUsers.forEach(function (user, index) {
      if (user.id.includes(socket.id)) {
        if (user.id.length === 1) {
          //only 1 socket for the acc delete the whole user profile
          onlineUsers.splice(index, 1);
          const ugilIndex = userGoogleIdList.indexOf(user.googleId);
          userGoogleIdList.splice(ugilIndex, 1);
          delete googleIdToSocketId[user.googleId];
          io.emit("userIsDisconnected", user.googleId);
        } else {
          //multiple socketid send updated user info and onlineuser list
          const index = user.id.indexOf(socket.id);
          user.id.splice(index, 1);
          user.id.forEach(function (socketId) {
            io.to(socketId).emit("newUser", user);
          });
        }
        io.emit("onlineUsers", onlineUsers);
      }
    });
    // socket.removeAllListeners();
  });
});

// Listen application request on port 3000
// http.listen(process.env.PORT || 3000, function (){
//     console.log('listening on *:3000');
// });
server.listen(port, () => console.log(`listening on ${port}`));

// var app = require('express')();
// // var path = require('path');
// var http = require('http');
// var server = http.createServer(app);
// const socketio = require('socket.io');
// // var io = socketio(http);
// const port = process.env.PORT || 4000 //process.env.NODE_ENV === "production" ? 3000 : 3001;

// // const cors = require('cors');
// // app.use(cors())

// const io = socketio(server,{
//     cors: {
//         origin: "https://chatella.herokuapp.com/"
//         // origin: "localhost:3000"
//     },
// });

// var onlineUsers = [];
// var userGoogleIdList = [];
// var googleIdToSocketId = {};
// // let i = 0;
// // Initialize appication with route / (that means root of the application)
// // app.get('/', function(req, res){
// //     var express=require('express');
// //     app.use(express.static(path.join(__dirname)));
// //     res.sendFile(path.join(__dirname, 'index.html'));
// // });
// //
// // // // Have Node serve the files for our built React app
// // app.use(express.static(path.resolve(__dirname, '../front_end/build')));

// // Register events on socket connection

// io.on('connection', function (socket) {
//     // console.log(i);
//     // i++;
//     // console.log('connected')

//     // Listen to chantMessage event sent by client and emit a chatMessage to the client
//     socket.on('chatMessage', function (message) {
//         message.receiver.forEach(function (socketId) {
//             io.to(socketId).emit('chatMessage', message);
//         })
//         console.log('msg sender arr size: ' + message.sender.length);
//         console.log('msg receiver arr size: ' + message.receiver.length);
//         console.log('this socketid: ' + socket.id);
//         console.log('msg sender arr' + JSON.stringify(message.sender));
//         if (Array.isArray(message.sender)) {//send msg to other windows of same google account
//             message.sender.forEach(function (socketId) {
//                 if (socketId !== socket.id) {//msg came from different socket but same google acc
//                     //redirect message sent from window1 to 2 both same google acc
//                     message.origin = socket.id;
//                     message.destination = socketId;
//                     io.to(socketId).emit('updateChat', message);
//                     console.log('update chat fired');
//                 }
//             })
//         }
//         //io.to(message.receiver).emit('chatMessage', message);
//     });

//     // Listen to notifyTyping event sent by client and emit a notifyTyping to the client
//     socket.on('notifyTyping', function (sender, receiver) {
//         receiver.id.forEach(function (socketId) {
//             io.to(socketId).emit('notifyTyping', sender, receiver);
//         })
//     });

//     // Listen to newUser event sent by client and emit a newUser to the client with new list of online user
//     socket.once('newUser', function (user) {
//         console.log('newUser registered');
//         console.log(user.name);
//         console.log(user.googleId);
//         var newUser = {id: [socket.id], name: user.name, googleId: user.googleId};
//         console.log(newUser.id)
//         if (onlineUsers.length === 0) {//for first user or new unique user
//             onlineUsers.push(newUser);
//             userGoogleIdList.push(newUser.googleId);
//             googleIdToSocketId[newUser.googleId] = [];
//             googleIdToSocketId[newUser.googleId].push(socket.id);
//         } else if (userGoogleIdList.includes(newUser.googleId)) {//multiple user with same google ID : repeat accs
//             googleIdToSocketId[newUser.googleId].push(socket.id);

//             for (let i = 0; i < onlineUsers.length; i++) {
//                 if (onlineUsers[i].googleId === newUser.googleId) {//find the old user with same google acc
//                     onlineUsers[i].id.push(socket.id);
//                     newUser.id = onlineUsers[i].id;
//                     console.log('onlineUsers repeat acc: ' + onlineUsers[i].id.length);
//                 }
//             }
//         } else { //new unique user
//             onlineUsers.push(newUser);
//             userGoogleIdList.push(newUser.googleId);
//             googleIdToSocketId[newUser.googleId] = [];
//             googleIdToSocketId[newUser.googleId].push(socket.id);
//         }

//         console.log(googleIdToSocketId[newUser.googleId].length);
//         googleIdToSocketId[newUser.googleId].forEach(function (socketId) {
//             console.log('server emit newuser length: ' + newUser.id.length);

//             io.to(socketId).emit('newUser', newUser);
//         });
//         console.log('onlineusers length: ' + onlineUsers.length);
//         io.emit('onlineUsers', onlineUsers);
//     });

//     // Listen to disconnect event sent by client and emit userIsDisconnected and onlineUsers (with new list of online users) to the client
//     socket.on('disconnect', function () {
//         onlineUsers.forEach(function (user, index) {
//             if (user.id.includes(socket.id)) {
//                 if (user.id.length === 1){//only 1 socket for the acc delete the whole user profile
//                     onlineUsers.splice(index, 1);
//                     const ugilIndex = userGoogleIdList.indexOf(user.googleId);
//                     userGoogleIdList.splice(ugilIndex, 1);
//                     delete googleIdToSocketId[user.googleId];
//                     io.emit('userIsDisconnected', user.googleId);
//                 } else {//multiple socketid send updated user info and onlineuser list
//                     const index = user.id.indexOf(socket.id);
//                     user.id.splice(index, 1);
//                     user.id.forEach(function (socketId) {
//                         io.to(socketId).emit('newUser', user);
//                     });
//                 }
//                 io.emit('onlineUsers', onlineUsers);
//             }
//         });
//         // socket.removeAllListeners();
//     });

// });

// // Listen application request on port 3000
// // http.listen(process.env.PORT || 3000, function (){
// //     console.log('listening on *:3000');
// // });
// server.listen(port, () => console.log(`listening on ${port}`));
