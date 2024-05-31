import { useState } from "react";
import { Call, createCall } from "../utils/createCall";
import { reportStats } from "../utils/reportStats";
import { TestOptions, reportType } from "../utils/type";
import { syntheticAudio } from "../synthetics/audio";
import { syntheticVideo } from "../synthetics/video";

const useVideoBandwidth = () =>
  /*iceServers: RTCIceServer[],
  options?: TestOptions*/
  {
    const [error, setError] = useState<Error | null>(null);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [gatheredStatsReport, setGatheredStatsReport] =
      useState<reportType | null>(null);
    let Call: Call;
    let localStream: MediaStream;
    let intervalId: string | number | NodeJS.Timeout | undefined;
    let response1: RTCStatsReport, response2: RTCStatsReport;

    const startTest = async (
      config: RTCConfiguration,
      options?: TestOptions
    ) => {
      const silent = options?.silent ?? false;
      const useSyntheticDevices = options?.silent ?? false;

      console.log(
        `Starting test: Silent: ${silent.toString()} | Use Synthetic Devices: ${useSyntheticDevices.toString()}`
      );
      console.dir(options);

      setError(null);

      const gotRemoteStream = () => {
        !silent && console.log("peerConnection2 received remote stream");
      };

      try {
        if (useSyntheticDevices) {
          const audioTrack = syntheticAudio();
          const videoTrack = syntheticVideo();
          localStream.addTrack(audioTrack);
          localStream.addTrack(videoTrack);

          !silent && console.log("Using synthetic audio and video devices");
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          localStream = stream;

          const videoTracks = localStream.getVideoTracks();
          const audioTracks = localStream.getAudioTracks();

          if (videoTracks?.length > 0) {
            !silent &&
              console.log(`Using video device: ${videoTracks[0].label}`);
          } else {
            console.warn(`No video devices detected`);
          }
          if (audioTracks?.length > 0) {
            !silent &&
              console.log(`Using audio device: ${audioTracks[0].label}`);
          } else {
            console.warn(`No audio devices detected`);
          }
        }
      } catch (e) {
        if (!useSyntheticDevices) {
          console.error(`getUserMedia() error:`, e);
        } else {
          console.error(`synthetic audio/video error:`, e);
        }
        setError(e as Error);
        stopInterval();
      }

      Call = createCall(config, "relay");
      Call.pc2?.addEventListener("track", gotRemoteStream);
      localStream
        .getTracks()
        .forEach((track) => Call.pc1?.addTrack(track, localStream));

      Call.establishConnection();
      checker(Call.pc1, Call.pc2);
    };

    function checker(
      peerConnection1: RTCPeerConnection,
      peerConnection2: RTCPeerConnection
    ) {
      intervalId = setInterval(() => {
        peerConnection1?.getStats().then((stats) => {
          response1 = stats;
        });
        peerConnection2?.getStats().then((stats) => {
          response2 = stats;
        });
      }, 1000);
    }

    function stopInterval() {
      clearInterval(intervalId);

      if (response1 && response2) {
        const updatedStatsReport = reportStats(response1, response2);
        setGatheredStatsReport(updatedStatsReport);
      } else {
        const e = new Error(
          "Either response1, response2 or both were undefined"
        );
        console.error(e);
        setError(e);
      }

      Call.pc1?.getSenders()?.forEach((sender: RTCRtpSender | undefined) => {
        const track = sender?.track;
        track?.stop();
      });
      Call.close();

      setIsRunning(false);
    }

    async function start(iceServers: RTCIceServer[], options?: TestOptions) {
      setIsRunning(true);
      console.log(`Initiating test with options:`);
      console.dir(options);

      const turnConfig: RTCConfiguration = {
        iceServers,
      };
      await startTest(turnConfig, options);

      if (options?.continuous !== true) {
        setTimeout(
          () => {
            options?.silent !== true && console.log(`Stopping test`);
            stopInterval();
          },
          options?.maximumTestDurationSeconds
            ? options?.maximumTestDurationSeconds * 1000
            : 5000
        );
      }
    }

    return {
      error,
      isRunning,
      report: gatheredStatsReport,
      start,
      stop: stopInterval,
    };
  };
export default useVideoBandwidth;
