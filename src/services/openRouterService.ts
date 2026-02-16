
import { Source, StudyMaterialType, ChatConfig } from "../types";

export interface QuizConfig {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface FlashcardConfig {
  cardCount: 'less' | 'standard' | 'more';
  style: 'concepts' | 'definitions' | 'qa';
  topic?: string;
}

export interface PresentationConfig {
  slideCount: 'short' | 'standard' | 'detailed';
  audience: 'general' | 'professional' | 'academic';
  topic?: string;
}

export interface InfographicConfig {
  style: 'minimalist' | 'detailed' | 'vibrant';
  layout: '1:1' | '9:16' | '16:9';
  topic?: string;
}

export interface MindMapConfig {
  complexity: 'simple' | 'standard' | 'complex';
  topic?: string;
}

export type AnyAIConfig = QuizConfig | FlashcardConfig | PresentationConfig | InfographicConfig | MindMapConfig;

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: any;
};

export class OpenRouterService {
  private readonly baseUrl = "https://openrouter.ai/api/v1";
  private readonly textModel = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  private readonly visionModel = process.env.OPENROUTER_VISION_MODEL || this.textModel;
  private readonly imageModel = process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-image-1";

  // Tool-specific model mapping (OpenRouter slugs). UIga chiqmaydi.
  private readonly toolModels = {
    chat: process.env.OPENROUTER_MODEL_CHAT || "anthropic/claude-sonnet-4.5",
    urlAnalysis: process.env.OPENROUTER_MODEL_URL || "anthropic/claude-sonnet-4.5",
    quiz: process.env.OPENROUTER_MODEL_QUIZ || "openai/gpt-5",
    flashcard: process.env.OPENROUTER_MODEL_FLASHCARD || "openai/gpt-5",
    mindmap: process.env.OPENROUTER_MODEL_MINDMAP || "google/gemini-2.5-pro",
    presentation: process.env.OPENROUTER_MODEL_PRESENTATION || "anthropic/claude-sonnet-4.5",
    reminders: process.env.OPENROUTER_MODEL_REMINDERS || "anthropic/claude-sonnet-4.5",
    vision: process.env.OPENROUTER_MODEL_VISION || this.visionModel
  } as const;

  private isDemoMode(): boolean {
    const envDemo = String(process.env.DEMO_MODE || "").toLowerCase() === "true";
    const localDemo =
      typeof window !== "undefined"
        ? (window.localStorage.getItem("DEMO_MODE") || "").toLowerCase() === "true"
        : false;
    return envDemo || localDemo;
  }

  private getApiKey() {
    if (this.isDemoMode()) return "demo-key";
    const localKey =
      typeof window !== "undefined"
        ? window.localStorage.getItem("OPENROUTER_API_KEY") || ""
        : "";
    const key = process.env.OPENROUTER_API_KEY || process.env.API_KEY || localKey;
    if (!key) {
      throw new Error("OPENROUTER_API_KEY topilmadi.");
    }
    return key;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.getApiKey()}`,
      "Content-Type": "application/json"
    };
  }

  private cleanJsonResponse(text: string): string {
    if (!text) return '{}';
    let cleaned = text.trim();
    
    // RegExp constructor avoids potential parser issues with backticks in literals
    const jsonBlockStart = new RegExp('^```json\\s*', 'i');
    const jsonBlockEnd = new RegExp('\\s*```$', 'g');
    
