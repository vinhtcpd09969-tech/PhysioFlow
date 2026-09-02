/**
 * BỘ LỌC TỪ NGỮ THÔ TỤC, XÚC PHẠM & CẢNH BÁO TIẾNG VIỆT (VIETNAMESE PROFANITY ENGINE)
 */

export const VIETNAMESE_LETTERS = 'a-zA-Z0-9_aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ';

const PROFANITY_PHRASES = [
  // Cụm 3 - 4 từ
  'mẹ kiếp nhà mày', 'mẹ cha nhà mày', 'con mẹ nhà mày', 'địt mẹ mày', 'địt cụ mày', 'địt bà mày',
  'đụ mẹ mày', 'đù mẹ mày', 'đậu má mày', 'bú cu con cặc', 'bú cặc', 'bú cu', 'hãm cành cạch',

  // Cụm 2 từ
  'đù mẹ', 'du me', 'đù má', 'du ma', 'đụ mẹ', 'du me', 'đụ má', 'du ma',
  'đậu má', 'dau ma', 'đậu mẹ', 'dau me',
  'mẹ mày', 'me may', 'mẹ nó', 'me no', 'mẹ kiếp', 'me kiep',
  'khốn nạn', 'khon nan', 'óc chó', 'oc cho', 'súc vật', 'suc vat',
  'rác rưởi', 'rac ruoi', 'con đĩ', 'con di', 'thằng chó', 'thang cho',
  'chó đẻ', 'cho de', 'chó chết', 'cho chet', 'đồ ngu', 'do ngu',
  'đồ chó', 'do cho', 'mất dạy', 'mat day', 'lũ khốn', 'lu khon',
  'địt mẹ', 'dit me', 'địt cụ', 'dit cu', 'địt bà', 'dit ba',
  'đéo mẹ', 'deo me', 'đéo thèm', 'deo them', 'ăn cặc', 'an cac',
  'ăn lồn', 'an lon', 'ăn buồi', 'an buoi', 'ăn cứt', 'an cut',
  'đĩ mẹ', 'di me', 'lồn mẹ', 'lon me', 'cặc mẹ', 'cac me',
  'đầu buồi', 'dau buoi', 'đầu cặc', 'dau cac', 'hãm lồn', 'ham lon', 'hãm lol', 'ham lol',
  'mặt lồn', 'mat lon', 'mặt cặc', 'mat cac', 'thằng khốn', 'thang khon',

  // Viết tắt / Acronyms / Slang
  'clgt', 'dcm', 'đcm', 'dkm', 'đkm', 'đmm', 'dmm', 'vcl', 'vkl', 'vcc', 'vlon', 'vloz',
  'vl', 'đm', 'dm', 'đjt', 'djt', 'd1t', 'đ1t', 'l0n', 'b0i', 'c4c', 'k4k', 'cc', 'cl',

  // Từ đơn có tính tục tĩu cao
  'địt', 'dit', 'đụ', 'lồn', 'lon', 'buồi', 'buoi', 'cặc', 'cac',
  'đéo', 'deo', 'đĩ', 'chịch', 'chich', 'đệt', 'det', 'đệch', 'dech',
  'đếch', 'dech', 'cứt', 'cut'
];

// Tạo các Regex ranh giới từ tiếng Việt linh hoạt
const COMPILED_PATTERNS: RegExp[] = PROFANITY_PHRASES.map((phrase) => {
  const chars = phrase.split('');
  let patternStr = '';
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === ' ') {
      patternStr += '[\\s._\\-]+';
    } else {
      const esc = c.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      patternStr += esc + '+';
      if (i < chars.length - 1 && chars[i + 1] !== ' ') {
        patternStr += '[\\s._\\-]*';
      }
    }
  }
  return new RegExp(`(^|[^${VIETNAMESE_LETTERS}])(${patternStr})($|[^${VIETNAMESE_LETTERS}])`, 'gi');
});

/**
 * Tự động che các từ ngữ thô tục, xúc phạm bằng dấu sao (***)
 */
export function censorText(text: string | null | undefined): string {
  if (!text) return '';
  let result = text;

  for (const regex of COMPILED_PATTERNS) {
    // Reset regex index if global
    regex.lastIndex = 0;
    result = result.replace(regex, (_, prefix, _matched, suffix) => {
      return prefix + '***' + suffix;
    });
  }

  return result;
}

/**
 * Kiểm tra xem chuỗi có chứa từ ngữ thô tục hay không
 */
export function containsProfanity(text: string | null | undefined): boolean {
  if (!text) return false;
  return censorText(text) !== text;
}

export default censorText;
