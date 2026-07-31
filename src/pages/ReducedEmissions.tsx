import { Leaf } from "lucide-react";
import { type ContentShot } from "@/components/ContentPageLayout";
import EditableContentPage from "@/components/EditableContentPage";
import { reducedEmissionsContent } from "@/data/pages/reduced-emissions";
import reducedEmissions from "@/assets/reduced-emissions.jpg";
import sustainableAviation from "@/assets/sustainable-aviation.jpg";
import maritime from "@/assets/maritime.jpg";
import micromobility from "@/assets/micromobility.jpg";

const gallery: ContentShot[] = [
  { src: reducedEmissions, caption: "Zero tailpipe emissions on the road" },
  { src: sustainableAviation, caption: "Cleaner fuels for low-carbon flight" },
  { src: maritime, caption: "Electrifying ports and shipping lanes" },
  { src: micromobility, caption: "Clean mobility for short urban trips" },
];

const video = { youtubeId: "M69GBL0IDzI", title: "Energy 101: Electric Vehicles" };

const ReducedEmissions = () => (
  <EditableContentPage
    path="/reduced-emissions"
    {...reducedEmissionsContent}
    heroImage={reducedEmissions}
    icon={Leaf}
    gallery={gallery}
    video={video}
  />
);

export default ReducedEmissions;
