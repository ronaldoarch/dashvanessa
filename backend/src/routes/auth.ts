import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Verificar conexão com banco
    try {
      await prisma.$connect();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ 
        error: 'Erro de conexão com banco de dados',
        ...(process.env.NODE_ENV !== 'production' && { details: dbError.message })
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        affiliate: {
          include: {
            deal: {
              select: {
                id: true,
                name: true,
                cpaValue: true,
                revSharePercentage: true,
              }
            }
          }
        } 
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }

    // @ts-ignore - jsonwebtoken types issue with expiresIn
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        affiliateId: user.affiliateId,
      },
      secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        affiliateId: user.affiliateId,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    // Retornar mensagem mais específica em desenvolvimento
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Erro ao fazer login'
      : error.message || 'Erro ao fazer login';
    
    res.status(500).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

// Registrar novo usuário (apenas admin)
router.post('/register', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, password, name, role, affiliateId } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'AFFILIATE',
        affiliateId,
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      affiliateId: user.affiliateId,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Resetar senha (apenas admin)
router.put('/reset-password/:userId', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

// Obter usuário atual
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        affiliate: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erro ao obter usuário' });
  }
});

// Atualizar senha do próprio usuário (requer senha atual)
router.put('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

// Atualizar email do próprio usuário (requer senha atual)
router.put('/change-email', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newEmail } = req.body;

    if (!currentPassword || !newEmail) {
      return res.status(400).json({ error: 'Senha atual e novo email são obrigatórios' });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Verificar se o novo email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== req.user!.id) {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }

    // Atualizar email
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { email: newEmail },
    });

    res.json({ message: 'Email atualizado com sucesso', email: newEmail });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }
    console.error('Change email error:', error);
    res.status(500).json({ error: 'Erro ao atualizar email' });
  }
});

// Atualizar email e senha do próprio usuário (requer senha atual)
router.put('/change-credentials', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: 'Senha atual é obrigatória' });
    }

    if (!newEmail && !newPassword) {
      return res.status(400).json({ error: 'Informe pelo menos o novo email ou a nova senha' });
    }

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const updateData: any = {};

    // Validar e atualizar email se fornecido
    if (newEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      // Verificar se o novo email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
      });

      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).json({ error: 'Este email já está em uso' });
      }

      updateData.email = newEmail;
    }

    // Validar e atualizar senha se fornecida
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Atualizar dados
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.json({ 
      message: 'Credenciais atualizadas com sucesso',
      email: updatedUser.email,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }
    console.error('Change credentials error:', error);
    res.status(500).json({ error: 'Erro ao atualizar credenciais' });
  }
});

export default router;
