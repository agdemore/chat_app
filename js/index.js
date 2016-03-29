'use strict';

const ipcRenderer = require('electron').ipcRenderer;
var request = require('request');
let vkAuth = require('./vk_auth');
let fs = require('fs');
let Promise = require('promise');

vkAuth.authenticate();


let appData = JSON.parse(fs.readFileSync(__dirname + '/app_data.json'));

const accessToken = appData.access_token;
const userId = appData.user_id;

function getFriends() {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://api.vk.com/method/friends.get?user_id=' + userId + '&fields=nickname,photo_50&v=5.50'
        }, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                let friendsJson = JSON.parse(response.body);
                let friends = friendsJson.response.items;
                resolve(friends);
            }
        });
    })
}

function createListOfFriends() {
    getFriends()
        .then(friends => {
            let toWrite = [];
            for (let i = 0; i < friends.length; i++) {
                let uid = friends[i]['id'];
                let firstName = friends[i]['first_name'];
                let lastName = friends[i]['last_name'];
                let photoUrl = friends[i]['photo_50']
                let elem = {
                    'id': uid,
                    'first_name': firstName,
                    'last_name': lastName,
                    'photo': photoUrl
                };
                toWrite.push(elem);
            }
            fs.writeFileSync(__dirname + '/friends_data.json', JSON.stringify(toWrite));
        })
}


function loadMessageHistory(userId) {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://api.vk.com/method/messages.getHistory?access_token=' + accessToken + '&count=50&user_id=' + userId + '&v=5.50'
        }, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                let historyJson = JSON.parse(response.body);
                let history = historyJson.response.items;
                resolve(history);
            }
        })
    })
}

function loadUserMessageHistory(userId) {
    loadMessageHistory(userId)
        .then(history => {
            console.log(history);
            clearChat();
            let chatList = document.getElementById('chat');
            for (let i = history.length - 1; i >= 0; i--) {
                chatList.appendChild(createChat(history[i]));
            }
            let btn = document.getElementById('send-message');
            if (btn.hasAttribute('onclick')) {
                btn.removeAttribute('onclick');
                btn.setAttribute('onclick', 'sendMessage("' + userId + '");');
            } else {
                btn.setAttribute('onclick', 'sendMessage("' + userId + '");');
            }
        })
}

function createChat(historyElement) {
    var li = document.createElement('li');
    li.className = 'chat-message';
    var message = document.createElement('p');
    message.className = 'chat-message-inner';
    message.innerHTML = historyElement.body;
    if (historyElement.from_id == userId) {
        li.className = 'chat-message-from-me';
        message.className = 'chat-message-inner from-me-color';
    }

    li.appendChild(message);
    return li;
}

function clearChat() {
    let ul = document.getElementById('chat');
    let lis = ul.getElementsByTagName('li');
    for (let i = lis.length - 1; i >= 0; i--) {
        ul.removeChild(lis[i]);
    }
}


function getDialogs() {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://api.vk.com/method/messages.getDialogs?access_token=' + accessToken + '&v=5.33'
        }, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                let dialogsJson = JSON.parse(response.body);
                let dialogs = dialogsJson.response.items;
                resolve(dialogs);
            }
        });
    })
}

function createMessage(dialogElement) {
    // create message element
    var li = document.createElement('li');
    li.className = 'message';
    var div = document.createElement('div');
    div.className = 'message-inner';
    var innerUl = document.createElement('ul');
    innerUl.className = "inner-ul";
    var photoLi = document.createElement('li');
    photoLi.className = "photo";
    var messageLi = document.createElement('li');
    var dateSpan = document.createElement('span');
    messageLi.className = 'inner-ul-message';
    dateSpan.className = 'date';
    var messageInfoUl = document.createElement('ul');
    messageInfoUl.className = "message-info";
    var userInfo = document.createElement('span');
    userInfo.className = "user-name";
    var messageInfoLi = document.createElement('li');
    messageInfoLi.className = 'message-li';
    var mess = document.createElement('li');
    mess.className = "mess";
    var date = dialogElement['message']['date'] * 1000;
    var normalDate = new Date(date);

    //display last message
    if (dialogElement['message']['attachments']) {
        mess.innerHTML = dialogElement['message']['attachments'][0]['type']
    } else {
        let messageBody = dialogElement['message']['body'];
        if (messageBody.length > 20) {
            messageBody = messageBody.substr(0, 20) + '...';
        }
        mess.innerHTML = messageBody;
    }

    if (dialogElement['message']['read_state'] == 0) {
        li.className = 'message message-unread'
    }
    if (dialogElement['unread']) {
        dateSpan.innerHTML = '+' + dialogElement['unread'].toString();
    } else {
        dateSpan.innerHTML = normalDate.toLocaleDateString();
    }

    var img = document.createElement('img');


    // ------------------ add message name or chat name ------------------------
    let u = JSON.parse(fs.readFileSync(__dirname + '/friends_data.json'));
    if (dialogElement['message']['user_id'] && dialogElement['message']['title'] == ' ... ') {
        let uid = dialogElement['message']['user_id'];
        for (let i = 0; i < u.length; i++) {
            if (uid == u[i]['id']) {
                let messageName = u[i]['first_name']+ ' ' + u[i]['last_name'];
                let p = u[i]['photo']
                userInfo.innerHTML = messageName;
                img.src = p;
                li.setAttribute('onclick', 'loadUserMessageHistory("' + u[i]['id'] + '");');
                li.setAttribute('user_id', u[i]['id']);
                // li.id = 'message';
            }
        }
    } else {
        let chatName = dialogElement['message']['title'];
        let uid = dialogElement['message']['user_id'];
        if (chatName.length > 20) {
            chatName = chatName.substr(0, 20) + '...';
        }
        userInfo.innerHTML = chatName;
        for (let i = 0; i < u.length; i++) {
            if (uid == u[i]['id']) {
                let chatLastSender = u[i]['first_name']+ ' ' + u[i]['last_name'];
            }
        }
    }
    //--------------------------------------------------------------------------
    photoLi.appendChild(img);
    messageInfoLi.appendChild(userInfo);
    messageInfoLi.appendChild(dateSpan);
    messageInfoUl.appendChild(messageInfoLi);
    messageInfoUl.appendChild(mess);
    messageLi.appendChild(messageInfoUl);
    innerUl.appendChild(photoLi);
    innerUl.appendChild(messageLi);
    div.appendChild(innerUl);
    li.appendChild(div);

    return li;
}

function createDialogsUi() {
    getDialogs()
        .then(dialogs => {
            console.log('dialogs :', dialogs);
            let dialogList = document.getElementById('dialogs');
            let u = JSON.parse(fs.readFileSync(__dirname + '/friends_data.json'));
            for (let i = 0; i < dialogs.length; i++) {
                dialogList.appendChild(createMessage(dialogs[i]));
            }
        })
}


function sendMessage(userId) {

    let messageText = document.getElementById('message-text').value;
    if (messageText == 0) {

    } else {
        request({
            url: 'https://api.vk.com/method/messages.send?access_token=' + accessToken +
                    '&user_id=' + userId + '&message='+ messageText + '&v=5.50'
        }, function(error, response, body) {
            if (error) {
                console.log(error);
            } else {
                console.log('ok');
            }
        })
    }
}


createListOfFriends();
createDialogsUi();
