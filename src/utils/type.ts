export interface reportType {
  videoStats: number[];
  nackCount: number;
  pliCount: number;
  qpSum: number;
  packetsSent: number;
  packetsReceived: number;
  packetsLost: number;
  framesEncoded: number;
  framesDecoded: number;
  framesSent: number;
  bytesSent: number;
  RoundTripTime: number;
  bandwidth_estimate_average: number;
  bandwidth_estimate_max: number;
  jitter?: number; // TODO figure out this calculation
}

export interface TestOptions {
  continuous?: boolean;
  useSyntheticDevices?: boolean;
  maximumTestDurationSeconds?: number;
}