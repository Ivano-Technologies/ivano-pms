import { readFile } from "fs/promises";
import { join } from "path";

import { ImageResponse } from "next/og";

import { BRAND_COPYRIGHT, BRAND_HEADLINE, BRAND_TAGLINE, PRODUCT_NAME } from "@/lib/brand";

export const runtime = "nodejs";

export const alt = `${PRODUCT_NAME} · ${BRAND_HEADLINE}`;

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

/** 1200×630 social preview in Lobby Light: paper, lockup, headline, terracotta rule, credit. */
export default async function OpenGraphImage() {
  const lockup = await readFile(join(process.cwd(), "public", "brand", "pms-lockup.svg"));
  const lockupDataUrl = `data:image/svg+xml;base64,${lockup.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAF7F2",
          color: "#141B26",
          padding: "72px 80px",
          fontFamily: 'Georgia, "Times New Roman", serif'
        }}
      >
        <img src={lockupDataUrl} width={210} height={72} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <span
            style={{
              display: "flex",
              fontSize: 22,
              color: "#5C6673",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600
            }}
          >
            {BRAND_TAGLINE}
          </span>
          <span style={{ fontSize: 76, lineHeight: 1.08, letterSpacing: "-0.02em", maxWidth: 900 }}>
            {BRAND_HEADLINE}
          </span>
          <div style={{ width: 120, height: 6, borderRadius: 3, background: "#B5472F" }} />
        </div>
        <span
          style={{
            fontSize: 22,
            color: "#5C6673",
            fontFamily: "ui-sans-serif, system-ui, sans-serif"
          }}
        >
          {BRAND_COPYRIGHT}
        </span>
      </div>
    ),
    {
      ...size
    }
  );
}
