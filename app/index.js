var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// 在线用户
var onlineUsers = {};
// 当前在线人数
var onlineCount = 0;
let chatlog = []
let rooms = {
}

app.get('/', function (req, res) {
    res.send('<h1>Welcome Realtime Server</h1>');
});

app.get('/logs', (req, res) => {
    res.json(chatlog)
})

io.on('connection', function (socket) {
    console.log('a user connected');

    // 监听新用户加入
    socket.on('login', function (obj) {
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        socket.name = obj.userid;

        //检查在线列表，如果不在里面就加入
        if (!onlineUsers.hasOwnProperty(obj.userid)) {
            onlineUsers[obj.userid] = obj.username;
            //在线人数+1
            onlineCount++;
        }

        //向所有客户端广播用户加入
        io.emit('login', {onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj});
        console.log(obj.username + '加入了聊天室');
    });

    //监听用户退出
    socket.on('disconnect', function () {
        //将退出的用户从在线列表中删除
        if (onlineUsers.hasOwnProperty(socket.name)) {
            //退出用户的信息
            var obj = {userid: socket.name, username: onlineUsers[socket.name]};

            //删除
            delete onlineUsers[socket.name];
            //在线人数-1
            onlineCount--;

            //向所有客户端广播用户退出
            io.emit('logout', {onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj});
            console.log(obj.username + '退出了聊天室');
        }
    });

    //监听用户发布聊天内容
    socket.on('message', function (obj) {
        console.log(obj)
        if (obj.to_id === '2') {
            console.log('机器人啊');
            //io.emit('debug', io.socket);
            io.emit('message', obj);
            io.sockets.socket(socket).emit('message', {
                from_id: '2',
                username: '机器人',
                to_id: obj.from_id,
                type: 'one',
                content: '这是自动回复，么么哒',
                time: new Date().getTime()
            });
        } else {
            //向所有客户端广播发布的消息
            io.emit('message', obj);
            chatlog.push(obj)
            console.log(obj.username + '说：' + obj.content + '**');
        }

    });

});

http.listen(3000, function () {
    console.log('listening on *:3000');
});