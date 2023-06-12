import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useRef, useEffect } from 'react';


const DetectedText = (props) => {

  const { originalText = '', translatedText = '', showOriginal = false, ...restProps } = props


  return (
    <div>
      <text>{showOriginal ? originalText : translatedText}</text>
    </div>
  )
}


const OverlayPage = () => {
  //let messagePortRef = useRef(null)

  useEffect(() => {

    window.addEventListener("message", (event) => {
      // event.source === window means the message is coming from the preload script, as opposed to from an <iframe> or other source.
      if (event.source === window && event.data === 'port') {
        const [port] = event.ports;
        //messagePortRef.current = port
        port.onmessage = (event) => {
          console.log('app -> over: ', event.data);
        }
      }
    })

    window.initOverlay.signalMessagePort();

  }, []);


  let translationText1 = {
    originalText: "bonjour",
    translatedText: "hello",
  }

  let translationText2 = {
    originalText: "au revoir",
    translatedText: "goodbye",
  }
  let [translationTexts, setTranslationTexts] = useState([translationText1, translationText2]);

  return (
    <div>
      {translationTexts.map((text) => (
        <DetectedText originalText={text.originalText} translatedText={text.translatedText}>
        </DetectedText>
      ))}
    </div>

  );
};

(async () => {
  ReactDOM.render(<OverlayPage></OverlayPage>, document.body);
})();
