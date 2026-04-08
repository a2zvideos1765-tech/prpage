import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using user's keys
cloudinary.config({
    cloud_name: process.env.Cloud_name,
    api_key: process.env.API_key,
    api_secret: process.env.API_secret,
});

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to Cloudinary using secure stream (Vercel Serverless compatible)
        const publicUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "pr_blog_uploads" },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary Stream Error", error);
                        reject(error);
                    } else {
                        resolve(result.secure_url);
                    }
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("Cloudinary Upload API Error:", error);
        return NextResponse.json({ error: "Failed to upload file to Cloud.", details: error.message }, { status: 500 });
    }
}
