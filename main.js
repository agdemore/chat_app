var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
var fs = require('fs');
var apiController = require('./vk_api_tools');


var mainWindow = null;
//var loginWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  	if (process.platform != 'darwin') {
  	  app.quit();
  	}
});

app.on('ready', function() {
  // Create the browser window.
  	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800
  	});
	mainWindow.setMenu(null);

	var userData = JSON.parse(fs.readFileSync(__dirname + '/user_data.json'));

	if (userData.remember == 'on') {
		mainWindow.loadURL('file://' + __dirname + '/templates/index.html');
		main();
	} else {
		mainWindow.loadURL('file://' + __dirname + '/templates/login.html');
	}


  	mainWindow.webContents.openDevTools();

  	mainWindow.on('closed', function() {
  	  	mainWindow = null;
  	});

	ipcMain.on('saveUser', function(event, email, password, rememberMe) {
		fs.writeFile(__dirname + '/user_data.json', JSON.stringify({
			email: email,
			password: password,
			remember: rememberMe
		}, null, 4));
		mainWindow.loadURL('file://' + __dirname + '/templates/index.html');
		main();
	});

	function main() {
		//var api = new apiController.Controller(userData.email, userData.password);
		////console.log(api.dialog());
		//var dialogs = api.dialog();
	}
	ipcMain.on('ready-to-create-dialogs-list', function(event, arg) {
		var api = new apiController.Controller(userData.email, userData.password);
		var dialogs = api.dialog();
		var at = api.accessToken;
		event.sender.send('create-dialogs-list', dialogs, at);
	})

});
