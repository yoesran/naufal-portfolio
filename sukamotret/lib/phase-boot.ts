import { STUDIO } from './content'

// A blocking <head> script that stamps data-phase BEFORE the first paint.
//
// Why this exists: the sun phase depends on the visitor's clock, so it can't be
// known at build time (static export) — but if we wait for React to hydrate,
// the page paints with a GUESSED accent and then visibly corrects itself. The
// hero's key word ("memories") rendered amber for ~1.1s and then faded to blue
// at midday. That flash is the bug this kills.
//
// It duplicates the golden-hour maths from `lib/sun.ts` — deliberately, because
// a pre-paint script can't wait for the bundle. The coordinates are interpolated
// from STUDIO so they can't drift, and `tests/smoke.spec.ts` asserts the phase
// this script picks equals the one the app computes (and that the hero's colour
// never changes after paint). If you touch `sunPhase`, touch this too — the test
// will tell you.
export const phaseBootScript = () => `(function(){
var LAT=${STUDIO.lat},LON=${STUDIO.lon},OFF=${STUDIO.utcOffsetHours};
var rad=Math.PI/180,t=Date.now();
var toJD=function(ms){return ms/86400000+2440587.5};
var lw=-LON,n=Math.round(toJD(t)-2451545.0-0.0009-lw/360);
var Js=2451545.0+0.0009+lw/360+n;
var M=(357.5291+0.98560028*(Js-2451545.0))%360;
var C=1.9148*Math.sin(M*rad)+0.02*Math.sin(2*M*rad)+0.0003*Math.sin(3*M*rad);
var lam=(M+C+180+102.9372)%360;
var Jt=Js+0.0053*Math.sin(M*rad)-0.0069*Math.sin(2*lam*rad);
var dec=Math.asin(Math.sin(lam*rad)*Math.sin(23.44*rad));
var at=function(a){
var c=(Math.sin(a*rad)-Math.sin(LAT*rad)*Math.sin(dec))/(Math.cos(LAT*rad)*Math.cos(dec));
var w=Math.acos(Math.max(-1,Math.min(1,c)))/rad/360;
return [(Jt-w-2440587.5)*86400000,(Jt+w-2440587.5)*86400000];};
var h=at(-0.833),g=at(6),b=at(-6);
var m=function(ms){return Math.floor((((ms/60000+OFF*60)%1440)+1440)%1440)};
var f=m(t),rise=m(h[0]),set=m(h[1]),gmEnd=m(g[0]),geStart=m(g[1]),dawn=m(b[0]),dusk=m(b[1]);
document.documentElement.dataset.phase=
((f>=rise&&f<=gmEnd)||(f>=geStart&&f<=set))?'golden':
(f>=gmEnd&&f<geStart)?'day':
((f>=dawn&&f<rise)||(f>set&&f<=dusk))?'blue':'night';
})()`
