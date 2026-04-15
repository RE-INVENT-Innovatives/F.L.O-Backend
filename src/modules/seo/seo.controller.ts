import { FastifyReply, FastifyRequest } from 'fastify';
import { SeoService } from './seo.service';
import { AppError } from '../../utils/errors';
import fs from 'fs/promises';
import path from 'path';

export class SeoController {
  constructor(private seoService: SeoService) {}

  async getSettings(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.seoService.getSeoSettings(userId);
    return reply.send(result);
  }

  async upsertSettings(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.seoService.upsertSeoSettings(userId, request.body);
    return reply.send(result);
  }

  async analyze(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.seoService.analyzeSeo(userId);
    return reply.send(result);
  }

  async uploadOgImage(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    if (!data) throw new AppError('No image uploaded', 400);

    // Simplistic local storage for now (should ideally go to Supabase/S3)
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(publicDir, { recursive: true });
    
    const filename = `${Date.now()}-${data.filename}`;
    const filePath = path.join(publicDir, filename);
    
    const buffer = await data.toBuffer();
    await fs.writeFile(filePath, buffer);
    
    const url = `/uploads/${filename}`;
    return reply.send({ url });
  }
}
