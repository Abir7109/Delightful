/* ============================================================
   SITE DATA — built-in defaults for Delightful Baking & Cooking
   ------------------------------------------------------------
   Single source of truth. Loaded by every page BEFORE the
   site scripts. The admin panel (admin.html) writes an overlay
   on top of these defaults via site-store.js — visitors get
   defaults + overlay, so the site always has content.
   ============================================================ */
window.DB_DEFAULTS = {
  v: 1,

  products: [
    {
      img: "assets/img/products/p01.jpg",
      name: "Signature Chocolate Truffle",
      tag: "Cakes",
      price: null,
      blurb: "Deep cocoa sponge under a slick of truffle chocolate, finished the way we like it — honest, dark and not overly sweet.",
      desc: "It's the cake most of our regulars start with. A moist cocoa sponge, a dark chocolate ganache that sets slowly, and a finish of hand-shaped truffle curls on top. Made in round and square, eggless possible on request."
    },
    {
      img: "assets/img/products/p02.jpg",
      name: "Rose-Scented Milk Delight",
      tag: "Cream · Cake",
      price: null,
      desc: "Light sponge soaked in rose-kissed milk, layered with fresh whipped cream and a soft rose water finish. Cooling, fragrant, and exactly the cake for warm evenings in Cumilla."
    },
    {
      img: "assets/img/products/p03.jpg",
      name: "Butter & Cocoa Loaf",
      tag: "Baked · Loaf",
      price: null,
      blurb: "A home-bakery classic — dense cocoa pound loaf with a crackly top that tastes of real butter.",
      desc: "No premix, no shortcuts: butter, eggs, cocoa and time. It slices clean, toasts beautifully, and pairs with chai better than most things in this world."
    },
    {
      img: "assets/img/products/p04.jpg",
      name: "Velvet Bloom Celebration Cake",
      tag: "Custom · Cake",
      price: null,
      blurb: "Soft velvet layers under a thick cream bloom — sized for birthdays and small anniversaries.",
      desc: "Airy layers of velvet sponge, whipped cream, and a gentle bloom finish. This is our default celebration cake — pick red velvet, chocolate or vanilla and tell us the size."
    },
    {
      img: "assets/img/products/p05.jpg",
      name: "Caramel Ribbon Cake",
      tag: "Cream · Cake",
      price: null,
      blurb: "Butterscotch ribbons pulled through a light sponge, crowned with toasted caramel.",
      desc: "A light sponge layered with homemade butterscotch caramel and whipped cream, finished with a crisp caramel drip and toasted shavings. The birthday favourite."
    },
    {
      img: "assets/img/products/p06.jpg",
      name: "Custom Fondant Cake",
      tag: "Custom · Fondant",
      price: null,
      blurb: "Entirely fondant-finished, made to order for engagements, Eid and every celebration.",
      desc: "For the days that deserve more than cream. We sculpt, theme and finish fondant cakes around any idea — send a reference or a rough sketch and we'll confirm the design with you first."
    },
    {
      img: "assets/img/products/p07.jpg",
      name: "Black Forest Jar",
      tag: "Jar · Dessert",
      price: null,
      blurb: "Cherry, cream and chocolate stacked in layers you can carry anywhere.",
      desc: "Our best-selling grab-and-go. Chocolate sponge, cream, sweet cherries and a chocolate cap sealed in a jar — with a spoon. Great for parties, teachers' days and little celebrations."
    },
    {
      img: "assets/img/products/p08.jpg",
      name: "Citrus Pound Cake",
      tag: "Bak · Loaf",
      price: null,
      blurb: "Zesty orange pound cake with a crackly sugar top and a dense, slow-baked heart.",
      desc: "Bright citrus against a dense, buttery crumb. Kept simple so the flavour does the talking — lovely with tea, lovely on its own."
    },
    {
      img: "assets/img/products/p09.jpg",
      name: "Mahogany Fudge Brownie",
      tag: "Brownie · Dessert",
      price: null,
      blurb: "Dense, fudgy and midnight-dark with a glossy cap and gooey centre.",
      desc: "Not a cake, not a biscuit — a proper fudgy brownie. Chocolate-forward, sides set, centre soft. Boxes of 4 and 9, ideal for gifting or hoarding."
    },
    {
      img: "assets/img/products/p10.jpg",
      name: "Pista Cream Tart",
      tag: "Custom · Cake",
      price: null,
      blurb: "Pistachio cream pooled over a short crust and showered with roasted crumble.",
      desc: "A crisp pistachio-crusted tart filled with cream and finished with a roasted pistachio crumble. Elegant, nutty, and a little bit fancy."
    },
    {
      img: "assets/img/products/p11.jpg",
      name: "Tiny Star Cupcakes",
      tag: "Cupcake · Dessert",
      price: null,
      blurb: "A dozen individually swirled cupcakes — pick your colours and flavours.",
      desc: "Soft vanilla or chocolate sponge, swirled cream on top, and your pick of colour for the party. Sold in sets of six or twelve."
    },
    {
      img: "assets/img/products/p12.jpg",
      name: "Pastel Celebration Box",
      tag: "Cupcake · Gift",
      price: null,
      blurb: "A custom box of mixed treats for card parties, mehfils and late-night cravings.",
      desc: "A little box of everything — mini pastries, jars, brownies and cupcakes arranged around your guest count. Great for Eid, mehfils, birthdays and treating yourself."
    }
  ],

  premium: (window.PREMIUM_CAKES || []).map(function (cake) {
    return { img: cake.img, name: "Premium Custom Cake", price: null };
  }),

  reviews: [
    { img: "assets/img/reviews/r1.jpg", name: "Labiba & Family", topic: "Birthday cake", time: "2 weeks ago", stars: 5, quote: "The cake was lighter than I expected and the cream was proper fresh. My daughter kept asking for another slice before we'd even cut the whole thing." },
    { img: "assets/img/reviews/r2.jpg", name: "Sadia", topic: "Black Forest Jar", time: "1 week ago", stars: 5, quote: "Ordered a couple of jars for a small gathering — they arrived neat, stacked safely, and vanished by the end of the evening." },
    { img: "assets/img/reviews/r3.jpg", name: "Photo orders", topic: "Custom theme", time: "just now", stars: 5, quote: "Sent a rough idea, came back better than the picture I sent. Confirmed the design, colour and size before baking — very patient people." },
    { img: "assets/img/reviews/r4.jpg", name: "Family Gifting", topic: "Pastel box", time: "3 days ago", stars: 5, quote: "I gifted the celebration box to my cousin. The mix of brownie, jar and mini bites meant nobody had to share a single flavour." },
    { img: "assets/img/reviews/r5.jpg", name: "", topic: "From the page", time: "recent", stars: 5, quote: "Repeat customer here. The loaf has that dense, buttery weight you only get when someone is actually baking and not just assembling." },
    { img: "assets/img/reviews/r6.jpg", name: "Eid Mezban", topic: "Themed set", time: "last month", stars: 5, quote: "Ordered a themed dessert set for our Eid get-together — every piece arrived labelled and the kids were fighting over the jars first." },
    { img: "assets/img/reviews/r7.jpg", name: "Nusrat", topic: "Crunchy jar", time: "6 days ago", stars: 5, quote: "Crunch and cream in every spoon. The jar survived the trip to my office and my whole team wanted to know who bakes it." },
    { img: "assets/img/reviews/r8.jpg", name: "Mom & Daughter", topic: "Mini bites", time: "5 days ago", stars: 5, quote: "Picked up a mixed tray for the weekend — the mini bites were gone before the tea finished cooling. Already planning the next order." },
    { img: "assets/img/reviews/r9.jpg", name: "Gift Cards", topic: "Celebration box", time: "4 days ago", stars: 5, quote: "Packaging felt properly special, the kind you don't want to crinkle. Opened it with guests and it stole the whole evening." },
    { img: "assets/img/reviews/r10.jpg", name: "Office Order", topic: "Brownie box", time: "3 days ago", stars: 5, quote: "Ordered for a small team treat — came neatly boxed and the brownies had that gooey middle that disappears first." },
    { img: "assets/img/reviews/r11.jpg", name: "Raisa", topic: "Layered cake", time: "2 days ago", stars: 5, quote: "Asked for a simple layered cake, the layers kept their shape and the cream wasn't heavy at all. My father finished his slice." },
    { img: "assets/img/reviews/r12.jpg", name: "Sunday Treat", topic: "Loaf box", time: "yesterday", stars: 5, quote: "The loaf was still warm in the box when it arrived. Buttery, dense, cut like a dream. This is my third order and it never misses." }
  ],

  faq: [
    { q: "How far in advance should I order?", a: "For simple cream or jar cakes, same-week usually works. For fondant or fully custom celebration cakes, please order 3–5 days ahead so we can block time and fresh ingredients — and message first to confirm." },
    { q: "Do you deliver to my area?", a: "We're based in Chandina, Cumilla. Local delivery around Chandina is easiest; for Cumilla town we can usually arrange it — just ask when you order and we'll confirm the day's route." },
    { q: "Can I change my design on a custom cake?", a: "Of course. Send a photo, a drawing, or even just a colour theme and a few keywords — kides, trucks, flowers, angles, characters. We'll sketch it out and confirm everything with you before we bake." },
    { q: "Do you offer eggless options?", a: "Yes — a few recipes are naturally eggless (our jars and some sponge variants) and we can make most things eggless on request. Just mention it when you order and we'll confirm the best option for your chosen cake." },
    { q: "How should I keep the cake fresh?", a: "Keep it in the fridge for cream and frosting-heavy cakes, and take it out 20–30 minutes before serving for the best texture. Jars and brownies sit happily at room temperature — just keep them sealed and patient." },
    { q: "Do you take orders for events or card parties?", a: "Absolutely — cupcakes, cake boxes, and themed desserts are our favourite event orders. Let us know your date, guest count and a rough budget, and we'll send back options you'll actually want to serve." }
  ],

  story: {
    media: "assets/img/hero-float2.jpg",
    floatB: "1K+",
    floatSmall: "friends who follow\nour little kitchen",
    lead: "“Welcome to our baking and cooking page — we started small at home, and this page grew to 1K followers the honest way: one delighted slice at a time.”",
    paragraphs: [
      "Delightful Baking & Cooking began as a home kitchen in Chandina, Cumilla — baking for family, then for neighbours, then for birthdays we'd never met. Today it's still a small, careful operation: real ingredients, baked in small batches, and finished only when it actually tastes right.",
      "Whether you're after a simple pound loaf or a fully themed celebration cake, we'd be genuinely honoured to bake for your table. Talk to us over Messenger — we usually reply fast."
    ],
    facts: [
      { b: "100%", small: "from-scratch" },
      { b: "No premix", small: "fresh each batch" },
      { b: "Cumilla", small: "baked local" }
    ],
    sigName: "The Delightful Kitchen",
    sigRole: "Chandina, Cumilla — baking since the very first batch"
  },

  cats: [
    { img: "assets/img/products/p01.jpg", imgAlt: "An assortment of cakes we bake", title: "Cakes & Celebration", link: "See cake menu" },
    { img: "assets/img/products/p09.jpg", imgAlt: "Brownies and jar desserts", title: "Brownies & Jars", link: "Grab-and-go treats" },
    { img: "assets/img/products/p07.jpg", imgAlt: "Custom themed celebration cakes", title: "Custom Themes", link: "Birthdays, mehfils, Eid" },
    { img: "assets/img/products/p11.jpg", imgAlt: "Cupcakes and mini bakes", title: "Cupcakes & Minis", link: "Perfect for parties" }
  ],

    headings: {
      premiumKicker: "Signature tier",
      premiumTitle: "Premium <em>cakes</em>",
      menuEyebrow: "This week's bake",
      menuTitle: "Pick your favourite, <em>we'll bake it fresh</em> for you",
      catsEyebrow: "From savoury to sweet",
      catsTitle: "What we bake & cook",
      storyEyebrow: "Behind the brand",
      reviewsEyebrow: "Sweet reviews",
      reviewsTitle: "What our happy <em>customers say</em>",
      faqEyebrow: "Good to know",
      faqTitle: "Questions, <em>answered</em>",
      processEyebrow: "The process",
      processTitle: "How to <em>get your cake</em>"
    },

  hero: {
    bg: "/assets/hero-background-image/bg.jpg"
  },

  order: {
    categories: [
      {
        id: "premium",
        name: "Premium",
        sub: "Signature tier",
        ref: "premium",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 14.1 8l4.9.8-3.6 3.4.9 4.9L12 14.5l-4.3 2.6.9-4.9-3.6-3.4L9.9 8 12 3.5Z"/><path d="M19.5 16.5l.5 1.3 1.4.3-1.1.9.3 1.4-1.1-.7-1.1.7.3-1.4-1.1-.9 1.4-.3.5-1.3Z"/></svg>'
      },
      {
        id: "pound",
        name: "Pound Cake",
        sub: "Classic loaves",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10h10l-1.2 9a1.6 1.6 0 0 1-1.6 1.4H9.8A1.6 1.6 0 0 1 8.2 19L7 10Z"/><path d="M9 10c0-1.4 1.3-2.4 3-2.4s3 1 3 2.4"/><path d="M8 8.5 6 4.5m4 4L8.5 4m4 4.5L11 4m4.5 4.5L17 4"/></svg>',
        items: [
          { name: "Regular Vanilla", price: 580, ico: "🍰" },
          { name: "Premium Vanilla", price: 650, ico: "🍰" },
          { name: "Regular Chocolate", price: 650, ico: "🍫" },
          { name: "Premium Chocolate", price: 750, ico: "🍫" },
          { name: "Chocolate Mud Cake", price: 1000, ico: "🍫" }
        ]
      },
      {
        id: "fruit",
        name: "Fruit Flavour",
        sub: "Fresh & juicy",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5c-3.6 0-5.5 2.4-5.5 5.5 0 1.7.8 3 1.9 4 1 1 2.2 1.5 3.6 1.5s2.6-.5 3.6-1.5c1.1-1 1.9-2.3 1.9-4 0-3.1-1.9-5.5-5.5-5.5Z"/><path d="M12 6.5V3.5M12 6.5c1.5 0 2.6.6 3.4 1.6.5-1.3 1-2.4 1.4-3.3"/><path d="M12 12c0-1.6 1.2-2.8 2.8-2.8"/></svg>',
        items: [
          { name: "Blueberry Cake", price: 800, ico: "🫐" },
          { name: "Orange Flavour", price: 700, ico: "🍊" },
          { name: "Mango Flavour", price: 700, ico: "🥭" },
          { name: "Strawberry Flavour", price: 850, ico: "🍓" },
          { name: "Lemon Flavour", price: 700, ico: "🍋" }
        ]
      },
      {
        id: "special",
        name: "Special Flavour",
        sub: "Fancy favourites",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6 4.9.9-3.7 3.3 1 4.9L12 14.3l-4 2.4 1-4.9L5.3 8.5l4.9-.9L12 3Z"/><path d="M19 15l.6 1.6 1.7.3-1.3 1.1.4 1.7-1.4-.9-1.4.9.4-1.7-1.3-1.1 1.7-.3L19 15Z"/></svg>',
        items: [
          { name: "Butterscotch", price: 1200, ico: "🍮" },
          { name: "Rosh Malai Flavour", price: 900, ico: "🥛" },
          { name: "Red Velvet · Whipped Cream", price: 850, ico: "🍓" },
          { name: "Red Velvet · Cream Cheese", price: 1200, ico: "🍓" },
          { name: "Red Velvet · Buttercream Cheese", price: 1500, ico: "🍓" }
        ]
      },
      {
        id: "jars",
        name: "Jars, Tub & Dream",
        sub: "Layers in a glass",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 1.4-.4 2.7-1 3.8L15.6 20a1.8 1.8 0 0 1-1.7 1.3H10.1A1.8 1.8 0 0 1 8.4 20L7 12.8C6.4 11.7 6 10.4 6 9Z"/><path d="M6 9h12"/><path d="M9 9V7.2A3 3 0 0 1 12 4.4 3 3 0 0 1 15 7.2V9"/></svg>',
        items: [
          { name: "Chocolate Tub Cake", price: 300, ico: "🍫" },
          { name: "Chocolate Dream Cake", price: 350, ico: "🍫" },
          { name: "Chocolate Jar Cake", price: 150, ico: "🫙" },
          { name: "Vanilla Tub Cake", price: 250, ico: "🍦" },
          { name: "Vanilla Dream Cake", price: 300, ico: "🍦" },
          { name: "Vanilla Jar Cake", price: 130, ico: "🫙" }
        ]
      },
      {
        id: "mini",
        name: "Mini Cake",
        sub: "Just for one",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11h10l-1 7a2 2 0 0 1-2 1.7h-4A2 2 0 0 1 8 18l-1-7Z"/><path d="M9 11V9a3 3 0 0 1 6 0v2"/><path d="M6.5 11h11"/></svg>',
        items: [
          { name: "Regular Vanilla", price: 300, ico: "🧁" },
          { name: "Premium Vanilla", price: 350, ico: "🧁" },
          { name: "Regular Chocolate", price: 400, ico: "🧁" },
          { name: "Premium Chocolate", price: 500, ico: "🧁" },
          { name: "Chocolate Mud Cake", price: 500, ico: "🧁" }
        ]
      }
    ],
    finishes: [
      { id: "cream", label: "Whipped cream", ico: "🍦" },
      { id: "choco", label: "Chocolate", ico: "🍫" },
      { id: "velvet", label: "Red velvet", ico: "🍓" },
      { id: "fruit", label: "Fresh fruit", ico: "🍇" }
    ],
    designLibrary: [
      { img: "assets/img/products/p01.jpg", name: "Chocolate Truffle" },
      { img: "assets/img/products/p02.jpg", name: "Rose Milk Cake" },
      { img: "assets/img/products/p03.jpg", name: "Butter & Cocoa Loaf" },
      { img: "assets/img/products/p04.jpg", name: "Velvet Bloom" },
      { img: "assets/img/products/p05.jpg", name: "Caramel Ribbon" },
      { img: "assets/img/products/p06.jpg", name: "Fondant Cake" },
      { img: "assets/img/products/p07.jpg", name: "Black Forest Jar" },
      { img: "assets/img/products/p08.jpg", name: "Citrus Pound Cake" },
      { img: "assets/img/products/p09.jpg", name: "Fudge Brownie" },
      { img: "assets/img/products/p10.jpg", name: "Pista Cream Tart" },
      { img: "assets/img/products/p11.jpg", name: "Star Cupcakes" },
      { img: "assets/img/products/p12.jpg", name: "Pastel Box" }
    ]
  },

  settings: {
    dataApiUrl: "",
    apiKey: "",
    dataSource: "",
    database: "delightful"
  }
};
