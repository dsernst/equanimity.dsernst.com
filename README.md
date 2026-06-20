# Equanimity

A meditation session logger. Press buttons on a handheld controller to timestamp mental events — without opening your eyes or reaching for the keyboard.

Built for long sits where you want a physical, eyes-closed way to note what comes up and review the timeline afterward.

## How it works

The app listens for keyboard events (from a controller in **keyboard mode**) and logs each D-pad press on release:

| Direction | Key | Label                                     |
| --------- | --- | ----------------------------------------- |
| Up        | `e` | "Start Again" — distracted mind           |
| Right     | `c` | "Craving"                                 |
| Left      | `d` | "Hatred"                                  |
| Down      | `f` | "Breathing" — too agitated for sensations |

On press, the label is spoken aloud. Holds longer than 400ms are recorded as holds with duration. Entries persist in `localStorage` and can be exported as TSV.

## Controller setup

Tested with an [**8BitDo Micro**](https://www.amazon.com/dp/B0CDG2HKBF/) in keyboard mode, rotated so the D-pad is on top. Other bluetooth controllers should work too, and be easy to adapt. Reach out if interested.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js, React, TypeScript, Tailwind CSS.
