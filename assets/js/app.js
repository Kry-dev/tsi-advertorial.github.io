// An object literal
var app = {
  init: function() {
    app.functionOne();
  },
  functionOne: function () {
  },
  scrollTop: function() {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
};
(function() {
  // your page initialization code here
  // the DOM will be available here
  app.init();
})();

window.onload = function() {
    let scrollPos = 0;
    const nav = document.querySelector('.mobile-fixed');
    
    function checkPosition() {
        let windowY = window.scrollY;
        if (windowY < scrollPos) {
            // Scrolling DOWN
            nav.classList.add('is-hidden');
            nav.classList.remove('is-visible');
        } else {
            // Scrolling UP
            nav.classList.add('is-visible');
            nav.classList.remove('is-hidden');
            
        }
        scrollPos = windowY;
    }
    
    window.addEventListener('scroll', checkPosition);
}
