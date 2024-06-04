import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
