import { Elysia, t } from 'elysia';
import { mediaService } from '../services/media.service';
import { authBeforeHandle } from '../middleware/auth';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const S = (ctx: unknown) => ctx as Record<string, unknown>;

export const mediaRoutes = new Elysia({ prefix: '/api/media' })
  .get('/', async (ctx) => {
    const q = S(ctx).query as Record<string, string>;
    return mediaService.list(S(ctx).siteId as number, {
      page: q.page ? Number(q.page) : 1,
      pageSize: q.pageSize ? Number(q.pageSize) : 20,
      mimeType: q.mimeType,
    });
  })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .post('/upload', async (ctx) => {
        const body = S(ctx).body as { file: File };
        const sid = S(ctx).siteId as number;
        const rawFile = body.file;
        if (!rawFile) throw new Error('No file uploaded');

        const siteDir = join(UPLOAD_DIR, String(sid));
        if (!existsSync(siteDir)) await mkdir(siteDir, { recursive: true });

        const timestamp = Date.now();
        const safeFilename = `${timestamp}-${rawFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filepath = join(siteDir, safeFilename);

        const buffer = await rawFile.arrayBuffer();
        await writeFile(filepath, new Uint8Array(buffer));

        return mediaService.create({
          siteId: sid, filename: rawFile.name,
          url: `/uploads/${sid}/${safeFilename}`,
          mimeType: rawFile.type || 'application/octet-stream',
          size: rawFile.size,
        });
      }, { body: t.Object({ file: t.File() }) })
      .delete('/:id', async (ctx) => {
        return mediaService.delete(Number((S(ctx).params as Record<string, string>).id));
      })
  );
