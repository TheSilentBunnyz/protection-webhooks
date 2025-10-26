const DISCORD_WEBHOOKS = {
    execution: process.env.DISCORD_WEBHOOK_EXECUTION ?? "https://discord.com/api/webhooks/1429520487171752057/9sLE-WLbyHayUmopuUbl5db5yTmoUpXTE-dTD0nrFucFJrvaIHH6TGivgsq68u0Nc-t6",
    error: process.env.DISCORD_WEBHOOK_ERROR ?? "https://discord.com/api/webhooks/1429520717220806799/TORz8Lzpebur8q8CUmrvkzz0dYW6RFD7_KuTab_FvZMCV4_dqZYwLPDJdnaazyCnfS7s",
    fallback: process.env.DISCORD_WEBHOOK_FALLBACK ?? "https://discord.com/api/webhooks/1429528520874266725/wT8z6ulqOs67pDmSXt01ckAxAGecWUsnAJOot5SI4EXhuB0vB9Vv65OHkXh7AJumQNAp"
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { type, data } = req.body;

        let webhookUrl;
        switch(type) {
            case 'execution':
                webhookUrl = DISCORD_WEBHOOKS.execution;
                break;
            case 'error':
                webhookUrl = DISCORD_WEBHOOKS.error;
                break;
            case 'fallback_error':
                webhookUrl = DISCORD_WEBHOOKS.fallback;
                break;
            default:
                return res.status(400).json({ error: 'Invalid webhook type. Use: execution, error, or fallback_error' });
        }

        if (!webhookUrl) {
            return res.status(500).json({ 
                error: `Webhook URL not configured for type: ${type}` 
            });
        }

        // Get Roblox avatar
        const userId = data?.UserId || "0";
        const imageUrl = (await (await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`)).json())?.data?.[0]?.imageUrl;
        
        const payload = {
            embeds: [{
                color: type === 'execution' ? 15158332 : 
                       type === 'error' ? 16711680 : 16776960,
                author: { 
                    name: type === 'execution' ? "Silent X Execution Logger" : 
                          type === 'error' ? "Silent X Error Logger" : "Silent X Fallback Logger" 
                },
                thumbnail: { url: imageUrl },
                image: {
                    url: "https://images-ext-1.discordapp.net/external/SfOTDbvGZw0Q4DBh_rE5Ezu2cMWznNrYCfYDeS8NPuQ/https/media.tenor.com/2UVcaTGegxoAAAPo/%25D0%25BA%25D0%25B0%25D0%25BF%25D0%25B8%25D0%25B1%25D0%25B0%25D1%2580%25D0%25B0.mp4"
                },
                title: type === 'execution' ? `${data?.DisplayName || data?.Username || "Unknown"} has executed Silent X!` :
                      type === 'error' ? "🟥 Silent X Error" : "🟨 Silent X Fallback Error",
                fields: [
                    { name: "**Display Name:**", value: data?.DisplayName || data?.Username || "Unknown", inline: true },
                    { name: "**Username:**", value: data?.Username || "Unknown", inline: true },
                    { name: "**User ID:**", value: data?.UserId || "N/A", inline: true },
                    { name: "**Profile Link:**", value: `https://www.roblox.com/users/${data?.UserId || "0"}`, inline: true },
                    { name: "**Executor:**", value: data?.ExecutorName || "Unknown", inline: true },
                    { name: "**Executor Level:**", value: data?.ExecutorLevel || "N/A", inline: true },
                    { name: "**HWID:**", value: data?.HWID || "N/A", inline: true },
                    { name: "**Membership Type:**", value: data?.MembershipType || "N/A", inline: true },
                    { name: "**Account Age:**", value: data?.AccountAge || "0", inline: true },
                    { name: "**Log Time:**", value: data?.LogTime || new Date().toISOString(), inline: true },
                    { name: "**Place ID:**", value: data?.PlaceID || "N/A", inline: true },
                    { name: "**Game Link:**", value: `https://www.roblox.com/games/${data?.PlaceID || "0"}`, inline: true },
                    { name: "**Source:**", value: data?.Source || "Silent X Hub", inline: true }
                ],
                footer: { 
                    text: type === 'execution' ? "Silent X Execution Logger" : 
                          type === 'error' ? "Silent X Error Logger" : "Silent X Fallback Logger"
                },
                timestamp: new Date().toISOString()
            }]
        };

        // Add error-specific fields
        if (type === 'error' || type === 'fallback_error') {
            payload.embeds[0].fields.push(
                { name: "**Error Message:**", value: data?.ErrorMessage || "Unknown error", inline: false },
                { name: "**Script:**", value: data?.ScriptName || "Unknown script", inline: true }
            );
        }

        const discordResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (discordResponse.ok) {
            res.status(200).json({ success: true, message: 'Webhook delivered successfully' });
        } else {
            const errorText = await discordResponse.text();
            res.status(500).json({ error: 'Discord webhook failed', details: errorText });
        }

    } catch (error) {
        console.error('Vercel webhook error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
