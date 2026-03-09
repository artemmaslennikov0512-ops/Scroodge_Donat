// app/page.tsx — лендинг: композиция секций
"use client";

import { useEffect, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <MatrixRain
        color="#00ff41"
        fontSize={16}
        speed={11}
        density={0.58}
        speedVariance={0.18}
        className="opacity-20 z-0"
      />
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/bg-wide.png")',
          backgroundColor: "#0a0a0f",
        }}
      />
      <div className="cyber-sphere-1" />
      <div className="cyber-sphere-2" />
      <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none" />

      <LandingNav isScrolled={isScrolled} />
      <LandingHero />
      <LandingFeatures />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFaq />
      <LandingFooter />
    </div>
  );
}
