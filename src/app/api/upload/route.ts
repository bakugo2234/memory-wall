import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB for images, 100MB for videos)
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isVideo
            ? "Video tối đa 100MB"
            : "Ảnh tối đa 10MB",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Định dạng không được hỗ trợ" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
      width?: number;
      height?: number;
      duration?: number;
      thumbnail_url?: string;
    }>((resolve, reject) => {
      const uploadOptions = {
        folder: "memory-wall",
        resource_type: isVideo ? ("video" as const) : ("image" as const),
        transformation: isVideo
          ? [{ quality: "auto", fetch_format: "mp4" }]
          : [{ quality: "auto", fetch_format: "auto" }],
        eager: isVideo
          ? [{ width: 640, crop: "scale", format: "jpg", so: "0" }]
          : undefined,
        eager_async: false,
      };

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else {
            resolve({
              secure_url: result!.secure_url,
              public_id: result!.public_id,
              resource_type: result!.resource_type,
              width: result!.width,
              height: result!.height,
              duration: result!.duration,
              thumbnail_url:
                isVideo && result!.eager?.[0]
                  ? result!.eager[0].secure_url
                  : undefined,
            });
          }
        })
        .end(buffer);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload thất bại. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
