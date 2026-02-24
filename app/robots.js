export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: '/admin/',
            },
            {
                // Explicitly allow popular AI crawlers and bots for AEO
                userAgent: ['ChatGPT-User', 'Google-Extended', 'ClaudeBot', 'PerplexityBot', 'anthropic-ai', 'OmgiliBot', 'Omgili', 'FacebookBot'],
                allow: '/',
            }
        ]
    }
}
