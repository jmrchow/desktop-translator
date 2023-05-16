import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Dropdown from 'react-bootstrap/Dropdown';
import { useState, useRef } from 'react';

import io from 'socket.io-client'




const MainPage = () => {

  const host = "http://127.0.0.1"
  const port = ":8080"
  let [inputSources, setInputSources] = useState([]);
  let [selectedSource, setSelectedSource] = useState({ name: "", id: "" });

  let videoRef = useRef(null);
  const rtcPeerConnection = useRef(new RTCPeerConnection({
    'iceServers': [
      { 'urls': 'stun:stun.l.google.com:19302' },
    ]
  }))

  
  // Load the possible video sources available on the computer. Returns screens and windows.
  let handleLoadInputSources = async () => {
    const videoInputs = await window.init.getInputSources();
    setInputSources(videoInputs);
  };

  let handleSelectVideoSource = async (sourceId) => {
    let source = inputSources.find(source => source.id == sourceId);
    setSelectedSource(source);
    let videoStream = await getVideoStream(source);
    await createPeerConnection(videoStream);
    negotiate();

    //const stream = await window.init.getVideoStream(source.id);

  }

  let negotiate = () => {

    rtcPeerConnection.current.createOffer().then(sdp => {
      return rtcPeerConnection.current.setLocalDescription(sdp);
      //    socket.emit('offer', sdp);
    }).then(() => {
      return new Promise(resolve => {
        if (rtcPeerConnection.current.iceGatheringState === 'complete') {
          resolve();
        } else {
          function checkState() {
            if (rtcPeerConnection.current.iceGatheringState === 'complete') {
              rtcPeerConnection.current.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          }
          rtcPeerConnection.current.addEventListener('icegatheringstatechange', checkState);
        }
      })
    }).then(() => {
      let offer = rtcPeerConnection.current.localDescription;
      return fetch(host + port + '/offer', {
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });

    }).then(function (response) {
      return response.json();
    }).then(function (answer) {
      console.log(answer.sdp);
      return rtcPeerConnection.current.setRemoteDescription(answer);
    }).catch(function (e) {
      alert(e);
    });
  }

  let mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);


  let createPeerConnection = async (stream) => {
    // register some listeners to help debugging
    rtcPeerConnection.current.addEventListener('icegatheringstatechange', function () {
      console.log("ICE gathering state: " + rtcPeerConnection.iceGatheringState);
    }, false);


    rtcPeerConnection.current.addEventListener('iceconnectionstatechange', function () {
      console.log("Ice Connection State: " + rtcPeerConnection.iceConnectionState);
    }, false);

    rtcPeerConnection.current.addEventListener('signalingstatechange', function () {
      console.log("Signaling State: " + rtcPeerConnection.signalingState);
    }, false);
    stream.getTracks().forEach( track => {
      rtcPeerConnection.current.addTrack(track, stream);
    });


  }


  // Gets the video stream from the selected video source
  let getVideoStream = async (source) => {

    let stream;
    try {
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720,
          }
        }
      };
      // video stream start

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream
      return stream
      // recording chunks
      // const options = { mimeType: 'video/webm; codecs=vp9' };
      // mediaRecorder.current = new MediaRecorder(stream, options);
      // mediaRecorder.current.ondataavailable = handleDataAvailable;
      // mediaRecorder.current.start();

    } catch (e) { console.log(e) }

    // socket.on('offer', offerSDP => {
    //   rtcPeerConnection.current.setRemoteDescription(
    //     new RTCSessionDescription(offerSDP)
    //   ).then(() => {
    //     rtcPeerConnection.current.createAnswer().then(sdp => {
    //       rtcPeerConnection.current.setLocalDescription(sdp);
    //       socket.emit('answer', sdp);
    //     })
    //   })
    // });

    // socket.on('answer', answerSDP => {
    //   rtcPeerConnection.current.setRemoteDescription(
    //     new RTCSessionDescription(answerSDP)
    //   )
    // });

    // socket.on('icecandidate', icecandidate => {
    //   rtcPeerConnection.current.addIceCandidate(
    //     new RTCIceCandidate(icecandidate)
    //   )
    // });

    // rtcPeerConnection.current.onicecandidate = (e) => {
    //   if (e.candidate){
    //     socket.emit('icecandidate', e.candidate)
    //   }
    // }

    // rtcPeerConnection.current.oniceconnectionstatechange = (e) => {
    //   console.log(e);
    // }

    // rtcPeerConnection.current.ontrack = (e) => {
    //  // videoRef.current.srcObject = e.streams[0];
    //   videoRef.current.onloadedmetadata = (e) => videoRef.current.play();
    // }

    // socket.on('answer', answerSDP => {
    //   rtcPeerConnection.current.setRemoteDescription(
    //     new RTCSessionDescription(answerSDP)
    //   )
    // });

    // socket.on('icecandidate', icecandidate => {
    //   rtcPeerConnection.current.addIceCandidate(
    //     new RTCIceCandidate(icecandidate)
    //   )
    // });

    // rtcPeerConnection.current.onicecandidate = (e) => {
    //   if (e.candidate) {
    //     socket.emit('icecandidate', e.candidate)
    //   }
    // }

    // rtcPeerConnection.current.oniceconnectionstatechange = (e) => {
    //   console.log(e);
    // }

    // rtcPeerConnection.current.ontrack = (e) => {
    //   // videoRef.current.srcObject = e.streams[0];
    //   videoRef.current.onloadedmetadata = (e) => videoRef.current.play();
    // }


  }

  let handleStop = () => {

    // close data channel
    // if (dc) {
    //     dc.close();
    // }

    // close transceivers
    if (rtcPeerConnection.current.getTransceivers) {
      rtcPeerConnection.current.getTransceivers().forEach(function (transceiver) {
        if (transceiver.stop) {
          transceiver.stop();
        }
      });
    }

    // close local audio / video
    console.log(rtcPeerConnection.current.getSenders())
    rtcPeerConnection.current.getSenders().forEach(function (sender) {
      sender.track.stop();
    });


    // close peer connection
    setTimeout(function () {
      rtcPeerConnection.current.close();
    }, 500);
  }


  let testHttp = () => {
    console.log("http://127.0.0.1:8080/test")
    fetch('http://127.0.0.1:8080/test', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
    });
  }
  let startVideo = () => {
    console.log(rtcPeerConnection.current.localDescription)
    console.log((rtcPeerConnection.current.remoteDescription))


  }

  return (
    <div>
      <h2>Main</h2>
      <video></video>
      <button id="startBtn" class="button is-primary" onClick={startVideo}>Start</button>
      <button id="stopBtn" class="button is-warning" onClick={handleStop}>Stop</button>
      <Dropdown onSelect={handleSelectVideoSource}>
        <Dropdown.Toggle variant="success" id="dropdown-basic">
          {selectedSource.name}
        </Dropdown.Toggle>

        <Dropdown.Menu>{
          inputSources.map(
            (input) => (
              <Dropdown.Item
                key={input.name}
                id={`video-source-${input.name}`}
                title={input.name}
                eventKey={input.id}
              >{input.name}</Dropdown.Item>))
        }
        </Dropdown.Menu>
      </Dropdown>
      <button id="videoSelectBtn" class="button is-text" onClick={handleLoadInputSources}>Choose a Video Source
      </button>
      <div>
        <button></button>
        <video ref={videoRef} autoPlay>
        </video>
      </div>
    </div>

  );
};

(async () => {
  const videoInputs = await window.init.getInputSources();
  ReactDOM.render(<MainPage videoInputs={videoInputs}></MainPage>, document.body);
})();
