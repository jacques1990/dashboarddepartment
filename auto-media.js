
/* ===== Auto Media Loader (newest-first from movies.json) =====
   - Looks for a <video id="miniPlayer"> and sets its src to the newest movie.
   - If the slideshow initializer is present (window.injectNewestSlide),
     it will inject the newest movie as the first slide.
*/
(function(){
  const MOVIES_URL = 'movies.json';

  function pickNewest(list){
    if (!Array.isArray(list) || !list.length) return null;
    // prefer 'addedAt' if present; otherwise fall back to last item
    const withTime = list.filter(x => typeof x.addedAt === 'number');
    if (withTime.length){
      withTime.sort((a,b)=>b.addedAt - a.addedAt);
      return withTime[0];
    }
    return list[list.length - 1];
  }

  fetch(MOVIES_URL, {cache:'no-store'})
    .then(r=>r.json())
    .then(list=>{
      const newest = pickNewest(list);
      if (!newest || !newest.url) return;

      // 1) Mini Player
      const mini = document.getElementById('miniPlayer');
      if (mini){
        // If the video tag has <source>, update that; else set src directly
        const srcEl = mini.querySelector('source');
        if (srcEl){ srcEl.src = newest.url; mini.load(); }
        else { mini.src = newest.url; }
      }

      // 2) Slideshow support (optional)
      if (typeof window.injectNewestSlide === 'function'){
        window.injectNewestSlide({ type:'video', src: newest.url }, /*toFront=*/true);
      }
    })
    .catch(()=>{/* silently ignore */});
})();
