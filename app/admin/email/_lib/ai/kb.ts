// Lightweight keyword retrieval: rank verified Knowledge articles by word
// overlap with the customer's message. Ported from newnei's Care kb.ts and
// adapted to Evercool's languages: English words score by token overlap; Thai
// has no word boundaries, so Thai runs in the query score by substring match.
// Good enough to ground the Draft button for a small knowledge base; swap for
// pgvector embeddings behind the same call if the base grows.

import type { KbArticle } from "@/app/admin/email/_lib/types";
import { classifyTopics, type TopicTagName } from "@/app/admin/email/_lib/support/classify";

// Multilingual bridge: when keyword scoring finds nothing (often a Thai message
// against an English article, or vice versa), fall back to the topic classifier
// (classify.ts already reads Thai and English) and match articles carrying that
// topic's anchor words. Best-effort; a miss just means the Draft writes a
// holding reply and a human answers from scratch.
const TOPIC_ANCHORS: Partial<Record<TopicTagName, RegExp>> = {
  Quote: /\b(quote|quotation|price|pricing)\b|ใบเสนอราคา|ราคา/i,
  Booking: /\b(booking|appointment|schedule|survey)\b|นัดหมาย|จองคิว/i,
  "Service & repair": /\b(repair|service|broken|leak|not cooling)\b|ซ่อม|น้ำหยด|ไม่เย็น/i,
  Installation: /\b(install|installation)\b|ติดตั้ง/i,
  Warranty: /\b(warranty|guarantee)\b|รับประกัน/i,
  Billing: /\b(invoice|receipt|billing|payment|tax)\b|ใบกำกับภาษี|ใบแจ้งหนี้|ชำระเงิน/i,
  "Filter change": /\b(filter)\b|ฟิลเตอร์|ไส้กรอง|ล้างแอร์/i,
  "Maintenance plan": /\b(maintenance|pm contract|preventive)\b|บำรุงรักษา|สัญญา/i,
  "Purchase order": /\b(purchase order|po)\b|ใบสั่งซื้อ/i,
  Shipping: /\b(shipping|delivery|freight|lead time)\b|จัดส่ง|ขนส่ง/i,
};

function topicFallback(query: string, articles: KbArticle[], limit: number): KbArticle[] {
  const topics = classifyTopics(query, "");
  if (topics.length === 0) return [];
  const anchors = topics.map((t) => TOPIC_ANCHORS[t]).filter(Boolean) as RegExp[];
  if (anchors.length === 0) return [];
  return articles
    .filter((a) => anchors.some((re) => re.test(`${a.title} ${a.body}`)))
    .slice(0, limit);
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "is",
  "are", "i", "you", "we", "it", "my", "me", "can", "do", "does", "have", "has",
  "with", "this", "that", "how", "what", "please", "hi", "hello", "thanks",
  "dear", "khun",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

// Thai character runs (3+ chars) in the text, for substring scoring.
function thaiRuns(text: string): string[] {
  return text.match(/[฀-๿]{3,}/g) ?? [];
}

export function retrieveRelevantArticles(
  query: string,
  articles: KbArticle[],
  limit = 3,
): KbArticle[] {
  const q = new Set(tokenize(query));
  const qThai = thaiRuns(query);
  if (q.size === 0 && qThai.length === 0) return articles.slice(0, limit);

  const scored = articles.map((article) => {
    const haystack = `${article.title} ${article.body}`;
    const words = tokenize(haystack);
    let score = 0;
    for (const w of words) if (q.has(w)) score += 1;
    // Title matches count double.
    for (const w of tokenize(article.title)) if (q.has(w)) score += 2;
    // Thai: each query run found in the article scores like a body word; found
    // in the title, like a title word.
    for (const run of qThai) {
      if (article.title.includes(run)) score += 3;
      else if (haystack.includes(run)) score += 1;
    }
    return { article, score };
  });

  // Require a real topical match (one title hit or three body-word overlaps) so
  // an uncovered question gets an honest holding reply instead of a confident
  // but wrong answer from a coincidental overlap.
  const keyword = scored
    .filter((s) => s.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
  if (keyword.length > 0) return keyword;

  // Keyword scoring found nothing (often a cross-language message): try the
  // topic bridge before handing off.
  return topicFallback(query, articles, limit);
}
