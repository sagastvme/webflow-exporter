(function() {
  // Function to remove all badges
  function removeBadge() {
    const badges = document.querySelectorAll('.w-webflow-badge');
    badges.forEach(badge => {
      if (badge.parentNode) {
        badge.parentNode.removeChild(badge);
      }
    });
  }

  // Remove badge immediately if it exists
  removeBadge();

  // Create an observer to monitor the DOM for additions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      removeBadge();
    });
  });

  // Start observing document.body for changes in children or subtree
  observer.observe(document.body, { childList: true, subtree: true });
})();