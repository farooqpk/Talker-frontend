export const downloadDataAsFile = (data: ArrayBuffer, fileName: string) => {
    const blob = new Blob([data], { type: "octet/stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url); // Clean up the URL object
    link.remove();
    return;
  };
  