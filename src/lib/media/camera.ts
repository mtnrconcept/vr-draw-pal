const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const PUBLIC_APP_URL = import.meta.env?.VITE_PUBLIC_APP_URL;

export type CameraAccessErrorCode = "unsupported" | "insecure-context";

export class CameraAccessError extends Error {
  code: CameraAccessErrorCode;

  constructor(message: string, code: CameraAccessErrorCode) {
    super(message);
    this.name = "CameraAccessError";
    this.code = code;
  }
}

const getLegacyGetUserMedia = (navigatorRef: Navigator & Record<string, any>) => {
  return (
    navigatorRef.mediaDevices?.getUserMedia ||
    navigatorRef.getUserMedia ||
    navigatorRef.webkitGetUserMedia ||
    navigatorRef.mozGetUserMedia ||
    navigatorRef.msGetUserMedia
  );
};

const isSecureEnoughContext = () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.isSecureContext) {
    return true;
  }

  return LOCALHOST_HOSTS.has(window.location.hostname);
};

const insecureContextMessage = () => {
  const base =
    "L'accès à la caméra nécessite une connexion sécurisée (HTTPS ou localhost).";
  if (PUBLIC_APP_URL) {
    return `${base} Ouvrez l'application via ${PUBLIC_APP_URL} ou un tunnel sécurisé pour continuer.`;
  }
  return `${base} Ouvrez l'application via https:// ou un tunnel sécurisé pour continuer.`;
};

export const ensureCameraAccessSupport = () => {
  if (!isSecureEnoughContext()) {
    throw new CameraAccessError(
      insecureContextMessage(),
      "insecure-context"
    );
  }

  const navigatorRef = navigator as Navigator & Record<string, any>;
  const getUserMedia = getLegacyGetUserMedia(navigatorRef);

  if (!getUserMedia) {
    throw new CameraAccessError(
      "La caméra n'est pas disponible sur ce navigateur ou cet appareil.",
      "unsupported"
    );
  }

  return getUserMedia;
};

export const requestCameraStream = async (constraints: MediaStreamConstraints) => {
  const getUserMedia = ensureCameraAccessSupport();

  if (getUserMedia === navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  return new Promise<MediaStream>((resolve, reject) => {
    getUserMedia.call(navigator, constraints, resolve, reject);
  });
};
