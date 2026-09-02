export interface EmailValidationResult {
  isValid: boolean;
  message?: string;
  suggestion?: string;
}

export const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmaill.vn': 'gmail.com',
  'gmail.com.vn': 'gmail.com',

  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'ymail.con': 'yahoo.com',

  // Hotmail typos
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',

  // Outlook typos
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlock.com': 'outlook.com',
  'outlook.con': 'outlook.com',

  // iCloud typos
  'iclod.com': 'icloud.com',
  'iclou.com': 'icloud.com',
  'icloud.con': 'icloud.com',

  // FPT edu typos
  'fpt.edu.vnn': 'fpt.edu.vn',
  'fpt.eduvn': 'fpt.edu.vn',
  'fpt.edu.con': 'fpt.edu.vn',
};

/**
 * Kiểm tra tính hợp lệ của địa chỉ email và phát hiện các lỗi gõ sai tên miền phổ biến
 */
export function validateEmail(email: string | null | undefined): EmailValidationResult {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { isValid: false, message: 'Địa chỉ email là bắt buộc.' };
  }

  const cleanEmail = email.trim();

  // Kiểm tra định dạng cơ bản: username@domain.tld
  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!basicRegex.test(cleanEmail)) {
    return { isValid: false, message: 'Địa chỉ email không đúng định dạng.' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: 'Địa chỉ email không đúng định dạng.' };
  }

  const [localPart, rawDomain] = parts;
  const domain = rawDomain.toLowerCase();

  // Kiểm tra phần tên người dùng (local part)
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { isValid: false, message: 'Tên người dùng trong email không được chứa dấu chấm liên tiếp hoặc ở đầu/cuối.' };
  }

  // Kiểm tra phần tên miền (domain)
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return { isValid: false, message: 'Tên miền email không được chứa dấu chấm liên tiếp hoặc ở đầu/cuối.' };
  }

  const domainParts = domain.split('.');
  for (const part of domainParts) {
    if (!part || part.startsWith('-') || part.endsWith('-')) {
      return { isValid: false, message: 'Tên miền email không hợp lệ.' };
    }
  }

  // Kiểm tra lỗi gõ nhầm tên miền phổ biến (ví dụ gmaill.com thay vì gmail.com)
  if (COMMON_DOMAIN_TYPOS[domain]) {
    const suggestionDomain = COMMON_DOMAIN_TYPOS[domain];
    const suggestedEmail = `${localPart}@${suggestionDomain}`;
    return {
      isValid: false,
      message: `Tên miền email "@${domain}" không hợp lệ (bạn có muốn nhập "@${suggestionDomain}" không?).`,
      suggestion: suggestedEmail,
    };
  }

  return { isValid: true };
}
