import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Dropdown from 'react-bootstrap/Dropdown';
import { useState, useRef } from 'react';

import io from 'socket.io-client'




const MainPage = () => {

  const socket = io('http://localhost:4000');
  let [inputSources, setInputSources] = useState([]);
  let [selectedSource, setSelectedSource] = useState({ name: "", id: "" });

  let videoRef = useRef(null);
  const rtcPeerConnection = useRef(new RTCPeerConnection({
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
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
    getVideoStream(source);
    //const stream = await window.init.getVideoStream(source.id);

  }

  let mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);

  // Gets the video stream from the selected video source
  let getVideoStream = async (source) => {
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
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream

      // recording chunks
      // const options = { mimeType: 'video/webm; codecs=vp9' };
      // mediaRecorder.current = new MediaRecorder(stream, options);
      // mediaRecorder.current.ondataavailable = handleDataAvailable;
      // mediaRecorder.current.start();

      rtcPeerConnection.current.addStream(stream);
      rtcPeerConnection.current.createOffer({
        offerToReceiveVideo: 1
      }).then(sdp => {
        rtcPeerConnection.current.setLocalDescription(sdp);
        socket.emit('offer', sdp);

      })
    } catch (e) { console.log(e) }

    socket.on('offer', offerSDP => {
      rtcPeerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offerSDP)
      ).then(() => {
        rtcPeerConnection.current.createAnswer().then(sdp => {
          rtcPeerConnection.current.setLocalDescription(sdp);
          socket.emit('answer', sdp);
        })
      })
    });

    socket.on('answer', answerSDP => {
      rtcPeerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answerSDP)
      )
    });

    socket.on('icecandidate', icecandidate => {
      rtcPeerConnection.current.addIceCandidate(
        new RTCIceCandidate(icecandidate)
      )
    });

    rtcPeerConnection.current.onicecandidate = (e) => {
      if (e.candidate){
        socket.emit('icecandidate', e.candidate)
      }
    }

    rtcPeerConnection.current.oniceconnectionstatechange = (e) => {
      console.log(e);
    }

    rtcPeerConnection.current.ontrack = (e) => {
     // videoRef.current.srcObject = e.streams[0];
      videoRef.current.onloadedmetadata = (e) => videoRef.current.play();
    }


  }




  let handleDataAvailable = (e) => {
    console.log('video data available');
    recordedChunks.current.push(e.data);
    console.log(recordedChunks.current)
  }

  let startVideo = () => {
    // console.log("play");
    // console.log(videoRef);
    // videoRef.current.play();
    console.log(mediaRecorder);
    mediaRecorder.current.stop();
  }

  return (
    <div>
      <h2>Main</h2>
      <video></video>
      <button id="startBtn" class="button is-primary" onClick={startVideo}>Start</button>
      <button id="stopBtn" class="button is-warning">Stop</button>
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
