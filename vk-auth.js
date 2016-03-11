var request = require('request').defaults({jar: true});
var htmlParser = require('htmlparser2');
var deasync = require('deasync');



function VKAuth() {
    this.formAttrs = {};
    this.urlAction = '';
    this.urlForAccess = '';
}

VKAuth.prototype.getAccessToken = function(email, password, clientId, scope) {
    var self = this;
    var body = this.getBody(clientId, scope);
    this.parseBody(body);
    var answer = this.auth(email, password, this.formAttrs);
    return answer;
};

VKAuth.prototype.auth = function(email, password, attribs) {
    var answer;
    var self = this;
    var req = request.post({
        url: this.urlAction,
        form: {
            email: email,
            pass: password,
            _origin: attribs['_origin'],
            ip_h: attribs['ip_h'],
            lg_h: attribs['lg_h'],
            to: attribs['to']
        },
        jar: true,
        followAllRedirects: true
    }, function(error, response, body) {
        if (error) {
            console.log(error);
        } else {
            self.giveAccess(body);
            request.post({
                url: self.urlForAccess
            }, function(error, response, html) {
                if (error) {
                    //console.log(error);
                } else {
                    //console.log(html);
                }
            });
        }
        var answerUrl = req.uri.href;
        //console.log('answer --->', answer);
        answer = self.parseUrlForAccessToken(answerUrl);

    });
    while (answer === undefined) {
        deasync.sleep(100);
    }
    return answer;
};

VKAuth.prototype.giveAccess = function(body) {
    var self = this;
    var parser = new htmlParser.Parser({
        onopentag: function(name, attrs) {
            if (name === 'form') {
                self.urlForAccess = attrs.action;
            }
        }
    });
    parser.write(body);
    parser.end();
};


VKAuth.prototype.getBody = function(clientId, scope) {
    var source;
    var authUrl = 'https://oauth.vk.com/authorize?client_id=' + clientId +
        '&display=page&redirect_uri=https://oauth.vk.com/blank.html&scope=' + scope +
        '&response_type=token&v=5.45';
    var res = request.post(authUrl, {
        jar: true
    }, function(error, body, response) {
        source = body;
    });
    while (source === undefined) {
        deasync.sleep(100);
    }
    return source['body'];
};

VKAuth.prototype.parseBody = function(body) {
    var self = this;
    var parser = new htmlParser.Parser({
        onopentag: function(name, attrs) {
            if (name === 'input' && attrs.type === 'hidden') {
                self.formAttrs[attrs.name] = attrs.value;
            }
            if (name === 'form') {
                self.urlAction = attrs.action;
            }
        }
    });
    parser.write(body);
    parser.end();
};

VKAuth.prototype.parseUrlForAccessToken = function(url) {
    var answer = {};
    var split1 = url.split('#')[1].split('&');
    for (var i = 0; i < split1.length; i++) {
        var attrs = split1[i].split('=');
        answer[attrs[0]] = attrs[1];
    }
    return answer;
};


//var a = new VKAuth();
//console.log(a.getAccessToken('sanders777@mail.ru', 'agdemorelmzdjk92', '5309107', 'offline,messages'));
exports.VKAuth = VKAuth;