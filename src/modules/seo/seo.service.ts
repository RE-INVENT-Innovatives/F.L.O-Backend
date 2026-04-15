import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors';
import { AiService } from '../ai/ai.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class SeoService {
  private genAI: GoogleGenerativeAI;
  
  constructor(private prisma: PrismaClient) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'NO_KEY');
  }

  async getSeoSettings(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      include: { seoSettings: true },
    });
    
    if (!portfolio) throw new AppError('Portfolio not found', 404);
    
    return portfolio.seoSettings || {};
  }

  async upsertSeoSettings(userId: string, data: any) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    
    if (!portfolio) throw new AppError('Portfolio not found', 404);

    return this.prisma.seoSettings.upsert({
      where: { portfolioId: portfolio.id },
      create: { ...data, portfolioId: portfolio.id },
      update: data,
    });
  }

  async analyzeSeo(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      include: { seoSettings: true, education: true, experience: true },
    });
    
    if (!portfolio) throw new AppError('Portfolio not found', 404);
    
    const { seoSettings } = portfolio;
    if (!seoSettings) throw new AppError('SEO settings not found', 400);

    const prompt = `You are an expert SEO and ATS consultant. Evaluate a portfolio's SEO settings and basic custom data to provide a comprehensive analysis.

Portfolio SEO data:
Title: ${seoSettings.metaTitle}
Description: ${seoSettings.metaDescription}
Keywords: ${seoSettings.keywords?.join(', ')}

Portfolio User Profile Data:
Bio: ${portfolio.customBio}
Skills: ${portfolio.skills?.join(', ')}

Return ONLY a raw JSON object with this exact structure (all scores 0-100):
{"overall":0,"titleScore":0,"descriptionScore":0,"keywordsScore":0,"atsScore":0,"suggestions":["suggestion 1"],"strengths":["strength 1"]}
    `;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const content = (await result.response).text().trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '');
        
      return JSON.parse(content);
    } catch (err: any) {
      throw new AppError(`SEO Analysis failed: ${err.message}`, 500);
    }
  }
}
