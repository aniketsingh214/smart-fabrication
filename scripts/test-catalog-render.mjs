async function test() {
  const res = await fetch('http://localhost:3000/catalog');
  const html = await res.text();
  const slugMatches = html.match(/\/catalog\/pin-[a-z0-9\-]+/g) || [];
  console.log('Matches for /catalog/pin- on page 1:', slugMatches.length);
  console.log('Sample links:', slugMatches.slice(0, 5));

  const imgMatches = html.match(/res\.cloudinary\.com[^\s"'>)]+/g) || [];
  console.log('Cloudinary images rendered:', imgMatches.length);
  console.log('Sample Cloudinary URLs:', imgMatches.slice(0, 3));

  // Test subcategory iron-pipe-gates
  const subRes = await fetch('http://localhost:3000/catalog?category=main-gates&sub=iron-pipe-gates');
  const subHtml = await subRes.text();
  const subSlugs = subHtml.match(/\/catalog\/pin-[a-z0-9\-]+/g) || [];
  console.log('Matches for iron-pipe-gates subcategory:', subSlugs.length);

  // Test metal-doors category
  const doorRes = await fetch('http://localhost:3000/catalog?category=metal-doors');
  const doorHtml = await doorRes.text();
  const doorSlugs = doorHtml.match(/\/catalog\/pin-[a-z0-9\-]+/g) || [];
  console.log('Matches for metal-doors category:', doorSlugs.length);
}
test().catch(console.error);
