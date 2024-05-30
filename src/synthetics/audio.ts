interface MediaStreamAudioDestinationNode extends AudioNode {
  stream: MediaStream;
}

export function syntheticAudio(): MediaStreamTrack {
  const audioContextFactory = require("audiocontext");
  const holder = {};
  const audioContext = audioContextFactory.getOrCreate(holder);
  const oscillator = audioContext.createOscillator();
  const dst = oscillator.connect(
    audioContext.createMediaStreamDestination()
  ) as MediaStreamAudioDestinationNode;
  oscillator.start();
  const track = dst.stream.getAudioTracks()[0];
  const originalStop = track.stop;
  track.stop = () => {
    originalStop.call(track);
    audioContextFactory.release(holder);
  };
  return track;
}
