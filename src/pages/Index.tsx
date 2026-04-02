import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import FeaturesSection from "@/components/FeaturesSection";
import PatientsSection from "@/components/PatientsSection";
import SpecializationsSection from "@/components/SpecializationsSection";
import ForWhoSection from "@/components/ForWhoSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import AppSection from "@/components/AppSection";
import FaqSection from "@/components/FaqSection";
import CtaSection from "@/components/CtaSection";
import FooterSection from "@/components/FooterSection";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <StatsBar />
    <FeaturesSection />
    <PatientsSection />
    <SpecializationsSection />
    <ForWhoSection />
    <TestimonialsSection />
    <PricingSection />
    <AppSection />
    <FaqSection />
    <CtaSection />
    <FooterSection />
    <WhatsAppFloat />
  </div>
);

export default Index;