    cleaned = cleaned.replace(jsonBlockStart, '').replace(jsonBlockEnd, '').trim();
    
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (e) {
      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      const startIdx = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
      
      const lastBrace = cleaned.lastIndexOf('}');
      const lastBracket = cleaned.lastIndexOf(']');
      const endIdx = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
      }
      return cleaned;
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const errorMsg = err?.message || "";
      const isRateLimit = errorMsg.includes("429") || errorMsg.toLowerCase().includes("rate");
      if (retries > 0 && isRateLimit) {
        await new Promise(res => setTimeout(res, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw err;
    }
  }

  private async callChat(messages: OpenRouterMessage[], model: string, temperature = 0.2): Promise<string> {
    return this.withRetry(async () => {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          temperature
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenRouter chat xatoligi (${res.status}): ${errorText}`);
      }

      const data: any = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        return content.map((part: any) => part?.text || "").join("\n").trim();
      }
      return "";
    });
  }

  private async callChatWithFallback(
    messages: OpenRouterMessage[],
    preferredModel: string,
    temperature = 0.2
  ): Promise<string> {
    const candidates = Array.from(new Set([preferredModel, this.textModel])).filter(Boolean);
    let lastErr: unknown;
    for (const model of candidates) {
      try {
        return await this.callChat(messages, model, temperature);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Model chaqirig'ida xatolik yuz berdi.");
  }

  private async callImage(prompt: string, size = "1024x1024"): Promise<string> {
    const res = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.imageModel,
        prompt,
        size
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter image xatoligi (${res.status}): ${errorText}`);
    }

    const data: any = await res.json();
    const first = data?.data?.[0];
    if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
    if (first?.url) return first.url;
    throw new Error("Image javobi bo'sh qaytdi.");
  }

  private buildChatInstruction(chatConfig?: ChatConfig): string {
    const roleMap: Record<string, string> = {
      default: "Siz tadqiqot yordamchisisiz.",
      tutor: "Siz repetitor sifatida bosqichma-bosqich tushuntirasiz.",
      custom: chatConfig?.customGoalText || "Siz foydalanuvchi maqsadiga mos javob berasiz."
    };

    const lengthMap: Record<string, string> = {
      default: "Javob uzunligi: standart.",
      longer: "Javob uzunligi: batafsilroq.",
      shorter: "Javob uzunligi: qisqaroq."
    };

    return `${roleMap[chatConfig?.goal || "default"]} Faqat o'zbek tilida javob bering. Berilgan manbalardan uzoqlashmang, taxminni taxmin deb belgilang, muhim nuqtalarni aniq va qisqa bayon qiling. ${lengthMap[chatConfig?.responseLength || "default"]}`;
  }

  private getDemoImage(title: string): string {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#1f2937"/>
            <stop offset="100%" stop-color="#0ea5e9"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <text x="50%" y="45%" text-anchor="middle" fill="#ffffff" font-size="48" font-family="Arial">DEMO MODE</text>
        <text x="50%" y="53%" text-anchor="middle" fill="#dbeafe" font-size="30" font-family="Arial">${title}</text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private getDemoStudyMaterial(type: StudyMaterialType, config?: AnyAIConfig): any {
    const topic = (config as any)?.topic || "Demo mavzu";
    if (type === "quiz") {
      return {
        title: `Demo Test: ${topic}`,
        questions: [
          {
            question: "Demo rejimining asosiy vazifasi nima?",
            options: ["UI va oqimni API'siz tekshirish", "Faqat internet tezligini sinash", "Faqat dizayn ranglarini almashtirish", "Ma'lumotlarni serverga yuklash"],
            correctAnswerIndex: 0,
            optionExplanations: ["To'g'ri: demo rejim real API chaqirmasdan jarayonni tekshiradi.", "Noto'g'ri: demo rejimi internet test vositasi emas.", "Noto'g'ri: demo rejimi faqat rang uchun emas.", "Noto'g'ri: demo rejimi serverga majburiy yuklamaydi."],
            explanation: "Demo rejimi UI, state va user flow'ni xavfsiz va tez sinashga xizmat qiladi."
          },
          {
            question: "Mock javoblar qachon ishlaydi?",
            options: ["DEMO_MODE=true yoqilganda", "Faqat DEBUG=true bo'lganda", "Faqat internet bo'lmaganda", "Faqat PDF yuklanganda"],
            correctAnswerIndex: 1,
            optionExplanations: ["Noto'g'ri: bu parametr demo uchun asosiy trigger emas.", "To'g'ri: demo switch `DEMO_MODE=true` bilan yoqiladi.", "Noto'g'ri: internetdan qat'i nazar ishlaydi.", "Noto'g'ri: kontent turiga bog'liq emas."],
            explanation: "Demo rejim markazlashgan flag orqali boshqariladi."
          },
          {
            question: "Nega demo rejim foydali?",
            options: ["Tez test va arzon prototiplash uchun", "Faqat backend loglarini ko'paytirish uchun", "Faqat foydalanuvchini bloklash uchun", "Faqat marketing bannerlari uchun"],
            correctAnswerIndex: 0,
            optionExplanations: ["To'g'ri: API xarajatisiz tez iteratsiya qilish mumkin.", "Noto'g'ri: bu demo rejim maqsadi emas.", "Noto'g'ri: demo rejim bloklashga xizmat qilmaydi.", "Noto'g'ri: banner bilan bog'liq emas."],
            explanation: "Demo rejim development vaqtini qisqartiradi va testni soddalashtiradi."
          },
          {
            question: "Demo natijalar bilan ishlaganda qaysi qoidaga amal qilish kerak?",
            options: ["Muhim qaror uchun manbani albatta tekshirish", "Har javobni 100% haqiqat deb qabul qilish", "Faqat bir marta ko'rib chiqish", "Tekshiruvsiz eksport qilish"],
            correctAnswerIndex: 0,
            optionExplanations: ["To'g'ri: demo kontent didaktik maqsadga ega, fakt-check zarur.", "Noto'g'ri: demo javoblar test maqsadida.", "Noto'g'ri: qayta tekshiruv kerak.", "Noto'g'ri: tekshiruvsiz foydalanish xavfli."],
            explanation: "AI va demo natijalarni har doim manba bilan solishtirish tavsiya etiladi."
          }
        ]
      };
    }
    if (type === "flashcard") {
      return {
        title: `Demo Kartochkalar: ${topic}`,
        cards: [
          { question: "Demo rejim nima?", answer: "Real API chaqirmasdan mock javoblar bilan ishlash rejimi." },
          { question: "Demo rejimda nima sinovdan o'tadi?", answer: "Interfeys, navigatsiya oqimi, state almashinuvi va eksport funksiyalari." },
          { question: "Qanday yoqiladi?", answer: "Sozlamalardagi Demo tugmasi yoki DEMO_MODE=true orqali yoqiladi." },
          { question: "Qachon ishlatish foydali?", answer: "API kalit bo'lmaganda, tez prototiplash va UI test paytida." },
          { question: "Qanday cheklovi bor?", answer: "Kontent real model sifati bilan bir xil bo'lmasligi mumkin." },
          { question: "Demo natijaga ishonch darajasi?", answer: "Past-o'rta: muhim faktlar uchun manba bilan tekshirish kerak." },
          { question: "Nega fallback kerak?", answer: "Model xatolarida xizmat uzluksiz ishlashi uchun." },
          { question: "OpenRouter API nima beradi?", answer: "Turli modelga bitta API orqali kirish va routing imkonini beradi." }
        ]
      };
    }
    if (type === "mindmap") {
      return {
        title: `Demo Mindmap: ${topic}`,
        rootNode: {
          label: "Demo Rejim Arxitekturasi",
          children: [
            {
              label: "Asosiy Maqsad",
              children: [
                { label: "API'siz test" },
                { label: "Tez iteratsiya" },
                { label: "Barqaror UX tekshiruvi" }
              ]
            },
            {
              label: "Sinov Obyektlari",
              children: [
                { label: "Chat oqimi" },
                { label: "Manba qo'shish" },
                { label: "Quiz / Flashcard / Mindmap" },
                { label: "Taqdimot / Infografika" }
              ]
            },
            {
              label: "Xavfsizlik va Sifat",
              children: [
                { label: "Fakt-check talab qilinadi" },
                { label: "Mock natija aniq ko'rsatiladi" },
                { label: "Fallback strategiyasi" }
              ]
            }
          ]
        }
      };
    }
    if (type === "presentation") {
      return {
        title: `Demo Taqdimot: ${topic}`,
        slides: [
          { title: "Demo Rejimga Kirish", content: ["Real API chaqiruvsiz sinov", "UI va oqimni tez tekshirish", "Arzon prototiplash imkoniyati"], imageUrl: this.getDemoImage("Demo Rejimga Kirish") },
          { title: "Asosiy Afzalliklar", content: ["Tez ishga tushirish", "Xarajatni kamaytirish", "Yangi funksiyalarni xavfsiz tekshirish"], imageUrl: this.getDemoImage("Asosiy Afzalliklar") },
          { title: "Texnik Jarayon", content: ["Mock javoblar qaytariladi", "Tool bo'yicha alohida promptlar", "Model fallback strategiyasi"], imageUrl: this.getDemoImage("Texnik Jarayon") },
          { title: "Sifat Nazorati", content: ["Javoblar o'zbek tilida", "Formatga qat'iy rioya", "Muqobil xatolik holatlari"], imageUrl: this.getDemoImage("Sifat Nazorati") },
          { title: "Cheklovlar", content: ["Real model darajasiga teng emas", "Kontent sun'iy bo'lishi mumkin", "Muhim qarorda tekshiruv shart"], imageUrl: this.getDemoImage("Cheklovlar") },
          { title: "Xulosa", content: ["Demo - tez va qulay test rejimi", "Ishlab chiqishda juda foydali", "Production uchun real API tavsiya etiladi"], imageUrl: this.getDemoImage("Xulosa") }
        ]
      };
    }
    return { title: `Demo: ${topic}`, content: "Demo content" };
  }

  async analyzeMediaSource(base64Data: string, mimeType: string, fileName: string): Promise<string> {
    if (this.isDemoMode()) {
      return `DEMO tahlil: "${fileName}" fayli muvaffaqiyatli qabul qilindi. Tur: ${mimeType}. Bu mock javob.`;
    }

    const prompt = `Quyidagi faylni tahlil qiling: "${fileName}".
Talablar:
- Faqat o'zbek tilida yozing.
- Muhim faktlar, sanalar, atamalar va xulosalarni ajrating.
- Keraksiz umumiy gaplardan saqlaning.
- Yakunda 3-7 bandli qisqa xulosa bering.`;

    if (!mimeType.startsWith("image/")) {
      return "OpenRouter brauzer rejimida hozircha rasm bo'lmagan fayllarni (masalan, PDF) bevosita tahlil qilish cheklangan.";
    }

    const text = await this.callChat(
      [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ]
        }
      ],
      this.toolModels.vision,
      0.2
    );
    return text || "Faylni tahlil qilib bo'lmadi.";
  }

