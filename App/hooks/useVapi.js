"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";

const getVapiInstance = () => {
  if (typeof window !== "undefined") {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.warn("Vapi Warning: NEXT_PUBLIC_VAPI_PUBLIC_KEY is missing!");
    }
    return publicKey ? new Vapi(publicKey) : null;
  }
  return null;
};

const normalizeTranscriptText = (text) => text.trim().replace(/\s+/g, " ");

/**
 * Drives a live Vapi web voice session.
 * Returns: status ('disconnected' | 'connecting' | 'listening' | 'thinking' | 'speaking'),
 * isSessionActive, transcript [{ role, text }], and toggleCall() to start/stop.
 */
export function useVapi(options = {}) {
  const [status, setStatus] = useState("disconnected");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  const [callId, setCallId] = useState(null);

  const vapiRef = useRef(null);
  // Latest options without re-binding toggleCall (assistantOverrides, callbacks).
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (!vapiRef.current) {
      vapiRef.current = getVapiInstance();
    }

    const vapi = vapiRef.current;
    if (!vapi) return;

    const onCallStart = () => {
      setStatus("listening");
      setIsSessionActive(true);
      setTranscript([]);
      setError(null);
    };

    const onCallEnd = () => {
      setStatus("disconnected");
      setIsSessionActive(false);
      setTranscript([]);
    };

    const onSpeechStart = () => setStatus("speaking");
    const onSpeechEnd = () => setStatus("listening");

    const onMessage = (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const text = normalizeTranscriptText(message.transcript ?? "");
        if (!text) return;

        setTranscript((prev) => {
          const role = message.role ?? "user";
          const isDuplicate = prev
            .slice(-3)
            .some((item) => item.role === role && normalizeTranscriptText(item.text) === text);
          if (isDuplicate) return prev;
          return [...prev, { role, text }];
        });
      }
    };

    const onError = (e) => {
      const msg =
        e?.error?.message ||
        e?.errorMsg ||
        e?.message ||
        (JSON.stringify(e ?? {}) === "{}"
          ? "Auth/network failure — check the PUBLIC key (not private), assistant ID, and mic permission."
          : JSON.stringify(e));
      console.error("Vapi Error:", e);
      setError(msg);
      setStatus("disconnected");
      setIsSessionActive(false);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.removeAllListeners();
    };
  }, []);

  const toggleCall = useCallback(async () => {
    const vapi = vapiRef.current;

    if (!vapi) {
      alert("System Error: Vapi Public Key is missing in your .env file.");
      return;
    }

    if (isSessionActive) {
      vapi.stop();
      return;
    }

    const assistantId = optsRef.current?.assistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      alert("System Error: Assistant ID is missing in your .env file.");
      return;
    }

    try {
      setStatus("connecting");
      setError(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const overrides = optsRef.current?.assistantOverrides;
      const call = await vapi.start(assistantId, overrides || undefined);
      if (call?.id) {
        setCallId(call.id);
        optsRef.current?.onCallId?.(call.id);
      }
    } catch (err) {
      console.error("Failed to start Vapi:", err);
      const isMic = err?.name === "NotAllowedError" || err?.name === "NotFoundError";
      setError(
        isMic
          ? "Microphone blocked. Allow mic access for localhost in your browser and retry."
          : err?.message || "Failed to start the voice session."
      );
      setStatus("disconnected");
      setIsSessionActive(false);
    }
  }, [isSessionActive]);

  return { status, isSessionActive, transcript, toggleCall, error, callId };
}

export default useVapi;
