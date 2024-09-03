"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Xumm } from 'xumm';
import styles from './main.module.css';

declare global {
  interface Window {
    createUnityInstance: any;
  }
}

const UnityGame: React.FC = () => {
  const webviewRef = useRef<HTMLIFrameElement>(null);
  const [windowSize, setWindowSize] = useState({ width: '100vw', height: '100vh' });
  const [unityInstance, setUnityInstance] = useState<any>(null);
  const [bearer, setBearer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xumm, setXumm] = useState<Xumm | null>(null);

  useEffect(() => {
    const initializeXumm = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const xAppToken = urlParams.get('xAppToken');

        if (!xAppToken) {
          throw new Error("No xAppToken found in URL");
        }

        const xumm = new Xumm(process.env.NEXT_PUBLIC_XUMM_API_KEY, xAppToken);
        
        await xumm.authorize();

        const bearerToken = await xumm.environment.bearer;
        if (bearerToken) {
          setBearer(bearerToken);
        } else {
          throw new Error("Failed to obtain bearer token");
        }

        setXumm(xumm);

      } catch (error) {
        console.error('Initialization error:', error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      }
    };

    const handleResize = () => {
      setWindowSize({ width: `${window.innerWidth}px`, height: `${window.innerHeight}px` });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'FROM_UNITY') {
        // ここでUnityからのメッセージを処理
        console.log('Received message from Unity:', event.data.message);
        xumm?.payload?.create({
          TransactionType: 'Payment',
          Destination: 'rPJuukGFu7Awm2c2fBY8jcAndfEZQngbpD',
          Amount: String(1)
        }).then((payload:any) => {
          xumm.xapp?.openSignRequest(payload)
        })
      }
    };

    window.addEventListener('message', handleMessage);
    initializeXumm();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [xumm,bearer]);


  const sendMessageToUnity = (message: string) => {
    console.log('sendMessageToUnity');
      // @ts-ignore
    if (unityInstance) {
      // @ts-ignore
      unityInstance.SendMessage('WebGLBridge', 'ReceiveMessageFromNextJS', message);
      console.log('sendMessageToUnity:OK');
    }
  };

  return (
  <div id="unity-container" className={styles.fullscreen} style={windowSize}>
    <iframe
      ref={webviewRef}
      src="https://unity-xapp.pages.dev"
      className={styles.fullscreenIframe}
      allow="autoplay; fullscreen; encrypted-media"
    />
    <button onClick={() => sendMessageToUnity('Hello from Next.js!')}>
      Send Message to Unity
    </button>
  </div>
  );
};

export default UnityGame;