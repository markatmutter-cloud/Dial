// homeSections — the copy model for the Home rows, in the shape of
// topTabs.js: one file owns the strings, every consumer reads them, so a
// label can't drift between surfaces.
//
// Each row carries an eyebrow (where the row comes from) and a descriptor
// (what the row is + where "View all" lands). Together they are how the
// landing page answers "it's not clear what's going on" WITHOUT the
// description paragraph at the top that Mark has ruled out: the explanation
// sits on the section it explains, one line each, skimmed rather than read.
//
// Rules if you edit these:
// - An eyebrow must NOT restate its heading. It names the source.
// - A descriptor names the MECHANISM and the DESTINATION. It is not a
//   tagline, and it never claims a number (numbers are the `count` prop,
//   derived at render, because hardcoded counts rot).
// - No em-dashes; Mark greps for them in user-facing copy.

export const HOME_SECTIONS = {
  recentAdded: {
    heading: "Recently added",
    eyebrow: "Dealer listings",
    descriptor: "The newest arrivals across every dealer we follow, swept three times a day.",
  },
  articles: {
    heading: "Articles",
    eyebrow: "Magazines and journals",
    descriptor: "Watch writing from around the web, indexed so you can search it like listings.",
  },
  recentSold: {
    heading: "Recently sold",
    eyebrow: "Sold archive",
    descriptor: "What things actually went for, from dealer sales and the auction rooms.",
  },
  guides: {
    heading: "Know the references",
    eyebrow: "Reference guides",
    descriptor: "Deep guides to single references: what to look for, what to avoid, why they matter.",
  },
  endingNext: {
    heading: "Ending next at auction",
    eyebrow: "Auction houses",
    descriptor: "Lots closing soonest at the houses we track, with the current bid.",
  },
};

export default HOME_SECTIONS;
