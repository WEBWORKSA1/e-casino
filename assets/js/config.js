/* e.casino — site configuration (edit this file to switch features on).
   Everything here is optional; the site works with the defaults. */
window.EC_CONFIG = {
  siteName: "e.casino",
  // Owner contact page used in the top bar and as a fallback for every form.
  contactUrl: "https://web.works/contact",

  // Google AdSense. Auto ads run from the <head> tag on every page.
  // To add manual units, create ad units in AdSense and paste their slot IDs here.
  adClient: "ca-pub-6620975821265271",
  adSlots: { inArticle: "", articleEnd: "", sidebar: "", home: "", lab: "" },

  // Optional Google Analytics 4 measurement ID, e.g. "G-XXXXXXX". Empty = no analytics.
  gaId: "",

  // Forms are delivered by FormSubmit. After the first submission, FormSubmit emails an
  // activation link and a random alias string; paste that alias here to stop using the
  // built-in (encoded) address entirely. Example: "a1b2c3d4e5f6..."
  formAlias: "",

  // Extra donation channels. Leave blank to hide. PayPal works out of the box.
  donate: {
    paypal: true,
    buyMeACoffee: "",   // e.g. "https://buymeacoffee.com/yourname"
    kofi: "",           // e.g. "https://ko-fi.com/yourname"
    githubSponsors: "", // e.g. "https://github.com/sponsors/yourname"
    patreon: "",        // e.g. "https://patreon.com/yourname"
    stripeLink: "",     // a Stripe Payment Link
    btc: "",            // wallet address
    eth: ""             // wallet address
  }
};
