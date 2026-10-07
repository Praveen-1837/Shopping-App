async function test() {
    const svix = await Promise.resolve().then(() => require('svix'));
    console.log(svix.Webhook);
}
test();
