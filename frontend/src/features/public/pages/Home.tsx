import { useState, useEffect } from 'react';
import Hero from '../components/home/Hero';
import ServicesCarousel from '../components/home/ServicesCarousel';
import Specialists from '../components/home/Specialists';
import Testimonials from '../components/home/Testimonials';
import ChatbotWidget from '../components/chatbot/ChatbotWidget';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Smooth scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="font-jakarta bg-background overflow-hidden selection:bg-primary/20 selection:text-primary min-h-screen">
      <Hero />
      <div id="featured-services-section">
        <ServicesCarousel />
      </div>
      <Specialists />
      <Testimonials />
      <ChatbotWidget isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
    </div>
  );
}
