import argparse
import asyncio
import logging
import math
import os
import numpy
import uuid
import json

from aiohttp import web
import aiohttp_cors
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRelay, MediaBlackhole, MediaRecorder, MediaPlayer

from av import VideoFrame
from threading import Timer

ROOT = os.path.dirname(__file__)

logger = logging.getLogger("pc")
pcs = set()
relay = MediaRelay()


class VideoTransformTrack(MediaStreamTrack): 
    """
    A video stream track that transforms frames from another track
    """

    kind = "video"

    def __init__(self, track):
        super().__init__()  # don't forget this!
        self.track = track

    async def recv(self):
        frame = await self.track.recv()

        # Do some processing/transforms/etc

        return frame
        # can also return coordinates with translation here



async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pc_id = "PeerConnection(%s)" % uuid.uuid4()
    pcs.add(pc)

    def log_info(msg, *args):
        logger.info(pc_id + " " + msg, *args)
    
    log_info("Created for %s", request.remote)
    
    
    if args.record_to:
        recorder = MediaRecorder(args.record_to)
        print(args.record_to)
    else:
        recorder = MediaBlackhole()


    @pc.on("datachannel")
    def on_datachannel(channel):
        @channel.on("message")
        def on_message(message):
            if isinstance(message,str) and message.startswith("ping"):
                channel.send("pong" + message[4:])
    
    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        log_info("ICE connection state is %s", pc.iceConnectionState)
        if pc.iceConnectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    @pc.on("track")
    def on_track(track):
        log_info("Track %s received", track.kind)
        print("TRACK RECEIVEDEEEEEEEEEEEEEEEEE")
        if track.kind =="video":
            pc.addTrack(VideoTransformTrack(
                relay.subscribe(track)
            ))
            if args.record_to:
                recorder.addTrack(relay.subscribe(track))
        
    
        @track.on("ended")
        async def on_ended():
            log_info("Track %s ended", track.kind)
            print("ENDEDDDDDDDDDDDDDDDDDDDDD")
            await recorder.stop()


    # handle offer
    await pc.setRemoteDescription(offer)
    await recorder.start()

    # send answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.Response(
        content_type="application/json",
        text=json.dumps(
            {
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type,
            }
        ),
    )


async def test(request):
    logger.info("Successful HTTP Message Test")
    print("hi")

async def on_shutdown(app):
    #close peer connections
    print("Shutting Down")
    print("receivers")
    for pc in pcs:
        for rec in pc.getReceivers():
            print(rec)
    print("transceivers")
    for pc in pcs:
        for trans in pc.getTransceivers():
            print(trans)
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="WebRTC audio / video / data-channels demo"
    )
    parser.add_argument("--cert-file", help="SSL certificate file (for HTTPS)")
    parser.add_argument("--key-file", help="SSL key file (for HTTPS)")
    parser.add_argument(
        "--host", default="0.0.0.0", help="Host for HTTP server (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port", type=int, default=8080, help="Port for HTTP server (default: 8080)"
    )
    parser.add_argument("--record-to", help="Write received media to a file."),
    parser.add_argument("--verbose", "-v", action="count")

    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    
    # if args.cert_file:
    #     ssl_context = ssl.SSLContext()
    #     ssl_context.load_cert_chain(args.cert_file, args.key_file)
    # else:
    #     ssl_context = None
    

    app = web.Application()
    app.on_shutdown.append(on_shutdown)
    app.router.add_post("/offer", offer)
    app.router.add_get("/test", test)

    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*"
            )
        })
    
    for route in list(app.router.routes()):
        cors.add(route)

    logger.info("Started server")
    web.run_app(app, access_log=None, host=args.host, port=args.port)

