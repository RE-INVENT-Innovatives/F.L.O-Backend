import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors';

export class TestimonialService {
  constructor(private prisma: PrismaClient) {}

  async getAll(userId: string) {
    return this.prisma.testimonial.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(userId: string, data: any) {
    return this.prisma.testimonial.create({
      data: {
        userId,
        name: data.name,
        role: data.role,
        content: data.content,
        avatarUrl: data.avatarUrl,
        isFeatured: data.isFeatured ?? false,
        isApproved: true, // Admin created are approved by default
        caseStudyUrl: data.caseStudyUrl
      }
    });
  }

  async createPublic(username: string, data: any) {
    const profile = await this.prisma.githubProfile.findFirst({
      where: { githubLogin: username },
      select: { userId: true }
    });

    if (!profile) {
      throw new AppError('User not found', 404);
    }

    return this.prisma.testimonial.create({
      data: {
        userId: profile.userId,
        name: data.name,
        role: data.role,
        content: data.content,
        avatarUrl: data.avatarUrl,
        isFeatured: false,
        isApproved: false, // Must be approved by user
        caseStudyUrl: data.caseStudyUrl
      }
    });
  }

  async approve(id: string, userId: string) {
    const existing = await this.prisma.testimonial.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new AppError('Testimonial not found', 404);
    }

    return this.prisma.testimonial.update({
      where: { id },
      data: { isApproved: true }
    });
  }

  async getPublic(username: string) {
    const profile = await this.prisma.githubProfile.findFirst({
      where: { githubLogin: username },
      select: { userId: true }
    });

    if (!profile) {
      throw new AppError('User not found', 404);
    }

    return this.prisma.testimonial.findMany({
      where: { 
        userId: profile.userId,
        isApproved: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, userId: string, data: any) {
    const existing = await this.prisma.testimonial.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new AppError('Testimonial not found', 404);
    }

    return this.prisma.testimonial.update({
      where: { id },
      data
    });
  }

  async delete(id: string, userId: string) {
    const existing = await this.prisma.testimonial.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new AppError('Testimonial not found', 404);
    }

    await this.prisma.testimonial.delete({
      where: { id }
    });
  }
}
