import http from './http';

export const getProcessQRCode = (processId) => http.get(`/shangyin/qrcodes/process/${processId}`);
export const getContractQRCode = (contractId) => http.get(`/shangyin/qrcodes/contract/${contractId}`);
export const getContractProductQRCode = (contractProductId) =>
  http.get(`/shangyin/qrcodes/contract-product/${contractProductId}`);
