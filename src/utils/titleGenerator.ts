import { DEFAULT_CHAT_TITLE, TITLE_GENERATION_CONFIG } from '../constants';

/**
 * Utility to auto-generate concise, ChatGPT-style conversation titles
 * from the user's initial prompt.
 */
export function generateChatTitle(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return DEFAULT_CHAT_TITLE;

  // 1. Strip code blocks and raw markdown symbols
  let clean = prompt
    .replace(/```[\s\S]*?```/g, '') // remove multi-line code blocks
    .replace(/`[^`]+`/g, '')        // remove inline code blocks
    .replace(/[#*_~>[\]()]/g, '')   // remove markdown markers
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return DEFAULT_CHAT_TITLE;

  // 2. Strip conversational filler prefixes
  const fillerPrefixes = [
    /^(can you\s+(please\s+)?(tell me about\s+|explain\s+|write\s+|help me\s+(with\s+)?|give me\s+)?)/i,
    /^(could you\s+(please\s+)?(tell me about\s+|explain\s+|write\s+|help me\s+(with\s+)?|give me\s+)?)/i,
    /^(please\s+(tell me about\s+|explain\s+|write\s+|help me\s+(with\s+)?|give me\s+)?)/i,
    /^(i need you to\s+|i want you to\s+|i need help with\s+|help me with\s+|help me\s+)/i,
    /^(i need to\s+|i want to\s+)/i,
    /^(tell me about\s+|tell me\s+|explain to me\s+|explain\s+)/i,
    /^(how do i\s+|how can i\s+|how to\s+|what is\s+|what are\s+|why does\s+|why is\s+)/i,
    /^(write a\s+|write an\s+|write\s+|create a\s+|create an\s+|make a\s+|generate a\s+)/i,
  ];

  for (const prefix of fillerPrefixes) {
    clean = clean.replace(prefix, '').trim();
  }

  // If stripping left nothing, fall back to the cleaned original
  if (!clean) {
    clean = prompt.replace(/\s+/g, ' ').trim();
  }

  // 3. Take the first sentence or clause
  const firstClause = clean.split(/[.?!:\n;]/)[0].trim();
  const words = firstClause.split(/\s+/).filter(Boolean);

  if (words.length === 0) return DEFAULT_CHAT_TITLE;

  // 4. Take up to 5-6 words or max characters
  let selectedWords = words.slice(0, TITLE_GENERATION_CONFIG.MAX_WORDS);
  let candidate = selectedWords.join(' ');

  if (candidate.length > TITLE_GENERATION_CONFIG.MAX_CHAR_LENGTH) {
    candidate = candidate.slice(0, TITLE_GENERATION_CONFIG.MAX_CHAR_LENGTH).trim();
    const lastSpace = candidate.lastIndexOf(' ');
    if (lastSpace > TITLE_GENERATION_CONFIG.MIN_BACKSPACE_CUT) {
      candidate = candidate.slice(0, lastSpace);
    }
  }

  // 5. Title Case formatting (preserving lowercase for minor conjunctions/prepositions)
  const minorWords = new Set<string>(TITLE_GENERATION_CONFIG.MINOR_WORDS);
  const titleCased = candidate
    .split(' ')
    .map((word, idx) => {
      const lower = word.toLowerCase();
      // Keep acronyms/uppercase words like API, CSS, HTML intact
      if (word.length > 1 && word === word.toUpperCase()) {
        return word;
      }
      if (idx > 0 && minorWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  return titleCased || DEFAULT_CHAT_TITLE;
}
