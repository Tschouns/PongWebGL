attribute vec2 aVertexPosition;

uniform vec2 uScreenResolution;
uniform mat3 uProjectionMatrix;

void main() {
    // Apply projection transformation.
    vec2 projectedPosition = (uProjectionMatrix * vec3(aVertexPosition, 1)).xy;

    // Convert to clip space coordinates.
    vec2 zeroToOneSpace = projectedPosition / uScreenResolution;
    vec2 zeroToTwoSpace = zeroToOneSpace * 1.0;
    vec2 clipSpace = zeroToTwoSpace - 1.0;

    // Set GL position.
    gl_Position = vec4(clipSpace, 0, 1);
}