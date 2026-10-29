package dev.pedropim.aquarium.tanks;

/** The photo storage a user has used, the most they may use, and the biggest file they may upload, in bytes. */
record PhotoUsage(long usedBytes, long quotaBytes, long maxFileBytes) {
}
