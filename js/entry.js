'use strict';


var React = require('react');
var ReactDom = require('react-dom');

var request = require('request');
// let vkAuth = require('../vk_auth');
// let Helper = require('../helper');
import Helper from '../helper';
let fs = require('fs');
let Promise = require('promise');
let jQuery = require('jquery');
let notifier = require('node-notifier')

let apiHelper = new Helper();

let DialogList = React.createClass({
    getInitialState: function() {
        return {items: []}
    },
    componentDidMount: function() {
        apiHelper.getDialogs('0')
            .then(dialogs => {
                this.setState({items: dialogs});
            })
    },
    render: function() {
        console.log(this.state.items);
        return <DialogListElement items={this.state.items} />
    }
});

let DialogListElement = React.createClass({
    render: function() {
        let createItem = function(item) {
            if ({item.message.chat_id}) {
                let mdate = {item.message.user_id},
                    mbody = {item.message.body},
                    cid = {item.message.chat_id},
                    mtitle = {item.message.title},
                    cphoto = {item.message.photo_50}
            } else {

            }
            let uid = {item.message.user_id},
                mdate = {item.message.user_id},
                mbody = {item.message.body},
                mtitle = {item.message.title},
            let uphoto = 'lll'
            return (<li key={item.message.id} className="message">
                        <div className="message-inner">
                            {item.message.body}
                        </div>
                    </li>);
        };
        return <ul className="dialogs-inner">{this.props.items.map(createItem)}</ul>;
    }
});

let MessageList = React.createClass({
    render: function() {

    }
});

let MessageListElement = React.createClass({
    render: function() {

    }
});


var App = React.createClass({
  render: function() {
    return <h1>Hello from React!</h1>;
  }
});

ReactDom.render(<DialogList/>, document.getElementById('dialogs'));
