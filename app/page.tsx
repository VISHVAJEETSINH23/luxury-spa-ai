"use client";

import { useState, useRef, useEffect } from "react";
import LuxuryNavbar from "@/components/LuxuryNavbar";
import CinematicHero from "@/components/CinematicHero";
import EditorialSections from "@/components/EditorialSections";
import NavigationDrawer from "@/components/NavigationDrawer";
import ReservationModal from "@/components/ReservationModal";
import AIWellnessDoctor from "@/components/AIWellnessDoctor";
import WhatsAppFloatingWidget from "@/components/WhatsAppFloatingWidget";
import AmbienceSwitcher from "@/components/AmbienceSwitcher";
import { scrollToSection } from "@/lib/scroll";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isReservationOpen, setIsReservationOpen] = useState<boolean>(false);
  const [isAIDoctorOpen, setIsAIDoctorOpen] = useState<boolean>(false);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | undefined>(undefined);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>(undefined);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/audio/alexa-soundtrack.mp3");
      audio.loop = true;
      audio.preload = "auto";
      audioInstanceRef.current = audio;
    }

    return () => {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        audioInstanceRef.current = null;
      }
    };
  }, []);

  const handleToggleAudio = () => {
    const audio = audioInstanceRef.current;
    if (!audio) return;

    if (isAudioActive) {
      audio.pause();
      setIsAudioActive(false);
    } else {
      audio.volume = 0.8;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsAudioActive(true);
          })
          .catch((err) => {
            console.error("Audio playback error:", err);
          });
      }
    }
  };

  const handleOpenReservation = (experienceId?: string, promoCode?: string) => {
    setSelectedExperienceId(experienceId);
    setAppliedPromoCode(promoCode);
    setIsReservationOpen(true);
  };

  const handleApplyAIPrescription = (therapyId: string, promoCode: string) => {
    setSelectedExperienceId(therapyId);
    setAppliedPromoCode(promoCode);
    setIsReservationOpen(true);
  };

  const handleSelectMenuLink = (target: string) => {
    if (target === "admin") {
      window.location.href = "/admin";
      return;
    }
    // Goes through Lenis so the drawer glides to the section like the navbar.
    scrollToSection(target);
  };

  return (
    <main className="relative min-h-screen bg-[#07090b] text-[#f7f4ee]">
      {/* 2. Floating Glassmorphic Luxury Navbar */}
      <LuxuryNavbar
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenReservation={() => handleOpenReservation()}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
      />

      {/* 3. Master 4-Act Continuous Canvas Journey */}
      <CinematicHero
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenReservation={() => handleOpenReservation()}
      />

      {/* 4. Deep-Dive Luxury Editorial Sections Below Canvas */}
      <EditorialSections
        onOpenReservation={handleOpenReservation}
        onOpenAIDoctor={() => setIsAIDoctorOpen(true)}
      />

      {/* 5. Floating Smart WhatsApp Concierge Widget */}
      <WhatsAppFloatingWidget />

      {/* 5B. Ambient background control (colour + motion) */}
      <AmbienceSwitcher />

      {/* 6. AI Wellness Consultant Modal */}
      <AIWellnessDoctor
        isOpen={isAIDoctorOpen}
        onClose={() => setIsAIDoctorOpen(false)}
        onApplyPrescription={handleApplyAIPrescription}
      />

      {/* 7. Fullscreen Editorial Navigation Drawer */}
      <NavigationDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectLink={handleSelectMenuLink}
        onOpenReservation={() => handleOpenReservation()}
      />

      {/* 8. VIP Sanctuary Reservation Concierge Modal */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        initialExperience={selectedExperienceId}
        initialPromoCode={appliedPromoCode}
      />
    </main>
  );
}
