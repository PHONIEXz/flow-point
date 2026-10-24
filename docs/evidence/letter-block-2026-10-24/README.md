# Block-letter export evidence

The archive contains two fictional, manually authored invitation PDFs and their input fixtures. They were rendered through the real application PDF exporter, text-checked for expected content and visually inspected. These are not live model outputs. Both use a separately chosen 24 October letter date for a 21 November event. Formal output starts with full supplied contact blocks; informal output omits the subject and recipient address. Review status remains in the footer. See qa.json for PDF hashes and page counts.

Live deployment was also verified through both browser download events and two direct /api/export responses. See live-downloads.json for status, hash, page and filename checks. Named browser storage retained the selected style, letter date, recipient and closing after reload. All test contacts and content were fictional.
