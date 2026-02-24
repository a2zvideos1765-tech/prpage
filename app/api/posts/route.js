import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(posts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();

        // Very basic slug generation
        const generatedSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const finalSlug = body.slug || generatedSlug;

        const newPost = await prisma.post.create({
            data: {
                title: body.title,
                slug: finalSlug,
                content: body.content,
                excerpt: body.excerpt,
                coverImage: body.coverImage,
                published: body.published || false,
                metaTitle: body.metaTitle,
                metaDescription: body.metaDescription,
                faqJson: body.faqJson,
                customSchema: body.customSchema,
            }
        });

        return NextResponse.json(newPost);
    } catch (error) {
        console.error("Post creation error:", error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
