async function runN(n, isConcurrent) {
  const urlBase = 'http://127.0.0.1:3000';
  let totalTime = 0;
  for (let i = 0; i < n; i++) {
    const start = performance.now();
    try {
      if (isConcurrent) {
        const [r1, r2] = await Promise.all([
          fetch(`${urlBase}/api/settings`),
          fetch(`${urlBase}/api/weather`)
        ]);
        if(r1.ok) await r1.json();
        if(r2.ok) await r2.json();
      } else {
        const res1 = await fetch(`${urlBase}/api/settings`);
        if(res1.ok) await res1.json();
        const res2 = await fetch(`${urlBase}/api/weather`);
        if(res2.ok) await res2.json();
      }
    } catch(e) {
        console.error(e)
    }
    const end = performance.now();
    totalTime += (end - start);
  }
  return totalTime / n;
}

async function measure() {
  const urlBase = 'http://127.0.0.1:3000';

  // Warm up
  try {
    for (let i = 0; i < 5; i++) {
      await fetch(`${urlBase}/api/settings`);
      await fetch(`${urlBase}/api/weather`);
    }
  } catch(e) {}

  const seqAvg = await runN(10, false);
  console.log(`Sequential time: ${seqAvg.toFixed(2)}ms`);

  const conAvg = await runN(10, true);
  console.log(`Concurrent time: ${conAvg.toFixed(2)}ms`);
}

measure();
