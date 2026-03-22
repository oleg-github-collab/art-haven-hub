import { useState, useRef, useCallback, useEffect } from "react";
import type { WSMessage } from "./useWebSocket";
import type { ICEServer } from "./useICEServers";

export type CallState = "idle" | "initiating" | "ringing" | "connecting" | "connected" | "ended";

export interface CallInfo {
  callId: string;
  callType: "audio" | "video";
  remoteUserId: string;
  remoteUserName: string;
  remoteUserAvatar?: string;
  conversationId: string;
  direction: "outgoing" | "incoming";
}

export interface CoBrowseEvent {
  type: "cobrowse_start" | "cobrowse_navigate" | "cobrowse_stop";
  url?: string;
  artworkId?: string;
  title?: string;
}

interface UseWebRTCOptions {
  iceServers?: ICEServer[];
  onCoBrowseEvent?: (event: CoBrowseEvent) => void;
}

const DEFAULT_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC(
  wsSend: (msg: WSMessage) => void,
  options?: UseWebRTCOptions,
) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const durationInterval = useRef<ReturnType<typeof setInterval>>();
  const callInfoRef = useRef<CallInfo | null>(null);

  // Keep ref in sync
  useEffect(() => {
    callInfoRef.current = callInfo;
  }, [callInfo]);

  const getICEConfig = useCallback((): RTCConfiguration => {
    const servers = options?.iceServers;
    if (servers && servers.length > 0) {
      return {
        iceServers: servers.map((s) => ({
          urls: s.urls,
          username: s.username,
          credential: s.credential,
        })),
      };
    }
    return { iceServers: DEFAULT_ICE };
  }, [options?.iceServers]);

  const cleanup = useCallback(() => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = undefined;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    iceCandidateQueue.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallDuration(0);
  }, []);

  const startDurationTimer = useCallback(() => {
    setCallDuration(0);
    durationInterval.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(getICEConfig());

    pc.onicecandidate = (event) => {
      if (event.candidate && callInfoRef.current) {
        wsSend({
          type: "ice_candidate",
          payload: {
            call_id: callInfoRef.current.callId,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        if (callInfoRef.current) {
          wsSend({
            type: "call_end",
            payload: { call_id: callInfoRef.current.callId },
          });
        }
        setCallState("ended");
        setTimeout(cleanup, 1000);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [getICEConfig, wsSend, cleanup]);

  const acquireMedia = useCallback(async (callType: "audio" | "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // --- Public actions ---

  const initiateCall = useCallback(
    async (calleeId: string, conversationId: string, callType: "audio" | "video") => {
      try {
        const stream = await acquireMedia(callType);
        setCallState("initiating");
        setCallInfo({
          callId: "", // will be set when we get call_accepted or from server
          callType,
          remoteUserId: calleeId,
          remoteUserName: "",
          conversationId,
          direction: "outgoing",
        });

        // Add tracks to be ready
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        wsSend({
          type: "call_initiate",
          payload: {
            callee_id: calleeId,
            conversation_id: conversationId,
            call_type: callType,
          },
        });
      } catch (err) {
        console.error("Failed to acquire media:", err);
        cleanup();
        setCallState("idle");
      }
    },
    [acquireMedia, createPeerConnection, wsSend, cleanup],
  );

  const acceptCall = useCallback(async () => {
    if (!callInfo) return;
    try {
      const stream = await acquireMedia(callInfo.callType);

      // Don't create a new PC yet — wait for the offer
      // But set up local stream ref
      localStreamRef.current = stream;

      wsSend({
        type: "call_accept",
        payload: { call_id: callInfo.callId },
      });
      setCallState("connecting");
    } catch (err) {
      console.error("Failed to acquire media:", err);
      rejectCall();
    }
  }, [callInfo, acquireMedia, wsSend]);

  const rejectCall = useCallback(() => {
    if (!callInfo) return;
    wsSend({
      type: "call_reject",
      payload: { call_id: callInfo.callId, reason: "declined" },
    });
    setCallState("idle");
    setCallInfo(null);
    cleanup();
  }, [callInfo, wsSend, cleanup]);

  const endCall = useCallback(() => {
    if (!callInfo) return;
    wsSend({
      type: "call_end",
      payload: { call_id: callInfo.callId },
    });
    setCallState("ended");
    setTimeout(() => {
      cleanup();
      setCallState("idle");
      setCallInfo(null);
    }, 1500);
  }, [callInfo, wsSend, cleanup]);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMicMuted((m) => !m);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsCameraOff((c) => !c);
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    if (!pcRef.current) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
    } catch {
      // User cancelled screen share picker
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (!pcRef.current || !screenStreamRef.current) return;

    // Restore camera track
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
    if (sender && cameraTrack) {
      sender.replaceTrack(cameraTrack);
    }

    screenStreamRef.current.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  }, []);

  // --- Co-browse ---

  const startCoBrowse = useCallback(() => {
    if (!callInfo) return;
    wsSend({
      type: "cobrowse_start",
      payload: { call_id: callInfo.callId },
    });
  }, [callInfo, wsSend]);

  const navigateCoBrowse = useCallback(
    (url: string, artworkId?: string, title?: string) => {
      if (!callInfo) return;
      wsSend({
        type: "cobrowse_navigate",
        payload: { call_id: callInfo.callId, url, artwork_id: artworkId, title },
      });
    },
    [callInfo, wsSend],
  );

  const stopCoBrowse = useCallback(() => {
    if (!callInfo) return;
    wsSend({
      type: "cobrowse_stop",
      payload: { call_id: callInfo.callId },
    });
  }, [callInfo, wsSend]);

  // --- Handle incoming WS messages ---

  const handleSignalingMessage = useCallback(
    async (msg: WSMessage) => {
      const payload = msg.payload as Record<string, unknown>;

      switch (msg.type) {
        case "call_incoming": {
          setCallState("ringing");
          setCallInfo({
            callId: payload.call_id as string,
            callType: (payload.call_type as "audio" | "video") || "audio",
            remoteUserId: payload.caller_id as string,
            remoteUserName: (payload.caller_name as string) || "Unknown",
            remoteUserAvatar: payload.caller_avatar as string,
            conversationId: payload.conversation_id as string,
            direction: "incoming",
          });
          break;
        }

        case "call_accepted": {
          // We're the caller. The callee accepted. Create offer.
          setCallInfo((prev) =>
            prev ? { ...prev, callId: payload.call_id as string } : prev,
          );
          setCallState("connecting");

          const pc = pcRef.current;
          if (!pc) break;

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            wsSend({
              type: "webrtc_offer",
              payload: {
                call_id: payload.call_id as string,
                sdp: pc.localDescription,
              },
            });
          } catch (err) {
            console.error("Failed to create offer:", err);
          }
          break;
        }

        case "call_rejected": {
          setCallState("ended");
          setTimeout(() => {
            cleanup();
            setCallState("idle");
            setCallInfo(null);
          }, 1500);
          break;
        }

        case "call_ended": {
          setCallState("ended");
          setTimeout(() => {
            cleanup();
            setCallState("idle");
            setCallInfo(null);
          }, 1500);
          break;
        }

        case "webrtc_offer": {
          // We're the callee. Got the offer. Create answer.
          const pc = createPeerConnection();
          const stream = localStreamRef.current;
          if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          }

          try {
            const sdp = payload.sdp as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));

            // Flush queued ICE candidates
            for (const candidate of iceCandidateQueue.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            iceCandidateQueue.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            wsSend({
              type: "webrtc_answer",
              payload: {
                call_id: payload.call_id as string,
                sdp: pc.localDescription,
              },
            });

            setCallState("connected");
            startDurationTimer();
          } catch (err) {
            console.error("Failed to handle offer:", err);
          }
          break;
        }

        case "webrtc_answer": {
          // We're the caller. Got the answer.
          const pc = pcRef.current;
          if (!pc) break;

          try {
            const sdp = payload.sdp as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));

            // Flush queued ICE candidates
            for (const candidate of iceCandidateQueue.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            iceCandidateQueue.current = [];

            setCallState("connected");
            startDurationTimer();
          } catch (err) {
            console.error("Failed to handle answer:", err);
          }
          break;
        }

        case "ice_candidate": {
          const candidate = payload.candidate as RTCIceCandidateInit;
          if (!candidate) break;

          const pc = pcRef.current;
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Failed to add ICE candidate:", err);
            }
          } else {
            // Queue until remote description is set
            iceCandidateQueue.current.push(candidate);
          }
          break;
        }

        case "cobrowse_start":
        case "cobrowse_navigate":
        case "cobrowse_stop": {
          options?.onCoBrowseEvent?.({
            type: msg.type as CoBrowseEvent["type"],
            url: payload.url as string,
            artworkId: payload.artwork_id as string,
            title: payload.title as string,
          });
          break;
        }
      }
    },
    [wsSend, createPeerConnection, cleanup, startDurationTimer, options],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    callInfo,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,

    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,

    startCoBrowse,
    navigateCoBrowse,
    stopCoBrowse,

    handleSignalingMessage,
  };
}
