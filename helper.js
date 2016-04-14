"use strict";

const ipcRenderer = require('electron').ipcRenderer;
let request = require('request');
let vkAuth = require('./vk_auth');
let fs = require('fs');
let Promise = require('promise');
let jQuery = require('jquery');
let notifier = require('node-notifier')

vkAuth.authenticate();
let appData = JSON.parse(fs.readFileSync(__dirname + '/app_data.json'));

class Helper {
    constructor() {
        this.accessToken = appData.access_token;
        this.userId = appData.user_id;
    }

    getFriends(userId) {
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

    createListOfFriends() {
        this.getFriends(this.userId)
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

    getDialogs(offset) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://api.vk.com/method/messages.getDialogs?access_token=' + this.accessToken + '&offset='+ offset +'&v=5.33'
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




}

// let apiHelper = new Helper();

// apiHelper.getDialogs('0').then(dialogs => {console.log(dialogs);})

export default Helper;
