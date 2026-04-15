import { FastifyReply, FastifyRequest } from 'fastify';
import { SeoService } from './seo.service';

export class SeoController {
  constructor(private seoService: SeoService) {}

  async get(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const seo = await this.seoService.getOrCreate(portfolio.id);
    return reply.send(seo);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const body = request.body as {
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
    };

    const seo = await this.seoService.upsert(portfolio.id, body);
    return reply.send(seo);
  }

  async uploadOgImage(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    const result = await this.seoService.uploadOgImage(
      portfolio.id,
      data.filename,
      await data.toBuffer(),
      data.mimetype
    );

    return reply.send(result);
  }

  async analyze(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const analysis = await this.seoService.analyze(portfolio.id);
    return reply.send(analysis);
  }
}
