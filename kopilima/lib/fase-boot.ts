// Blocking <head> script that stamps data-fase BEFORE first paint — same
// pattern (and same reasons) as sukamotret's phase-boot: the fase depends on
// the visitor's clock, so it can't be in the static HTML, and waiting for
// hydration paints a guessed palette that visibly corrects itself.
//
// It duplicates jam.ts's `fase` thresholds on purpose (a pre-paint script
// can't await the bundle). The "opens already lit" smoke test asserts this
// script and the hydrated app agree — touch one, touch both.
export const faseBootScript = () => `(function(){
var d=new Date(),m=(d.getUTCHours()*60+d.getUTCMinutes()+480)%1440;
document.documentElement.dataset.fase=(m>=300&&m<1080)?'siang':'malam';
})()`
