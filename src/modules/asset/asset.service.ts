import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors';
import { supabase } from '../../lib/supabase';

// Ensure uploads directory exists (Only needed for local storage)
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'assets');

export class AssetService {
  constructor(
    private prisma: PrismaClient,
    private dbType: 'local' | 'supabase' = 'local'
  ) {
    if (this.dbType === 'local') {
      fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);
    }
  }

  async getAll(userId: string, type?: string, sortBy?: string) {
    const where: any = { userId };
    if (type) where.type = type;

    return this.prisma.asset.findMany({
      where,
      orderBy: { createdAt: sortBy === 'oldest' ? 'asc' : 'desc' }
    });
  }

  async upload(userId: string, filename: string, buffer: Buffer, mimetype: string, size?: number) {
    // Generate a unique filename using timestamp
    const ext = path.extname(filename);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    
    let publicUrl = '';
    
    if (this.dbType === 'supabase') {
      // 1. Upload to Supabase Storage Bucket
      // Ensure you have created a bucket named 'assets' in your Supabase dashboard
      const { data, error } = await supabase.storage
        .from('assets')
        .upload(`${userId}/${uniqueFilename}`, buffer, {
          contentType: mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new AppError(`Supabase Storage Error: ${error.message}`, 500);
      }

      // 2. Get Public URL
      const { data: { publicUrl: url } } = supabase.storage
        .from('assets')
        .getPublicUrl(`${userId}/${uniqueFilename}`);
      
      publicUrl = url;
    } else {
      // Local Save
      const filePath = path.join(UPLOADS_DIR, uniqueFilename);
      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/assets/${uniqueFilename}`;
    }

    // Determine basic type from mimetype
    let type = 'misc';
    if (mimetype.startsWith('image/')) type = 'image';
    else if (mimetype.startsWith('video/')) type = 'video';
    else if (mimetype.startsWith('audio/')) type = 'audio';
    else if (mimetype.includes('pdf') || mimetype.includes('document')) type = 'doc';
    else if (mimetype.includes('zip') || mimetype.includes('tar')) type = 'archive';
    else if (mimetype.includes('json') || mimetype.includes('javascript') || mimetype.includes('html')) type = 'code';

    return this.prisma.asset.create({
      data: {
        userId,
        name: filename,
        type,
        url: publicUrl,
        size
      }
    });
  }

  async delete(id: string, userId: string) {
    const existing = await this.prisma.asset.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new AppError('Asset not found', 404);
    }

    if (this.dbType === 'supabase') {
      // Remove from Supabase Storage
      const pathToRemove = existing.url.split('/assets/').pop()?.split('?')[0];
      if (pathToRemove) {
        await supabase.storage.from('assets').remove([pathToRemove]);
      }
    } else {
      // Remove from local storage
      try {
        const filename = existing.url.split('/').pop();
        if (filename) {
          await fs.unlink(path.join(UPLOADS_DIR, filename));
        }
      } catch (err) {
        console.warn('Could not delete local file for asset', existing.id);
      }
    }

    await this.prisma.asset.delete({
      where: { id }
    });
  }
}
