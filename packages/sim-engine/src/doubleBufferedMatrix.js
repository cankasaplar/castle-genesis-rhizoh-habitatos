/**
 * Double-Buffered Matrix Array
 * Grid/hücresel tabanlı veri durumlarında okuma ve yazma bütünlüğü sağlar
 */
export class DoubleBufferedMatrix {
    constructor(rows, cols, DataType = Float32Array) {
        this.rows = rows;
        this.cols = cols;
        this.size = rows * cols;
        this.primaryBuffer = new DataType(this.size);
        this.backBuffer = new DataType(this.size);
    }

    get(row, col) {
        return this.primaryBuffer[row * this.cols + col];
    }

    /**
     * Değişiklikleri her zaman görünmeyen arka tampona (backBuffer) yazıyoruz
     */
    setNext(row, col, value) {
        this.backBuffer[row * this.cols + col] = value;
    }

    /**
     * Bir sonraki frame'e geçildiğinde tamponları anında takas (swap) ediyoruz
     */
    swap() {
        const temp = this.primaryBuffer;
        this.primaryBuffer = this.backBuffer;
        this.backBuffer = temp;
    }

    clearBackBuffer() {
        this.backBuffer.fill(0);
    }
}
