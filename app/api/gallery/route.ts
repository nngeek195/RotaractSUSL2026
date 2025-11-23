import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    // Option 1: Fetch by folder - uncomment and use if your images are in a folder
    // const result = await cloudinary.api.resources({
    //   type: 'upload',
    //   prefix: 'gallery/',  // Change 'gallery/' to your folder name
    //   max_results: 500,
    //   resource_type: 'image',
    // });

    // Option 2: Fetch by tag - uncomment and use if your images are tagged
    const result = await cloudinary.api.resources_by_tag(
      'gallery',  // Change 'gallery' to your tag name
      {
        max_results: 500,
        resource_type: 'image',
      }
    );

    // Option 3: Fetch all images (current default)
    // const result = await cloudinary.api.resources({
    //   type: 'upload',
    //   max_results: 500,
    //   resource_type: 'image',
    // });

    const images = result.resources.map((resource: any) => ({
      url: resource.secure_url,
      publicId: resource.public_id,
      width: resource.width,
      height: resource.height,
    }));

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Error fetching Cloudinary images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images', details: error.message },
      { status: 500 }
    );
  }
}
