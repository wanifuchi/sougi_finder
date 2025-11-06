import { GoogleGenAI } from "@google/genai";
import type { SearchResult, GroundingChunk, QAndA } from '../types';

interface Position {
  latitude: number;
  longitude: number;
}

interface ParsedDetails {
    address?: string;
    phone?: string;
    rating?: number;
    reviewCount?: number;
    reviews?: string[];
    qanda?: QAndA[];
}


const parseDetailsFromMarkdown = (markdown: string): Map<string, ParsedDetails> => {
    const detailsMap = new Map<string, ParsedDetails>();
    if (!markdown) {
        return detailsMap;
    }

    // Split the text into sections, one for each funeral home, identified by '###'
    const sections = markdown.split('### ').slice(1);

    for (const section of sections) {
        const lines = section.split('\n');
        const title = lines[0]?.trim();
        if (!title) continue;

        const details: ParsedDetails = {
            reviews: [],
            qanda: [],
        };

        let currentQandA: Partial<QAndA> = {};
        let readingReviews = false;
        let readingQandA = false;

        for (const line of lines.slice(1)) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('- **住所:**')) {
                const value = trimmedLine.replace('- **住所:**', '').trim();
                if (value !== '情報なし') details.address = value;
                readingReviews = false; readingQandA = false;
            } else if (trimmedLine.startsWith('- **電話番号:**')) {
                const value = trimmedLine.replace('- **電話番号:**', '').trim();
                 if (value !== '情報なし') details.phone = value;
                readingReviews = false; readingQandA = false;
            } else if (trimmedLine.startsWith('- **評価:**')) {
                const ratingStr = trimmedLine.replace('- **評価:**', '').trim();
                const rating = parseFloat(ratingStr);
                if (!isNaN(rating)) details.rating = rating;
                readingReviews = false; readingQandA = false;
            } else if (trimmedLine.startsWith('- **レビュー数:**')) {
                const countStr = trimmedLine.replace('- **レビュー数:**', '').trim();
                const count = parseInt(countStr, 10);
                if (!isNaN(count)) details.reviewCount = count;
                readingReviews = false; readingQandA = false;
            } else if (trimmedLine.startsWith('- **口コミ:**')) {
                readingReviews = true;
                readingQandA = false;
            } else if (trimmedLine.startsWith('- **Q&A:**')) {
                readingReviews = false;
                readingQandA = true;
            } else if (readingReviews && trimmedLine.startsWith('- ')) {
                const reviewText = trimmedLine.substring(2).trim().replace(/^「|」$/g, '');
                if (reviewText !== '情報なし') {
                    details.reviews?.push(reviewText);
                }
            } else if (readingQandA && trimmedLine.startsWith('- **Q:**')) {
                // Save previous Q&A if complete
                if (currentQandA.question && currentQandA.answer) {
                    details.qanda?.push(currentQandA as QAndA);
                }
                const questionText = trimmedLine.replace('- **Q:**', '').trim();
                if (questionText !== '情報なし') {
                    currentQandA = { question: questionText };
                } else {
                    currentQandA = {}; // Reset if it is '情報なし'
                }
            } else if (readingQandA && trimmedLine.startsWith('- **A:**') && currentQandA.question) {
                currentQandA.answer = trimmedLine.replace('- **A:**', '').trim();
                details.qanda?.push(currentQandA as QAndA);
                currentQandA = {}; // Reset for the next pair
            }
        }

        // Add the last parsed Q&A if it exists
        if (currentQandA.question && currentQandA.answer) {
             details.qanda?.push(currentQandA as QAndA);
        }

        detailsMap.set(title, details);
    }

    return detailsMap;
}

export const searchFuneralHomes = async (
  query: string,
  position: Position | null
): Promise<SearchResult[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const contents = `「${query}」という検索クエリに合致する日本の**葬儀社または斎場のみ**を検索してください。レストラン、公園、その他の無関係な施設は**絶対に含めないでください**。

Googleマップで見つかった各施設について、以下の情報を厳密なフォーマットで提供してください。施設名は必ず三重のシャープ記号（###）で見出しとしてください。情報がない場合は「情報なし」と記載してください。

### [施設の正式名称]
- **住所:** [都道府県から始まる完全な住所]
- **電話番号:** [市外局番から始まる電話番号]
- **評価:** [5段階評価の数値]
- **レビュー数:** [レビューの件数]
- **口コミ:** (特に参考になるものを最大3件まで引用してください。各口コミは必ず、改行して「- 」から始まる独立した行として記述してください。口コミがない場合は、この項目に続く口コミの箇条書きは省略してください。)
- **Q&A:**
  - **Q:** [質問内容1]
  - **A:** [回答内容1]

これを、見つかった全ての施設について繰り返してください。`;

  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (position) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: position.latitude,
          longitude: position.longitude,
        },
      },
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config,
  });

  console.log("--- Gemini API Raw Text Response ---");
  console.log(response.text);
  console.log("------------------------------------");

  const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const detailsMap = parseDetailsFromMarkdown(response.text);
  
  console.log(`[Data Processor] Parsed details map contains ${detailsMap.size} items.`);

  const places: SearchResult[] = groundingChunks
    .filter(chunk => chunk.maps && chunk.maps.uri && chunk.maps.title)
    .map(chunk => {
        const title = chunk.maps!.title;
        const matchingKey = Array.from(detailsMap.keys()).find(key => {
            const normalizedKey = key.replace(/[\s\u3000]/g, '');
            const normalizedTitle = title.replace(/[\s\u3000]/g, '');
            return normalizedKey === normalizedTitle || normalizedKey.includes(normalizedTitle) || normalizedTitle.includes(normalizedKey);
        });
        const details = matchingKey ? detailsMap.get(matchingKey) : undefined;
        
        return {
            title: title,
            uri: chunk.maps!.uri,
            address: details?.address,
            phone: details?.phone,
            rating: details?.rating,
            reviewCount: details?.reviewCount,
            reviews: details?.reviews,
            qanda: details?.qanda,
        }
    });

  return places;
};