import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, MapPin, Navigation, Search, Car, Wallet, Leaf, Users } from 'lucide-react';
import { Brand } from '../common/Brand';
import { JourneyArtwork } from '../common/JourneyArtwork';
interface LandingPageProps { onNavigate: (view: string, data?: any) => void; }
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [pickupCity, setPickupCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  return <div className="rm-landing">
    <section className="landing-hero rm-container">
      <div className="hero-copy">
        <p className="rm-eyebrow"><span className="live-dot"/> YOUR EVERYDAY JOURNEY, REIMAGINED</p>
        <h1>Going places.<br/><span>Better together.</span></h1>
        <p className="hero-description">Your next ride could be the start of a great connection. Find someone heading your way, share the cost, and enjoy the journey.</p>
        <div className="hero-actions"><button className="rm-button" onClick={() => onNavigate('register')}>Find your RouteMate <ArrowUpRight size={19}/></button><button className="rm-text-button" onClick={() => onNavigate('post-ride')}>Offer a ride <ArrowRight size={17}/></button></div>
        <div className="hero-note"><span className="mini-people"><span>R</span><span>M</span><span>U</span></span><p>A shared route.<br/><strong>A better way to get there.</strong></p></div>
      </div>
      <JourneyArtwork/>
    </section>
    <div className="rm-container">
      <form className="landing-search" onSubmit={e => { e.preventDefault(); onNavigate('find-routemate', { pickupCity, destinationCity }); }}>
        <div className="search-intro"><span className="rm-eyebrow">LET’S GET GOING</span><h2>Where to next?</h2></div>
        <label><MapPin size={20}/><span><span>Leaving from</span><input required aria-label="Leaving from" placeholder="Your pickup city" value={pickupCity} onChange={e => setPickupCity(e.target.value)}/></span></label>
        <label><Navigation size={20}/><span><span>Heading to</span><input required aria-label="Heading to" placeholder="Your destination" value={destinationCity} onChange={e => setDestinationCity(e.target.value)}/></span></label>
        <button className="rm-button" type="submit"><Search size={18}/> Find a ride</button>
      </form>
      <div className="landing-values"><span><Wallet size={17}/> Share the travel costs</span><span><Users size={17}/> Meet people on your route</span><span><Leaf size={17}/> Make room for a greener commute</span></div>
    </div>
    <section className="rm-container how-section" id="how-it-works">
      <div className="section-heading"><div><p className="rm-eyebrow">LESS PLANNING. MORE LIVING.</p><h2>Your way there, in three steps.</h2></div><p>From your daily commute to a weekend away,<br/>make the most of every kilometre.</p></div>
      <div className="how-grid">{[
        { icon: Search, title: 'Find your way', text: 'Choose your pickup and destination. Explore rides that fit your plans.' },
        { icon: Users, title: 'Meet your RouteMate', text: 'Check the ride details and driver profile, then request your seat.' },
        { icon: Car, title: 'Enjoy the journey', text: 'Keep track of your ride, meet at your pickup, and head out together.' }
      ].map((step, i) => <article key={step.title}><div className="step-top"><span><step.icon size={23}/></span><small>0{i + 1}</small></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
    </section>
    <section className="rm-container"><div className="offer-banner"><div><p className="rm-eyebrow">GOT A SEAT TO SPARE?</p><h2>Your route. A little more rewarding.</h2><p>Turn your empty seats into shared journeys. You choose the route, time, and price.</p></div><button className="rm-button rm-button-white" onClick={() => onNavigate('post-ride')}>Offer a ride <ArrowUpRight size={18}/></button></div></section>
    <footer className="rm-container landing-footer"><Brand/><p>Made for the journeys we share.</p><button className="rm-text-button" onClick={() => onNavigate('login')}>Let’s get moving <ArrowRight size={16}/></button></footer>
  </div>;
};
