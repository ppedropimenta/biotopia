package dev.pedropim.aquarium.email;

import java.net.URI;

import org.springframework.web.util.HtmlUtils;

/**
 * The HTML of an email, with the site's look: the leaffish and the name on a blackwater band, the message on paper,
 * and the site's address at the foot. Email clients drop most of CSS, so the layout is tables with inline styles,
 * pictures and fonts come from the site by absolute URL (under {@code /email/} in the frontend's public folder), and
 * every font has a fallback: Apple Mail shows Source Serif 4, Gmail and Outlook show Georgia.
 * <p>
 * The pieces take plain text and escape it, so a message is put together without writing HTML.
 */
public final class EmailLayout {

	// The colours of docs/ui.md (frontend/src/styles/biotopia.css). Emails cannot read CSS variables.
	private static final String PAPER = "#ece2cb";

	private static final String PAPER_CARD = "#f6f0e1";

	private static final String PAPER_PHOTO = "#fbf7ee";

	private static final String INK = "#241a11";

	private static final String INK_SOFT = "#3d3022";

	private static final String INK_MUTED = "#5b4a36";

	private static final String BLACKWATER = "#2b1d12";

	private static final String RIVER_BRIGHT = "#f1e7d0";

	private static final String NEON = "#23628a";

	private static final String SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif";

	private static final String MONO = "'IBM Plex Mono', Menlo, Consolas, 'Courier New', monospace";

	private final String siteUrl;

	public EmailLayout(String siteUrl) {
		this.siteUrl = siteUrl;
	}

	/**
	 * The whole email around {@code content}. The preheader is the line most inboxes show next to the subject; it is
	 * hidden in the message itself.
	 */
	public String page(String languageCode, String title, String preheader, String content) {
		return """
				<!DOCTYPE html>
				<html lang="%1$s">
				<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<meta name="color-scheme" content="light only">
				<meta name="supported-color-schemes" content="light">
				<title>%2$s</title>
				<style>
				@font-face { font-family: 'Source Serif 4'; font-style: normal; font-weight: 200 900; src: url('%3$s/email/fonts/source-serif-4.woff2') format('woff2'); }
				@font-face { font-family: 'Source Serif 4'; font-style: italic; font-weight: 200 900; src: url('%3$s/email/fonts/source-serif-4-italic.woff2') format('woff2'); }
				@font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 500; src: url('%3$s/email/fonts/ibm-plex-mono-500.woff2') format('woff2'); }
				@media (max-width: 600px) { .sheet { padding: 32px 24px !important; } .band { padding: 18px 24px !important; } .foot { padding: 20px 24px 0 !important; } }
				</style>
				</head>
				<body style="margin:0;padding:0;background-color:%4$s;">
				<div style="display:none;max-height:0;overflow:hidden;opacity:0;">%5$s</div>
				<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" bgcolor="%4$s" style="background-color:%4$s;">
				<tr><td align="center" style="padding:32px 12px;">
				<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%%;max-width:560px;">
				<tr><td class="band" bgcolor="%6$s" style="background-color:%6$s;padding:20px 40px;">
				<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
				<td style="padding-right:10px;vertical-align:middle;"><img src="%3$s/email/leaffish.png" width="44" height="21" alt="" style="display:block;border:0;"></td>
				<td style="vertical-align:middle;font-family:%7$s;font-style:italic;font-size:24px;line-height:28px;color:%8$s;">Biotopia</td>
				</tr></table>
				</td></tr>
				<tr><td class="sheet" bgcolor="%9$s" style="background-color:%9$s;padding:40px;">
				%10$s
				</td></tr>
				<tr><td class="foot" style="padding:20px 40px 0;font-family:%7$s;font-size:13px;line-height:20px;color:%11$s;">
				<span style="font-style:italic;">Biotopia</span> &middot; <a href="%3$s" style="color:%11$s;text-decoration:underline;">%12$s</a>
				</td></tr>
				</table>
				</td></tr>
				</table>
				</body>
				</html>
				""".formatted(languageCode, escape(title), siteUrl, PAPER, escape(preheader), BLACKWATER, SERIF, RIVER_BRIGHT,
				PAPER_CARD, content, INK_MUTED, escape(host()));
	}

	/** One of the site's drawings, on a lighter sheet like the plates in the app, with its name under it. */
	public String drawing(String file, int width, int height, String name) {
		return """
				<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" bgcolor="%1$s" style="background-color:%1$s;margin:0 0 32px;">
				<tr><td align="center" style="padding:24px 16px 16px;">
				<img src="%2$s/email/%3$s" width="%4$d" height="%5$d" alt="%6$s" style="display:block;border:0;width:100%%;max-width:%4$dpx;height:auto;">
				<p style="margin:8px 0 0;font-family:%7$s;font-style:italic;font-size:14px;line-height:20px;color:%8$s;">%6$s</p>
				</td></tr>
				</table>
				""".formatted(PAPER_PHOTO, siteUrl, file, width, height, escape(name), SERIF, INK_MUTED);
	}

	public String heading(String text) {
		return """
				<h1 style="margin:0 0 16px;font-family:%s;font-weight:500;font-size:30px;line-height:36px;color:%s;">%s</h1>
				""".formatted(SERIF, INK, escape(text));
	}

	public String paragraph(String text) {
		return paragraph(text, INK_SOFT, 16, 26);
	}

	/** Smaller supporting text, such as when a link expires. */
	public String note(String text) {
		return paragraph(text, INK_MUTED, 14, 22);
	}

	/** A link written out in full, so it can be copied when a button or a click does not work. */
	public String link(String url) {
		return """
				<p style="margin:0 0 16px;font-family:%1$s;font-size:14px;line-height:22px;word-break:break-all;"><a href="%2$s" style="color:%3$s;text-decoration:underline;">%2$s</a></p>
				""".formatted(SERIF, escape(url), NEON);
	}

	/** The main action, as the app's primary button: ink on paper, capitals in mono, almost square. */
	public String button(String label, String url) {
		return """
				<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px;"><tr>
				<td bgcolor="%1$s" style="background-color:%1$s;border-radius:2px;">
				<a href="%2$s" style="display:inline-block;padding:15px 26px;font-family:%3$s;font-weight:500;font-size:14px;line-height:18px;letter-spacing:0.06em;text-transform:uppercase;color:%4$s;text-decoration:none;">%5$s</a>
				</td></tr></table>
				""".formatted(INK, escape(url), MONO, PAPER_CARD, escape(label));
	}

	private static String paragraph(String text, String colour, int size, int lineHeight) {
		return """
				<p style="margin:0 0 16px;font-family:%s;font-size:%dpx;line-height:%dpx;color:%s;">%s</p>
				""".formatted(SERIF, size, lineHeight, colour, escape(text));
	}

	private String host() {
		String host = URI.create(siteUrl).getHost();
		return host == null ? siteUrl : host;
	}

	private static String escape(String text) {
		return HtmlUtils.htmlEscape(text, "UTF-8");
	}

}
