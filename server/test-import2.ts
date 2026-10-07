import type { Webhook } from 'svix';
const dynamicImport = new Function('specifier', 'return import(specifier)');
async function testImport() {
  const svix = await dynamicImport('svix');
  const WebhookConstructor = svix.Webhook as typeof Webhook;
  const wh = new WebhookConstructor('secret');
  console.log(wh);
}
testImport();
