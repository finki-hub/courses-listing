type RasterizeOptions = {
  height: number;
  pixelRatio: number;
  svgDataUrl: string;
  width: number;
};

const rasterizeInWorker = ({
  height,
  pixelRatio,
  svgDataUrl,
  width,
}: RasterizeOptions): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('screenshot-worker.ts', import.meta.url),
      { type: 'module' },
    );

    const encoded = new TextEncoder().encode(svgDataUrl);
    const { buffer } = encoded;

    worker.addEventListener(
      'message',
      (e: MessageEvent<{ blob?: Blob; error?: string }>) => {
        worker.terminate();
        if (e.data.error) reject(new Error(e.data.error));
        else if (e.data.blob) resolve(e.data.blob);
        else reject(new Error('No blob returned'));
      },
    );

    worker.addEventListener('error', (e) => {
      worker.terminate();
      reject(new Error(e.message));
    });

    worker.postMessage({ buffer, height, pixelRatio, width }, [buffer]);
  });

const rasterizeOnMainThread = ({
  height,
  pixelRatio,
  svgDataUrl,
  width,
}: RasterizeOptions): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob returned null'));
      }, 'image/png');
    });
    img.addEventListener('error', () => {
      reject(new Error('Image load failed'));
    });
    img.src = svgDataUrl;
  });

export const captureTableToClipboard = async (
  element: HTMLElement,
): Promise<boolean> => {
  const { toSvg } = await import('html-to-image');

  const pixelRatio = 2;
  const bgValue = getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim();
  const backgroundColor = bgValue
    ? `hsl(${bgValue})`
    : document.documentElement.dataset['kbTheme'] === 'dark'
      ? '#09090b'
      : '#ffffff';

  try {
    const svgDataUrl = await toSvg(element, { backgroundColor, pixelRatio });

    const opts: RasterizeOptions = {
      height: element.scrollHeight,
      pixelRatio,
      svgDataUrl,
      width: element.scrollWidth,
    };

    const blob = await rasterizeInWorker(opts).catch(() =>
      rasterizeOnMainThread(opts),
    );

    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
};
