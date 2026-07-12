/**
 * PromptPay QR payload generator (EMV QR Code standard)
 * Generates a PromptPay payload string that can be encoded into a QR code.
 * Phone: 0066XXXXXXXXX format (leading 0 replaced with 66 country code)
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ((crc & 0xffff) | 0x10000).toString(16).slice(-4).toUpperCase();
}

function field(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export function buildPromptPayPayload(phone: string, amount?: number): string {
  // Normalize to 0066XXXXXXXXX
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("66")
    ? "0066" + digits.slice(2)
    : digits.startsWith("0")
    ? "0066" + digits.slice(1)
    : "0066" + digits;

  const merchantAccountInfo = field("00", "A000000677010111") + field("01", normalized);

  let payload =
    field("00", "01") +                          // Payload format indicator
    field("01", amount !== undefined ? "12" : "11") + // Point of initiation: 12 = one-time w/ amount, 11 = static/reusable
    field("29", merchantAccountInfo) +            // PromptPay merchant account info
    field("52", "0000") +                        // Merchant category code
    field("53", "764") +                         // Currency (THB)
    (amount !== undefined ? field("54", amount.toFixed(2)) : "") +
    field("58", "TH") +                          // Country code
    field("59", "Evercool Thailand") +            // Merchant name
    field("60", "Bangkok") +                     // Merchant city
    "6304";                                       // CRC placeholder tag + length

  payload += crc16(payload);
  return payload;
}
