import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import { UserRole } from '@prisma/client';

// 1. Get users (with filter by role)
export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.query;

    const whereClause: any = {
      deletedAt: null,
    };

    if (role) {
      whereClause.role = {
        name: role as UserRole,
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { role: true },
      orderBy: { name: 'asc' },
    });

    // Don't expose password hashes
    const sanitizedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.name,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: sanitizedUsers,
    });
  } catch (error) {
    next(error);
  }
}

// 2. Create user (Admin only)
export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, roleName } = req.body;
    const user = req.user;

    if (!name || !email || !password || !roleName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { name: roleName as UserRole },
    });
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Selected role is invalid.',
      });
    }

    // Check unique email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `User with email "${email}" already exists.`,
      });
    }

    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roleId: role.id,
      },
      include: { role: true },
    });

    // Write audit log
    await createAuditLog({
      userId: user?.userId,
      role: user?.role || 'ADMIN',
      action: 'CREATE_USER_ACCOUNT',
      entity: 'User',
      entityId: newUser.id,
      ipAddress: req.ip,
      newValue: { name: newUser.name, email: newUser.email, role: newUser.role.name },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
      },
    });
  } catch (error) {
    next(error);
  }
}

// 3. Update user (Admin only)
export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, email, password, roleName } = req.body;
    const user = req.user;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existingUser || existingUser.deletedAt) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check email unique if changing
    if (email && email !== existingUser.email) {
      const emailDup = await prisma.user.findUnique({ where: { email } });
      if (emailDup) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
    }

    let roleId = existingUser.roleId;
    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName as UserRole } });
      if (!role) {
        return res.status(400).json({ success: false, message: 'Invalid role selection.' });
      }
      roleId = role.id;
    }

    const updateData: any = {
      name,
      email,
      roleId,
    };

    if (password && password.trim() !== '') {
      updateData.passwordHash = bcrypt.hashSync(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    // Write audit log
    await createAuditLog({
      userId: user?.userId,
      role: user?.role || 'ADMIN',
      action: 'UPDATE_USER_ACCOUNT',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip,
      oldValue: { name: existingUser.name, email: existingUser.email, role: existingUser.role.name },
      newValue: { name: updated.name, email: updated.email, role: updated.role.name },
    });

    return res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role.name,
      },
    });
  } catch (error) {
    next(error);
  }
}

// 4. Soft delete user (Admin only)
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Write audit log
    await createAuditLog({
      userId: user?.userId,
      role: user?.role || 'ADMIN',
      action: 'DELETE_USER_ACCOUNT',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
