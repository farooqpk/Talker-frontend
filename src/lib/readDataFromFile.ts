export const readDataFromFile = (
  file: File,
  outputType: "text" | "arrayBuffer"
): Promise<string | ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (outputType === "text") {
        resolve(reader.result as string);
      } else if (outputType === "arrayBuffer") {
        resolve(reader.result as ArrayBuffer);
      }
    };

    if (outputType === "text") {
      reader.readAsText(file);
    } else if (outputType === "arrayBuffer") {
      reader.readAsArrayBuffer(file);
    }

    reader.onerror = reject;
  });
};
