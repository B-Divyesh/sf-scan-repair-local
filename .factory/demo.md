# Demo sandbox

Open `/demo` or select **Try it with sample data** from the first screen. The demo loads one realistic archival field-notes page with seeded recognised text and a 93% confidence marker.

The banner stays visible while demo mode is active. **Reset demo** discards the in-memory sample workspace and creates it again. **Start for real** returns to `/`; neither route reads nor writes document data to local storage, IndexedDB, or the real workspace. The demo’s only document state is the page array in that tab’s memory.

The sample source is `public/sample-scan.svg`. It is bundled with the app and cached by the service worker so `/demo` reloads offline after the first visit.
