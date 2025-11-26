import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
function mapImages(resources: any[]) {
  return resources.map((img: any) => ({
    url: img.secure_url,
    publicId: img.public_id,
    width: img.width,
    height: img.height,
  }));
}
export async function GET() {
  try {
    const result = await cloudinary.api.resources_by_tag(
      "gallery", // Change 'gallery' to your tag name
      {
        max_results: 500,
        resource_type: "image",
      }
    );
    return NextResponse.json({ images: mapImages(result.resources) });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch images", details: error.message },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const folder = body.folder || "Gallery";
    const max_results = body.max_results || 500;
    // Fetch all images from Gallery and its subfolders
    const result = await cloudinary.search
      .expression(`folder="${folder}" OR folder="${folder}/*"`)
      .max_results(max_results)
      .execute();
    return NextResponse.json({ images: mapImages(result.resources) });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch images", details: error.message },
      { status: 500 }
    );
  }
}
