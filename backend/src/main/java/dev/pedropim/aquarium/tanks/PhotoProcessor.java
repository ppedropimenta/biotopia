package dev.pedropim.aquarium.tanks;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Set;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;

import org.springframework.stereotype.Component;

import dev.pedropim.aquarium.web.ApiException;

/**
 * Turns an uploaded picture into what is stored: decoded, turned upright, at most {@value #MAX_EDGE} pixels on
 * its long edge and written again as a JPEG. A picture that is written again carries none of the original's
 * bytes, so nothing in them (EXIF with the GPS position, the camera, comments) survives. The only thing read from
 * the metadata is the orientation, and only to rotate the pixels.
 */
@Component
class PhotoProcessor {

	static final int MAX_EDGE = 2000;

	/** Decoding needs about 4 bytes a pixel, so this keeps one upload under roughly 100 MB of memory. */
	private static final long MAX_PIXELS = 25_000_000L;

	private static final float JPEG_QUALITY = 0.85f;

	/** The names ImageIO gives the readers of the accepted formats. */
	private static final Set<String> FORMATS = Set.of("jpeg", "png", "webp");

	/** The stored picture and its size in pixels. */
	record Processed(byte[] jpeg, int width, int height) {
	}

	Processed process(byte[] original) {
		BufferedImage decoded = decode(original);
		BufferedImage upright = orient(decoded, readOrientation(original));
		BufferedImage resized = fit(upright);
		return new Processed(encode(resized), resized.getWidth(), resized.getHeight());
	}

