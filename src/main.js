const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const cors = require('cors');
const express = require('express');
const expressApp = express();

const { createServer } = require('http');
const { Server } = require('socket.io');

// expressApp.use(express.static(__dirname));

// expressApp.get('/', function(req, res, next) {
//   console.log('req path...', req.path)
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// expressApp.set('port', 4001);

// expressApp.use(cors({ origin: '*' }));

// expressApp.use(function (req, res, next) {
//   // Website you wish to allow to connect
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   // Request methods you wish to allow
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//   // Request headers you wish to allow
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//   // // Set to true if you need the website to include cookies in the requests sent
//   // // to the API (e.g. in case you use sessions)
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   // Pass to next layer of middleware
//   next();
// });



// const httpServer = createServer(expressApp)
// httpServer.listen(4001, '0.0.0.0')
// httpServer.on('error', e => console.log('error'))
// httpServer.on('listening', () => console.log(httpServer.address()))
// const io = new Server(httpServer, {
//     origin: '*',
// });

// const connections = io.of('/desktop-translator')

// connections.on('connection', socket => {
//     console.log('connection established')

//     socket.on('offer', sdp => {
//         console.log('routing offer')
//         // send to the electron app
//         socket.broadcast.emit('offer', sdp)
//     })

//     socket.on('answer', sdp => {
//         console.log('routing answer')
//         // send to the electron app
//         socket.broadcast.emit('answer', sdp)
//     })

//     socket.on('icecandidate', icecandidate => {
//         socket.broadcast.emit('icecandidate', icecandidate)
//     })
// });


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
};


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

const createOverlayWindow = () => {
  const overlayWindow = new BrowserWindow({
    width: 900,
    height: 400,
    maxWidth: 1920, minWidth: 100,
    maxWidth: 1080, minWidth: 200,
    frame: false,
    autoHideMenubar: true,
    webPreferences: {
      preload: OVERLAY_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
    },
    transparent: true,
    alwaysOnTop: true,
    });
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.loadURL(OVERLAY_WINDOW_WEBPACK_ENTRY);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);
app.on('ready', createOverlayWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const { desktopCapturer, remote } = require('electron');

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const inputSourcesList = inputSources.map(source => {
    return {
      name: source.name,
      id: source.id
    };
  })

  return inputSourcesList;

}

ipcMain.handle("getInputSources", (e) => {
  //console.log(e);
  return getVideoSources();
});

ipcMain.handle("getVideoStream", (e, source) => {
  console.log(e);
  console.log(source);
});