import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { createAuditLog } from '../utils/audit.js';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    // Write audit log
    await createAuditLog({
      userId: user.id,
      role: user.role.name,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Not logged in.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { role: true },
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    next(error);
  }
}