  async analyzeUrlSource(url: string): Promise<{ title: string, content: string }> {
    if (this.isDemoMode()) {
      return {
        title: `Demo URL: ${url}`,
        content: "Bu demo rejim javobi. URL mazmuni mock tarzda tayyorlandi."
      };
    }

    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const readableUrl = `https://r.jina.ai/http://${normalizedUrl.replace(/^https?:\/\//i, "")}`;
    let pageText = "";

    try {
      const fetched = await fetch(readableUrl);
      if (fetched.ok) {
        pageText = (await fetched.text()).slice(0, 20000);
      }
    } catch {
      pageText = "";
    }

    const prompt = `URL tahlili: ${normalizedUrl}. Sahifadagi asosiy mazmunni tahlil qiling. Faqat o'zbek tilida yozing. Javobni quyidagi formatda qaytaring:
TITLE: [Sarlavha]
CONTENT: [Tahlil]`;

    try {
      const text = await this.callChatWithFallback(
        [
          { role: "system", content: "Siz URL kontent tahlilchisisiz. Faqat o'zbek tilida va faqat so'ralgan formatda qaytaring." },
          {
            role: "user",
            content: `${prompt}\n\nSAHIFA MATNI:\n${pageText || "Sahifa matni olinmadi. URL va ehtimoliy mazmun asosida javob bering."}`
          }
        ],
        this.toolModels.urlAnalysis,
        0.1
      );
      
      const titleRegex = new RegExp('TITLE:\\s*(.*)', 'i');
      const contentRegex = new RegExp('CONTENT:\\s*([\\s\\S]*)', 'i');
      
      const titleMatch = text.match(titleRegex);
      const contentMatch = text.match(contentRegex);
      
      return { 
        title: titleMatch ? titleMatch[1].trim() : normalizedUrl, 
        content: contentMatch ? contentMatch[1].trim() : (text || "Tahlil xatosi.")
      };
    } catch (err) {
      return { title: normalizedUrl, content: "Xatolik yuz berdi." };
    }
  }

