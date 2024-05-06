export function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create HTML Image element
    const img = new Image();

    // Create a FileReader to read the file
    const reader = new FileReader();
    reader.onload = function (event) {
      img.onload = function () {
        // Create canvas element
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image onto canvas
        ctx?.drawImage(img, 0, 0);

        // Convert canvas to WebP
        canvas.toBlob((webpBlob) => {
          if (webpBlob) {
            resolve(webpBlob as Blob);
          } else {
            reject(new Error("Conversion to WebP failed"));
          }
        }, "image/webp");
      };

      img.src = event.target?.result as string;
    };
    reader.onerror = reject;

    // Read the file as Data URL
    reader.readAsDataURL(file);
  });
}
