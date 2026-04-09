import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { title, content } = await request.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content required" }, { status: 400 });
        }

        const prompt = `You are an expert SEO and AEO optimizer. Analyze this PR/Blog post.
      Title: ${title}
      Content: ${content.substring(0, 5000)} // trim to save tokens
      
      Respond STRICTLY in valid JSON format with no markdown formatting.
      Keys required:
      "metaTitle": a catchy SEO title under 60 chars.
      "metaDescription": a compelling description under 160 chars.
      "excerpt": a 2-sentence summary.
      "faqJson": stringified JSON-LD Array of FAQPage schema based on the content.
      "customSchema": stringified JSON-LD where "@type" is an array: ["NewsArticle", "BlogPosting"] with keywords.
      `;

        // 1. Try Gemini AI
        if (process.env.GEMINI_API_KEY) {
            try {
                const modelId = process.env.GEMINI_MODEL_ID || "gemini-2.5-flash";
                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                if (geminiRes.ok) {
                    const data = await geminiRes.json();
                    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (responseText) {
                        return NextResponse.json(JSON.parse(responseText));
                    }
                } else {
                    console.warn(`Gemini API returned error status: ${geminiRes.status}`);
                }
            } catch (e) {
                console.warn(`Gemini API call failed, falling back to NVIDIA NIM...`, e.message);
            }
        }

        // 2. Fallback to NVIDIA NIM (Kimi K2)
        if (process.env.NVIDIA_NIM_API_KEY) {
            try {
                const modelId = process.env.KIMI_MODEL_ID || "moonshotai/kimi-k2-instruct";
                const nimRes = await fetch(`https://integrate.api.nvidia.com/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.2,
                        max_tokens: 1024,
                    })
                });

                if (nimRes.ok) {
                    const data = await nimRes.json();
                    let responseText = data.choices?.[0]?.message?.content;
                    if (responseText) {
                        // NIM responses might wrap JSON in markdown tags, so strip them
                        responseText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
                        return NextResponse.json(JSON.parse(responseText));
                    }
                } else {
                    console.warn(`NVIDIA NIM API returned error status: ${nimRes.status}`);
                }
            } catch (e) {
                console.warn(`NVIDIA NIM API fall back failed...`, e.message);
            }
        }

        // Default simulated response if no API key or call fails
        return NextResponse.json({
            metaTitle: `${title} | Top PR News`,
            metaDescription: `Read the latest insights and breaking news about ${title}. Discover comprehensive analysis in our new post.`,
            excerpt: `An exclusive look into ${title}, covering key highlights and future trends.`,
            faqJson: `{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "What is this article about?", "acceptedAnswer": {"@type": "Answer", "text": "This article discusses ${title}."}}]}`,
            customSchema: `{"@context": "https://schema.org", "@type": "BlogPosting", "headline": "${title}"}`,
        });

    } catch (error) {
        console.error("AI SEO Generation error:", error);
        return NextResponse.json({ error: "Failed to generate AI SEO" }, { status: 500 });
    }
}
