import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not load image.")));
    image.src = src;
  });
}

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  mimeType = "image/jpeg",
  quality = 0.92
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process image.");
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not crop image."));
      },
      mimeType,
      quality
    );
  });

  const baseName = fileName.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: mimeType });
}
