async function measure() {
  const urlBase = 'http://127.0.0.1:3000';

  // Warm up
  try {
    await fetch(`${urlBase}/api/settings`);
    await fetch(`${urlBase}/api/weather`);
  } catch(e) {}

  // Sequential
  const startSeq = performance.now();
  try {
    const res1 = await fetch(`${urlBase}/api/settings`);
    if(res1.ok) { await res1.json(); }
    const res2 = await fetch(`${urlBase}/api/weather`);
    if(res2.ok) { await res2.json(); }
  } catch(e) {}
  const endSeq = performance.now();
  console.log(`Sequential time: ${(endSeq - startSeq).toFixed(2)}ms`);

  // Concurrent
  const startCon = performance.now();
  try {
    const [r1, r2] = await Promise.all([
      fetch(`${urlBase}/api/settings`),
      fetch(`${urlBase}/api/weather`)
    ]);
    if(r1.ok) { await r1.json(); }
    if(r2.ok) { await r2.json(); }
  } catch(e) {}
  const endCon = performance.now();
  console.log(`Concurrent time: ${(endCon - startCon).toFixed(2)}ms`);
}

measure();
