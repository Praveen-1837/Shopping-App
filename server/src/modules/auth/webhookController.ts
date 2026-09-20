import { Request, Response, NextFunction } from 'express';
import { Webhook } from 'svix';
import { prisma } from '../../config/db';
import { Role } from '@prisma/client';

export const handleClerkWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'whsec_placeholder') {
    console.warn('⚠️ CLERK_WEBHOOK_SIGNING_SECRET is missing or using placeholder');
  }

  // Get Svix headers for verification
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing Svix verification headers',
      },
    });
  }

  // Get raw body (requires raw body parser on this route)
  const payload = req.body;
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);

  let evt: any;

  try {
    const wh = new Webhook(WEBHOOK_SECRET || '');
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err: any) {
    console.error('❌ Clerk Webhook Verification Failed:', err.message);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: `Webhook signature verification failed: ${err.message}`,
      },
    });
  }

  const { id: clerkId } = evt.data;
  const eventType = evt.type;

  console.log(`🔔 Received Clerk Webhook Event: ${eventType} for user ${clerkId}`);

  try {
    if (eventType === 'user.created') {
      const primaryEmailId = evt.data.primary_email_address_id;
      const primaryEmailObj = evt.data.email_addresses?.find((e: any) => e.id === primaryEmailId);
      const email = primaryEmailObj?.email_address || evt.data.email_addresses?.[0]?.email_address || `${clerkId}@example.com`;
      const firstName = evt.data.first_name || '';
      const lastName = evt.data.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || evt.data.username || 'Anonymous User';
      const roleFromMetadata = (evt.data.public_metadata?.role as Role) || Role.CUSTOMER;

      await prisma.user.upsert({
        where: { clerkId },
        update: {
          name,
          firstName,
          lastName,
          email,
          role: roleFromMetadata,
        },
        create: {
          clerkId,
          name,
          firstName,
          lastName,
          email,
          role: roleFromMetadata,
        },
      });

      console.log(`✅ Synced new user ${clerkId} (${email}) into database with role ${roleFromMetadata}`);
    } else if (eventType === 'user.updated') {
      const primaryEmailId = evt.data.primary_email_address_id;
      const primaryEmailObj = evt.data.email_addresses?.find((e: any) => e.id === primaryEmailId);
      const email = primaryEmailObj?.email_address || evt.data.email_addresses?.[0]?.email_address;
      const firstName = evt.data.first_name || '';
      const lastName = evt.data.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || evt.data.username;
      const roleFromMetadata = evt.data.public_metadata?.role as Role | undefined;

      const updateData: any = {};
      if (name) updateData.name = name;
      updateData.firstName = firstName;
      updateData.lastName = lastName;
      if (email) updateData.email = email;
      if (roleFromMetadata) updateData.role = roleFromMetadata;

      await prisma.user.update({
        where: { clerkId },
        data: updateData,
      });

      console.log(`✅ Updated synced user ${clerkId} (${email}) in database`);
    } else if (eventType === 'user.deleted') {
      await prisma.user.delete({
        where: { clerkId },
      });

      console.log(`✅ Deleted user ${clerkId} from database`);
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error(`❌ Error processing Clerk webhook (${eventType}):`, error);
    return next(error);
  }
};
