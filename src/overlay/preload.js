// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld(
  'initOverlay',
  {
    signalMessagePort : () => promiseMessagePortResolve()
  }
)
// We need to wait until the main world is ready to receive the message before
// sending the port. We create this promise in the preload so it's guaranteed
// to register the onload listener before the load event is fired.

const windowLoaded = new Promise(resolve => {
  window.onload = resolve
})


var promiseMessagePortResolve, promiseMessagePortReject;
const readyForMessagePort = new Promise ((resolve, reject) => {
  promiseMessagePortResolve = resolve;
  promiseMessagePortReject = reject;
});

ipcRenderer.on('port', async (event) => {
  // wait for window load event
  await windowLoaded
  console.log('window loaded')
  // wait for react window to be ready for message
  await readyForMessagePort
  console.log('ready for message port')
    // We use regular window.postMessage to transfer the port from the isolated
  // world to the main world.
  window.postMessage('port', '*', event.ports)
})