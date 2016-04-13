'use strict';


const ipcRenderer = require('electron').ipcRenderer;
var request = require('request');
let vkAuth = require('./vk_auth');
let fs = require('fs');
let Promise = require('promise');
let jQuery = require('jquery');
let async1 = require('async');
let notifier = require('node-notifier')

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
            let toWrite = {};
            for (let i = 0; i < friends.length; i++) {
                let uid = friends[i]['id'];
                let firstName = friends[i]['first_name'];
                let lastName = friends[i]['last_name'];
                let photoUrl = friends[i]['photo_50']
                // let elem = {};
                toWrite[uid] = {
                        'first_name': firstName,
                        'last_name': lastName,
                        'photo': photoUrl
                };
                // toWrite.push(elem);
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
            createChatUi(history);
            jQuery('.right-menu-content').scrollTop(jQuery('.right-menu-content')[0].scrollHeight);
            addUserNameToTop();
        })
}

function addUserNameToTop() {
    if (user.userId) {
        let uName = u[user.userId]['first_name']+ ' ' + u[user.userId]['last_name'];
        jQuery('.top-title-inner-content').text(uName);
    } else if (chat.chatId) {
        let param = "[ chat_id = '" + chat.chatId + "']";
        jQuery('.top-title-inner-content').text(jQuery(param).attr('chat_name'));
        console.log(param);
    } else if (jQuery('.message').attr('user_id')) {
        let uName = u[jQuery('.message').attr('user_id')]['first_name']+ ' ' + u[jQuery('.message').attr('user_id')]['last_name'];
        jQuery('.top-title-inner-content').text(uName);
    } else if (jQuery('.message').attr('chat_id')) {
        jQuery('.top-title-inner-content').text(jQuery('.message').attr('chat_name'));
    } else {

    }
}

// add to .chat attribute that will show pagination
function loadMoreUserMessageHistory(userId, startMessage) {
    loadMessageHistory(userId, startMessage)
        .then(history => {
            console.log(history);
            let firstMessage = jQuery('.chat div p:first');
            createChatUi(history);
            jQuery('.right-menu-content').scrollTop(firstMessage.offset().top - 50);
        })
}

function createChatUi(history) {
    let chatList = jQuery('.chat');
    for (let i = 0; i < history.length; i++) {
        chatList.prepend(createChat2(history[i]));
    }
    addSendLogic();

}
function addSendLogic() {
    let btn = document.getElementById('send-message');

    if (btn.hasAttribute('onclick')) {
        btn.removeAttribute('onclick');
        if (user.userId) {
            btn.setAttribute('onclick', 'sendMessage("' + user.userId + '");');
        } else if (chat.chatId) {
            btn.setAttribute('onclick', 'sendMessage("' + chat.chatId + '");');
        } else if (jQuery('.message').attr('user_id')) {
            btn.setAttribute('onclick', 'sendMessage("' + jQuery('.message').attr('user_id') + '");');
        } else if (jQuery('.message').attr('chat_id')) {
            btn.setAttribute('onclick', 'sendMessage("' + jQuery('.message').attr('chat_id') + '");');
        }
    } else {
        btn.setAttribute('onclick', 'sendMessage("' + user.userId + '");');
    }
}

function createChat2(historyElement) {
    let li = document.createElement('div');
    li.className = 'a';
    let message = document.createElement('p');
    let dateElem = document.createElement('span');
    let date = historyElement.date * 1000;
    let nDate = new Date(date);
    dateElem.innerHTML = nDate;
    message.className = 'a-inner';
    if (historyElement.attachments) {
        console.log('>>>', historyElement.attachments);
        message.innerHTML = messageTypesHelper(historyElement.attachments);
    } else if (historyElement.action) {
        if (historyElement.action == 'chat_create') {
            message.innerHTML = 'cteate chat ' + historyElement.action_text;
        }
    } else {
        message.innerHTML = parseMessageForLink(historyElement.body);
    }
    if (historyElement.from_id == userId) {
        li.className = 'a-message-from-me';
        message.className = 'a-inner from-me-color';
    }

    li.appendChild(message);
    return li;
}

