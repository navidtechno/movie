// Offline test: stubs the MovieBox API with fixture data shaped like real
// responses, then exercises catalog/meta/stream handlers end to end.
const path = require("path");

const FIX = {
  search: {
    results: [
      {
        topicType: "subject",
        subjects: [
          {
            subjectId: "1857349212451623008", subjectType: 1, title: "Project Hail Mary",
            description: "A lone astronaut...", releaseDate: "2026-03-20", genre: "Sci-Fi,Adventure",
            cover: { url: "https://pbcdn.aoneroom.com/image/x.webp" },
            stills: { url: "https://pbcdn.aoneroom.com/image/y.webp" },
            imdbRatingValue: "8.1", duration: "2h 26m",
          },
        ],
      },
    ],
  },
  subject: {
    subjectId: "7845473610491125400", subjectType: 2, title: "The Mentalist",
    description: "A detective...", releaseDate: "2008-09-23", genre: "Crime,Drama",
    cover: { url: "https://pbcdn.aoneroom.com/image/z.webp" }, stills: null,
    imdbRatingValue: "8.1", seNum: 7,
  },
  seasons: {
    seasons: [
      { season: 1, subjectId: "7845473610491125400", title: "Season 1", episodeCount: 2, releaseDate: "2008-09-23", cover: null },
      { season: 2, subjectId: "7845473610491125400", title: "Season 2", episodeCount: 1, releaseDate: "2009-09-24", cover: null },
    ],
  },
  playInfo: {
    streams: [
      { id: "s1", url: "https://macdn.aoneroom.com/v/720/index.m3u8", resolutions: "720", format: "hls" },
      { id: "s2", url: "https://macdn.aoneroom.com/v/1080/index.m3u8", resolutions: "1080", format: "hls" },
      { id: "s3", url: "https://macdn.aoneroom.com/v/480.mp4", resolutions: "480", format: "mp4" },
    ],
  },
  captions: [{ language: "en", url: "https://pbcdn.aoneroom.com/sub/en.srt", format: "srt" }],
  trending: { items: [{ subject: null }] },
  dailyRec: { subjects: [] },
};
FIX.trending.items[0].subject = { ...FIX.search.results[0].subjects[0], subjectType: 2, title: "Trending Show" };
FIX.dailyRec.subjects = [FIX.search.results[0].subjects[0]];

// Stub ./moviebox before addon.js loads it
const mbPath = path.resolve(__dirname, "src/moviebox.js");
require.cache[mbPath] = {
  id: mbPath, filename: mbPath, loaded: true,
  exports: {
    search: async () => FIX.search,
    getSubject: async () => FIX.subject,
    seasonInfo: async () => FIX.seasons,
    resources: async () => ({ resources: [] }),
    playInfo: async () => FIX.playInfo,
    streamCaptions: async () => FIX.captions,
    trending: async () => FIX.trending,
    dailyRec: async () => FIX.dailyRec,
  },
};

const addon = require("./src/addon");
const { addonBuilder } = require("stremio-addon-sdk");

(async () => {
  // reach into the sdk interface handlers via a local call
  const iface = addon;
  const get = (p) =>
    new Promise((resolve, reject) => {
      const http = require("http");
      http.get(`http://127.0.0.1:7124${p}`, (r) => {
        let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => resolve(JSON.parse(d)));
      }).on("error", reject);
    });

  const { serveHTTP } = require("stremio-addon-sdk");
  serveHTTP(iface, { port: 7124 });
  await new Promise((r) => setTimeout(r, 800));

  const cat = await get("/catalog/movie/moviebox-movies/search=avengers.json");
  console.log("CATALOG metas:", cat.metas.length, "| first:", cat.metas[0] && cat.metas[0].name, "| type:", cat.metas[0] && cat.metas[0].type);

  const meta = await get("/meta/series/mb:7845473610491125400.json");
  console.log("META name:", meta.meta.name, "| videos:", (meta.meta.videos || []).length,
    "| first video id:", meta.meta.videos && meta.meta.videos[0].id);

  const stream = await get("/stream/series/mb:7845473610491125400:1:2.json");
  console.log("STREAMS:", stream.streams.length, "| best:", stream.streams[0] && stream.streams[0].url,
    "| title:", stream.streams[0] && stream.streams[0].title,
    "| subs:", stream.streams[0] && (stream.streams[0].subtitles || []).length);

  const mstream = await get("/stream/movie/mb:1857349212451623008.json");
  console.log("MOVIE STREAMS:", mstream.streams.length);
  process.exit(0);
})().catch((e) => { console.error("TEST FAIL", e); process.exit(1); });
