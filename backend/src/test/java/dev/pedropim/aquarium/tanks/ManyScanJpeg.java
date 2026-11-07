package dev.pedropim.aquarium.tanks;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

/** A hostile but well-formed progressive JPEG, built by hand so its size stays small. */
final class ManyScanJpeg {

	private ManyScanJpeg() {
	}

	/**
	 * A grey progressive JPEG with as many scans as asked. Each scan after the first is about 33 bytes and says
	 * "nothing changes in the next 32 767 blocks" a few times over.
	 */
	static byte[] build(int width, int height, int scans) throws IOException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		out.write(new byte[] { (byte) 0xFF, (byte) 0xD8 });
		// Quantization table of ones.
		out.write(new byte[] { (byte) 0xFF, (byte) 0xDB, 0, 67, 0 });
		for (int i = 0; i < 64; i++) {
			out.write(1);
		}
		// SOF2: progressive, 8 bits, one component.
		out.write(new byte[] { (byte) 0xFF, (byte) 0xC2, 0, 11, 8, (byte) (height >> 8), (byte) height, (byte) (width >> 8),
				(byte) width, 1, 1, 0x11, 0 });
		// DC table: one code of one bit, meaning "no change". AC table: one code of one bit, meaning "EOB run, 14 more bits".
		out.write(huffmanTable(0x00, 0x00));
		out.write(huffmanTable(0x10, 0xE0));
		int blocks = ((width + 7) / 8) * ((height + 7) / 8);
		// First scan: the DC of every block, one zero bit each.
		out.write(new byte[] { (byte) 0xFF, (byte) 0xDA, 0, 8, 1, 1, 0, 0, 0, 0 });
		out.write(new byte[(blocks + 7) / 8]);
		byte[] acScan = acScan(blocks);
		for (int i = 0; i < scans; i++) {
			out.write(acScan);
		}
		out.write(new byte[] { (byte) 0xFF, (byte) 0xD9 });
		return out.toByteArray();
	}

	private static byte[] acScan(int blocks) {
		ByteArrayOutputStream scan = new ByteArrayOutputStream();
		scan.writeBytes(new byte[] { (byte) 0xFF, (byte) 0xDA, 0, 8, 1, 1, 0, 1, 63, 0 });
		int runs = (blocks + 32766) / 32767;
		int buffer = 0;
		int bits = 0;
		for (int i = 0; i < runs; i++) {
			// The code (0), then 14 bits that make this run 32 767 blocks long.
			int value = 0b0_11111111111111;
			for (int b = 14; b >= 0; b--) {
				buffer = buffer << 1 | value >> b & 1;
				if (++bits == 8) {
					scan.write(buffer);
					if (buffer == 0xFF) {
						scan.write(0);
					}
					buffer = 0;
					bits = 0;
				}
			}
		}
		if (bits > 0) {
			buffer = buffer << 8 - bits | (1 << 8 - bits) - 1;
			scan.write(buffer);
			if (buffer == 0xFF) {
				scan.write(0);
			}
		}
		return scan.toByteArray();
	}

	private static byte[] huffmanTable(int classAndId, int symbol) {
		byte[] table = new byte[22];
		table[0] = (byte) 0xFF;
		table[1] = (byte) 0xC4;
		table[2] = 0;
		table[3] = 20;
		table[4] = (byte) classAndId;
		table[5] = 1;
		table[21] = (byte) symbol;
		return table;
	}

}
