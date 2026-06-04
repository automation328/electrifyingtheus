// Media gallery seed data. Photos use bundled assets; swap to Supabase Storage
// URLs (public bucket) once media is uploaded via the n8n form. Videos embed
// from YouTube/Vimeo — replace the sample IDs with real event recaps.

import type { VideoProvider } from "@/components/VideoEmbed";
import evFamily from "@/assets/ev-family.jpg";
import evCharging from "@/assets/ev-charging.jpg";
import workforce from "@/assets/workforce.jpg";
import steamEducation from "@/assets/steam-education.jpg";
import heavyDuty from "@/assets/heavy-duty.jpg";
import micromobility from "@/assets/micromobility.jpg";
import evWinter from "@/assets/ev-winter.jpg";
import evSavings from "@/assets/ev-savings.jpg";
import reducedEmissions from "@/assets/reduced-emissions.jpg";
import pumpToPlug from "@/assets/event-pump-to-plug.jpg";

export interface GalleryPhoto {
  src: string;
  alt: string;
  caption?: string;
}

export interface GalleryVideo {
  title: string;
  provider?: VideoProvider;
  /** YouTube/Vimeo id (for provider youtube|vimeo). */
  id?: string;
  /** File URL for self-hosted video (provider "file"), e.g. a Supabase Storage URL. */
  src?: string;
  /** Optional .vtt captions for self-hosted video. */
  captions?: string;
  /** Poster — auto for YouTube; required for Vimeo/self-hosted. */
  poster?: string;
}

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  { src: pumpToPlug, alt: "From Pump to Plug webinar", caption: "From Pump to Plug — webinar" },
  { src: evFamily, alt: "Family at an EV ride & drive", caption: "Ride & Drive — Atlanta, GA" },
  { src: evCharging, alt: "Charging an EV at home", caption: "Home charging demo" },
  { src: workforce, alt: "Clean-energy workforce training", caption: "Workforce Summit — Detroit, MI" },
  { src: steamEducation, alt: "Students at a STEAM event", caption: "STEAM education day" },
  { src: heavyDuty, alt: "Electric heavy-duty truck", caption: "Fleet electrification workshop" },
  { src: micromobility, alt: "E-bikes and micromobility", caption: "Micromobility expo" },
  { src: evSavings, alt: "EV cost savings", caption: "Cost-of-ownership clinic" },
  { src: evWinter, alt: "EV in winter conditions", caption: "Winter range workshop" },
  { src: reducedEmissions, alt: "Cleaner air community event", caption: "Community air-quality event" },
];

export const GALLERY_VIDEOS: GalleryVideo[] = [
  // YouTube/Vimeo — replace sample IDs with your real recap videos.
  { id: "aqz-KE-bpKQ", title: "Event recap (sample — replace)", provider: "youtube" },
  { id: "dQw4w9WgXcQ", title: "How EVs save thousands (sample — replace)", provider: "youtube" },

  // Self-hosted example — upload an MP4 to a Supabase Storage public bucket and
  // paste its URL + a poster image. Uncomment to use:
  // {
  //   provider: "file",
  //   title: "Ride & Drive — Atlanta recap",
  //   src: "https://<ref>.supabase.co/storage/v1/object/public/gallery/atlanta-recap.mp4",
  //   poster: pumpToPlug,
  //   // captions: "https://<ref>.supabase.co/storage/v1/object/public/gallery/atlanta-recap.en.vtt",
  // },
];
