attribute vec2 aVertexPosition;
attribute vec3 uProjectionMat;

void main() {
    gl_Position = vec4(aVertexPosition, 0, 1);
}