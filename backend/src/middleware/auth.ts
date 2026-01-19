import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    affiliateId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
      affiliateId?: string;
    };

    // Verificar se o usuário ainda existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { affiliate: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      affiliateId: user.affiliateId || undefined,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

export const requireAffiliate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'AFFILIATE' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas afiliados.' });
  }
  next();
};
