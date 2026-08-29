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
router.patch('/users/profile', requireAuth(), updateProfile);

// Address Management
router.get('/addresses', requireAuth(), getAddresses);
router.post('/addresses', requireAuth(), createAddress);
router.put('/addresses/:id', requireAuth(), updateAddress);
router.delete('/addresses/:id', requireAuth(), deleteAddress);
router.patch('/addresses/:id/default', requireAuth(), setDefaultAddress);

// Support Ticket Management
router.get('/support/tickets', requireAuth(), getSupportTickets);
router.post('/support/tickets', requireAuth(), createSupportTicket);

export default router;
