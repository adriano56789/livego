import { Request, Response, NextFunction } from 'express';
import { Streamer } from '../models';
import { getUserIdFromToken } from './auth';

declare global {
  namespace Express {
    interface Request {
      stream?: any;
    }
  }
}

export const validateStreamKey = async (req: Request, res: Response, next: NextFunction) => {
  const { streamUrl, streamKey } = req.body;
  
  if (!streamKey) {
    return res.status(403).json({ error: 'Stream key required' });
  }
  
  // Extrair streamId: webrtc://server/live/streamId
  const streamId = streamUrl.split('/').pop();
  
  if (!streamId) {
    return res.status(400).json({ error: 'Invalid stream URL' });
  }
  
  try {
    const stream = await Streamer.findOne({ id: streamId, streamKey });
    
    if (!stream) {
      return res.status(403).json({ error: 'Invalid stream key' });
    }
    
    const userId = getUserIdFromToken(req);
    
    if (stream.hostId !== userId) {
      return res.status(403).json({ error: 'Only stream owner can publish' });
    }
    
    req.stream = stream;
    next();
  } catch (error) {
    console.error('[StreamAuth] Error validating stream key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