  async chatWithSources(messages: any[], sources: Source[], chatConfig?: ChatConfig): Promise<string> {
    if (this.isDemoMode()) {
      const lastUser = [...messages].reverse().find(m => m.role === "user")?.text || "Savol";
      return `DEMO javob: "${lastUser}" bo'yicha mock tahlil tayyorlandi. Aktiv manbalar soni: ${sources.length}.`;
    }

    const context = sources.length > 0 ? `KONTEKST:\n${sources.map(s => `[${s.name}]\n${s.content}`).join('\n\n').slice(0, 15000)}` : '';
    const payload: OpenRouterMessage[] = [
      { role: "system", content: this.buildChatInstruction(chatConfig) },
      { role: "user", content: context || "Kontekst yo'q." },
      ...messages.map((m): OpenRouterMessage => {
        const role: OpenRouterMessage["role"] =
          m?.role === "system" ? "system" : m?.role === "user" ? "user" : "assistant";
        return {
          role,
          content: m?.text ?? ""
        };
      })
    ];
    const text = await this.callChatWithFallback(payload, this.toolModels.chat, 0.3);
    return text || "Xatolik yuz berdi.";
  }

  async generateSlideImage(slideTitle: string, slideContent: string[]): Promise<string> {
    if (this.isDemoMode()) {
      return this.getDemoImage(`Slide: ${slideTitle}`);
    }

    const prompt = `16:9 formatdagi professional o'quv slaydi yarating.
Sarlavha: "${slideTitle}"
Asosiy bandlar: ${slideContent.join(", ")}
Talablar:
- Matn faqat o'zbek tilida bo'lsin.
- Dizayn toza, o'qilishi oson, kontrast yuqori bo'lsin.
- Keraksiz bezak, watermark yoki ortiqcha logo bo'lmasin.
- Slayd real taqdimotga tayyor ko'rinishda bo'lsin.`;
    try {
      const fullPrompt = `${prompt}\nAsosiy bandlar: ${slideContent.join(", ")}`;
      return await this.callImage(fullPrompt, "1536x1024");
    } catch (err) {
      return "";
    }
  }

