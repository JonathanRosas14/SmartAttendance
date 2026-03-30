// utils/qrGenerator.js
// Utilidad de apoyo — la lógica principal está en el controlador

// Valida si un QR string sigue vigente y es de la clase correcta
export function validarQR(qrString, claseId) {
  try {
    const qr = JSON.parse(qrString);

    if (qr.claseId !== claseId) {
      return { ok: false, motivo: "QR no corresponde a esta clase." };
    }
    if (Date.now() > qr.expiracion) {
      return { ok: false, motivo: "QR expirado. Solicita uno nuevo al profesor." };
    }

    return { ok: true, motivo: "QR válido." };
  } catch {
    return { ok: false, motivo: "QR inválido o modificado." };
  }
}

// Retorna cuántos segundos le quedan al QR
export function tiempoRestanteQR(qrString) {
  try {
    const qr = JSON.parse(qrString);
    const restante = Math.max(0, Math.floor((qr.expiracion - Date.now()) / 1000));
    return restante;
  } catch {
    return 0;
  }
}