// function createChat(historyElement) {
//     var li = document.createElement('div');
//     li.className = 'm chat-message';
//     var message = document.createElement('p');
//     let dateElem = document.createElement('span');
//     let date = historyElement.date * 1000;
//     let nDate = new Date(date);
//     dateElem.innerHTML = nDate;
//     message.className = 'chat-message-inner';
//     message.innerHTML = historyElement.body;
//     if (historyElement.from_id == userId) {
//         li.className = 'm chat-message-from-me';
//         message.className = 'chat-message-inner from-me-color';
//     }
//
//     li.appendChild(message);
//     // li.appendChild(dateElem);
//     return li;
// }

function clearChat() {
    let div = document.getElementById('chat');
    let msgs = div.getElementsByTagName('div');
    for (let i = msgs.length - 1; i >= 0; i--) {
        div.removeChild(msgs[i]);
    }
}

function clearDialogs() {
    let div = document.getElementById('dialogs');
    let msgs = div.getElementsByTagName('li');
    for (let i = msgs.length - 1; i >= 0; i--) {
        div.removeChild(msgs[i]);
    }
}


function loadChatHistory(chatId, offset) {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://api.vk.com/method/messages.getHistory?' +
                    'access_token=' + accessToken + '&count=50&offset=' + offset + '&peer_id=' +
                    String(2000000000 + parseInt(chatId)) +
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
function loadChatMessageHistory(chatId, offset) {
    loadChatHistory(chatId, offset)
        .then(history => {
            console.log(history);
            clearChat();
            createBigChatUi(history);
            jQuery('.right-menu-content').scrollTop(jQuery('.right-menu-content')[0].scrollHeight);
            addUserNameToTop();
        })
}
function loadMoreChatMessageHistory(chatId, offset) {
    loadChatHistory(chatId, offset)
        .then(history => {
            console.log(history);
            let firstMessage = jQuery('.chat div p:first');
            createBigChatUi(history);
            jQuery('.right-menu-content').scrollTop(firstMessage.offset().top - 50);
        })
}
function createBigChatUi(history) {
    let chatList = jQuery('.chat');
    for (let i = 0; i < history.length; i++) {
        chatList.prepend(createBigChat(history[i]));
    }
    addSendLogic();
}
function createBigChat(historyElement) {
    let u = JSON.parse(fs.readFileSync(__dirname + '/friends_data.json'));
    let div = document.createElement('div');
    div.className = 'a';
    let fromUser = document.createElement('img');
    let message = document.createElement('p');
    let dateElem = document.createElement('span');
    let date = historyElement.date * 1000;
    let nDate = new Date(date);
    dateElem.innerHTML = nDate;
    message.className = 'a-inner';
    if (historyElement.attachments) {
        message.innerHTML = messageTypesHelper(historyElement.attachments);
    } else if (historyElement.action) {
        if (historyElement.action == 'chat_create') {
            message.innerHTML = 'cteate chat ' + historyElement.action_text;
        }
    } else {
        message.innerHTML = parseMessageForLink(historyElement.body);
    }
    if (historyElement.from_id == userId) {
        div.className = 'a-message-from-me';
        message.className = 'a-inner from-me-color';
    }
    let uid = historyElement['from_id'];
    // for (let i = 0; i < u.length; i++) {
        if (u[uid]) {
            // fromUser.innerHTML = u[i]['first_name']+ ' ' + u[i]['last_name'];
            fromUser.src = u[uid]['photo'];
            fromUser.className = 'user-photo-chat';
        }
    // }
    if (historyElement.from_id != userId) {
        div.appendChild(fromUser)
    }

    div.appendChild(message);
    return div;
}


function getUser(uid) {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://api.vk.com/method/users.get?user_ids='+ uid +'&fields=photo_50&v=5.33'
        }, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                let userDataJson = JSON.parse(response.body);
                let userData = userDataJson.response;
                resolve(userData);
            }
        });
    })
}
let unknownUsers = [];
function saveUserIfNotInFriends(uid) {
    getUser(uid)
        .then(userData => {
            console.log(userData);
            let toWrite = {}
            for (let i = 0; i < userData.length; i++) {
                toWrite[userData[i].id] = {
                        'first_name': userData[i].first_name,
                        'last_name': userData[i].last_name,
                        'photo': userData[i].photo_50
                };
            }
            fs.writeFileSync(__dirname + '/unknown_users_data.json', JSON.stringify(toWrite));
        })

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

let unreadMessages = 0;
let unreadMessagesIds = []; // <--------------------------- set messages read state!!!!

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
        mess.innerHTML = '<p>' + messageBody + '</p>';
    }

    if (dialogElement['message']['read_state'] == 0) {
        li.className = 'message message-unread'
    }
    if (dialogElement['unread']) {
        dateSpan.innerHTML = '+' + dialogElement['unread'].toString();
        unreadMessages = unreadMessages + dialogElement['unread'];
    } else {
        dateSpan.innerHTML = normalDate.toLocaleDateString();
    }

    var img = document.createElement('img');


    // ------------------ add message name or chat name ------------------------
    let u = JSON.parse(fs.readFileSync(__dirname + '/friends_data.json'));
    let unknowU = JSON.parse(fs.readFileSync(__dirname + '/unknown_users_data.json'));
    if (dialogElement['message']['user_id'] && dialogElement['message']['title'] == ' ... ') {
        let uid = String(dialogElement['message']['user_id']);
        if (u[uid]) {
            let messageName = u[uid]['first_name']+ ' ' + u[uid]['last_name'];
            let p = u[uid]['photo']
            userInfo.innerHTML = messageName;
            img.src = p;
            li.setAttribute('onclick', 'loadUserMessageHistory("' + uid + '", "0");');
            li.setAttribute('user_id', uid);
            li.setAttribute('pagination', '50');
            // li.id = 'message';
        } else {
            li.setAttribute('onclick', 'loadUserMessageHistory("' + uid + '", "0");');
            li.setAttribute('user_id', uid);
            li.setAttribute('pagination', '50');
            unknownUsers.push(uid);
            if(unknowU[uid]){
                let messageName = unknowU[uid]['first_name']+ ' ' + unknowU[uid]['last_name'];
                let p = unknowU[uid]['photo']
                userInfo.innerHTML = messageName;
                img.src = p;
            }
            // saveUserIfNotInFriends(uid);
            // let messageUserId = uid;
            // userInfo.innerHTML = messageUserId;
        }
    } else if (dialogElement['message']['chat_id']){
        let chatName = dialogElement['message']['title'];
        let uid = dialogElement['message']['user_id'];
        userInfo.innerHTML = chatName;
        // for (let i = 0; i < u.length; i++) {
            if (u[uid]) {
                let chatLastSender = u[uid]['first_name']+ ' ' + u[uid]['last_name'];
            }
        // }
        li.setAttribute('onclick', 'loadChatMessageHistory("' + dialogElement['message']['chat_id'] + '", "0");');
        li.setAttribute('chat_id', dialogElement['message']['chat_id']);
        li.setAttribute('pagination', '50');
        li.setAttribute('chat_name', dialogElement['message']['title']);
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
    if (offset == '0') {
        clearDialogs();
    }
    getDialogs(offset)
        .then(dialogs => {
            console.log('dialogs :', dialogs);
            let dialogList = document.getElementById('dialogs');
            // let u = JSON.parse(fs.readFileSync(__dirname + '/friends_data.json'));
            for (let i = 0; i < dialogs.length; i++) {
                dialogList.appendChild(createMessage(dialogs[i]));
            }
        })
        .then(() => {
            if (jQuery('.message').attr('user_id')) {
                loadUserMessageHistory(jQuery('.message').attr('user_id'), '0');
            } else if (jQuery('.message').attr('chat_id')) {
                loadChatMessageHistory(jQuery('.message').attr('chat_id'), '0');
            }
            showInfoU(unknownUsers);
            ipcRenderer.send('countOfUnreadMessages', String(unreadMessages));
        })

}


