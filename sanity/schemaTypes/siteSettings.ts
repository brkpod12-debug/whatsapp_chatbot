import { defineField, defineType } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Website Settings",
  type: "document",
  groups: [
    { name: "branding", title: "Branding" },
    { name: "contact", title: "Contact & WhatsApp" },
    { name: "navigation", title: "Navigation" },
    { name: "footer", title: "Footer" },
    { name: "legal", title: "Legal & RERA" },
    { name: "seo", title: "SEO & Search" },
    { name: "social", title: "Social Links" },
  ],
  fields: [
    defineField({ name: "name", title: "Brand name", group: "branding", type: "string", validation: (r) => r.required() }),
    defineField({ name: "legalName", title: "Legal/registered name", group: "branding", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "logo",
      title: "Main website logo",
      group: "branding",
      type: "image",
      description: "Used in the header and footer instead of the wordmark.",
    }),
    defineField({ name: "tagline", title: "Tagline", group: "branding", type: "string", validation: (r) => r.required() }),
    defineField({ name: "heroVideo", title: "Homepage hero video path (e.g. /hero.mp4)", group: "branding", type: "string", validation: (r) => r.required() }),

    defineField({ name: "phone", title: "Phone number (displayed as text)", group: "contact", type: "string", validation: (r) => r.required() }),
    defineField({ name: "phoneHref", title: "Phone link (tel:…)", group: "contact", type: "string", validation: (r) => r.required() }),
    defineField({ name: "whatsapp", title: "WhatsApp link (full https://wa.me/…)", group: "contact", type: "url", validation: (r) => r.required() }),
    defineField({ name: "email", title: "Email address", group: "contact", type: "string", validation: (r) => r.required() }),
    defineField({ name: "address", title: "Office address (displayed)", group: "contact", type: "text", rows: 2, validation: (r) => r.required() }),
    defineField({ name: "city", title: "City", group: "contact", type: "string", validation: (r) => r.required() }),
    defineField({ name: "state", title: "State", group: "contact", type: "string", validation: (r) => r.required() }),
    defineField({ name: "hours", title: "Opening hours (displayed)", group: "contact", type: "string", validation: (r) => r.required() }),

    defineField({
      name: "navLinks",
      title: "Header navigation menu",
      group: "navigation",
      type: "array",
      description: "Order shown on the website. Each row is one menu link (label + destination).",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", type: "string", validation: (r) => r.required() }),
            defineField({ name: "href", type: "string", validation: (r) => r.required() }),
          ],
        },
      ],
    }),
    defineField({ name: "enquireLabel", title: "Header 'Enquire' button label", group: "navigation", type: "string", initialValue: "Enquire privately" }),

    defineField({
      name: "footerExploreLinks",
      title: "Footer: Explore links",
      group: "footer",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", type: "string", validation: (r) => r.required() }),
            defineField({ name: "href", type: "string", validation: (r) => r.required() }),
          ],
        },
      ],
    }),
    defineField({
      name: "footerGroundsLinks",
      title: "Footer: Grounds list",
      group: "footer",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "footerBlurb",
      title: "Footer brand blurb",
      group: "footer",
      type: "text",
      rows: 3,
      validation: (r) => r.required(),
    }),

    defineField({
      name: "rera",
      title: "RERA registration",
      group: "legal",
      type: "object",
      fields: [
        defineField({ name: "registeredUnder", type: "string", title: "Registered under", validation: (r) => r.required() }),
        defineField({ name: "number", type: "string", title: "RERA number", validation: (r) => r.required() }),
        defineField({ name: "note", type: "string", title: "Registration note shown in the footer", validation: (r) => r.required() }),
      ],
    }),
    defineField({
      name: "legal",
      title: "Legal & disclaimers",
      group: "legal",
      type: "object",
      fields: [
        defineField({ name: "disclaimer", type: "text", title: "Site disclaimer", rows: 3, description: "Shown next to the RERA line in the footer." }),
        defineField({ name: "privacyUrl", type: "url", title: "Privacy policy link" }),
        defineField({ name: "termsUrl", type: "url", title: "Terms of use link" }),
      ],
    }),

    defineField({ name: "siteUrl", title: "Website address (e.g. https://joshproperties.in)", group: "seo", type: "string", initialValue: "https://joshproperties.in", validation: (r) => r.required() }),
    defineField({ name: "position", title: "Short positioning statement", group: "seo", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({
      name: "metaDescription",
      title: "SEO meta description (Google search snippet)",
      group: "seo",
      type: "text",
      rows: 2,
      description: "Shown under the site title in Google results. Aim for 150-160 characters.",
    }),
    defineField({ name: "keywords", title: "Search keywords", group: "seo", type: "array", of: [{ type: "string" }] }),
    defineField({
      name: "googleSiteVerification",
      title: "Google Search Console verification code",
      group: "seo",
      type: "string",
      description:
        "Search Console > Add property > HTML tag. Paste only the content value, not the whole tag.",
    }),
    defineField({ name: "ogTitle", title: "Social sharing title", group: "seo", type: "string" }),
    defineField({ name: "ogDescription", title: "Social sharing description", group: "seo", type: "text", rows: 2 }),
    defineField({ name: "ogImage", title: "Social sharing image", group: "seo", type: "image" }),
    defineField({
      name: "org",
      title: "Business details for search engines (JSON-LD)",
      group: "seo",
      type: "object",
      fields: [
        defineField({ name: "foundingYear", type: "string", title: "Founded year", description: "e.g. 2017" }),
        defineField({ name: "streetAddress", type: "string", title: "Street address", description: "e.g. Road No. 12" }),
        defineField({ name: "addressLocality", type: "string", title: "Locality + city", description: "e.g. Banjara Hills, Hyderabad" }),
        defineField({ name: "postalCode", type: "string", title: "PIN code", description: "e.g. 500034" }),
        defineField({ name: "openingHours", type: "string", title: "Opening hours (machine format)", description: "e.g. Mo-Sa 10:00-19:00" }),
        defineField({ name: "priceRange", type: "string", title: "Price range indicator", description: "e.g. ₹₹₹" }),
      ],
    }),

    defineField({
      name: "socialLinks",
      title: "Social links",
      group: "social",
      type: "array",
      description: "Only enabled links appear on the website.",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "platform",
              type: "string",
              title: "Platform",
              options: {
                list: ["Instagram", "Facebook", "LinkedIn", "YouTube", "X (Twitter)", "WhatsApp"],
              },
            }),
            defineField({ name: "href", type: "url", title: "Profile link (https://…)", validation: (r) => r.required() }),
            defineField({ name: "enabled", type: "boolean", title: "Show on website", initialValue: true }),
          ],
        },
      ],
    }),
  ],
  preview: { select: { title: "name" } },
});