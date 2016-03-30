var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
var fs = require('fs');

var mainWindow = null;

app.on('window-all-closed', function() {
  	if (process.platform != 'darwin') {
  	  app.quit();
  	}
});

app.on('ready', function() {
  	mainWindow = new BrowserWindow({
		width: 900,
		height: 800,
        minWidth: 500,
        minHeight: 300
  	});
	mainWindow.setMenu(null);

    try {
        var userData = JSON.parse(fs.readFileSync(__dirname + '/user_data.json'));

    	if (userData.remember == 'on') {
    		mainWindow.loadURL('file://' + __dirname + '/index.html');
    	} else {
    		mainWindow.loadURL('file://' + __dirname + '/templates/login.html');
    	}
    } catch(e) {
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
		mainWindow.loadURL('file://' + __dirname + '/index.html');
	});


	// ipcMain.on('ready-to-create-dialogs-list', function(event, arg) {
	// 	event.sender.send('create-dialogs-list', dialogs, at);
	// })

});
