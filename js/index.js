const ipcRenderer = require('electron').ipcRenderer;
        var request = require('request');
        var React = require('react');
        var ReactDOM = require('react-dom');

        ReactDOM.render(
            <h1> hello!! </h1>,
            document.getElementById('content')
        );
        
        window.onload = function() {
            ipcRenderer.send('ready-to-create-dialogs-list');
        };

        ipcRenderer.on('create-dialogs-list', function(event, dialogs, at) {
            var dialogList = document.getElementById('dialogs');
            for (var i = 0; i < dialogs.length; i++) {
                var li = document.createElement('li');
                li.className = 'message';
                var div = document.createElement('div');
                div.className = 'message-inner';
                var innerUl = document.createElement('ul');
                innerUl.className = 'inner-ul';
                var photoLi = document.createElement('li');
                var messageLi = document.createElement('li');
                var dateSpan = document.createElement('span');
                photoLi.className = 'photo';
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
                var date = dialogs[i]['message']['date'] * 1000;
                var normalDate = new Date(date);

                if (dialogs[i]['message']['attachments']) {
                    mess.innerHTML = dialogs[i]['message']['attachments']['type']
                } else {
                    mess.innerHTML = dialogs[i]['message']['body'];
                }
                if (dialogs[i]['message']['read_state'] == 0) {
                    li.className = 'message message-unread'
                }
                if (dialogs[i]['unread']) {
                    dateSpan.innerHTML = '+' + dialogs[i]['unread'].toString();
                } else {
                    dateSpan.innerHTML = normalDate.toLocaleDateString();
                }
                photoLi.innerHTML = '[Photo]';
                //userInfo.innerHTML = 'Name Surname';

                messageInfoLi.appendChild(userInfo);
                messageInfoLi.appendChild(dateSpan);
                messageInfoUl.appendChild(messageInfoLi);
                messageInfoUl.appendChild(mess);
                messageLi.appendChild(messageInfoUl);
                innerUl.appendChild(photoLi);
                innerUl.appendChild(messageLi);
                div.appendChild(innerUl);
                li.appendChild(div);
                dialogList.appendChild(li);


                if (dialogs[i]['message']['user_id']) {
                    var uid = dialogs[i]['message']['user_id'];
                    request({
                        url: "https://api.vk.com/method/users.get?user_id=" + uid +
                            "&fields=contacts&access_token=" + at + "&v=5.8"
                    }, function(error, response, body) {
                        if (error) {
                            console.log('ooops! error with user');
                        }
                        var userJson = JSON.parse(response.body);
                        var u = userJson.response;
                        if (u[0]) {
                            userInfo.innerHTML = u[0]['first_name'] + ' ' + u[0]['last_name'];
                        }
                    });
                }

            }

            console.log(dialogs);
            console.log(dialogs[4]['message']['body']);
        });
