"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dynamicImport = new Function('specifier', 'return import(specifier)');
async function testImport() {
    const svix = await dynamicImport('svix');
    const WebhookConstructor = svix.Webhook;
    const wh = new WebhookConstructor('secret');
    console.log(wh);
}
testImport();
