import { ImageResponse } from 'next/og';

// iPad home-screen icon. Opaque and full-bleed (iOS rounds the corners itself); drawn as SVG so the
// build needs no fonts or emoji downloads. Generated once at build time.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#1679AB"/>
  <circle cx="42" cy="21" r="7" fill="#FFB422"/>
  <path d="M13 34c7-8 17-10 27-6" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <path d="M8 44c5 0 7-4 12-4s7 4 12 4 7-4 12-4 7 4 12 4" fill="none" stroke="#D2EAF5" stroke-width="4" stroke-linecap="round"/>
  <path d="M8 53c5 0 7-4 12-4s7 4 12 4 7-4 12-4 7 4 12 4" fill="none" stroke="#D2EAF5" stroke-width="4" stroke-linecap="round" opacity=".6"/>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`} width={180} height={180} alt="" />,
    size,
  );
}
