import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useRef, useEffect } from 'react';


const DetectedText = (props) => {

  const { originalText = '', translatedText = '', showOriginal = false, confidence, box, ...restProps } = props




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
          setTranslationTexts(JSON.parse(event.data))


        }
      }
    })

    window.initOverlay.signalMessagePort();

  }, []);



  let translationText1 = "bonjour"

  let translationText2 = "hi"
  let [translationTexts, setTranslationTexts] = useState([[translationText1, translationText2], [translationText1, translationText2]]);

  useEffect(() => {
    console.log(translationTexts)
  }, [translationTexts])

  return (
    <div>
      {translationTexts.map(([translatedText, originalText, confidence, box, ...others]) => (
        <DetectedText originalText={originalText} translatedText={translatedText} confidence={confidence} box={box}>
        </DetectedText>
      ))}
    </div>

  );
};

(async () => {
  ReactDOM.render(<OverlayPage></OverlayPage>, document.body);
})();
