package dev.pedropim.aquarium.identity;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HexFormat;

import jakarta.servlet.http.HttpServletRequest;

/**
 * The address that a limit counts. Caddy puts the real address in X-Forwarded-For (replacing whatever the client
 * sent) and Tomcat, with {@code server.forward-headers-strategy=native}, turns it into {@code getRemoteAddr()} only
 * when the request comes from a proxy on a private network. An IPv6 client gets a whole /64 block to itself, so
 * using another address of the block does not escape the limit.
 */
final class ClientAddress {

	private ClientAddress() {
	}

	static String of(HttpServletRequest request) {
		return keyOf(request.getRemoteAddr());
	}

	static String keyOf(String address) {
		if (address == null || !address.contains(":")) {
			return String.valueOf(address);
		}
		try {
			// A literal with a colon is never looked up in DNS.
			if (InetAddress.getByName(address) instanceof Inet6Address ipv6) {
				byte[] bytes = ipv6.getAddress();
				return HexFormat.of().formatHex(bytes, 0, 8) + "::/64";
			}
		}
		catch (UnknownHostException notAnAddress) {
			// Falls through: the text itself is the key.
		}
		return address;
	}

}
