var express=require('express');
var app=express();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var ip = require('ip');
app.use(express.static('./')); 


require("./controller/controller.js")(app,io);

/*http.listen(8080,function(){
    console.log("Node Server is setup and it is listening on http://"+ip.address()+":8080");
})*/

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on', http.address().port);
});