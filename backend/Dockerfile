# Build stage: compiles the jar with the Maven wrapper. Tests run in CI before the image is built.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q package -DskipTests

# Run stage: only a JRE and the jar, as a user that is not root.
FROM eclipse-temurin:21-jre
RUN useradd --system --create-home --uid 1001 aquarium \
    && mkdir -p /data/photos && chown aquarium /data/photos
USER aquarium
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
ENV PHOTOS_DIR=/data/photos
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
