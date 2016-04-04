'use strict';

const ipcRenderer = require('electron').ipcRenderer;
var request = require('request');
let vkAuth = require('./vk_auth');
let fs = require('fs');
let Promise = require('promise');
let jQuery = require('jquery');

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


function loadMessageHistory(userId, offset) {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://api.vk.com/method/messages.getHistory?' +
                    'access_token=' + accessToken + '&count=50&offset=' + offset + '&user_id=' + userId +
                    '&start_message_id=0&v=5.38'
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

function loadUserMessageHistory(userId, offset) {
    loadMessageHistory(userId, offset)
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

// add to .chat attribute that will show pagination
function loadMoreUserMessageHistory(userId, startMessage) {
    loadMessageHistory(userId, startMessage)
        .then(history => {
            console.log(history);
            let chatList = jQuery('.chat');
            for (let i = 0; i < history.length; i++) {
                chatList.prepend(createChat(history[i]));
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
    li.className = 'm chat-message';
    var message = document.createElement('p');
    let dateElem = document.createElement('span');
    let date = historyElement.date * 1000;
    let nDate = new Date(date);
    dateElem.innerHTML = nDate;
    message.className = 'chat-message-inner';
    message.innerHTML = historyElement.body;
    if (historyElement.from_id == userId) {
        li.className = 'm chat-message-from-me';
        message.className = 'chat-message-inner from-me-color';
    }

    li.appendChild(message);
    // li.appendChild(dateElem);
    return li;
}

function clearChat() {
    let ul = document.getElementById('chat');
    let lis = ul.getElementsByTagName('li');
    for (let i = lis.length - 1; i >= 0; i--) {
        ul.removeChild(lis[i]);
    }
}


function getDialogs(offset) {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://api.vk.com/method/messages.getDialogs?access_token=' + accessToken + '&offset='+ offset +'&v=5.33'
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
    var li = document.createElement('li'); // <------- replace li to div
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
                li.setAttribute('onclick', 'loadUserMessageHistory("' + u[i]['id'] + '", "0");');
                li.setAttribute('user_id', u[i]['id']);
                li.setAttribute('pagination', '50');
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

function createDialogsUi(offset) {
    getDialogs(offset)
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
createDialogsUi('0');


// load-more-messages-with-jQuery action on scroll
jQuery('.right-menu-content').on('scroll', function() {
    if (jQuery('.right-menu-content').scrollTop() == 0) {
        // console.log(user.userId);
        let param = "[ user_id = '" + user.userId + "']";
        let page = jQuery(param).attr('pagination');
        // console.log(page);
        jQuery(param).attr('pagination', parseInt(page) + 50);
        loadMoreUserMessageHistory(user.userId, page);
    }
})
// load-more-chat-with-jQuery action on scroll
jQuery('.left-menu').on('scroll', function() {
    if (jQuery('.left-menu').scrollTop() + jQuery('.left-menu').innerHeight()  == jQuery(this)[0].scrollHeight) {
        let page = jQuery('.left-menu').attr('pagination');
        createDialogsUi(page);
        jQuery('.left-menu').attr('pagination', parseInt(page) + 20);
    }
})
