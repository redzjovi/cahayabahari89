/** Minimal strict-CSV line parser (RFC 4180 subset): comma-separated fields,
 * double-quoted fields with "" escapes, CRLF/LF newlines. Malformed lines are
 * skipped by callers — this returns raw field arrays per non-empty line. */

export function parseCsvLines(body: string): string[][] {
	const rows: string[][] = [];
	let field = '';
	let row: string[] = [];
	let quoted = false;
	let hasContent = false;

	const pushField = () => {
		row.push(field);
		field = '';
	};
	const pushRow = () => {
		// skip blank lines (no content at all)
		if (hasContent) rows.push(row);
		row = [];
		hasContent = false;
	};

	for (let i = 0; i < body.length; i++) {
		const ch = body[i];
		if (quoted) {
			if (ch === '"') {
				if (body[i + 1] === '"') {
					field += '"';
					hasContent = true;
					i++;
				} else {
					quoted = false;
				}
			} else {
				field += ch;
				hasContent = true;
			}
		} else if (ch === '"') {
			// quote only opens a quoted field at field start (ignoring leading spaces)
			if (field.trim() === '') {
				field = '';
				quoted = true;
			} else {
				field += ch;
			}
			hasContent = true;
		} else if (ch === ',') {
			pushField();
		} else if (ch === '\n' || ch === '\r') {
			if (ch === '\r' && body[i + 1] === '\n') i++;
			pushField();
			pushRow();
		} else {
			field += ch;
			if (ch.trim() !== '') hasContent = true;
		}
	}
	pushField();
	pushRow();
	// trim unquoted padding; quoted content keeps inner spacing
	return rows.map((r) => r.map((f) => f.trim()));
}

/** Parse `year, "text"` milestone lines. */
export function parseMilestones(body: string): { year: string; text: string }[] {
	return parseCsvLines(body)
		.filter((f) => f.length >= 2 && (f[0] || f[1]))
		.map((f) => ({ year: f[0], text: f.slice(1).join(', ') }));
}

/** Parse `"title", "sub"` value lines. */
export function parseValues(body: string): { title: string; text: string }[] {
	return parseCsvLines(body)
		.filter((f) => f.length >= 2 && (f[0] || f[1]))
		.map((f) => ({ title: f[0], text: f.slice(1).join(', ') }));
}
