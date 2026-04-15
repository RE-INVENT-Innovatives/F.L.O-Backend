import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class SeoService {
  constructor(
    private prisma: PrismaClient,
    private geminiKey?: string
  ) {}

  async getOrCreate(portfolioId: string) {
    let seo = await this.prisma.seoSettings.findUnique({
      where: { portfolioId },
    });

    if (!seo) {
      seo = await this.prisma.seoSettings.create({
        data: { portfolioId },
      });
    }

    return seo;
  }

  async upsert(portfolioId: string, data: {
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageUrl?: string;
    keywords?: string[];
    canonicalUrl?: string;
    twitterCard?: string;
    twitterSite?: string;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
  }) {
    return this.prisma.seoSettings.upsert({
      where: { portfolioId },
      update: data,
      create: {
        portfolioId,
        ...data,
      },
    });
  }

  async uploadOgImage(portfolioId: string, filename: string, buffer: Buffer, mimetype: string) {
    // For simplicity, save locally. Can be extended to use Supabase like asset service.
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'seo');
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const ext = path.extname(filename);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);
    
    await fs.writeFile(filePath, buffer);
    const url = `/uploads/seo/${uniqueFilename}`;

    await this.prisma.seoSettings.update({
      where: { portfolioId },
      data: { ogImageUrl: url },
    });

    return { url };
  }

  async analyze(portfolioId: string) {
    const seo = await this.getOrCreate(portfolioId);
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { user: true },
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    if (!this.geminiKey) {
      throw new AppError('Gemini API key not configured', 500);
    }

    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are an SEO expert. Analyze the following SEO settings and portfolio data.

SEO Settings:
- Meta Title: "${seo.metaTitle || ''}"
- Meta Description: "${seo.metaDescription || ''}"
- OG Title: "${seo.ogTitle || ''}"
- OG Description: "${seo.ogDescription || ''}"
- Keywords: ${JSON.stringify(seo.keywords || [])}
- Twitter Card: "${seo.twitterCard || ''}"
- Robots Index: ${seo.robotsIndex}
- Robots Follow: ${seo.robotsFollow}

Portfolio Data:
- Name: "${portfolio.user.name}"
- Custom Bio: "${portfolio.customBio || ''}"
- Skills: ${JSON.stringify(portfolio.skills || [])}

Provide a JSON response with this exact structure (no markdown, no code fences):
{
  "overall": number (0-100),
  "titleScore": number (0-100),
  "descriptionScore": number (0-100),
  "keywordsScore": number (0-100),
  "atsScore": number (0-100),
  "suggestions": string[],
  "strengths": string[]
}

Scoring guidelines:
- titleScore: Evaluate if metaTitle is present, 50-60 chars, includes name/key skills
- descriptionScore: Evaluate if metaDescription is present, 150-160 chars, compelling
- keywordsScore: Evaluate if relevant keywords are present (at least 5)
- atsScore: Evaluate ATS-friendliness based on skills, bio completeness
- overall: Weighted average of all scores

Return ONLY the JSON object.
`;

    try {
      const result = await model.generateContent(prompt);
      const content = (await result.response).text().trim();
      
      // Strip markdown fences if present
      const cleaned = content
        .replace(/^```(?:json)?\s*/, '')
        .replace(/\s*```\s*$/, '')
        .trim();

      const analysis = JSON.parse(cleaned);
      return analysis;
    } catch (err: any) {
      console.error('SEO Analysis error:', err);
      throw new AppError(`AI Analysis failed: ${err.message}`, 500);
    }
  }
}
