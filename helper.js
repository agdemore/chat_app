"use strict";

const ipcRenderer = require('electron').ipcRenderer;
let request = require('request');
let vkAuth = require('./vk_auth');
let fs = require('fs');
let Promise = require('promise');
let jQuery = require('jquery');
let notifier = require('node-notifier')
//
// // vkAuth.authenticate();
// // console.log(__dirname);
// // let appData = JSON.parse(fs.readFileSync(__dirname + 'app_data.json'));
// // console.log(appData);
//
// class Helper {
//     constructor() {
//         this.accessToken = appData.access_token;
//         this.userId = appData.user_id;
//     }
//
//     getFriends() {
//         return new Promise((resolve, reject) => {
//             request({
//                 url: 'https://api.vk.com/method/friends.get?user_id=' + this.userId + '&fields=nickname,photo_50&v=5.50'
//             }, function(error, response, body) {
//                 if (error) {
//                     reject(error);
//                 } else {
//                     let friendsJson = JSON.parse(response.body);
//                     let friends = friendsJson.response.items;
//                     resolve(friends);
//                 }
//             });
//         })
//     }
//
//     createListOfFriends() {
//         this.getFriends()
//             .then(friends => {
//                 let toWrite = {};
//                 for (let i = 0; i < friends.length; i++) {
//                     let uid = friends[i]['id'];
//                     let firstName = friends[i]['first_name'];
//                     let lastName = friends[i]['last_name'];
//                     let photoUrl = friends[i]['photo_50']
//                     // let elem = {};
//                     toWrite[uid] = {
//                             'first_name': firstName,
//                             'last_name': lastName,
//                             'photo': photoUrl
//                     };
//                     // toWrite.push(elem);
//                 }
//                 fs.writeFileSync(__dirname + '/friends_data.json', JSON.stringify(toWrite));
//             })
//     }
//
// }
//
// let apiHelper = new Helper();
//
// module.exports.apiHelper = apiHelper;
