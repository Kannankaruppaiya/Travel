"""Dump the string table of a Hermes bytecode bundle (bytecode version 98).

Usage:
    python3 -I hbc_strings.py index.android.bundle strings.jsonl

Writes one JSON-encoded string per line, in string-table order. Works on the
Wanderlog Android bundle (assets/index.android.bundle), which uses Hermes
bytecode v98: a 128-byte file header followed by 12-byte small function
headers, then the string kinds, identifier hashes, small string table,
overflow string table and string storage, each 4-byte aligned.
"""
import json
import struct
import sys

HEADER_SIZE = 128
SMALL_FUNC_HEADER_SIZE = 12  # v98 (Hermes static_h / 250829098 release)
MAX_STRING_LEN = 200_000


def align(x):
    return (x + 3) & ~3


def main(path, out):
    data = open(path, 'rb').read()
    magic, version = struct.unpack_from('<QI', data, 0)
    if version != 98:
        sys.exit(f'expected Hermes bytecode v98, found v{version}')
    (_file_len, _global_idx, func_count, kind_count, ident_count, str_count,
     overflow_count, storage_size) = struct.unpack_from('<8I', data, 32)

    off = HEADER_SIZE + func_count * SMALL_FUNC_HEADER_SIZE
    off = align(off) + kind_count * 4
    off = align(off) + ident_count * 4
    small_off = align(off)
    over_off = align(small_off + str_count * 4)
    storage_off = align(over_off + overflow_count * 8)

    with open(out, 'w') as f:
        for i in range(str_count):
            entry, = struct.unpack_from('<I', data, small_off + i * 4)
            is_utf16 = entry & 1
            offset = (entry >> 1) & 0x7FFFFF
            length = entry >> 24
            if length == 255:  # overflowed entry: offset indexes the overflow table
                offset, length = struct.unpack_from('<II', data, over_off + offset * 8)
            if length > MAX_STRING_LEN or offset > storage_size:
                s = '<BAD>'
            elif is_utf16:
                start = storage_off + offset
                s = data[start:start + length * 2].decode('utf-16-le', 'replace')
            else:
                start = storage_off + offset
                s = data[start:start + length].decode('latin-1')
            f.write(json.dumps(s, ensure_ascii=False) + '\n')
    print(f'wrote {str_count} strings to {out}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
