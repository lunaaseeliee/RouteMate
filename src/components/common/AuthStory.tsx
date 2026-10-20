import React from 'react';
import { Brand } from './Brand';
import { JourneyArtwork } from './JourneyArtwork';
export function AuthStory() {
  return <aside className="auth-story"><Brand/><div><p className="rm-eyebrow">A GOOD JOURNEY STARTS HERE</p><h1>A familiar route.<br/>A new connection.</h1><p>Find your people, share the journey, and make everyday travel feel a little more worthwhile.</p></div><JourneyArtwork/><p className="auth-story-footnote">Your next chapter is just a ride away.</p></aside>;
}