function sendMessage(userId) {

    let messageText = document.getElementById('message-text').value;
    if (messageText == 0) {

    } else {
        request({
            url: 'https://api.vk.com/method/messages.send?access_token=' + accessToken +
                    '&user_id=' + userId + '&message='+ encodeURIComponent(messageText) + '&v=5.50'
        }, function(error, response, body) {
            if (error) {
                console.log(error);
            } else {
                console.log('ok');
                jQuery('#message-text').val('');
                loadUserMessageHistory(userId, '0')
                createDialogsUi('0');
            }
        })
    }
}

//on start main()
createListOfFriends();
// createDialogsUi('0');


// load-more-messages-with-jQuery action on scroll
jQuery('.right-menu-content').on('scroll', function() {
    if (jQuery('.right-menu-content').scrollTop() == 0) {
        if (user.userId) {
            let param = "[ user_id = '" + user.userId + "']";
            let page = jQuery(param).attr('pagination');
            jQuery(param).attr('pagination', parseInt(page) + 50);
            loadMoreUserMessageHistory(user.userId, page);
        } else if (chat.chatId) {
            let param = "[ chat_id = '" + chat.chatId + "']";
            let page = jQuery(param).attr('pagination');
            jQuery(param).attr('pagination', parseInt(page) + 50);
            loadMoreChatMessageHistory(chat.chatId, page);
        }
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


function messageTypesHelper(attachment) {
    for (let i = 0; i < attachment.length; i++) {
        let type = attachment[i]['type'];
        if (type == 'photo') {
            return '<a href=' + attachment[i]['photo']['photo_1280'] + ' target="_blank">' +
                    '<img src=' + attachment[i]['photo']['photo_604'] + ' class="attachment-img"></a>'
        } else if (type == 'link') {
            return '<a href=' + attachment[i]['link']['url'] + ' target="_blank">outlink: ' + attachment[0]['link']['title'] +'</a>'
        } else if (type == 'audio') {
            return '<strong>audio</strong>'
        } else if (type == 'video') {
            return '<strong>video</strong>'
        } else if (type == 'doc') {
            return '<a href=' + attachment[i]['doc']['url'] + ' target="_blank">File: ' + attachment[0]['doc']['title'] +'</a>';
        } else if (type == 'wall') {
            return '<strong>wall</strong>'
        }
    }
}

function makeLink(element) {
    return '<a href=' + element + ' target="_blank">' + element + '</a>';
}

function parseMessageForLink(messageText) {
    let text = '';
    let url_pattern = /\.(?=[a-zA-Z])/;
    let a = messageText.split(' ');
    for (let el of a) {
        if (a.length == 1)
            el = el.replace(',','');
        let score = el.search(url_pattern);
        if (score > 0) {
            let link = makeLink(el);
            text += link + ' ';
        } else {
            text += el + ' ';
        }
    }
    return text;
}


function sendByEnter() {
    if (event.keyCode == 13) {
      sendMessage(user.userId);
    }
    return true;
}


function getLongPollParameters() {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://api.vk.com/method/messages.getLongPollServer?access_token=' + accessToken + '&v=5.50'
        }, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                let answerJson = JSON.parse(response.body);
                let answer = answerJson.response;
                resolve(answer);
                // fs.writeFileSync(__dirname + '/long_poll.json', JSON.stringify({'server': answer.server, 'key': answer.key}));
                // fs.writeFileSync(__dirname + '/long_poll_ts.json', JSON.stringify({'ts': answer.ts}));
            }
        })
    })

}
function getUpdatesFromLongPollServer(server, key, ts) {
    return new Promise((resolve, reject) => {
        request({
            url: 'https://'+ server +'?act=a_check&key=' + key + '&ts=' + ts + '&wait=25&mode=2'
        }, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                let answerJson = JSON.parse(response.body);
                // let answer = answerJson.response;
                // console.log(answerJson);
                resolve(answerJson);
            }
        })

    })
}

