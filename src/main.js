const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const cors = require('cors');
const express = require('express');
const expressApp = express();

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