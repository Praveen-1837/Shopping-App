import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';

async function getDbUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

// GET /api/v1/users/username-available?username=hatake_kakashi
export const checkUsernameAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUsername = (req.query.username as string) || '';
    const username = rawUsername.trim().toLowerCase();

    if (!username) {
      res.status(200).json({ success: true, available: false, message: 'Username is required' });
      return;
    }

    const auth = getAuth(req);
    const clerkId = auth?.userId;
    let currentUserId: string | null = null;

    if (clerkId) {
      const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
      if (user) currentUserId = user.id;
    }

    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
      },
    });

    if (!existing) {
      res.status(200).json({
        success: true,
        available: true,
        username,
      });
      return;
    }

    let counter = 1;
    let suggestedAlternative = `${username}${counter}`;
    while (counter < 100) {
      suggestedAlternative = `${username}${counter}`;
      const taken = await prisma.user.findFirst({
        where: { username: { equals: suggestedAlternative, mode: 'insensitive' } },
      });
      if (!taken) break;
      counter++;
    }

    res.status(200).json({
      success: true,
      available: false,
      username,
      suggestedAlternative,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/users/profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const { name, username, phone, alternatePhone } = req.body;

    if (username && typeof username === 'string' && username.trim().length > 0) {
      const existing = await prisma.user.findFirst({
        where: {
          username: username.trim(),
          NOT: { clerkId: auth.userId },
        },
      });
      if (existing) {
        res.status(400).json({ success: false, error: { code: 'USERNAME_TAKEN', message: 'Username is already taken' } });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId: auth.userId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(username !== undefined && { username: username ? String(username).trim() : null }),
        ...(phone !== undefined && { phone: phone ? String(phone).trim() : null }),
        ...(alternatePhone !== undefined && { alternatePhone: alternatePhone ? String(alternatePhone).trim() : null }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/addresses
export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    const addresses = await prisma.address.findMany({
      where: { userId: dbUser.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/addresses
export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);
    const { label, line1, line2, city, state, pincode, isDefault } = req.body;

    if (!label || !line1 || !city || !state || !pincode) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing required address fields' } });
      return;
    }

    const existingCount = await prisma.address.count({ where: { userId: dbUser.id } });
    const makeDefault = Boolean(isDefault || existingCount === 0);

    if (makeDefault) {
      await prisma.address.updateMany({
        where: { userId: dbUser.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: dbUser.id,
        label: String(label).trim(),
        line1: String(line1).trim(),
        line2: line2 ? String(line2).trim() : null,
        city: String(city).trim(),
        state: String(state).trim(),
        pincode: String(pincode).trim(),
        isDefault: makeDefault,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: newAddress,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/addresses/:id
export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const id = req.params.id as string;
    const dbUser = await getDbUser(auth.userId);
    const { label, line1, line2, city, state, pincode, isDefault } = req.body;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== dbUser.id) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found or unauthorized' } });
      return;
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: dbUser.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(label !== undefined && { label: String(label).trim() }),
        ...(line1 !== undefined && { line1: String(line1).trim() }),
        ...(line2 !== undefined && { line2: line2 ? String(line2).trim() : null }),
        ...(city !== undefined && { city: String(city).trim() }),
        ...(state !== undefined && { state: String(state).trim() }),
        ...(pincode !== undefined && { pincode: String(pincode).trim() }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/addresses/:id
export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const id = req.params.id as string;
    const dbUser = await getDbUser(auth.userId);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== dbUser.id) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found or unauthorized' } });
      return;
    }

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
      });
      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/addresses/:id/default
export const setDefaultAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const id = req.params.id as string;
    const dbUser = await getDbUser(auth.userId);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== dbUser.id) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } });
      return;
    }

    await prisma.address.updateMany({
      where: { userId: dbUser.id },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    res.status(200).json({
      success: true,
      message: 'Default address updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/support/tickets
export const getSupportTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/support/tickets
export const createSupportTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);
    const { subject, message } = req.body;

    if (!subject || !message) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Subject and message are required' } });
      return;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: dbUser.id,
        subject: String(subject).trim(),
        message: String(message).trim(),
        status: 'OPEN',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};
