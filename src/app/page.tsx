"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Xumm } from 'xumm';

declare global {
  interface Window {
    createUnityInstance: any;
  }
}

const UnityGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "./Build/Build.loader.js";
    script.async = true;
    
    script.onload = () => {
      window.createUnityInstance(canvasRef.current, {
        dataUrl: "./Build/Build.data.unityweb",
        frameworkUrl: "./Build/Build.framework.js.unityweb",
        codeUrl: "./Build/Build.wasm.unityweb",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "YourCompanyName",
        productName: "YourProductName",
        productVersion: "0.1",
      }, (progress:any) => {
        console.log(`Loading: ${(progress * 100).toFixed(2)}%`);
      }).then((unityInstance:any) => {
        setUnityInstance(unityInstance);
        console.log("Unity instance created successfully");
      }).catch((error:any) => {
        console.error("Unity instance creation failed:", error);
      });
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
  <div id="unity-container" style={{ width: '100%', height: '100%' }}>
    <canvas id="unity-canvas" ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    <button onClick={() => sendMessageToUnity('Hello from Next.js!')}>
      Send Message to Unity
    </button>
  </div>
  );
};

export default UnityGame;