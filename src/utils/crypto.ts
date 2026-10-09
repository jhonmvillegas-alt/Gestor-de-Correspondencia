// Electronic Signature & Cryptographic verification utilities

export async function generateSha256(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // Fallback hash
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0') + Date.now().toString(16);
  }
}

export function generateVerificationCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  let code = 'DOC-';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return code;
}
