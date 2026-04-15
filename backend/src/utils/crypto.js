const CryptoJS = require("crypto-js");

const encryptPayload = (payload) => {
  const ciphertext = CryptoJS.AES.encrypt(
    JSON.stringify(payload),
    process.env.QR_SECRET
  ).toString();

  return ciphertext;
};

const decryptPayload = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.QR_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
};

module.exports = { encryptPayload, decryptPayload };
