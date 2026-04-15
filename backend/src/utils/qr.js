const QRCode = require("qrcode");
const { encryptPayload } = require("./crypto");

const generateEncryptedQR = async (payload) => {
  const encryptedPayload = encryptPayload(payload);
  const qrCodeDataUrl = await QRCode.toDataURL(encryptedPayload, {
    width: 300,
    margin: 1,
  });

  return { encryptedPayload, qrCodeDataUrl };
};

module.exports = { generateEncryptedQR };
