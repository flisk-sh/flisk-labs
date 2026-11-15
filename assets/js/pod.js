// Run a lab step in a fleet pod (https://fleet.flisk.si). The learner's own fleet key and provider key go
// straight from this page to fleet; they live in sessionStorage only and never touch any other server.
(() => {
  const root = document.querySelector('[data-pod-panel]');
  if (!root) return;
  const FLEET = root.dataset.fleet || 'https://fleet.flisk.si';
  const LAB = root.dataset.lab;
  const PROVIDERS = { e2b: 'X-E2B-Key', daytona: 'X-Daytona-Key', freestyle: 'X-Freestyle-Key', tensorlake: 'X-Tensorlake-Key', upstash: 'X-Upstash-Key' };
  const $ = (s, r = document) => r.querySelector(s);
  const store = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { return null; } };
  const doneKey = 'practice:done:' + LAB;
  const done = () => { try { return new Set(JSON.parse(localStorage.getItem(doneKey) || '[]')); } catch { return new Set(); } };
  const saveDone = (set) => { try { localStorage.setItem(doneKey, JSON.stringify([...set])); } catch {} };

  const fleetKey = $('[data-pod-fleet-key]', root), provider = $('[data-pod-provider]', root), providerKey = $('[data-pod-provider-key]', root), status = $('[data-pod-status]', root);
  fleetKey.value = store('practice:fleet') || ''; providerKey.value = store('practice:pkey') || ''; provider.value = store('practice:provider') || 'e2b';
  const say = (t, bad) => { status.textContent = t; status.dataset.bad = bad ? '1' : ''; };
  const headers = () => ({ authorization: 'Bearer ' + fleetKey.value.trim(), 'content-type': 'application/json', [PROVIDERS[provider.value]]: providerKey.value.trim() });
  const call = async (method, path, body) => {
    const res = await fetch(FLEET + path, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'fleet answered ' + res.status);
    return data;
  };
  const save = () => { store('practice:fleet', fleetKey.value.trim()); store('practice:pkey', providerKey.value.trim()); store('practice:provider', provider.value); };

  let podId = store('practice:pod:' + LAB), starting = null;
  const ensurePod = async () => {
    if (podId) return podId;
    if (!fleetKey.value.trim() || !providerKey.value.trim()) throw new Error('Add your fleet key and your ' + provider.value + ' key first.');
    save();
    starting = starting || (async () => {
      say('Starting a pod on ' + provider.value + '…');
      const made = await call('POST', '/v1/pods', { cpu: 2, ram: 4, provider: provider.value });
      podId = made.id; store('practice:pod:' + LAB, podId);
      const setup = root.dataset.setup;
      if (setup) { say('Setting the pod up…'); const r = await call('POST', '/v1/pods/' + encodeURIComponent(podId) + '/run', { command: setup, timeout: 600 }); if (r.exitCode !== 0) say('Pod setup exited ' + r.exitCode + ': ' + (r.stderr || r.stdout || '').slice(-300), true); }
      say('Pod ready.'); return podId;
    })().finally(() => { starting = null; });
    return starting;
  };

  const progress = () => { const n = done().size, el = $('[data-pod-progress]'); if (el) el.textContent = n + ' of ' + root.dataset.steps + ' steps passed' + (n >= +root.dataset.steps ? ' · lab complete' : ''); };
  const mark = (id, ok) => { const li = document.getElementById(id), set = done(); if (ok) set.add(id); else set.delete(id); saveDone(set); if (li) li.dataset.passed = ok ? '1' : ''; document.querySelectorAll('.step-toc a[href="#' + id + '"]').forEach((a) => a.parentElement.dataset.passed = ok ? '1' : ''); progress(); };
  done().forEach((id) => mark(id, true));
  progress();

  document.addEventListener('click', async (e) => {
    const run = e.target.closest('[data-pod-run]');
    if (run) {
      const li = run.closest('.guide-step'), out = $('[data-pod-out]', li), cmd = run.dataset.podRun;
      run.disabled = true; out.hidden = false; out.textContent = 'Running…';
      try {
        const id = await ensurePod();
        const r = await call('POST', '/v1/pods/' + encodeURIComponent(id) + '/run', { command: cmd, timeout: 300 });
        out.textContent = ((r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')).trim() || '(no output)';
        const ok = r.exitCode === 0; mark(li.id, ok);
        out.dataset.ok = ok ? '1' : ''; out.insertAdjacentText('beforeend', '\n\nexit ' + r.exitCode + (ok ? ' · step passed' : ' · step failed: ' + li.querySelector('.guide-expect').textContent));
      } catch (err) { out.textContent = err.message; out.dataset.ok = ''; say(err.message, true); }
      run.disabled = false;
    }
    if (e.target.closest('[data-pod-stop]')) {
      if (!podId) return say('No pod running.');
      try { await call('DELETE', '/v1/pods/' + encodeURIComponent(podId)); } catch (err) { return say(err.message, true); }
      podId = null; store('practice:pod:' + LAB, null); say('Pod stopped.');
    }
    if (e.target.closest('[data-pod-reset]')) { saveDone(new Set()); location.reload(); }
  });
  [fleetKey, providerKey, provider].forEach((el) => el.addEventListener('change', save));
})();
