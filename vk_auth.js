'use strict';

var request = require('request').defaults({jar: true});
var htmlParser = require('htmlparser2');
var Promise = require('promise');
var fs = require('fs');


let userData = JSON.parse(fs.readFileSync(__dirname + '/data.json'));
var clientId = userData.client_id;
var scope = 'offline,friends'
var authUrl = 'https://oauth.vk.com/authorize?client_id=' + clientId +
    '&display=page&redirect_uri=https://oauth.vk.com/blank.html&scope=' + scope +
    '&response_type=token&v=5.45';

function httpPost(url) {
    return new Promise(function(resolve, reject) {
        request.post(url, {
            jar: true
        }, function(error, response, body) {
            if (error) {
                console.log(error);
            } else {
                resolve(body);
            }
        });
    });
}
function auth(params) {
    return new Promise(function(resolve, reject) {
        request.post({
            url: params.urlAction,
            form: {
                email: userData.email,
                pass: userData.password,
                _origin: params['_origin'],
                ip_h: params['ip_h'],
                lg_h: params['lg_h'],
                to: params['to']
            },
            jar: true,
            followAllRedirects: true
        }, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                // resolve(body);
                let urlForAccess = '';
                let parser = new htmlParser.Parser({
                    onopentag: function(name, attrs) {
                        if (name === 'form') {
                            urlForAccess = attrs.action;
                        }
                    }
                });
                parser.write(body);
                parser.end();
                request.post({
                    url: urlForAccess
                }, function(error, response, body) {
                    if (error) {
                        // console.log('-->',error); working but throw Error: options.uri is a required argument
                    } else {
                        // console.log(body);
                    }
                });
                resolve(response.request.uri.href);
            }
        });
    })
}
function getToken(url) {
    return new Promise((resolve, reject) => {
        request.post({
            url: url
        }, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    })
}

//Again don't need parse auth work it home
//notice!! don't rewrite app_data.json
httpPost(authUrl)
    .then(body => {
        let params = {};
        let parser1 = new htmlParser.Parser({
            onopentag: function(name, attrs) {
                if (name === 'input' && attrs.type === 'hidden') {
                    params[attrs.name] = attrs.value;
                }
                if (name === 'form') {
                    params['urlAction'] = attrs.action;
                }
            }
        });
        parser1.write(body);
        parser1.end();
        return params;
    })
    .then(params => {
        return auth(params);
    })
    .then(url => {

        let answer = {};
        let split1 = url.split('#')[1].split('&');
        for (let i = 0; i < split1.length; i++) {
            let attrs = split1[i].split('=');
            answer[attrs[0]] = attrs[1];
        }
        return answer;
    })
    .then(answer => {
        fs.writeFile(__dirname + '/app_data.json', JSON.stringify({
            access_token: answer.access_token,
            expires_in: answer.expires_in,
            user_id: answer.user_id
		}, null, 4));
    });
