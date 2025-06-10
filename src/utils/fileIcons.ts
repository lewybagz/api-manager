/**
 * Utility to get a placeholder for a file icon based on its extension.
 * @param fileName The full name of the file (e.g., "document.pdf").
 * @returns A string placeholder for the icon (e.g., "ICON_PDF").
 */
export const getFileIconPlaceholder = (fileName: string): string => {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  switch (extension) {
    case ".env":
      return "https://img.icons8.com/?size=100&id=21896&format=png&color=000000";
    case ".jpeg":
      return "https://img.icons8.com/?size=100&id=nnUuvw2cQVSd&format=png&color=000000";
    case ".jpg":
      return "https://img.icons8.com/?size=100&id=334&format=png&color=000000";
    case ".js":
      return "https://img.icons8.com/?size=100&id=108784&format=png&color=000000";
    case ".json":
      return "https://img.icons8.com/?size=100&id=78107&format=png&color=000000";
    case ".key":
      return "https://img.icons8.com/?size=100&id=21087&format=png&color=000000";
    case ".log":
      return "https://img.icons8.com/?size=100&id=40610&format=png&color=000000";
    case ".md":
      return "https://img.icons8.com/?size=100&id=21827&format=png&color=000000";
    case ".pdf":
      return "https://img.icons8.com/?size=100&id=47052&format=png&color=000000";
    case ".pem":
      return "https://img.icons8.com/?size=100&id=o6lgmoHFVhC7&format=png&color=000000";
    case ".png":
      return "https://img.icons8.com/?size=100&id=50040&format=png&color=000000";
    case ".ts":
      return "https://img.icons8.com/?size=100&id=uJM6fQYqDaZK&format=png&color=000000";
    case ".txt":
      return "https://img.icons8.com/?size=100&id=46907&format=png&color=000000";
    case ".zip":
      return "https://img.icons8.com/?size=100&id=46964&format=png&color=000000";
    default:
      return "https://img.icons8.com/?size=100&id=67360&format=png&color=000000";
  }
}; 