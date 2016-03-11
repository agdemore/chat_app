var vkAuth = require('./vk-auth');
var request = require('request');
var deasync = require('deasync');

var vk = new vkAuth.VKAuth();

var clientId = '5309107';
//var email = 'sanders777@mail.ru';
//var password = 'agdemorelmzdjk92';
//var authInfo = vk.getAccessToken(email, password, clientId, 'offline,messages');

function Controller(email, password) {
    this.auth = vk.getAccessToken(email, password, clientId, 'offline,messages');
    this.uid = this.auth['user_id'];
    this.accessToken = this.auth['access_token'];

    this.dialog = function() {
		var dialogs;
        request({
            url: 'https://api.vk.com/method/messages.getDialogs?access_token=' + this.accessToken + '&v=5.33'
        }, function(error, response, body) {
            var dialogsJson = JSON.parse(response.body);
            dialogs = dialogsJson.response.items;
        });
		while (dialogs === undefined) {
			deasync.sleep(100);
		}
		return dialogs;
    }

    this.getUserMessages = function(userId) {
        var messages;
        request({
            url: "https://api.vk.com/method/messages.getHistory?count=20&user_id=" + userId + 
                "&access_token=" + this.accessToken + "&v=5.33"
        }, function(error, response, body) {
            var messagesJson = JSON.parse(response.body);
            messages = messagesJson;
        });
        while (messages == undefined) {
            deasync.sleep(100);
        }
        return messages;
    }

    this.getUserContacts = function(userId) {
        var user;
        request({
            url: "https://api.vk.com/method/users.get?user_id=" + userId + 
                "&fields=contacts&access_token=" + this.accessToken + "&v=5.8"
        }, function(error, response, body) {
            if (error) {
                user = 'ooops! error with user'
                return user;
            }
            var userJson = JSON.parse(response.body);
            user = userJson;
        });
        while (user == undefined) {
            deasync.sleep(100);
        }
        return user;
    }
}

//var c = new Controller(email, password, clientId);
//c.dialog();

exports.Controller = Controller;