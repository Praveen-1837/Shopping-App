import { Role } from '@prisma/client';
import { roleGuard } from '../../middleware/roleGuard';
import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  checkUsernameAvailability,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getSupportTickets,
  createSupportTicket,
} from './userController';

const router = Router();

// Profile & Username Availability
router.get('/users/username-available', checkUsernameAvailability);
router.patch('/users/profile', requireAuth(), roleGuard([Role.CUSTOMER]), updateProfile);

// Address Management
router.get('/addresses', requireAuth(), roleGuard([Role.CUSTOMER]), getAddresses);
router.post('/addresses', requireAuth(), roleGuard([Role.CUSTOMER]), createAddress);
router.put('/addresses/:id', requireAuth(), roleGuard([Role.CUSTOMER]), updateAddress);
router.delete('/addresses/:id', requireAuth(), roleGuard([Role.CUSTOMER]), deleteAddress);
router.patch('/addresses/:id/default', requireAuth(), roleGuard([Role.CUSTOMER]), setDefaultAddress);

// Support Ticket Management
router.get('/support/tickets', requireAuth(), roleGuard([Role.CUSTOMER]), getSupportTickets);
router.post('/support/tickets', requireAuth(), roleGuard([Role.CUSTOMER]), createSupportTicket);

export default router;
