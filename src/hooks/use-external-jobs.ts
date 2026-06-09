// Fetches real openings from EV companies' public ATS boards via the /api/jobs
// proxy (configured by the JOB_BOARDS env var) and maps them onto the Job shape
// the Careers page renders. With no boards configured the proxy returns [], so
// the page falls back to its curated static list.

import { useQuery } from "@tanstack/react-query";
import { type Job } from "@/data/careers";
import jobFallback from "@/assets/workforce.jpg";

interface FeedJob {
  title: string;
  company: string;
  department: string;
  location: string;
  type: string;
  description: string;
  descriptionFull?: string;
  url: string;
}

const mapToJob = (j: FeedJob, index: number): Job => ({
  title: j.title,
  company: j.company,
  department: j.department || "EV Industry",
  location: j.location || "See listing",
  type: j.type || "Full-time",
  description: j.description || `Open role at ${j.company}.`,
  descriptionFull: j.descriptionFull || j.description,
  image: jobFallback,
  applyUrl: j.url,
  featured: index < 2, // surface the first couple in the Featured section
});

async function fetchExternalJobs(): Promise<Job[]> {
  try {
    const res = await fetch("/api/jobs");
    if (!res.ok) return [];
    const data = await res.json();
    const list: FeedJob[] = Array.isArray(data?.jobs) ? data.jobs : [];
    return list.map(mapToJob);
  } catch {
    return [];
  }
}

export function useExternalJobs(): { jobs: Job[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["external-jobs"],
    queryFn: fetchExternalJobs,
    staleTime: 60 * 60 * 1000, // 1h — matches the CDN cache on /api/jobs
  });
  return { jobs: q.data ?? [], loading: q.isLoading };
}
