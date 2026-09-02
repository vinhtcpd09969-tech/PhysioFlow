import { useEffect } from 'react';
import Hero from '../components/home/Hero';
import ConditionsTreated from '../components/home/ConditionsTreated';
import WhyUs from '../components/home/WhyUs';
import ServicesCarousel from '../components/home/ServicesCarousel';
import Specialists from '../components/home/Specialists';
import Testimonials from '../components/home/Testimonials';

export default function Home() {
  // Smooth scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="font-jakarta bg-background overflow-hidden selection:bg-teal-500/20 min-h-screen">
      <Hero />
      <ConditionsTreated />
      <WhyUs />
      <div id="featured-services-section">
        <ServicesCarousel />
      </div>
      <Specialists />
      <Testimonials />
    </div>
  );
}
