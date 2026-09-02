import { Request, Response } from 'express';
import { processAndSaveImage } from '../utils/image.util';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/appError';

const ALLOWED_TYPES = ['blog', 'package', 'specialist'];

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('Vui lòng chọn file ảnh');
  }

  const type = typeof req.query.type === 'string' && ALLOWED_TYPES.includes(req.query.type)
    ? req.query.type
    : 'blog';

  const url = await processAndSaveImage(req.file.buffer, type);
  res.json({ url });
});