// let longPollParams = JSON.parse(fs.readFileSync(__dirname + '/long_poll.json'));
let u = JSON.parse(fs.readFileSync(__dirname + '/friends_data.json'));

function getUpdates() {
    let longPollParams = JSON.parse(fs.readFileSync(__dirname + '/long_poll.json'));
    let tsParam = JSON.parse(fs.readFileSync(__dirname + '/long_poll_ts.json'));
    getUpdatesFromLongPollServer(longPollParams.server, longPollParams.key, tsParam.ts)
        .then(answer => {
            console.log(answer);
            fs.writeFileSync(__dirname + '/long_poll_ts.json', JSON.stringify({'ts': answer.ts}));
            let updates = answer.updates;
            if (answer.failed) {
                if (answer.failed == 2) {
                    location.reload();
                }
            }
            for (let i = 0; i < updates.length; i++) {
                let code = updates[i][0];
                if (code == 0) {
                    let mid = updates[i][1];
                    let flag = updates[i][2];
                    console.log('delete message', mid);
                } else if (code == 1) {
                    let mid = updates[i][1];
                    let flag = updates[i][2];
                    console.log('replace flags', flags, 'from', mid);
                } else if (code == 2) {
                    let mid = updates[i][1];
                    let mask = updates[i][2];
                    if (updates[i].length > 3) {
                        let uid = updates[i][3];
                    }
                    console.log('make flags', mask, 'at', mid);
                } else if (code == 3) {
                    let mid = updates[i][1];
                    let mask = updates[i][2];
                    if (updates[i].length > 3) {
                        let uid = updates[i][3];
                    }
                    console.log('clear flags', mask, 'at', mid);
                } else if (code == 4) {
                    let mid = updates[i][1];
                    let flag = updates[i][2];
                    let from_uid = updates[i][3] ;
                    let timestamp = updates[i][4];
                    let subject = updates[i][5];
                    let text = updates[i][6];
                    let attachment = updates[i][7];
                    if (user.userId == from_uid) {
                        loadUserMessageHistory(from_uid, '0');
                        createDialogsUi('0');
                    } else {
                        createDialogsUi('0');
                    }
                    let fromUser = u[uid]['first_name'] + ' ' + u[uid]['last_name'];
                    new Notification(fromUser, text);
                    console.log('message from', u[uid]['first_name'], u[uid]['last_name'], 'text:', text);
                    if (uid != userId) {
                        createNotification('message from ' +u[uid]['first_name'] + ' ' + u[uid]['last_name'], text);
                    }
                } else if (code == 8) {
                    let uid = updates[i][1] * (-1);
                    console.log('user', u[uid]['first_name'], u[uid]['last_name'] , 'online');
                } else if (code == 9) {
                    let uid = updates[i][1] * (-1);
                    let flag = updates[i][2]
                    if (flag == 0) {
                        console.log('user', u[uid]['first_name'], u[uid]['last_name'], 'offline');
                    } else if (flag == 1) {

                    }
                } else if (code == 51) {
                    console.log('??? some shit ???');
                } else if (code == 61) {
                    let uid = updates[i][1]; // * (-1);
                    let flag = updates[i][2];
                    console.log(u[uid]['first_name'], u[uid]['last_name'], 'is typing');
                } else if (code == 62) {
                    let uid = updates[i][1] * (-1);
                    let chat_id = updates[i][2];
                    console.log(uid, 'is typing in', chat_id);
                } else if (code == 70) {
                    console.log('phone call???');
                }
            }
        })
}

function showInfoU(uU) {
    let uids = uU.join();
    console.log(uids);
    saveUserIfNotInFriends(uids);
}

function createNotification(title, message) {
    notifier.notify({
        title: title,
        message: message,
        icon: __dirname + '/icon/vk-128-b.png',
        sound: true,
        wait: false
    });
}

function getLongPoll() {
    getLongPollParameters()
        .then(answer => {
            fs.writeFileSync(__dirname + '/long_poll.json', JSON.stringify({'server': answer.server, 'key': answer.key}));
            fs.writeFileSync(__dirname + '/long_poll_ts.json', JSON.stringify({'ts': answer.ts}));
        })
}
getLongPoll();
createDialogsUi('0');

setInterval(getUpdates, 2000);
