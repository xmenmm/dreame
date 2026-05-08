import { issueCaptcha, renderCaptchaSvg } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  const { code } = await issueCaptcha();
  const svg = renderCaptchaSvg(code);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