	private static BufferedImage decode(byte[] original) {
		try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(original))) {
			Iterator<ImageReader> readers = in == null ? null : ImageIO.getImageReaders(in);
			if (readers == null || !readers.hasNext()) {
				throw unsupported();
			}
			ImageReader reader = readers.next();
			try {
				if (!FORMATS.contains(reader.getFormatName().toLowerCase())) {
					throw unsupported();
				}
				reader.setInput(in, true, true);
				// The size is in the header, so a picture that is a bomb is refused before it takes memory.
				if ((long) reader.getWidth(0) * reader.getHeight(0) > MAX_PIXELS) {
					throw ApiException.invalidField("file", "too_many_pixels");
				}
				return reader.read(0);
			}
			finally {
				reader.dispose();
			}
		}
		catch (IOException | RuntimeException broken) {
			if (broken instanceof ApiException api) {
				throw api;
			}
			// A file that has the signature of an image and cannot be read is as good as no image.
			throw unsupported();
		}
	}

	private static ApiException unsupported() {
		return ApiException.invalidField("file", "unsupported_type");
	}

	/** The orientation, or 1 when the metadata is broken: a damaged tag is no reason to refuse the picture. */
	private static int readOrientation(byte[] jpeg) {
		try {
			return orientationOf(jpeg);
		}
		catch (RuntimeException broken) {
			return 1;
		}
	}

	/**
	 * The EXIF orientation of a JPEG (1 to 8), 1 when there is none. It is read by hand because it is one number in
	 * one place: the Exif segment's TIFF header, then the first entry named 0x0112.
	 */
	static int orientationOf(byte[] jpeg) {
		int i = 2;
		while (jpeg.length > 3 && (jpeg[0] & 0xFF) == 0xFF && (jpeg[1] & 0xFF) == 0xD8 && i + 4 <= jpeg.length
				&& (jpeg[i] & 0xFF) == 0xFF) {
			int marker = jpeg[i + 1] & 0xFF;
			if (marker == 0xDA) {
				break;
			}
			int length = u16(jpeg, i + 2, false);
			int start = i + 4;
			if (marker == 0xE1 && length >= 16 && start + 6 <= jpeg.length && jpeg[start] == 'E'
					&& jpeg[start + 1] == 'x' && jpeg[start + 2] == 'i' && jpeg[start + 3] == 'f') {
				return tiffOrientation(jpeg, start + 6, Math.min(jpeg.length, i + 2 + length));
			}
			i += 2 + length;
		}
		return 1;
	}

	private static int tiffOrientation(byte[] b, int tiff, int end) {
		if (tiff + 8 > end) {
			return 1;
		}
		boolean little = b[tiff] == 'I';
		int entries = tiff + u32(b, tiff + 4, little);
		if (entries < tiff || entries + 2 > end) {
			return 1;
		}
		int count = u16(b, entries, little);
		for (int n = 0; n < count && entries + 2 + (n + 1) * 12 <= end; n++) {
			int entry = entries + 2 + n * 12;
			if (u16(b, entry, little) == 0x0112) {
				int value = u16(b, entry + 8, little);
				return value >= 1 && value <= 8 ? value : 1;
			}
		}
		return 1;
	}

	private static int u16(byte[] b, int at, boolean little) {
		int first = b[at] & 0xFF;
		int second = b[at + 1] & 0xFF;
		return little ? second << 8 | first : first << 8 | second;
	}

	private static int u32(byte[] b, int at, boolean little) {
		return little ? u16(b, at + 2, true) << 16 | u16(b, at, true) : u16(b, at, false) << 16 | u16(b, at + 2, false);
	}

	/** Applies one of the eight EXIF orientations so the picture looks the way the person held the camera. */
	private static BufferedImage orient(BufferedImage image, int orientation) {
		if (orientation == 1) {
			return image;
		}
		int w = image.getWidth();
		int h = image.getHeight();
		AffineTransform transform = switch (orientation) {
			case 2 -> new AffineTransform(-1, 0, 0, 1, w, 0);
			case 3 -> new AffineTransform(-1, 0, 0, -1, w, h);
			case 4 -> new AffineTransform(1, 0, 0, -1, 0, h);
			case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0);
			case 6 -> new AffineTransform(0, 1, -1, 0, h, 0);
			case 7 -> new AffineTransform(0, -1, -1, 0, h, w);
			default -> new AffineTransform(0, -1, 1, 0, 0, w);
		};
		boolean swaps = orientation >= 5;
		BufferedImage turned = new BufferedImage(swaps ? h : w, swaps ? w : h, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = flatCanvas(turned);
		g.drawImage(image, transform, null);
		g.dispose();
		return turned;
	}

	/** Brings the long edge down to {@value #MAX_EDGE}; a picture that is already smaller keeps its size. */
	private static BufferedImage fit(BufferedImage image) {
		int longEdge = Math.max(image.getWidth(), image.getHeight());
		if (longEdge <= MAX_EDGE && image.getType() == BufferedImage.TYPE_INT_RGB) {
			return image;
		}
		double scale = Math.min(1.0, (double) MAX_EDGE / longEdge);
		int width = Math.max(1, (int) Math.round(image.getWidth() * scale));
		int height = Math.max(1, (int) Math.round(image.getHeight() * scale));
		BufferedImage resized = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = flatCanvas(resized);
		g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
		g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
		g.drawImage(image, 0, 0, width, height, null);
		g.dispose();
		return resized;
	}

	/** A canvas painted white first: JPEG has no transparency, and black would show through a transparent PNG. */
	private static Graphics2D flatCanvas(BufferedImage canvas) {
		Graphics2D g = canvas.createGraphics();
		g.setColor(Color.WHITE);
		g.fillRect(0, 0, canvas.getWidth(), canvas.getHeight());
		return g;
	}

	private static byte[] encode(BufferedImage image) {
		ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
		try (ByteArrayOutputStream out = new ByteArrayOutputStream();
				var stream = ImageIO.createImageOutputStream(out)) {
			ImageWriteParam params = writer.getDefaultWriteParam();
			params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
			params.setCompressionQuality(JPEG_QUALITY);
			writer.setOutput(stream);
			// No metadata is passed to the writer, so none is written.
			writer.write(null, new IIOImage(image, null, null), params);
			stream.flush();
			return out.toByteArray();
		}
		catch (IOException failed) {
			throw new IllegalStateException("Could not encode the photo", failed);
		}
		finally {
			writer.dispose();
		}
	}

}
