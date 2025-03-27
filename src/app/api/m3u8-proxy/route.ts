/* eslint-disable @typescript-eslint/no-explicit-any */
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
                Referer: "https://megacloud.club/" ,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive"
            }
        });

        const headers = new Headers(response.headers as any);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // Log detailed error information for better debugging in Vercel
            console.error('M3U8 Proxy Error:', {
                message: error.message,
                stack: error.stack,
                url: req.url
            });
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
}