# Manual Test Checklist

Start the app with `npm start`. Use a temporary Kit and two samples that sound
clearly different. Set Humanize to 0 for the first playback checks.

## Layers

- [ ] In Kit, click a channel waveform. The editor opens with one Main layer covering 1-127.
- [ ] Click Add Layer and give each layer a different sample. Switching layers shows the correct sample and waveform.
- [ ] Set the Soft layer's Range end to 63. The ranges should read 1-63 and 64-127.
- [ ] Change Layer trim (dB) and preview it. Only that layer's volume should change.
- [ ] Add and remove a third layer. Ranges still cover 1-127, and the final remaining layer cannot be removed.

## Waveform editing

- [ ] In Audio Edit, select part of the waveform, trim, and normalize. Compare Preview Original and Preview Edited, then use Reset to clear the edits.
- [ ] In Beat Alignment, move the marker, try -10 ms and +10 ms, preview, and reset it.
- [ ] Make a waveform edit, then switch layers. A discard prompt appears; declining keeps the edit and current layer.
- [ ] Change a sample assignment, range, or trim, then Cancel. Reopening shows the previously applied settings.

## Playback

- [ ] Set up the two different samples again with ranges 1-63 and 64-127. Click Apply and reopen; the settings are retained.
- [ ] In Pattern, add notes and right-click them to set velocities to 32, 63, 64, and 100. With Humanize at 0, 32/63 play Soft and 64/100 play Hard, with no doubled hits.
- [ ] In Kit, press Hit. It plays the sample assigned to velocity 64.
- [ ] Increase Humanize while playing. Timing and strength vary slightly; returning it to 0 restores the authored playback.

## Saving and usability

- [ ] Edit a factory sample and choose Save Copy & Apply. A user copy is created, and the factory sample stays unchanged.
- [ ] Assign the same user sample to two layers, edit it, and choose Replace & Apply. Both layers use the updated sound.
- [ ] Save a Kit using a user sample, switch Kits, and open Manage Samples. The saved Kit is listed as using that sample, and Delete is disabled.
- [ ] Save the test Kit, refresh, and load it again. Then export and import it. Layers, samples, trim, and alignment should survive both checks.
- [ ] Narrow the window and try keyboard navigation with Tab and Enter/Space. Essential controls remain reachable. Try touch too, if available.

## Problems found

Record the step, what happened, and what you expected:

-
