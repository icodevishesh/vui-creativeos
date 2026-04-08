import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const folderName = formData.get("folderName") as string || "general";

        // 1. Define the directory and ensure it exists
        const safeFolderName = folderName.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
        const uploadDir = path.join(process.cwd(), "docs", "uploads", safeFolderName);
        await fs.mkdir(uploadDir, { recursive: true });

        // 2. Create a unique filename to avoid overwriting
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${Date.now()}-${safeFileName}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        // 3. Process the file in chunks using a ReadableStream
        const reader = file.stream().getReader();

        // We use a flag 'a' (append) to write chunks one by one
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 'value' is a Uint8Array (a chunk of the file)
            await fs.appendFile(filePath, Buffer.from(value));
        }

        const fileUrl = `/uploads/${safeFolderName}/${uniqueFileName}`;

        return NextResponse.json({
            message: "File uploaded successfully",
            path: filePath,
            url: fileUrl,
            size: file.size,
            name: file.name,
            mimeType: file.type
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
    }
}


