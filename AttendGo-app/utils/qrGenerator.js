// utils/qrGenerator.js
// Funciones auxiliares para validar códigos QR dinámicos
// Los QR se generan en el controlador, aquí solo validamos que sean correctos

// Valida que un QR sea válido: que sea de la clase correcta y que no haya expirado
export function validarQR(qrString, claseId) {
  try {
    const qr = JSON.parse(qrString);

    // El QR debe corresponder exactamente a esta clase
    if (qr.claseId !== claseId) {
      return { ok: false, motivo: "QR no corresponde a esta clase." };
    }
    // El QR se genera con una duración limitada, después expira
    if (Date.now() > qr.expiracion) {
      return { ok: false, motivo: "QR expirado. Solicita uno nuevo al profesor." };
    }

    return { ok: true, motivo: "QR válido." };
  } catch {
    // Si no es un JSON válido, el QR fue modificado o es inválido
    return { ok: false, motivo: "QR inválido o modificado." };
  }
}

// Retorna cuántos segundos le quedan al QR antes de expirar
export function tiempoRestanteQR(qrString) {
  try {
    const qr = JSON.parse(qrString);
    // Calcular la diferencia entre ahora y la expiración, en segundos
    const restante = Math.max(0, Math.floor((qr.expiracion - Date.now()) / 1000));
    return restante;
  } catch {
    return 0;
  }
}