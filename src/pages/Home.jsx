import React from 'react';
import Hero from '../components/home/Hero';
import About from '../components/home/About';
import Projects from '../components/home/Projects';
import Services from '../components/home/Services';
import FAQ from '../components/home/FAQ';

function Home() {
  return (
    <>
      <Hero />
      <About />
      <Projects />
      <Services />
      <FAQ />
    </>
  );
}

export default Home;
