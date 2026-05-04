const axios = require("axios");

async function getHubSpotContacts(assetClass) {
  const headers = { Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}` };

  if (assetClass) {
    const response = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts/search",
      {
        filterGroups: [
          { filters: [{ propertyName: "asset_class", operator: "EQ", value: assetClass }] },
        ],
        properties: ["firstname", "lastname", "email"],
        limit: 100,
      },
      { headers }
    );
    return response.data.results.map((c) => ({
      name:  [c.properties.firstname, c.properties.lastname].filter(Boolean).join(" ") || "Unknown",
      email: c.properties.email || "",
    }));
  }

  const response = await axios.get(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    {
      params:  { limit: 1, properties: "firstname,lastname,email" },
      headers,
    }
  );
  const p = response.data.results[0].properties;
  return [{
    name:  [p.firstname, p.lastname].filter(Boolean).join(" ") || "Unknown",
    email: p.email || "",
  }];
}

module.exports = { getHubSpotContacts };
