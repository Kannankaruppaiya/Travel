# Reproducing the Wanderlog code analysis

The Wanderlog Android app (`base.apk` in the repo root, version 2.223) is an Expo / React Native app.
All of its logic is in `assets/index.android.bundle`, compiled to **Hermes bytecode version 98**.
Older tools (hbctool, hermes-dec) and Hermes' `main` branch can't read v98, so these steps build
Hermes' own disassembler from the exact compiler release.

## 1. Extract the bundle

```bash
git lfs pull                      # the APKs are stored in Git LFS
mkdir -p /tmp/wl && unzip -q base.apk -d /tmp/wl
ls -la /tmp/wl/assets/index.android.bundle   # ~29 MB, starts with c6 1f bc 03 c1 03 19 1f 62 00 00 00
```

## 2. Dump all strings (fast, no build needed)

```bash
python3 -I research/wanderlog/tools/hbc_strings.py /tmp/wl/assets/index.android.bundle /tmp/wl/strings.jsonl
grep -i "couldn't parse" /tmp/wl/strings.jsonl
```

This finds the UI text, API paths (`/api/...`) and enum names.

## 3. Full disassembly (to read the actual logic)

The `250829098.x` versions of the `hermes-compiler` npm package emit bytecode v98
(the version number is `<branch date>` + `<bytecode version>`). Build `hbcdump` from the
`250829098.0.19` release commit:

```bash
git clone --filter=blob:none https://github.com/facebook/hermes.git hermes-src
git -C hermes-src checkout 40b4c8d4e22ed2b9af46aba81aec3ca8aa5e169c   # hermes-compiler 250829098.0.19
cmake -S hermes-src -B hermes-build -G Ninja -DCMAKE_BUILD_TYPE=Release \
      -DHERMES_UNICODE_LITE=ON -DHERMES_ENABLE_INTL=OFF   # no ICU needed
ninja -C hermes-build hbcdump                              # 5-10 min on 4 cores
hermes-build/bin/hbcdump -pretty-disassemble -c "disassemble;quit" \
      -out=/tmp/wl/wanderlog.hasm /tmp/wl/assets/index.android.bundle   # ~155 MB text, 61,309 functions
```

Note: an `hbcdump` built from the last v98 commit on the `static_h` branch (`639e5d6af`) also
accepts v98 files but uses a different opcode table. It prints garbage and crashes on this bundle,
so use the release commit above.

Useful searches in `wanderlog.hasm`:

| What | Search for |
| --- | --- |
| Email import errors | `Function<getEmailErrorMessage>` |
| Supported / unsupported email reservation types | `"taxi/shuttle/car "` |
| Link-import source detection | `Function<getSourceFromParsedURL>`, `Function<getUnsupportedImportHost>` |
| Hotel search sources | `"LodgingBookingSou"` |

The pretty printer truncates long string operands to 17 characters followed by `...`. To see the
full text, look the prefix up in `strings.jsonl`.
