"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleClerkWebhook = void 0;
// Workaround for importing ESM modules in CommonJS environment
const dynamicImport = new Function('specifier', 'return import(specifier)');
const db_1 = require("../../config/db");
const client_1 = require("@prisma/client");
const handleClerkWebhook = async (req, res, next) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'whsec_placeholder') {
        console.warn('⚠️ CLERK_WEBHOOK_SIGNING_SECRET is missing or using placeholder');
    }
    // Get Svix headers for verification
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];
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
    let evt;
    try {
        const svix = await dynamicImport('svix');
        const WebhookConstructor = svix.Webhook;
        const wh = new WebhookConstructor(WEBHOOK_SECRET || '');
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    }
    catch (err) {
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
            const primaryEmailObj = evt.data.email_addresses?.find((e) => e.id === primaryEmailId);
            const email = primaryEmailObj?.email_address || evt.data.email_addresses?.[0]?.email_address || `${clerkId}@example.com`;
            const firstName = evt.data.first_name || '';
            const lastName = evt.data.last_name || '';
            const name = `${firstName} ${lastName}`.trim() || evt.data.username || 'Anonymous User';
            const roleFromMetadata = evt.data.public_metadata?.role || client_1.Role.CUSTOMER;
            await db_1.prisma.user.upsert({
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
        }
        else if (eventType === 'user.updated') {
            const primaryEmailId = evt.data.primary_email_address_id;
            const primaryEmailObj = evt.data.email_addresses?.find((e) => e.id === primaryEmailId);
            const email = primaryEmailObj?.email_address || evt.data.email_addresses?.[0]?.email_address;
            const firstName = evt.data.first_name || '';
            const lastName = evt.data.last_name || '';
            const name = `${firstName} ${lastName}`.trim() || evt.data.username;
            const roleFromMetadata = evt.data.public_metadata?.role;
            const updateData = {};
            if (name)
                updateData.name = name;
            updateData.firstName = firstName;
            updateData.lastName = lastName;
            if (email)
                updateData.email = email;
            if (roleFromMetadata)
                updateData.role = roleFromMetadata;
            await db_1.prisma.user.update({
                where: { clerkId },
                data: updateData,
            });
            console.log(`✅ Updated synced user ${clerkId} (${email}) in database`);
        }
        else if (eventType === 'user.deleted') {
            await db_1.prisma.user.delete({
                where: { clerkId },
            });
            console.log(`✅ Deleted user ${clerkId} from database`);
        }
        return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    }
    catch (error) {
        console.error(`❌ Error processing Clerk webhook (${eventType}):`, error);
        return next(error);
    }
};
exports.handleClerkWebhook = handleClerkWebhook;
