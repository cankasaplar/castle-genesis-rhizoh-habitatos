import os
import struct
import numpy as np

INPUT_DIM = 40960
HIDDEN_DIM = 256
QUANT_SCALE = 64
MAGIC_V4 = b"RHNNUEV4"

def export_nnue_v4_bin_numpy(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    np.random.seed(42)
    fw = (np.random.randn(INPUT_DIM, HIDDEN_DIM) * 4.0).astype(np.int16)
    fb = np.full(HIDDEN_DIM, 8, dtype=np.int16)
    ow_w = (np.random.randn(HIDDEN_DIM) * 2.0).astype(np.int16)
    ow_b = (np.random.randn(HIDDEN_DIM) * 2.0).astype(np.int16)
    ob = 0

    with open(output_path, "wb") as f:
        f.write(MAGIC_V4)
        f.write(struct.pack("<II", INPUT_DIM, HIDDEN_DIM))
        f.write(fw.tobytes())
        f.write(fb.tobytes())
        f.write(ow_w.tobytes())
        f.write(ow_b.tobytes())
        f.write(struct.pack("<i", ob))
    print(f"✓ Exported HalfKP NNUE V4 model to {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == "__main__":
    out_bin = os.path.join("config", "rhizoh_nnue.bin")
    export_nnue_v4_bin_numpy(out_bin)
