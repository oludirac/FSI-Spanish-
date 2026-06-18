"use client";

import { useRouter } from "next/navigation";
import StudyPage from "@/components/StudyPage";

export default function GuidePage() {
  const router = useRouter();
  return <StudyPage onBack={() => router.push("/")} />;
}
