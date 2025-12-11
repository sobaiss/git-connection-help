export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject): void => {
    const reader: FileReader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
  });
}
