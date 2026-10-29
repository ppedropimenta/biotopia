package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

import dev.pedropim.aquarium.web.ApiException;

/** The decode, strip, resize and re-encode step, without the web around it. */
class PhotoProcessorTest {

	private final PhotoProcessor processor = new PhotoProcessor();

	@Test
	void aJpegComesOutAsAJpegOfTheSameSizeWhenItIsSmallEnough() throws IOException {
		PhotoProcessor.Processed result = processor.process(Images.jpeg(300, 200));

		assertThat(result.width()).isEqualTo(300);
		assertThat(result.height()).isEqualTo(200);
		assertThat(Images.format(result.jpeg())).isEqualTo("jpeg");
	}

	@Test
	void theLongEdgeIsBroughtDownToTwoThousandPixelsKeepingTheProportions() throws IOException {
		PhotoProcessor.Processed result = processor.process(Images.jpeg(4000, 3000));

		assertThat(result.width()).isEqualTo(2000);
		assertThat(result.height()).isEqualTo(1500);
		BufferedImage stored = ImageIO.read(new ByteArrayInputStream(result.jpeg()));
		assertThat(stored.getWidth()).isEqualTo(2000);
	}

	@Test
	void aTallPhotoIsLimitedOnItsHeight() throws IOException {
		PhotoProcessor.Processed result = processor.process(Images.png(1000, 3000));

		assertThat(result.height()).isEqualTo(2000);
		assertThat(result.width()).isEqualTo(667);
	}

	@Test
	void pngAndWebpAreAcceptedAndStoredAsJpeg() throws IOException {
		assertThat(Images.format(processor.process(Images.png(40, 30)).jpeg())).isEqualTo("jpeg");
		assertThat(Images.format(processor.process(Images.WEBP_1X1).jpeg())).isEqualTo("jpeg");
	}

	@Test
	void aTransparentPngGetsAWhiteBackgroundInsteadOfBlack() throws IOException {
		BufferedImage clear = new BufferedImage(20, 20, BufferedImage.TYPE_INT_ARGB);
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(clear, "png", out);

		BufferedImage stored = ImageIO.read(new ByteArrayInputStream(processor.process(out.toByteArray()).jpeg()));

		assertThat(new Color(stored.getRGB(10, 10)).getRed()).isGreaterThan(240);
	}

	@Test
	void everyMetadataSegmentIsDroppedIncludingGps() {
		byte[] withGps = Images.withExif(Images.jpeg(60, 40), 1, "GPSLatitude 52.5200N");
		assertThat(new String(withGps, StandardCharsets.ISO_8859_1)).contains("GPSLatitude");

		byte[] stored = processor.process(withGps).jpeg();

		String text = new String(stored, StandardCharsets.ISO_8859_1);
		assertThat(text).doesNotContain("GPSLatitude").doesNotContain("Exif");
		assertThat(Images.segmentMarkers(stored)).doesNotContain(0xE1, 0xE2, 0xED, 0xFE);
	}

	@Test
	void aPhotoTakenSidewaysIsTurnedUprightBeforeTheOrientationTagIsLost() {
		// Orientation 6: the camera was turned, the pixels must be rotated a quarter turn clockwise.
		byte[] sideways = Images.withExif(Images.jpeg(300, 200), 6, "x");

		PhotoProcessor.Processed result = processor.process(sideways);

		assertThat(result.width()).isEqualTo(200);
		assertThat(result.height()).isEqualTo(300);
	}

	@Test
	void somethingThatIsNotAnImageIsRefused() {
		assertThatThrownBy(() -> processor.process("hello".getBytes(StandardCharsets.UTF_8)))
			.isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.fields()).containsEntry("file", "unsupported_type"));
	}

	@Test
	void anImageFormatThatIsNotOnTheListIsRefused() throws IOException {
		BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(image, "gif", out);

		assertThatThrownBy(() -> processor.process(out.toByteArray()))
			.isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.fields()).containsEntry("file", "unsupported_type"));
	}

	@Test
	void aPictureWithTooManyPixelsIsRefusedBeforeItIsDecoded() throws IOException {
		// 10 000 x 10 000 compresses to a few KB when blank, but needs 400 MB to decode.
		BufferedImage huge = new BufferedImage(10_000, 10_000, BufferedImage.TYPE_BYTE_GRAY);
		Graphics2D g = huge.createGraphics();
		g.setColor(Color.GRAY);
		g.fillRect(0, 0, 10_000, 10_000);
		g.dispose();
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(huge, "png", out);

		assertThatThrownBy(() -> processor.process(out.toByteArray()))
			.isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.fields()).containsEntry("file", "too_many_pixels"));
	}

	/** Builds the test pictures. */
	static final class Images {

		static final byte[] WEBP_1X1 = Base64.getDecoder().decode("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==");

		private Images() {
		}

		static byte[] jpeg(int width, int height) {
			return encode(width, height, "jpg");
		}

		static byte[] png(int width, int height) {
			return encode(width, height, "png");
		}

		private static byte[] encode(int width, int height, String format) {
			BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
			Graphics2D g = image.createGraphics();
			g.setColor(Color.BLUE);
			g.fillRect(0, 0, width, height);
			g.dispose();
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			try {
				ImageIO.write(image, format, out);
			}
			catch (IOException e) {
				throw new IllegalStateException(e);
			}
			return out.toByteArray();
		}

		/** The reader's name for the format of these bytes, lower case. */
		static String format(byte[] bytes) throws IOException {
			try (var in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
				return ImageIO.getImageReaders(in).next().getFormatName().toLowerCase();
			}
		}

		/** The JPEG with an Exif segment added right after its start: the given orientation, then {@code extra}. */
		static byte[] withExif(byte[] jpeg, int orientation, String extra) {
			byte[] extraBytes = extra.getBytes(StandardCharsets.ISO_8859_1);
			ByteArrayOutputStream tiff = new ByteArrayOutputStream();
			// Big-endian TIFF header, one IFD entry (orientation), then the extra text after the IFD.
			tiff.writeBytes(new byte[] { 'M', 'M', 0, 42, 0, 0, 0, 8 });
			tiff.writeBytes(new byte[] { 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, (byte) orientation, 0, 0, 0, 0, 0, 0 });
			tiff.writeBytes(extraBytes);
			byte[] exif = "Exif\0\0".getBytes(StandardCharsets.ISO_8859_1);
			int length = 2 + exif.length + tiff.size();
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			out.write(jpeg, 0, 2);
			out.write(0xFF);
			out.write(0xE1);
			out.write(length >> 8);
			out.write(length & 0xFF);
			out.writeBytes(exif);
			out.writeBytes(tiff.toByteArray());
			out.write(jpeg, 2, jpeg.length - 2);
			return out.toByteArray();
		}

		/** The marker codes of the segments before the image data starts. */
		static java.util.List<Integer> segmentMarkers(byte[] jpeg) {
			var markers = new java.util.ArrayList<Integer>();
			int i = 2;
			while (i + 4 <= jpeg.length && (jpeg[i] & 0xFF) == 0xFF) {
				int marker = jpeg[i + 1] & 0xFF;
				if (marker == 0xDA) {
					break;
				}
				markers.add(marker);
				i += 2 + (((jpeg[i + 2] & 0xFF) << 8) | (jpeg[i + 3] & 0xFF));
			}
			return markers;
		}

	}

}
