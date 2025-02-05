// Utility function to split base64 into chunks

const splitBase64IntoChunks = (base64String) => {
  const CHUNK_SIZE = 250000;
  const chunks = [];
  let index = 0;

  // Remove data:image/jpeg;base64, prefix if exists
  const base64Data = base64String.includes("base64,")
    ? base64String.split("base64,")[1]
    : base64String;

  while (index < base64Data.length) {
    chunks.push(base64Data.slice(index, index + CHUNK_SIZE));
    index += CHUNK_SIZE;
  }

  return chunks;
};

// Utility function to assemble chunks back into base64
const assembleChunks = (chunks) => {
  return chunks.map((chunk) => chunk.data).join("");
};

module.exports = { splitBase64IntoChunks, assembleChunks };
