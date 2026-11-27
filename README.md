# studio

Zhoucai Ni's photography portfolio, at [studio.zhoucai.me](https://studio.zhoucai.me). Built with React, TypeScript and Vite.

## Running it

```
npm install
npm run dev       # local dev server
npm test          # unit and component tests
npm run build     # production build (what the deploy runs)
```

Photos and their data come from a folder of selects, not from the repo's source:

```
npm run photos    # resize the selects into public/photos and rewrite src/data/collections.json
npm run colours   # recompute each photo's dominant colour from its thumbnail
```

## Credits

The **Colour** page, which places every photo on a colour wheel and groups similar colours into squares, is inspired by Simon Rosbach's colour-wheel photo browser, which I found on Instagram. The code here is written from scratch for this site.
