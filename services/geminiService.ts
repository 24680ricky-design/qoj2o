// AI Service is currently disabled to simplify deployment.
// This function is kept to maintain type compatibility if it's called elsewhere.

export const generateHint = async (name: string): Promise<string> => {
  // Return a default generic hint instead of calling an API
  return "請仔細觀察圖片特徵";
};