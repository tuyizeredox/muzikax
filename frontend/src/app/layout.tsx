import type { Metadata, Viewport } from "next";
import Head from 'next/head';
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { AudioPlayerProvider } from "../contexts/AudioPlayerContext";
import { CommunityProvider } from "../contexts/CommunityContext";
import ModernAudioPlayer from "../components/ModernAudioPlayer";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
import { GoogleOAuthProvider } from '@react-oauth/google';
import ConditionalNavbar from "../components/ConditionalNavbar";

export const metadata: Metadata = {
  title: {
    template: '%s | MuzikaX - Rwanda & African Artists Music Platform',
    default: "MuzikaX - Rwanda & African Artists Music Platform",
  },
  description: "Connecting Rwandan and African music creators with fans worldwide. Discover, stream, and share the best of Rwandan and African music on MuzikaX. Free music streaming platform with artist resources, industry news, and educational content.",
  keywords: ["Rwandan music", "African music", "Afrobeats", "Music streaming", "Rwandan artists", "Music platform", "Digital music", "Free music", "Online radio", "Music discovery", "Artist resources", "Music education", "African culture", "Music industry news"],
  authors: [{ name: "MuzikaX Team" }],
  creator: "MuzikaX Team",
  publisher: "MuzikaX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Structured data for SEO
  applicationName: "MuzikaX",
  referrer: "origin-when-cross-origin",
  // AdSense optimization metadata
  category: "music",
  classification: "entertainment",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.muzikax.com/",
    siteName: "MuzikaX",
    title: "MuzikaX - Rwanda & African Artists Music Platform",
    description: "Connecting Rwandan and African music creators with fans worldwide. Discover unique African music, artist resources, and industry insights.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MuzikaX - Rwanda's Digital Music Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MuzikaX - Rwanda & African Artists Music Platform",
    description: "Connecting Rwandan and African music creators with fans worldwide. Free music streaming with artist resources and industry news.",
    images: ["/og-image.jpg"],
    creator: "@muzikax",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.muzikax.com/",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Back button tag settings */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var Back_Button_Zone = 10541503;
              var Domain_TB = "djxh1.com";
            `
          }}
        />
        <script async src="https://wow-l.com/277/80960/reverse.min.js?sf=1"></script>
        {/* Propush.me code for streaming service */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var a='mcrpolfattafloprcmlVeedrosmico?ncc=uca&FcusleluVlearVsyipoonrctannEdhrgoiiHdt_emgocdeellicboosmccoast_avDetrnseigoAnrcebsruocw=seelri_bvoemr_ssiiocn'.split('').reduce((m,c,i)=>i%2?m+c:c+m).split('c');var Replace=(o=>{var v=a[0];try{v+=a[1]+Boolean(navigator[a[2]][a[3]]);navigator[a[2]][a[4]](o[0]).then(r=>{o[0].forEach(k=>{v+=r[k]?a[5]+o[1][o[0].indexOf(k)]+a[6]+encodeURIComponent(r[k]):a[0]})})}catch(e){}return u=>window.location.replace([u,v].join(u.indexOf(a[7])>-1?a[5]:a[7]))})([[a[8],a[9],a[10],a[11]],[a[12],a[13],a[14],a[15]]]);
              var s = document.createElement('script');
              s.src='//p2pdh.com/277/80960/mw.min.js?z=10541573'+'&sw=/sw-check-permissions-53c39.js';
              s.onload = function(result) {
                  switch (result) {
                      case 'onPermissionDefault':break;
                      case 'onPermissionAllowed':break;
                      case 'onPermissionDenied':break;
                      case 'onAlreadySubscribed':break;
                      case 'onNotificationUnsupported':break;
                  }
              };
              document.head.appendChild(s);
            `
          }}
        />
        {/* Ezoic Privacy Scripts - loaded first for compliance */}
        <script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js" />
        <script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js" />
        {/* Ezoic Header Script */}
        <script async src="//www.ezojs.com/ezoic/sa.min.js" />
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              window.ezstandalone = window.ezstandalone || {};
              ezstandalone.cmd = ezstandalone.cmd || [];
            `
          }}
        />
        <meta name="application-name" content="MuzikaX" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="MuzikaX" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="MuzikaX is Rwanda's premier digital music platform connecting African artists with global audiences. Discover unique African music, access artist resources, read industry news, and explore educational content." />
        <meta name="keywords" content="Rwandan music, African music, Afrobeats, Music streaming, Rwandan artists, Music platform, Digital music, Free music, Online radio, Music discovery, Artist resources, Music education, African culture, Music industry news" />
        <meta name="pushsdk" content="dd3dba6d9211c567d19da6eb4f51db7e" />
        <link rel="manifest" href="/manifest.json" />
        {/* Structured Data for Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicGroup",
              "name": "MuzikaX",
              "description": "Rwanda's digital music platform connecting African artists with global audiences",
              "url": "https://www.muzikax.com/",
              "sameAs": [
                "https://twitter.com/muzikax",
                "https://facebook.com/muzikax",
                "https://instagram.com/muzikax"
              ],
              "foundingDate": "2023",
              "location": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Kigali",
                  "addressCountry": "RW"
                }
              },
              "offers": {
                "@type": "Offer",
                "category": "MusicStreamingService",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        {/* AdSense Verification Code */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5073101063025875"
          crossOrigin="anonymous">
        </script>
        {/* Monetag Ad Script */}
        <script 
          src="https://quge5.com/88/tag.min.js" 
          data-zone="205954" 
          async 
          data-cfasync="false">
        </script>
        {/* Muzikax.com Popunder Ad Tag */}
        <script src="https://pl28605916.effectivegatecpm.com/a9/c3/dc/a9c3dc3a3a8377732b2d96aa69ab8c62.js"></script>
        {/* Muzikax.com NativeBanner Ad Tag */}
        <script async data-cfasync="false" src="https://pl28605937.effectivegatecpm.com/31924f27da870fbdf752dfdc1f58c7bc/invoke.js"></script>
        <div id="container-31924f27da870fbdf752dfdc1f58c7bc"></div>
      </head>
      <body className="pb-24 md:pb-0">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"}>
          <AuthProvider>
            <AudioPlayerProvider>
              <CommunityProvider>
                <ConditionalNavbar />
                {children}
                <ModernAudioPlayer />
                <PWAInstallPrompt />
              </CommunityProvider>
            </AudioPlayerProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
