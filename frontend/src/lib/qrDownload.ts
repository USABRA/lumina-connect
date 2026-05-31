export function downloadSvgAsPng(svgElement: SVGSVGElement, filename: string, size = 512) {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pngBlob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }, "image/png");

    URL.revokeObjectURL(url);
  };

  image.src = url;
}

export function printQrSheet() {
  window.print();
}
