from tesserocr import PyTessBaseAPI, RIL
from PIL import Image
from pathlib import Path

PATH = str(Path(__file__).parent.absolute())

def preprocess(img):
    gray = img.convert('L')
    blackwhite = gray.point(lambda x: 0 if x < 200 else 255, '1')
    return blackwhite

def extractWords(img):
    # api = PyTessBaseAPI(path=(PATH + '/tesserocr/tessdata/.'), lang='eng')
    extractedRes = []
    with PyTessBaseAPI(path=(PATH + '/tesserocr/tessdata/.'), lang='eng') as api:
        api.SetImage(img)
        boxes = api.GetComponentImages(RIL.TEXTLINE, True)
        print(len(boxes))
        for i, (im, box, blockid, paragraphid) in enumerate(boxes):
            # im is a PIL image object of
            # box is a dict with x,y,w, and h keys
            api.SetRectangle(box['x'], box['y'], box['w'], box['h'])
            ocrResult = api.GetUTF8Text()
            conf = api.MeanTextConf()
            print(u"Box[{0}]: x={x}, y={y}, w={w}, h={h}, "
              "confidence: {1}, text: {2}".format(i, conf, ocrResult, **box))
            extractedRes.append((ocrResult, conf, box))
    
    return extractedRes