  async generateStudyMaterial(type: StudyMaterialType, sources: Source[], config?: AnyAIConfig): Promise<any> {
    if (this.isDemoMode()) {
      return this.getDemoStudyMaterial(type, config);
    }

    const context = sources.length > 0 ? `KONTEKST:\n${sources.map(s => `[${s.name}]\n${s.content}`).join('\n\n').slice(0, 15000)}` : '';
    
    let prompt = "";

    if (type === 'quiz') {
      const c = config as QuizConfig;
      prompt = `Berilgan kontekst asosida faqat o'zbek tilida ${c?.questionCount || 10} ta test savoli tuzing. Qiyinchilik: ${c?.difficulty || 'medium'}. 
      ${c?.topic ? `Fokus mavzu: ${c.topic}` : ''}
      MUHIM: 
      1. To'g'ri javoblar variantlar (0, 1, 2, 3) orasida tasodifiy taqsimlansin.
      2. "optionExplanations" maydonida har bir variant uchun alohida, aniq va qisqa tushuntirish bering.
      3. Savollar manbaga tayanib, takrorlanmasin va imlo jihatdan toza bo'lsin.`;
    } else if (type === 'flashcard') {
      const c = config as FlashcardConfig;
      const count = c?.cardCount === 'less' ? 10 : c?.cardCount === 'more' ? 25 : 15;
      const styles = {
        concepts: "asosiy tushunchalar va ularning qisqa mohiyati",
        definitions: "terminlar va ularning aniq ta'riflari",
        qa: "savol va javob shaklida (imtihonga tayyorgarlik uchun)"
      };
      
      prompt = `Berilgan kontekst asosida faqat o'zbek tilida ${count} ta o'quv kartochkasi (flashcards) tuzing. 
      Uslub: ${styles[c?.style || 'concepts']}. 
      ${c?.topic ? `Fokus mavzu: ${c.topic}` : ''}
      Kartochkalar o'rganishni osonlashtiradigan darajada qisqa, lo'nda va aniq bo'lsin.
      Javoblar amaliy va tushunarli bo'lsin.`;
    } else if (type === 'mindmap') {
      const c = config as MindMapConfig;
      const level = c?.complexity === 'simple' ? "oddiy va tushunarli" : c?.complexity === 'complex' ? "murakkab va har bir qism chuqur yoritilgan" : "standart";
      
      prompt = `Berilgan kontekst asosida faqat o'zbek tilida ${level} darajadagi aqliy xarita (mind map) iyerarxiyasini tuzing. 
      ${c?.topic ? `Fokus mavzu: ${c.topic}` : ''}
      Markaziy g'oya (rootNode) dan boshlab, mantiqiy tarmoqlarni tuzing. Har bir tugun (label) majburiy bo'lsin.
      Tuzilma daraxt shaklida, aniq va takrorlarsiz bo'lsin.`;
    } else if (type === 'presentation') {
      const c = config as PresentationConfig;
      const slideCount = c?.slideCount === 'short' ? 5 : c?.slideCount === 'detailed' ? 15 : 10;
      const audiences = {
        general: "oddiy va hamma tushunadigan tilda",
        professional: "ishbilarmonlik va texnik tilda, faktlarga boy",
        academic: "akademik va chuqur tahliliy tilda, ilmiy yondashuv bilan"
      };

      prompt = `Berilgan kontekst asosida faqat o'zbek tilida ${slideCount} ta slayddan iborat taqdimot rejasi va mazmunini tayyorlang. 
      Auditoriya: ${audiences[c?.audience || 'general']}. 
      ${c?.topic ? `Fokus mavzu: ${c.topic}` : ''}
      Har bir slayd sarlavha va 3-5 ta asosiy banddan iborat bo'lsin.
      Bandlar qisqa, mazmunli va taqdimotga tayyor bo'lsin.`;
    }

    const jsonTemplateMap: Record<StudyMaterialType, string> = {
      quiz: `{"title":"...","questions":[{"question":"...","options":["...","...","...","..."],"correctAnswerIndex":0,"optionExplanations":["...","...","...","..."],"explanation":"..."}]}`,
      flashcard: `{"title":"...","cards":[{"question":"...","answer":"..."}]}`,
      mindmap: `{"title":"...","rootNode":{"label":"...","children":[{"label":"...","children":[{"label":"..."}]}]}}`,
      presentation: `{"title":"...","slides":[{"title":"...","content":["...","...","..."]}]}`,
      infographic: `{"title":"Infografika","content":"Visual output expected"}`,
      reminders: `{"title":"Eslatma","content":"..."}`
    };

    const modelByType: Record<StudyMaterialType, string> = {
      quiz: this.toolModels.quiz,
      flashcard: this.toolModels.flashcard,
      mindmap: this.toolModels.mindmap,
      presentation: this.toolModels.presentation,
      infographic: this.toolModels.presentation,
      reminders: this.toolModels.reminders
    };

    const responseText = await this.callChatWithFallback(
      [
        {
          role: "system",
          content: "Siz JSON generatorisiz. Faqat JSON qaytaring, izoh yoki markdown ishlatmang. JSON ichidagi barcha matnlar faqat o'zbek tilida bo'lsin."
        },
        {
          role: "user",
          content: `${context}\n\n${prompt}\n\nQuyidagi JSON strukturaga aniq mos qaytaring:\n${jsonTemplateMap[type]}`
        }
      ],
      modelByType[type] || this.textModel,
      0.2
    );

    try {
      const cleaned = this.cleanJsonResponse(responseText || "{}");
      const parsed = JSON.parse(cleaned);

      if (type === 'presentation' && Array.isArray(parsed?.slides)) {
        const slidesWithImages = await Promise.all(
          parsed.slides.map(async (slide: any, index: number) => {
            const title = typeof slide?.title === "string" && slide.title.trim()
              ? slide.title.trim()
              : `Slayd ${index + 1}`;
            const content = Array.isArray(slide?.content)
              ? slide.content.map((item: any) => String(item))
              : [];
            const imageUrl = await this.generateSlideImage(title, content);
            return {
              ...slide,
              title,
              content,
              imageUrl: imageUrl || slide?.imageUrl || ""
            };
          })
        );
        return { ...parsed, slides: slidesWithImages };
      }

      return parsed;
    } catch (e) {
      throw new Error("Generatsiya jarayonida xatolik yuz berdi.");
    }
  }

