export const SAMPLE_CLIENTS = [
  { id: "ek", name: "Emirates Airlines", code: "EK" },
  { id: "modon", name: "Modon Properties", code: "MOD" },
  { id: "kenvue", name: "Kenvue", code: "KNV" },
];

export const SAMPLE = {
  ek: {
    taxonomy: {
      pattern: "{country}{objective}{campaign}{monthYY}",
      separator: "",
      example: "beconsummerdxbmar25",
      fields: [
        "country (2-char ISO)",
        "objective (con/awr/bra)",
        "campaign name",
        "month + year (mar25)",
      ],
    },
    plan: [
      { lead: "Akshata", campaign: "beconsummerdxbmar25", country: "be", platform: "instagram", startDate: "2025-03-03", endDate: "2025-03-25", budget: 30000, buyingUnit: "CPC", currency: "USD", hiredUnits: 10345 },
      { lead: "Akshata", campaign: "beconsummerdxbmar25", country: "be", platform: "youtube", startDate: "2025-03-03", endDate: "2025-03-25", budget: 28300, buyingUnit: "CPM", currency: "USD", hiredUnits: 3537500 },
      { lead: "Akshata", campaign: "beconsummerdxbmar25", country: "be", platform: "gdn", startDate: "2025-03-03", endDate: "2025-03-25", budget: 30000, buyingUnit: "CPC", currency: "USD", hiredUnits: 55556 },
      { lead: "Akshata", campaign: "frconsummerdxbmar25", country: "fr", platform: "youtube", startDate: "2025-03-03", endDate: "2025-03-25", budget: 15000, buyingUnit: "CPM", currency: "USD", hiredUnits: 2500000 },
      { lead: "Akshata", campaign: "frconsummerdxbmar25", country: "fr", platform: "instagram", startDate: "2025-03-03", endDate: "2025-03-25", budget: 14000, buyingUnit: "CPC", currency: "USD", hiredUnits: 8750 },
      { lead: "Saad", campaign: "saconramadan25", country: "sa", platform: "snapchat", startDate: "2025-03-01", endDate: "2025-03-31", budget: 25000, buyingUnit: "CPM", currency: "USD", hiredUnits: 3571429 },
      { lead: "Saad", campaign: "kwconeconomymar25", country: "kw", platform: "instagram", startDate: "2025-03-10", endDate: "2025-03-31", budget: 12000, buyingUnit: "CPC", currency: "USD", hiredUnits: 15000 },
      { lead: "Tamara", campaign: "dkconsummerdxbmar25", country: "dk", platform: "teads", startDate: "2025-03-03", endDate: "2025-03-25", budget: 7000, buyingUnit: "CPM", currency: "USD", hiredUnits: 1000000 },
    ],
    weeks: {
      W1: [
        { campaign: "beconsummerdxbmar25", platform: "instagram", cost: 4100, delivered: 1800 },
        { campaign: "beconsummerdxbmar25", platform: "youtube", cost: 3900, delivered: 620000 },
        { campaign: "frconsummerdxbmar25", platform: "youtube", cost: 2100, delivered: 380000 },
        { campaign: "saconramadan25", platform: "snapchat", cost: 1600, delivered: 210000 },
      ],
      W2: [
        { campaign: "beconsummerdxbmar25", platform: "instagram", cost: 12500, delivered: 5200 },
        { campaign: "beconsummerdxbmar25", platform: "youtube", cost: 11200, delivered: 1800000 },
        { campaign: "frconsummerdxbmar25", platform: "youtube", cost: 6400, delivered: 1100000 },
        { campaign: "frconsummerdxbmar25", platform: "instagram", cost: 5800, delivered: 3400 },
        { campaign: "saconramadan25", platform: "snapchat", cost: 4100, delivered: 580000 },
        { campaign: "kwconeconomymar25", platform: "instagram", cost: 1800, delivered: 2100 },
      ],
      W3: [
        { campaign: "beconsummerdxbmar25", platform: "instagram", cost: 29999, delivered: 13743 },
        { campaign: "beconsummerdxbmar25", platform: "youtube", cost: 29245, delivered: 4790919 },
        { campaign: "beconsummerdxbmar25", platform: "gdn", cost: 28100, delivered: 52000 },
        { campaign: "frconsummerdxbmar25", platform: "youtube", cost: 15830, delivered: 2922207 },
        { campaign: "frconsummerdxbmar25", platform: "instagram", cost: 13999, delivered: 8396 },
        { campaign: "saconramadan25", platform: "snapchat", cost: 6800, delivered: 980000 },
        { campaign: "kwconeconomymar25", platform: "instagram", cost: 4200, delivered: 5100 },
        { campaign: "dkconsummerdxbmar25", platform: "teads", cost: 6970, delivered: 2088254 },
      ],
    },
  },
  modon: {
    taxonomy: {
      pattern: "{brand}{market}{campaign}_{quarter}",
      separator: "_",
      example: "modcairolaunch_q1",
      fields: ["brand code", "market/city", "campaign name", "quarter"],
    },
    plan: [
      { lead: "Sarah", campaign: "modcairolaunch_q1", country: "eg", platform: "meta", startDate: "2025-02-01", endDate: "2025-03-31", budget: 50000, buyingUnit: "CPC", currency: "USD", hiredUnits: 125000 },
      { lead: "Sarah", campaign: "modcairolaunch_q1", country: "eg", platform: "google_ads", startDate: "2025-02-01", endDate: "2025-03-31", budget: 35000, buyingUnit: "CPC", currency: "USD", hiredUnits: 58333 },
    ],
    weeks: {
      W1: [
        { campaign: "modcairolaunch_q1", platform: "meta", cost: 5200, delivered: 13000 },
        { campaign: "modcairolaunch_q1", platform: "google_ads", cost: 3800, delivered: 6300 },
      ],
      W2: [
        { campaign: "modcairolaunch_q1", platform: "meta", cost: 14600, delivered: 36500 },
        { campaign: "modcairolaunch_q1", platform: "google_ads", cost: 11200, delivered: 18600 },
      ],
    },
  },
  kenvue: {
    taxonomy: { pattern: "", separator: "", example: "", fields: [] },
    plan: [],
    weeks: {},
  },
};
