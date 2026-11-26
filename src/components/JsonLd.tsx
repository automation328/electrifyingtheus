/** schema.org data for search engines. `<` is escaped so no value can close the script tag. */
const JsonLd = ({ data }: { data: object | null }) =>
  data ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  ) : null;

export default JsonLd;
