var app = angular.module('myapp',['ngMaterial','ui.router','ngStorage']);

app.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect();

    return {
        on: function(eventName, callback){
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    };
}]);

app.config(['$stateProvider','$urlRouterProvider',function($stateProvider,$urlRouterProvider){
    $urlRouterProvider.otherwise('/');
    $stateProvider
    .state('login',{
        url:'/',
        views:{
            'body':{
                templateUrl:'/views/login.html',
                controller:'registerController'
            }
        }
    })
    .state('loggedin',{
        url:'/login',
        views:{
            'body':{
                templateUrl:'/views/chat.html',
                controller:'myController'
            }
        }
    })
}]);


app.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.myEnter);
                });

                event.preventDefault();
            }
        });
    };
});


app.controller('myController',['$scope','socket','$http','$mdDialog','$compile','$location','$state','$localStorage', '$sessionStorage',function($scope,socket,$http,$mdDialog,$compile,$location,$state,$localStorage, $sessionStorage){
    url= location.host;
    $scope.users=[];
    $scope.messages={};
    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

    socket.on('handle', function(data) {
        $scope.user = data;
        console.log("Get handle : "+$scope.user);
    });


    socket.on('users', function(data) {
        console.log("users list : "+data);
        $scope.$apply(function () {
            $scope.users=[];
            $scope.online_friends=[];
            for(var i in data){
                console.log("users list : "+i);
                if (i!=$scope.user){
                    console.log(i);
                    console.log("users list : "+$scope.allfriends);
                    if ( $scope.allfriends.includes(i) ){
                        $scope.online_friends.push(i);
                    }
                    else{
                        $scope.users.push(i);                        
                    }
                    
                }
            }
            console.log("users list : "+$scope.allfriends);
            console.log("users list : "+$scope.users);
            console.log("users list : "+$scope.online_friends);
        });
    });
    
    $scope.confirm=function(){
        var data = {
            "friend_handle":$scope.friend,
            "my_handle":$scope.user
        };

        $http({method: 'POST',url:'http://'+url+'/friend_request',data})//, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    };
    
    $scope.showConfirm = function(data) {
        var confirm = $mdDialog.confirm()
        .title(" connection request ")
        .textContent(data.my_handle+' wants to connect.Do you want to Connect?')
        .ariaLabel('Lucky day')
        .ok('Ok')
        .cancel('No');

        $mdDialog.show(confirm).then(function() {
            data['confirm']="Yes";
            $http({method: 'POST',url:'http://'+url+'/friend_request/confirmed', data//, headers:{
                //'Content-Type': 'application/json'
            //}
            })
        }, function() {
            data['confirm']="No";

            $http({method: 'POST',url:'http://'+url+'/friend_request/confirmed', data//, headers:{
            //    'Content-Type': 'application/json'
            //}
            })
        });
    };

    socket.on('message', function(data) {
        $scope.showConfirm(data);
    });

    var getDate=function(){
        date = new Date();
        hour=date.getHours();
        period="AM";
        if (hour>12){
            hour=hour%12;
            period="PM";
        }
        form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
        return form_date;        
    }
    
    
    socket.on('group', function(data) {
        var div = document.createElement('div');
        if(data.split("#*@")[1]!=$scope.user){
            div.innerHTML='<div class="direct-chat-msg right">\
                            <div class="direct-chat-info clearfix">\
                            <span class="direct-chat-name pull-right">'+data.split("#*@")[1]+'</span>\
                            <span class="direct-chat-timestamp pull-left">'+getDate()+'</span>\
                            </div>\
                            <div class="direct-chat-text">'
                            +data.split("#*@")[0]+
                            '</div>\
                            </div>';
            document.getElementById("group").appendChild(div);
            document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        }
    });
    
    $scope.group_message= function(message){
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+$scope.user+'</span>\
                        <span class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src=""\ alt="message user image">\
                        <div class="direct-chat-text">'
                        +message+
                        '</div>\
                        </div>';
        document.getElementById("group").appendChild(div);
        document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        socket.emit('group message',message+"#*@"+$scope.user);
        $scope.groupMessage=null;
    }
    
    var insertMessage = function(from,to,msg){
        console.log(from + " " + to);
        if (to in $scope.messages){
            if ($scope.messages[to].length>25){
                $scope.messages[to].splice(0,1);
            }
        }
        else{
            $scope.messages[to]=[];
        }
        $scope.messages[to].push({
            "sender":from,
            "msg" : msg,
            "date" : getDate()  
        });
        localStorage.setItem(to,JSON.stringify($scope.messages[to]));
        localStorage.setItem(from,JSON.stringify($scope.messages[from]));
        console.log(localStorage.getItem(to));
    }

    $scope.send_message=function(chat,message){
        console.log(chat);
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+$scope.user+'</span>\
                        <span class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src=""\ alt="message user image">\
                        <div class="direct-chat-text">'
                        +message+
                        '</div>\
                        </div>';
        document.getElementById(chat).appendChild(div);
        document.getElementById(chat).scrollTop=document.getElementById(chat).scrollHeight;
        socket.emit('private message',chat+"#*@"+message+"#*@"+$scope.user+"#*@"+getDate());
        insertMessage($scope.user,chat,message);
        $scope.message=null;
    }

    
    popups=[];
    
    //this is used to close a popup
    $scope.close_chat= function(chat_friend)
    {
        chat_box=null;
        console.log(chat_friend);
        console.log(popups);
        
        for(var iii = 0; iii < popups.length; iii++)
        {
            if(chat_friend == popups[iii])
            {
                console.log("sss");
                var chat_box=document.getElementById(popups[popups.length-1]+"01");
                chat_box.parentElement.removeChild(chat_box);
                popups.splice(iii,1);
            }
        }   
    }
    
}]);

app.service('encrypt', function() {
    this.hash =function(str){
        h = 7;
        letters = "abcdefghijklmnopqrstuvwxyz-_1234567890@!#$%&*.,"
        for (var i=0;i<str.length;i++){
            h = (h * 37 + letters.indexOf(str[i]))
        }
        return h
    }
});

app.controller('registerController',['$scope','encrypt','$http','$state',function($scope,encrypt,$http,$state){
    url= location.host;

    $scope.user={
        'name':'',
        'handle':'',
        'password':'',
        'email':'',
        'phone':''
    };

    $scope.login_data={
        'handle':'',
        'password':''
    };

    $scope.Register = function(){
        $scope.user.password=encrypt.hash($scope.user.password);

        $http({method: 'POST',url:'http://'+url+'/register', data:$scope.user})//, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    }

    $scope.login = function(){
        console.log("login");
        $scope.login_data.password=encrypt.hash($scope.login_data.password);
        console.log($scope.login_data);
        $http({ method: 'POST', url:'http://'+url+'/login', data:$scope.login_data })//, headers:config})
            .success(function (data) {
            if(data=="success"){
                console.log("Inside success login");
                $state.go('loggedin');
            }
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    }
}]);