  async generateInfographicImage(sources: Source[], config: InfographicConfig): Promise<string> {
    if (this.isDemoMode()) {
      return this.getDemoImage(`Infografika: ${config.topic || "Demo"}`);
    }

    const context = sources.length > 0 ? sources.map(s => s.content).join("\n\n").slice(0, 4000) : "No context";
    const prompt = `Quyidagi mavzu bo'yicha professional o'quv infografika yarating.
Mavzu: ${config.topic || 'material'}
Uslub: ${config.style}
Talablar:
- Barcha matnlar faqat o'zbek tilida bo'lsin.
- Matnlar qisqa, o'qilishi oson va aniq bo'lsin.
- Kuchli vizual ierarxiya bo'lsin (sarlavha -> bo'lim -> qisqa izoh).
- Dizayn toza va zamonaviy bo'lsin.

Kontekst:
${context}`;

    const sizeMap: Record<InfographicConfig["layout"], string> = {
      "1:1": "1024x1024",
      "9:16": "1024x1536",
      "16:9": "1536x1024"
    };

    try {
      return await this.callImage(prompt, sizeMap[config.layout] || "1024x1536");
    } catch (e: any) {
      throw new Error(e?.message || "Infografika yaratib bo'lmadi.");
    }
  }
}

export const openRouterService = new OpenRouterService();

