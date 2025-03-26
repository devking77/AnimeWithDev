import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { LineTransform ,allowedExtensions} from "./src/utils/line-transform";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get("url");
        if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

        const isStaticFiles = allowedExtensions.some(ext => url.endsWith(ext));
        const baseUrl = url.replace(/[^/]+$/, "");

        const response = await axios.get(url, {
            responseType: "stream",
            headers: { 
                Accept: "*/*", 
                Referer: "https://megacloud.club/" 
            }
        });

        const headers = new Headers(response.headers as any);
        if (!isStaticFiles) headers.delete("content-length");

        if (isStaticFiles) {
            const stream = new ReadableStream({
                start(controller) {
                    response.data.on("data", (chunk: any) => controller.enqueue(chunk));
                    response.data.on("end", () => controller.close());
                    response.data.on("error", (err: any) => controller.error(err));
                },
            });
            return new NextResponse(stream, { headers });
        }

        const transform = new LineTransform(baseUrl);
        const transformedStream = new ReadableStream({
            start(controller) {
                response.data.pipe(transform);
                transform.on("data", (chunk: any) => controller.enqueue(chunk));
                transform.on("end", () => controller.close());
                transform.on("error", (err: any) => controller.error(err));
            },
        });

        return new NextResponse(transformedStream, { headers });

    } catch (error: any) {
        console.error(error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}