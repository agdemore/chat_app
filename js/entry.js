'use strict';


var React = require('react');
var ReactDom = require('react-dom');

var request = require('request');
// let vkAuth = require('../vk_auth');
let apiHelper = require('../helper');
let fs = require('fs');
let Promise = require('promise');
let jQuery = require('jquery');
let notifier = require('node-notifier')
//
// vkAuth.authenticate();
// console.log(__dirname);
// let appData = JSON.parse(fs.readFileSync(__dirname + 'app_data.json'));
// console.log(appData);

var App = React.createClass({
  render: function() {
    return <h1>Hello from React!</h1>;
  }
});

ReactDom.render(<App/>, document.getElementById('react-root'));
