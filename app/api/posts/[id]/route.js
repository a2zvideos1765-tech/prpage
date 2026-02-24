import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // If slug is explicitly changed
        if (body.title && !body.slug) {
            body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title: body.title,
                slug: body.slug,
                content: body.content,
                excerpt: body.excerpt,
                coverImage: body.coverImage,
                published: body.published,
                metaTitle: body.metaTitle,
                metaDescription: body.metaDescription,
                faqJson: body.faqJson,
                customSchema: body.customSchema,
            }
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        await prisma.post.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
