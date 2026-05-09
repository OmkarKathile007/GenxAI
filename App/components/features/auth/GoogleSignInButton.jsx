"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const renderButton = useCallback(() => {
    if (!clientId || disabled || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          onCredential(response.credential);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "continue_with",
      width: buttonRef.current.offsetWidth || 336,
    });
  }, [clientId, disabled, onCredential]);

  useEffect(() => {
    if (scriptReady) {
      renderButton();
    }
  }, [scriptReady, renderButton]);

  if (!clientId) {
    return (
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-center text-sm text-yellow-200">
        Google login needs NEXT_PUBLIC_GOOGLE_CLIENT_ID.
      </div>
    );
  }

  return (
    <>
      <Script src={GOOGLE_SCRIPT_SRC} strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div
        className={disabled ? "pointer-events-none opacity-60" : ""}
        aria-disabled={disabled}
      >
        <div ref={buttonRef} className="flex min-h-[44px] w-full justify-center" />
      </div>
    </>
  );
}
