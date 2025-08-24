// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length4 = 0;
    while (current) {
      current = current.tail;
      length4++;
    }
    return length4 - 1;
  }
};
function prepend(element4, tail) {
  return new NonEmpty(element4, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index5) {
    if (index5 < 0 || index5 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index5);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index5) {
  if (bitOffset === 0) {
    return buffer[index5] ?? 0;
  } else {
    const a = buffer[index5] << bitOffset & 255;
    const b = buffer[index5 + 1] >> 8 - bitOffset;
    return a | b;
  }
}
var UtfCodepoint = class {
  constructor(value2) {
    this.value = value2;
  }
};
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name2, message) {
  if (isBitArrayDeprecationMessagePrinted[name2]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name2} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name2] = true;
}
function bitArraySlice(bitArray, start4, end) {
  end ??= bitArray.bitSize;
  bitArrayValidateRange(bitArray, start4, end);
  if (start4 === end) {
    return new BitArray(new Uint8Array());
  }
  if (start4 === 0 && end === bitArray.bitSize) {
    return bitArray;
  }
  start4 += bitArray.bitOffset;
  end += bitArray.bitOffset;
  const startByteIndex = Math.trunc(start4 / 8);
  const endByteIndex = Math.trunc((end + 7) / 8);
  const byteLength = endByteIndex - startByteIndex;
  let buffer;
  if (startByteIndex === 0 && byteLength === bitArray.rawBuffer.byteLength) {
    buffer = bitArray.rawBuffer;
  } else {
    buffer = new Uint8Array(
      bitArray.rawBuffer.buffer,
      bitArray.rawBuffer.byteOffset + startByteIndex,
      byteLength
    );
  }
  return new BitArray(buffer, end - start4, start4 % 8);
}
function bitArraySliceToInt(bitArray, start4, end, isBigEndian, isSigned) {
  bitArrayValidateRange(bitArray, start4, end);
  if (start4 === end) {
    return 0;
  }
  start4 += bitArray.bitOffset;
  end += bitArray.bitOffset;
  const isStartByteAligned = start4 % 8 === 0;
  const isEndByteAligned = end % 8 === 0;
  if (isStartByteAligned && isEndByteAligned) {
    return intFromAlignedSlice(
      bitArray,
      start4 / 8,
      end / 8,
      isBigEndian,
      isSigned
    );
  }
  const size2 = end - start4;
  const startByteIndex = Math.trunc(start4 / 8);
  const endByteIndex = Math.trunc((end - 1) / 8);
  if (startByteIndex == endByteIndex) {
    const mask2 = 255 >> start4 % 8;
    const unusedLowBitCount = (8 - end % 8) % 8;
    let value2 = (bitArray.rawBuffer[startByteIndex] & mask2) >> unusedLowBitCount;
    if (isSigned) {
      const highBit = 2 ** (size2 - 1);
      if (value2 >= highBit) {
        value2 -= highBit * 2;
      }
    }
    return value2;
  }
  if (size2 <= 53) {
    return intFromUnalignedSliceUsingNumber(
      bitArray.rawBuffer,
      start4,
      end,
      isBigEndian,
      isSigned
    );
  } else {
    return intFromUnalignedSliceUsingBigInt(
      bitArray.rawBuffer,
      start4,
      end,
      isBigEndian,
      isSigned
    );
  }
}
function intFromAlignedSlice(bitArray, start4, end, isBigEndian, isSigned) {
  const byteSize = end - start4;
  if (byteSize <= 6) {
    return intFromAlignedSliceUsingNumber(
      bitArray.rawBuffer,
      start4,
      end,
      isBigEndian,
      isSigned
    );
  } else {
    return intFromAlignedSliceUsingBigInt(
      bitArray.rawBuffer,
      start4,
      end,
      isBigEndian,
      isSigned
    );
  }
}
function intFromAlignedSliceUsingNumber(buffer, start4, end, isBigEndian, isSigned) {
  const byteSize = end - start4;
  let value2 = 0;
  if (isBigEndian) {
    for (let i = start4; i < end; i++) {
      value2 *= 256;
      value2 += buffer[i];
    }
  } else {
    for (let i = end - 1; i >= start4; i--) {
      value2 *= 256;
      value2 += buffer[i];
    }
  }
  if (isSigned) {
    const highBit = 2 ** (byteSize * 8 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2;
    }
  }
  return value2;
}
function intFromAlignedSliceUsingBigInt(buffer, start4, end, isBigEndian, isSigned) {
  const byteSize = end - start4;
  let value2 = 0n;
  if (isBigEndian) {
    for (let i = start4; i < end; i++) {
      value2 *= 256n;
      value2 += BigInt(buffer[i]);
    }
  } else {
    for (let i = end - 1; i >= start4; i--) {
      value2 *= 256n;
      value2 += BigInt(buffer[i]);
    }
  }
  if (isSigned) {
    const highBit = 1n << BigInt(byteSize * 8 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2n;
    }
  }
  return Number(value2);
}
function intFromUnalignedSliceUsingNumber(buffer, start4, end, isBigEndian, isSigned) {
  const isStartByteAligned = start4 % 8 === 0;
  let size2 = end - start4;
  let byteIndex = Math.trunc(start4 / 8);
  let value2 = 0;
  if (isBigEndian) {
    if (!isStartByteAligned) {
      const leadingBitsCount = 8 - start4 % 8;
      value2 = buffer[byteIndex++] & (1 << leadingBitsCount) - 1;
      size2 -= leadingBitsCount;
    }
    while (size2 >= 8) {
      value2 *= 256;
      value2 += buffer[byteIndex++];
      size2 -= 8;
    }
    if (size2 > 0) {
      value2 *= 2 ** size2;
      value2 += buffer[byteIndex] >> 8 - size2;
    }
  } else {
    if (isStartByteAligned) {
      let size3 = end - start4;
      let scale = 1;
      while (size3 >= 8) {
        value2 += buffer[byteIndex++] * scale;
        scale *= 256;
        size3 -= 8;
      }
      value2 += (buffer[byteIndex] >> 8 - size3) * scale;
    } else {
      const highBitsCount = start4 % 8;
      const lowBitsCount = 8 - highBitsCount;
      let size3 = end - start4;
      let scale = 1;
      while (size3 >= 8) {
        const byte = buffer[byteIndex] << highBitsCount | buffer[byteIndex + 1] >> lowBitsCount;
        value2 += (byte & 255) * scale;
        scale *= 256;
        size3 -= 8;
        byteIndex++;
      }
      if (size3 > 0) {
        const lowBitsUsed = size3 - Math.max(0, size3 - lowBitsCount);
        let trailingByte = (buffer[byteIndex] & (1 << lowBitsCount) - 1) >> lowBitsCount - lowBitsUsed;
        size3 -= lowBitsUsed;
        if (size3 > 0) {
          trailingByte *= 2 ** size3;
          trailingByte += buffer[byteIndex + 1] >> 8 - size3;
        }
        value2 += trailingByte * scale;
      }
    }
  }
  if (isSigned) {
    const highBit = 2 ** (end - start4 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2;
    }
  }
  return value2;
}
function intFromUnalignedSliceUsingBigInt(buffer, start4, end, isBigEndian, isSigned) {
  const isStartByteAligned = start4 % 8 === 0;
  let size2 = end - start4;
  let byteIndex = Math.trunc(start4 / 8);
  let value2 = 0n;
  if (isBigEndian) {
    if (!isStartByteAligned) {
      const leadingBitsCount = 8 - start4 % 8;
      value2 = BigInt(buffer[byteIndex++] & (1 << leadingBitsCount) - 1);
      size2 -= leadingBitsCount;
    }
    while (size2 >= 8) {
      value2 *= 256n;
      value2 += BigInt(buffer[byteIndex++]);
      size2 -= 8;
    }
    if (size2 > 0) {
      value2 <<= BigInt(size2);
      value2 += BigInt(buffer[byteIndex] >> 8 - size2);
    }
  } else {
    if (isStartByteAligned) {
      let size3 = end - start4;
      let shift = 0n;
      while (size3 >= 8) {
        value2 += BigInt(buffer[byteIndex++]) << shift;
        shift += 8n;
        size3 -= 8;
      }
      value2 += BigInt(buffer[byteIndex] >> 8 - size3) << shift;
    } else {
      const highBitsCount = start4 % 8;
      const lowBitsCount = 8 - highBitsCount;
      let size3 = end - start4;
      let shift = 0n;
      while (size3 >= 8) {
        const byte = buffer[byteIndex] << highBitsCount | buffer[byteIndex + 1] >> lowBitsCount;
        value2 += BigInt(byte & 255) << shift;
        shift += 8n;
        size3 -= 8;
        byteIndex++;
      }
      if (size3 > 0) {
        const lowBitsUsed = size3 - Math.max(0, size3 - lowBitsCount);
        let trailingByte = (buffer[byteIndex] & (1 << lowBitsCount) - 1) >> lowBitsCount - lowBitsUsed;
        size3 -= lowBitsUsed;
        if (size3 > 0) {
          trailingByte <<= size3;
          trailingByte += buffer[byteIndex + 1] >> 8 - size3;
        }
        value2 += BigInt(trailingByte) << shift;
      }
    }
  }
  if (isSigned) {
    const highBit = 2n ** BigInt(end - start4 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2n;
    }
  }
  return Number(value2);
}
function bitArrayValidateRange(bitArray, start4, end) {
  if (start4 < 0 || start4 > bitArray.bitSize || end < start4 || end > bitArray.bitSize) {
    const msg = `Invalid bit array slice: start = ${start4}, end = ${end}, bit size = ${bitArray.bitSize}`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value2) {
    super();
    this[0] = value2;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values3 = [x, y];
  while (values3.length) {
    let a = values3.pop();
    let b = values3.pop();
    if (a === b) continue;
    if (!isObject(a) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a);
    for (let k of keys2(a)) {
      values3.push(get2(a, k), get2(b, k));
    }
  }
  return true;
}
function getters(object4) {
  if (object4 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object4 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c)) return false;
  return a.constructor === b.constructor;
}
function makeError(variant, file, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root3, shift, hash, key, val, addedLeaf) {
  switch (root3.type) {
    case ARRAY_NODE:
      return assocArray(root3, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root3, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root3, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root3, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size + 1,
      array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: ARRAY_NODE,
        size: root3.size,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root3;
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function assocIndex(root3, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root3.bitmap, bit);
  if ((root3.bitmap & bit) !== 0) {
    const node = root3.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root3.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root3.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root3.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root3.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root3, shift, hash, key, val, addedLeaf) {
  if (hash === root3.hash) {
    const idx = collisionIndexOf(root3, key);
    if (idx !== -1) {
      const entry = root3.array[idx];
      if (entry.v === val) {
        return root3;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size2 = root3.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root3.array, size2, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root3.hash, shift),
      array: [root3]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root3, key) {
  const size2 = root3.array.length;
  for (let i = 0; i < size2; i++) {
    if (isEqual(key, root3.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return findArray(root3, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root3, key);
  }
}
function findArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return void 0;
  }
  return root3.array[idx];
}
function without(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return withoutArray(root3, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root3, key);
  }
}
function withoutArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return root3;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root3;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
  }
  if (n === void 0) {
    if (root3.size <= MIN_ARRAY_NODE) {
      const arr = root3.array;
      const out = new Array(root3.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root3.size - 1,
      array: cloneAndSet(root3.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function withoutIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return root3;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  return root3;
}
function withoutCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return root3;
  }
  if (root3.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root3.hash,
    array: spliceOut(root3.array, idx)
  };
}
function forEach(root3, fn) {
  if (root3 === void 0) {
    return;
  }
  const items = root3.array;
  const size2 = items.length;
  for (let i = 0; i < size2; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root3, size2) {
    this.root = root3;
    this.size = size2;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root3 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root3, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = /* @__PURE__ */ Symbol();

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function length_loop(loop$list, loop$count) {
  while (true) {
    let list4 = loop$list;
    let count = loop$count;
    if (list4 instanceof Empty) {
      return count;
    } else {
      let list$1 = list4.tail;
      loop$list = list$1;
      loop$count = count + 1;
    }
  }
}
function length(list4) {
  return length_loop(list4, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix2 = loop$prefix;
    let suffix = loop$suffix;
    if (prefix2 instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix2.head;
      let rest$1 = prefix2.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function is_empty2(list4) {
  return isEqual(list4, toList([]));
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list4 = loop$list;
    let elem = loop$elem;
    if (list4 instanceof Empty) {
      return false;
    } else {
      let first$1 = list4.head;
      if (isEqual(first$1, elem)) {
        return true;
      } else {
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$elem = elem;
      }
    }
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list4, predicate) {
  return filter_loop(list4, predicate, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let index5 = loop$index;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let acc$1 = prepend(fun(first$1, index5), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index5 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list4, fun) {
  return index_map_loop(list4, fun, 0, toList([]));
}
function drop(loop$list, loop$n) {
  while (true) {
    let list4 = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list4;
    } else {
      if (list4 instanceof Empty) {
        return toList([]);
      } else {
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$n = n - 1;
      }
    }
  }
}
function take_loop(loop$list, loop$n, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let n = loop$n;
    let acc = loop$acc;
    let $ = n <= 0;
    if ($) {
      return reverse(acc);
    } else {
      if (list4 instanceof Empty) {
        return reverse(acc);
      } else {
        let first$1 = list4.head;
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$n = n - 1;
        loop$acc = prepend(first$1, acc);
      }
    }
  }
}
function take(list4, n) {
  return take_loop(list4, n, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second = loop$second;
    if (first instanceof Empty) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first, second) {
  return append_loop(reverse(first), second);
}
function prepend2(list4, item) {
  return prepend(item, list4);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function any(loop$list, loop$predicate) {
  while (true) {
    let list4 = loop$list;
    let predicate = loop$predicate;
    if (list4 instanceof Empty) {
      return false;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = predicate(first$1);
      if ($) {
        return true;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
      }
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list4 instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = compare4(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare4;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2 instanceof Empty) {
      return toList([]);
    } else if (direction instanceof Ascending) {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Descending();
        loop$compare = compare4;
      }
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Ascending();
        loop$compare = compare4;
      }
    }
  }
}
function sort(list4, compare4) {
  if (list4 instanceof Empty) {
    return toList([]);
  } else {
    let $ = list4.tail;
    if ($ instanceof Empty) {
      let x = list4.head;
      return toList([x]);
    } else {
      let x = list4.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare4(x, y);
      if ($1 instanceof Lt) {
        _block = new Ascending();
      } else if ($1 instanceof Eq) {
        _block = new Ascending();
      } else {
        _block = new Descending();
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare4,
        toList([x]),
        direction,
        y,
        toList([])
      );
      return merge_all(sequences$1, new Ascending(), compare4);
    }
  }
}
function shuffle_pair_unwrap_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return acc;
    } else {
      let elem_pair = list4.head;
      let enumerable = list4.tail;
      loop$list = enumerable;
      loop$acc = prepend(elem_pair[1], acc);
    }
  }
}
function do_shuffle_by_pair_indexes(list_of_pairs) {
  return sort(
    list_of_pairs,
    (a_pair, b_pair) => {
      return compare(a_pair[0], b_pair[0]);
    }
  );
}
function shuffle(list4) {
  let _pipe = list4;
  let _pipe$1 = fold(
    _pipe,
    toList([]),
    (acc, a) => {
      return prepend([random_uniform(), a], acc);
    }
  );
  let _pipe$2 = do_shuffle_by_pair_indexes(_pipe$1);
  return shuffle_pair_unwrap_loop(_pipe$2, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string5;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder7) {
  let $ = decoder7.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map2(decoder7, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder7.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function then$(decoder7, next) {
  return new Decoder(
    (dynamic_data) => {
      let $ = decoder7.function(dynamic_data);
      let data = $[0];
      let errors = $[1];
      let decoder$1 = next(data);
      let $1 = decoder$1.function(dynamic_data);
      let layer = $1;
      let data$1 = $1[0];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return [data$1, errors];
      }
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure2 = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure2;
    } else {
      let decoder7 = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder7.function(data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function decode_error(expected, found) {
  return toList([
    new DecodeError(expected, classify_dynamic(found), toList([]))
  ]);
}
function run_dynamic_function(data, name2, f) {
  let $ = f(data);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError(name2, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_bool(data) {
  let $ = isEqual(identity(true), data);
  if ($) {
    return [true, toList([])];
  } else {
    let $1 = isEqual(identity(false), data);
    if ($1) {
      return [false, toList([])];
    } else {
      return [false, decode_error("Bool", data)];
    }
  }
}
function decode_int(data) {
  return run_dynamic_function(data, "Int", int);
}
function failure(zero, expected) {
  return new Decoder((d) => {
    return [zero, decode_error(expected, d)];
  });
}
var bool = /* @__PURE__ */ new Decoder(decode_bool);
var int2 = /* @__PURE__ */ new Decoder(decode_int);
function decode_string(data) {
  return run_dynamic_function(data, "String", string);
}
var string2 = /* @__PURE__ */ new Decoder(decode_string);
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p2, k) => {
          return push_path(p2, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path(layer, path) {
  let decoder7 = one_of(
    string2,
    toList([
      (() => {
        let _pipe = int2;
        return map2(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map(
    path,
    (key) => {
      let key$1 = identity(key);
      let $ = run(key$1, decoder7);
      if ($ instanceof Ok) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function console_log(term) {
  console.log(term);
}
function random_uniform() {
  const random_uniform_result = Math.random();
  if (random_uniform_result === 1) {
    return random_uniform();
  }
  return random_uniform_result;
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Array`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Nil";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function index2(data, key) {
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key, token);
    if (entry === token) return new Ok(new None());
    return new Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && data instanceof List) {
    let i = 0;
    for (const value2 of data) {
      if (i === key) return new Ok(new Some(value2));
      i++;
    }
    return new Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key in data) return new Ok(new Some(data[key]));
    return new Ok(new None());
  }
  return new Error(key_is_int ? "Indexable" : "Dict");
}
function list(data, decode2, pushPath, index5, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    const error = new DecodeError("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element4 of data) {
    const layer = decode2(element4);
    const [out, errors] = layer;
    if (errors instanceof NonEmpty) {
      const [_, errors2] = pushPath(layer, index5.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index5++;
  }
  return [List.fromArray(decoded), emptyList];
}
function int(data) {
  if (Number.isInteger(data)) return new Ok(data);
  return new Error(0);
}
function string(data) {
  if (typeof data === "string") return new Ok(data);
  return new Error("");
}

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function compare(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function unwrap(result, default$) {
  if (result instanceof Ok) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function negate(bool4) {
  return !bool4;
}
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function object(entries) {
  return Object.fromEntries(entries);
}
function identity3(x) {
  return x;
}
function array(list4) {
  return list4.toArray();
}

// build/dev/javascript/gleam_json/gleam/json.mjs
function string3(input2) {
  return identity3(input2);
}
function bool2(input2) {
  return identity3(input2);
}
function int3(input2) {
  return identity3(input2);
}
function object2(entries) {
  return object(entries);
}
function preprocessed_array(from2) {
  return array(from2);
}
function array2(entries, inner_type) {
  let _pipe = entries;
  let _pipe$1 = map(_pipe, inner_type);
  return preprocessed_array(_pipe$1);
}

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var document = () => globalThis?.document;
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var option_none = /* @__PURE__ */ new None();

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ new Gt();
var LT = /* @__PURE__ */ new Lt();
var EQ = /* @__PURE__ */ new Eq();
function compare3(a, b) {
  if (a.name === b.name) {
    return EQ;
  } else if (a.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name2, value2) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value2;
  }
};
var Property = class extends CustomType {
  constructor(kind, name2, value2) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value2;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name2, handler, include, prevent_default, stop_propagation, immediate2, debounce, throttle) {
    super();
    this.kind = kind;
    this.name = name2;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.immediate = immediate2;
    this.debounce = debounce;
    this.throttle = throttle;
  }
};
var Handler = class extends CustomType {
  constructor(prevent_default, stop_propagation, message) {
    super();
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.message = message;
  }
};
var Never = class extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
};
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes instanceof Empty) {
      return merged;
    } else {
      let $ = attributes.head;
      if ($ instanceof Attribute) {
        let $1 = $.name;
        if ($1 === "") {
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = merged;
        } else if ($1 === "class") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "class") {
                  let kind = $.kind;
                  let class1 = $2;
                  let rest = $3.tail;
                  let class2 = $4.value;
                  let value2 = class1 + " " + class2;
                  let attribute$1 = new Attribute(kind, "class", value2);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else if ($1 === "style") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "style") {
                  let kind = $.kind;
                  let style1 = $2;
                  let rest = $3.tail;
                  let style2 = $4.value;
                  let value2 = style1 + ";" + style2;
                  let attribute$1 = new Attribute(kind, "style", value2);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else {
          let attribute$1 = $;
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      } else {
        let attribute$1 = $;
        let rest = attributes.tail;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      }
    }
  }
}
function prepare(attributes) {
  if (attributes instanceof Empty) {
    return attributes;
  } else {
    let $ = attributes.tail;
    if ($ instanceof Empty) {
      return attributes;
    } else {
      let _pipe = attributes;
      let _pipe$1 = sort(_pipe, (a, b) => {
        return compare3(b, a);
      });
      return merge(_pipe$1, empty_list);
    }
  }
}
var attribute_kind = 0;
function attribute(name2, value2) {
  return new Attribute(attribute_kind, name2, value2);
}
var property_kind = 1;
function property(name2, value2) {
  return new Property(property_kind, name2, value2);
}
var event_kind = 2;
function event(name2, handler, include, prevent_default, stop_propagation, immediate2, debounce, throttle) {
  return new Event2(
    event_kind,
    name2,
    handler,
    include,
    prevent_default,
    stop_propagation,
    immediate2,
    debounce,
    throttle
  );
}
var never_kind = 0;
var never = /* @__PURE__ */ new Never(never_kind);
var always_kind = 2;

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name2, value2) {
  return attribute(name2, value2);
}
function property2(name2, value2) {
  return property(name2, value2);
}
function boolean_attribute(name2, value2) {
  if (value2) {
    return attribute2(name2, "");
  } else {
    return property2(name2, bool2(false));
  }
}
function class$(name2) {
  return attribute2("class", name2);
}
function none() {
  return class$("");
}
function do_styles(loop$properties, loop$styles) {
  while (true) {
    let properties = loop$properties;
    let styles2 = loop$styles;
    if (properties instanceof Empty) {
      return styles2;
    } else {
      let $ = properties.head[0];
      if ($ === "") {
        let rest = properties.tail;
        loop$properties = rest;
        loop$styles = styles2;
      } else {
        let $1 = properties.head[1];
        if ($1 === "") {
          let rest = properties.tail;
          loop$properties = rest;
          loop$styles = styles2;
        } else {
          let rest = properties.tail;
          let name$1 = $;
          let value$1 = $1;
          loop$properties = rest;
          loop$styles = styles2 + name$1 + ":" + value$1 + ";";
        }
      }
    }
  }
}
function styles(properties) {
  return attribute2("style", do_styles(properties, ""));
}
function checked(is_checked) {
  return boolean_attribute("checked", is_checked);
}
function disabled(is_disabled) {
  return boolean_attribute("disabled", is_disabled);
}
function name(element_name) {
  return attribute2("name", element_name);
}
function selected(is_selected) {
  return boolean_attribute("selected", is_selected);
}
function type_(control_type) {
  return attribute2("type", control_type);
}
function value(control_value) {
  return attribute2("value", control_value);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var Actions = class extends CustomType {
  constructor(dispatch, emit, select2, root3, provide) {
    super();
    this.dispatch = dispatch;
    this.emit = emit;
    this.select = select2;
    this.root = root3;
    this.provide = provide;
  }
};
function do_comap_select(_, _1, _2) {
  return void 0;
}
function do_comap_actions(actions, f) {
  return new Actions(
    (msg) => {
      return actions.dispatch(f(msg));
    },
    actions.emit,
    (selector) => {
      return do_comap_select(actions, selector, f);
    },
    actions.root,
    actions.provide
  );
}
function do_map(effects, f) {
  return map(
    effects,
    (effect) => {
      return (actions) => {
        return effect(do_comap_actions(actions, f));
      };
    }
  );
}
function map3(effect, f) {
  return new Effect(
    do_map(effect.synchronous, f),
    do_map(effect.before_paint, f),
    do_map(effect.after_paint, f)
  );
}
var empty = /* @__PURE__ */ new Effect(
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([])
);
function none2() {
  return empty;
}
function from(effect) {
  let task = (actions) => {
    let dispatch = actions.dispatch;
    return effect(dispatch);
  };
  let _record = empty;
  return new Effect(toList([task]), _record.before_paint, _record.after_paint);
}
function batch(effects) {
  return fold(
    effects,
    empty,
    (acc, eff) => {
      return new Effect(
        fold(eff.synchronous, acc.synchronous, prepend2),
        fold(eff.before_paint, acc.before_paint, prepend2),
        fold(eff.after_paint, acc.after_paint, prepend2)
      );
    }
  );
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get(map7, key) {
  const value2 = map7?.get(key);
  if (value2 != null) {
    return new Ok(value2);
  } else {
    return new Error(void 0);
  }
}
function has_key2(map7, key) {
  return map7 && map7.has(key);
}
function insert2(map7, key, value2) {
  map7 ??= /* @__PURE__ */ new Map();
  map7.set(key, value2);
  return map7;
}
function remove(map7, key) {
  map7?.delete(key);
  return map7;
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Key = class extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index5, parent) {
    super();
    this.index = index5;
    this.parent = parent;
  }
};
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return true;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function add2(parent, index5, key) {
  if (key === "") {
    return new Index(index5, parent);
  } else {
    return new Key(key, parent);
  }
}
var root2 = /* @__PURE__ */ new Root();
var separator_element = "	";
function do_to_string(loop$path, loop$acc) {
  while (true) {
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      if (acc instanceof Empty) {
        return "";
      } else {
        let segments = acc.tail;
        return concat2(segments);
      }
    } else if (path instanceof Key) {
      let key = path.key;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(separator_element, prepend(key, acc));
    } else {
      let index5 = path.index;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_element,
        prepend(to_string(index5), acc)
      );
    }
  }
}
function to_string2(path) {
  return do_to_string(path, toList([]));
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string2(path), candidates);
  }
}
var separator_event = "\n";
function event2(path, event4) {
  return do_to_string(path, toList([separator_event, event4]));
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key, mapper, children, keyed_children) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.children = children;
    this.keyed_children = keyed_children;
  }
};
var Element = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text = class extends CustomType {
  constructor(kind, key, mapper, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
};
function is_void_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function to_keyed(key, node) {
  if (node instanceof Fragment) {
    let _record = node;
    return new Fragment(
      _record.kind,
      key,
      _record.mapper,
      _record.children,
      _record.keyed_children
    );
  } else if (node instanceof Element) {
    let _record = node;
    return new Element(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.children,
      _record.keyed_children,
      _record.self_closing,
      _record.void
    );
  } else if (node instanceof Text) {
    let _record = node;
    return new Text(_record.kind, key, _record.mapper, _record.content);
  } else {
    let _record = node;
    return new UnsafeInnerHtml(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.inner_html
    );
  }
}
var fragment_kind = 0;
function fragment(key, mapper, children, keyed_children) {
  return new Fragment(fragment_kind, key, mapper, children, keyed_children);
}
var element_kind = 1;
function element(key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element(
    element_kind,
    key,
    mapper,
    namespace,
    tag,
    prepare(attributes),
    children,
    keyed_children,
    self_closing,
    void$ || is_void_element(tag, namespace)
  );
}
var text_kind = 2;
function text(key, mapper, content) {
  return new Text(text_kind, key, mapper, content);
}
var unsafe_inner_html_kind = 3;

// build/dev/javascript/lustre/lustre/internals/equals.ffi.mjs
var isReferenceEqual = (a, b) => a === b;
var isEqual2 = (a, b) => {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  const type = typeof a;
  if (type !== typeof b) {
    return false;
  }
  if (type !== "object") {
    return false;
  }
  const ctor = a.constructor;
  if (ctor !== b.constructor) {
    return false;
  }
  if (Array.isArray(a)) {
    return areArraysEqual(a, b);
  }
  return areObjectsEqual(a, b);
};
var areArraysEqual = (a, b) => {
  let index5 = a.length;
  if (index5 !== b.length) {
    return false;
  }
  while (index5--) {
    if (!isEqual2(a[index5], b[index5])) {
      return false;
    }
  }
  return true;
};
var areObjectsEqual = (a, b) => {
  const properties = Object.keys(a);
  let index5 = properties.length;
  if (Object.keys(b).length !== index5) {
    return false;
  }
  while (index5--) {
    const property3 = properties[index5];
    if (!Object.hasOwn(b, property3)) {
      return false;
    }
    if (!isEqual2(a[property3], b[property3])) {
      return false;
    }
  }
  return true;
};

// build/dev/javascript/lustre/lustre/vdom/events.mjs
var Events = class extends CustomType {
  constructor(handlers, dispatched_paths, next_dispatched_paths) {
    super();
    this.handlers = handlers;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
function new$3() {
  return new Events(
    empty2(),
    empty_list,
    empty_list
  );
}
function tick(events) {
  return new Events(
    events.handlers,
    events.next_dispatched_paths,
    empty_list
  );
}
function do_remove_event(handlers, path, name2) {
  return remove(handlers, event2(path, name2));
}
function remove_event(events, path, name2) {
  let handlers = do_remove_event(events.handlers, path, name2);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function remove_attributes(handlers, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name2 = attribute3.name;
        return do_remove_event(events, path, name2);
      } else {
        return events;
      }
    }
  );
}
function handle(events, path, name2, event4) {
  let next_dispatched_paths = prepend(path, events.next_dispatched_paths);
  let _block;
  let _record = events;
  _block = new Events(
    _record.handlers,
    _record.dispatched_paths,
    next_dispatched_paths
  );
  let events$1 = _block;
  let $ = get(
    events$1.handlers,
    path + separator_event + name2
  );
  if ($ instanceof Ok) {
    let handler = $[0];
    return [events$1, run(event4, handler)];
  } else {
    return [events$1, new Error(toList([]))];
  }
}
function has_dispatched_events(events, path) {
  return matches(path, events.dispatched_paths);
}
function do_add_event(handlers, mapper, path, name2, handler) {
  return insert2(
    handlers,
    event2(path, name2),
    map2(
      handler,
      (handler2) => {
        let _record = handler2;
        return new Handler(
          _record.prevent_default,
          _record.stop_propagation,
          identity2(mapper)(handler2.message)
        );
      }
    )
  );
}
function add_event(events, mapper, path, name2, handler) {
  let handlers = do_add_event(events.handlers, mapper, path, name2, handler);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_attributes(handlers, mapper, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name2 = attribute3.name;
        let handler = attribute3.handler;
        return do_add_event(events, mapper, path, name2, handler);
      } else {
        return events;
      }
    }
  );
}
function compose_mapper(mapper, child_mapper) {
  let $ = isReferenceEqual(mapper, identity2);
  let $1 = isReferenceEqual(child_mapper, identity2);
  if ($1) {
    return mapper;
  } else if ($) {
    return child_mapper;
  } else {
    return (msg) => {
      return mapper(child_mapper(msg));
    };
  }
}
function do_remove_children(loop$handlers, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_remove_child(_pipe, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$path = path;
      loop$child_index = child_index + 1;
      loop$children = rest;
    }
  }
}
function do_remove_child(handlers, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    return do_remove_children(handlers, path, 0, children);
  } else if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path, attributes);
    return do_remove_children(_pipe$1, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    return remove_attributes(handlers, path, attributes);
  }
}
function remove_child(events, parent, child_index, child) {
  let handlers = do_remove_child(events.handlers, parent, child_index, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function do_add_children(loop$handlers, loop$mapper, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let mapper = loop$mapper;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_add_child(_pipe, mapper, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$mapper = mapper;
      loop$path = path;
      loop$child_index = child_index + 1;
      loop$children = rest;
    }
  }
}
function do_add_child(handlers, mapper, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return do_add_children(handlers, composed_mapper, path, 0, children);
  } else if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path, attributes);
    return do_add_children(_pipe$1, composed_mapper, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path, attributes);
  }
}
function add_child(events, mapper, parent, index5, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index5, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_children(events, mapper, path, child_index, children) {
  let handlers = do_add_children(
    events.handlers,
    mapper,
    path,
    child_index,
    children
  );
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag, attributes, children) {
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function text2(content) {
  return text("", identity2, content);
}
function none3() {
  return text("", identity2, "");
}
function map4(element4, f) {
  let mapper = identity2(compose_mapper(identity2(f), element4.mapper));
  if (element4 instanceof Fragment) {
    let children = element4.children;
    let keyed_children = element4.keyed_children;
    let _record = element4;
    return new Fragment(
      _record.kind,
      _record.key,
      mapper,
      identity2(children),
      identity2(keyed_children)
    );
  } else if (element4 instanceof Element) {
    let attributes = element4.attributes;
    let children = element4.children;
    let keyed_children = element4.keyed_children;
    let _record = element4;
    return new Element(
      _record.kind,
      _record.key,
      mapper,
      _record.namespace,
      _record.tag,
      identity2(attributes),
      identity2(children),
      identity2(keyed_children),
      _record.self_closing,
      _record.void
    );
  } else if (element4 instanceof Text) {
    return identity2(element4);
  } else {
    let attributes = element4.attributes;
    let _record = element4;
    return new UnsafeInnerHtml(
      _record.kind,
      _record.key,
      mapper,
      _record.namespace,
      _record.tag,
      identity2(attributes),
      _record.inner_html
    );
  }
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function h1(attrs, children) {
  return element2("h1", attrs, children);
}
function h2(attrs, children) {
  return element2("h2", attrs, children);
}
function h3(attrs, children) {
  return element2("h3", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function hr(attrs) {
  return element2("hr", attrs, empty_list);
}
function li(attrs, children) {
  return element2("li", attrs, children);
}
function p(attrs, children) {
  return element2("p", attrs, children);
}
function ul(attrs, children) {
  return element2("ul", attrs, children);
}
function span(attrs, children) {
  return element2("span", attrs, children);
}
function table(attrs, children) {
  return element2("table", attrs, children);
}
function tbody(attrs, children) {
  return element2("tbody", attrs, children);
}
function td(attrs, children) {
  return element2("td", attrs, children);
}
function th(attrs, children) {
  return element2("th", attrs, children);
}
function thead(attrs, children) {
  return element2("thead", attrs, children);
}
function tr(attrs, children) {
  return element2("tr", attrs, children);
}
function button(attrs, children) {
  return element2("button", attrs, children);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}
function label(attrs, children) {
  return element2("label", attrs, children);
}
function option(attrs, label2) {
  return element2("option", attrs, toList([text2(label2)]));
}
function select(attrs, children) {
  return element2("select", attrs, children);
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
var Patch = class extends CustomType {
  constructor(index5, removed, changes, children) {
    super();
    this.index = index5;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key, before) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
  }
};
var Replace = class extends CustomType {
  constructor(kind, index5, with$) {
    super();
    this.kind = kind;
    this.index = index5;
    this.with = with$;
  }
};
var Remove = class extends CustomType {
  constructor(kind, index5) {
    super();
    this.kind = kind;
    this.index = index5;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
};
function new$5(index5, removed, changes, children) {
  return new Patch(index5, removed, changes, children);
}
var replace_text_kind = 0;
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
var replace_inner_html_kind = 1;
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
var update_kind = 2;
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
var move_kind = 3;
function move(key, before) {
  return new Move(move_kind, key, before);
}
var remove_kind = 4;
function remove2(index5) {
  return new Remove(remove_kind, index5);
}
var replace_kind = 5;
function replace2(index5, with$) {
  return new Replace(replace_kind, index5, with$);
}
var insert_kind = 6;
function insert3(children, before) {
  return new Insert(insert_kind, children, before);
}

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, events) {
    super();
    this.patch = patch;
    this.events = events;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events;
  }
};
function is_controlled(events, namespace, tag, path) {
  if (tag === "input") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag === "select") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag === "textarea") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$mapper, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let mapper = loop$mapper;
    let events = loop$events;
    let old = loop$old;
    let new$8 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (new$8 instanceof Empty) {
      if (old instanceof Empty) {
        return new AttributeChange(added, removed, events);
      } else {
        let $ = old.head;
        if ($ instanceof Event2) {
          let prev = $;
          let old$1 = old.tail;
          let name2 = $.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name2);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = old$1;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let prev = $;
          let old$1 = old.tail;
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = old$1;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        }
      }
    } else if (old instanceof Empty) {
      let $ = new$8.head;
      if ($ instanceof Event2) {
        let next = $;
        let new$1 = new$8.tail;
        let name2 = $.name;
        let handler = $.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name2, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let next = $;
        let new$1 = new$8.tail;
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      }
    } else {
      let next = new$8.head;
      let remaining_new = new$8.tail;
      let prev = old.head;
      let remaining_old = old.tail;
      let $ = compare3(prev, next);
      if ($ instanceof Lt) {
        if (prev instanceof Event2) {
          let name2 = prev.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name2);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        }
      } else if ($ instanceof Eq) {
        if (next instanceof Attribute) {
          if (prev instanceof Attribute) {
            let _block;
            let $1 = next.name;
            if ($1 === "value") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "checked") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "selected") {
              _block = controlled || prev.value !== next.value;
            } else {
              _block = prev.value !== next.value;
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name2 = prev.name;
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name2);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (next instanceof Property) {
          if (prev instanceof Property) {
            let _block;
            let $1 = next.name;
            if ($1 === "scrollLeft") {
              _block = true;
            } else if ($1 === "scrollRight") {
              _block = true;
            } else if ($1 === "value") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else if ($1 === "checked") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else if ($1 === "selected") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else {
              _block = !isEqual2(prev.value, next.value);
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name2 = prev.name;
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name2);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (prev instanceof Event2) {
          let name2 = next.name;
          let handler = next.handler;
          let has_changes = prev.prevent_default.kind !== next.prevent_default.kind || prev.stop_propagation.kind !== next.stop_propagation.kind || prev.immediate !== next.immediate || prev.debounce !== next.debounce || prev.throttle !== next.throttle;
          let _block;
          if (has_changes) {
            _block = prepend(next, added);
          } else {
            _block = added;
          }
          let added$1 = _block;
          let events$1 = add_event(events, mapper, path, name2, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let name2 = next.name;
          let handler = next.handler;
          let added$1 = prepend(next, added);
          let removed$1 = prepend(prev, removed);
          let events$1 = add_event(events, mapper, path, name2, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed$1;
        }
      } else if (next instanceof Event2) {
        let name2 = next.name;
        let handler = next.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name2, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      }
    }
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$path, loop$changes, loop$children, loop$mapper, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$8 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let path = loop$path;
    let changes = loop$changes;
    let children = loop$children;
    let mapper = loop$mapper;
    let events = loop$events;
    if (new$8 instanceof Empty) {
      if (old instanceof Empty) {
        return new Diff(
          new Patch(patch_index, removed, changes, children),
          events
        );
      } else {
        let prev = old.head;
        let old$1 = old.tail;
        let _block;
        let $ = prev.key === "" || !has_key2(moved, prev.key);
        if ($) {
          _block = removed + 1;
        } else {
          _block = removed;
        }
        let removed$1 = _block;
        let events$1 = remove_child(events, path, node_index, prev);
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed$1;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      }
    } else if (old instanceof Empty) {
      let events$1 = add_children(
        events,
        mapper,
        path,
        node_index,
        new$8
      );
      let insert4 = insert3(new$8, node_index - moved_offset);
      let changes$1 = prepend(insert4, changes);
      return new Diff(
        new Patch(patch_index, removed, changes$1, children),
        events$1
      );
    } else {
      let next = new$8.head;
      let prev = old.head;
      if (prev.key !== next.key) {
        let new_remaining = new$8.tail;
        let old_remaining = old.tail;
        let next_did_exist = get(old_keyed, next.key);
        let prev_does_exist = has_key2(new_keyed, prev.key);
        if (next_did_exist instanceof Ok) {
          if (prev_does_exist) {
            let match = next_did_exist[0];
            let $ = has_key2(moved, prev.key);
            if ($) {
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let before = node_index - moved_offset;
              let changes$1 = prepend(
                move(next.key, before),
                changes
              );
              let moved$1 = insert2(moved, next.key, void 0);
              let moved_offset$1 = moved_offset + 1;
              loop$old = prepend(match, old);
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved$1;
              loop$moved_offset = moved_offset$1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes$1;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let index5 = node_index - moved_offset;
            let changes$1 = prepend(remove2(index5), changes);
            let events$1 = remove_child(events, path, node_index, prev);
            let moved_offset$1 = moved_offset - 1;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new$8;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset$1;
            loop$removed = removed;
            loop$node_index = node_index;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes$1;
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if (prev_does_exist) {
          let before = node_index - moved_offset;
          let events$1 = add_child(
            events,
            mapper,
            path,
            node_index,
            next
          );
          let insert4 = insert3(toList([next]), before);
          let changes$1 = prepend(insert4, changes);
          loop$old = old;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset + 1;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = changes$1;
          loop$children = children;
          loop$mapper = mapper;
          loop$events = events$1;
        } else {
          let change = replace2(node_index - moved_offset, next);
          let _block;
          let _pipe = events;
          let _pipe$1 = remove_child(_pipe, path, node_index, prev);
          _block = add_child(_pipe$1, mapper, path, node_index, next);
          let events$1 = _block;
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = prepend(change, changes);
          loop$children = children;
          loop$mapper = mapper;
          loop$events = events$1;
        }
      } else {
        let $ = old.head;
        if ($ instanceof Fragment) {
          let $1 = new$8.head;
          if ($1 instanceof Fragment) {
            let next$1 = $1;
            let new$1 = new$8.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child_path = add2(path, node_index, next$1.key);
            let child = do_diff(
              prev$1.children,
              prev$1.keyed_children,
              next$1.children,
              next$1.keyed_children,
              empty2(),
              0,
              0,
              0,
              node_index,
              child_path,
              empty_list,
              empty_list,
              composed_mapper,
              events
            );
            let _block;
            let $2 = child.patch;
            let $3 = $2.children;
            if ($3 instanceof Empty) {
              let $4 = $2.changes;
              if ($4 instanceof Empty) {
                let $5 = $2.removed;
                if ($5 === 0) {
                  _block = children;
                } else {
                  _block = prepend(child.patch, children);
                }
              } else {
                _block = prepend(child.patch, children);
              }
            } else {
              _block = prepend(child.patch, children);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes;
            loop$children = children$1;
            loop$mapper = mapper;
            loop$events = child.events;
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Element) {
          let $1 = new$8.head;
          if ($1 instanceof Element) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.namespace === next$1.namespace && prev$1.tag === next$1.tag) {
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              let composed_mapper = compose_mapper(
                mapper,
                next$1.mapper
              );
              let child_path = add2(path, node_index, next$1.key);
              let controlled = is_controlled(
                events,
                next$1.namespace,
                next$1.tag,
                child_path
              );
              let $2 = diff_attributes(
                controlled,
                child_path,
                composed_mapper,
                events,
                prev$1.attributes,
                next$1.attributes,
                empty_list,
                empty_list
              );
              let added_attrs = $2.added;
              let removed_attrs = $2.removed;
              let events$1 = $2.events;
              let _block;
              if (removed_attrs instanceof Empty) {
                if (added_attrs instanceof Empty) {
                  _block = empty_list;
                } else {
                  _block = toList([update(added_attrs, removed_attrs)]);
                }
              } else {
                _block = toList([update(added_attrs, removed_attrs)]);
              }
              let initial_child_changes = _block;
              let child = do_diff(
                prev$1.children,
                prev$1.keyed_children,
                next$1.children,
                next$1.keyed_children,
                empty2(),
                0,
                0,
                0,
                node_index,
                child_path,
                initial_child_changes,
                empty_list,
                composed_mapper,
                events$1
              );
              let _block$1;
              let $3 = child.patch;
              let $4 = $3.children;
              if ($4 instanceof Empty) {
                let $5 = $3.changes;
                if ($5 instanceof Empty) {
                  let $6 = $3.removed;
                  if ($6 === 0) {
                    _block$1 = children;
                  } else {
                    _block$1 = prepend(child.patch, children);
                  }
                } else {
                  _block$1 = prepend(child.patch, children);
                }
              } else {
                _block$1 = prepend(child.patch, children);
              }
              let children$1 = _block$1;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children$1;
              loop$mapper = mapper;
              loop$events = child.events;
            } else {
              let next$2 = $1;
              let new_remaining = new$8.tail;
              let prev$2 = $;
              let old_remaining = old.tail;
              let change = replace2(node_index - moved_offset, next$2);
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$2
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$2
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Text) {
          let $1 = new$8.head;
          if ($1 instanceof Text) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.content === next$1.content) {
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let next$2 = $1;
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              let child = new$5(
                node_index,
                0,
                toList([replace_text(next$2.content)]),
                empty_list
              );
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = prepend(child, children);
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else {
          let $1 = new$8.head;
          if ($1 instanceof UnsafeInnerHtml) {
            let next$1 = $1;
            let new$1 = new$8.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child_path = add2(path, node_index, next$1.key);
            let $2 = diff_attributes(
              false,
              child_path,
              composed_mapper,
              events,
              prev$1.attributes,
              next$1.attributes,
              empty_list,
              empty_list
            );
            let added_attrs = $2.added;
            let removed_attrs = $2.removed;
            let events$1 = $2.events;
            let _block;
            if (removed_attrs instanceof Empty) {
              if (added_attrs instanceof Empty) {
                _block = empty_list;
              } else {
                _block = toList([update(added_attrs, removed_attrs)]);
              }
            } else {
              _block = toList([update(added_attrs, removed_attrs)]);
            }
            let child_changes = _block;
            let _block$1;
            let $3 = prev$1.inner_html === next$1.inner_html;
            if ($3) {
              _block$1 = child_changes;
            } else {
              _block$1 = prepend(
                replace_inner_html(next$1.inner_html),
                child_changes
              );
            }
            let child_changes$1 = _block$1;
            let _block$2;
            if (child_changes$1 instanceof Empty) {
              _block$2 = children;
            } else {
              _block$2 = prepend(
                new$5(node_index, 0, child_changes$1, toList([])),
                children
              );
            }
            let children$1 = _block$2;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes;
            loop$children = children$1;
            loop$mapper = mapper;
            loop$events = events$1;
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        }
      }
    }
  }
}
function diff(events, old, new$8) {
  return do_diff(
    toList([old]),
    empty2(),
    toList([new$8]),
    empty2(),
    empty2(),
    0,
    0,
    0,
    0,
    root2,
    empty_list,
    empty_list,
    identity2,
    tick(events)
  );
}

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var setTimeout = globalThis.setTimeout;
var clearTimeout = globalThis.clearTimeout;
var createElementNS = (ns, name2) => document().createElementNS(ns, name2);
var createTextNode = (data) => document().createTextNode(data);
var createDocumentFragment = () => document().createDocumentFragment();
var insertBefore = (parent, node, reference) => parent.insertBefore(node, reference);
var moveBefore = SUPPORTS_MOVE_BEFORE ? (parent, node, reference) => parent.moveBefore(node, reference) : insertBefore;
var removeChild = (parent, child) => parent.removeChild(child);
var getAttribute = (node, name2) => node.getAttribute(name2);
var setAttribute = (node, name2, value2) => node.setAttribute(name2, value2);
var removeAttribute = (node, name2) => node.removeAttribute(name2);
var addEventListener = (node, name2, handler, options) => node.addEventListener(name2, handler, options);
var removeEventListener = (node, name2, handler) => node.removeEventListener(name2, handler);
var setInnerHtml = (node, innerHtml) => node.innerHTML = innerHtml;
var setData = (node, data) => node.data = data;
var meta = Symbol("lustre");
var MetadataNode = class {
  constructor(kind, parent, node, key) {
    this.kind = kind;
    this.key = key;
    this.parent = parent;
    this.children = [];
    this.node = node;
    this.handlers = /* @__PURE__ */ new Map();
    this.throttles = /* @__PURE__ */ new Map();
    this.debouncers = /* @__PURE__ */ new Map();
  }
  get parentNode() {
    return this.kind === fragment_kind ? this.node.parentNode : this.node;
  }
};
var insertMetadataChild = (kind, parent, node, index5, key) => {
  const child = new MetadataNode(kind, parent, node, key);
  node[meta] = child;
  parent?.children.splice(index5, 0, child);
  return child;
};
var getPath = (node) => {
  let path = "";
  for (let current = node[meta]; current.parent; current = current.parent) {
    if (current.key) {
      path = `${separator_element}${current.key}${path}`;
    } else {
      const index5 = current.parent.children.indexOf(current);
      path = `${separator_element}${index5}${path}`;
    }
  }
  return path.slice(1);
};
var Reconciler = class {
  #root = null;
  #dispatch = () => {
  };
  #useServerEvents = false;
  #exposeKeys = false;
  constructor(root3, dispatch, { useServerEvents = false, exposeKeys = false } = {}) {
    this.#root = root3;
    this.#dispatch = dispatch;
    this.#useServerEvents = useServerEvents;
    this.#exposeKeys = exposeKeys;
  }
  mount(vdom) {
    insertMetadataChild(element_kind, null, this.#root, 0, null);
    this.#insertChild(this.#root, null, this.#root[meta], 0, vdom);
  }
  push(patch) {
    this.#stack.push({ node: this.#root[meta], patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #stack = [];
  #reconcile() {
    const stack = this.#stack;
    while (stack.length) {
      const { node, patch } = stack.pop();
      const { children: childNodes } = node;
      const { changes, removed, children: childPatches } = patch;
      iterate(changes, (change) => this.#patch(node, change));
      if (removed) {
        this.#removeChildren(node, childNodes.length - removed, removed);
      }
      iterate(childPatches, (childPatch) => {
        const child = childNodes[childPatch.index | 0];
        this.#stack.push({ node: child, patch: childPatch });
      });
    }
  }
  #patch(node, change) {
    switch (change.kind) {
      case replace_text_kind:
        this.#replaceText(node, change);
        break;
      case replace_inner_html_kind:
        this.#replaceInnerHtml(node, change);
        break;
      case update_kind:
        this.#update(node, change);
        break;
      case move_kind:
        this.#move(node, change);
        break;
      case remove_kind:
        this.#remove(node, change);
        break;
      case replace_kind:
        this.#replace(node, change);
        break;
      case insert_kind:
        this.#insert(node, change);
        break;
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(parent, { children, before }) {
    const fragment3 = createDocumentFragment();
    const beforeEl = this.#getReference(parent, before);
    this.#insertChildren(fragment3, null, parent, before | 0, children);
    insertBefore(parent.parentNode, fragment3, beforeEl);
  }
  #replace(parent, { index: index5, with: child }) {
    this.#removeChildren(parent, index5 | 0, 1);
    const beforeEl = this.#getReference(parent, index5);
    this.#insertChild(parent.parentNode, beforeEl, parent, index5 | 0, child);
  }
  #getReference(node, index5) {
    index5 = index5 | 0;
    const { children } = node;
    const childCount = children.length;
    if (index5 < childCount) {
      return children[index5].node;
    }
    let lastChild = children[childCount - 1];
    if (!lastChild && node.kind !== fragment_kind) return null;
    if (!lastChild) lastChild = node;
    while (lastChild.kind === fragment_kind && lastChild.children.length) {
      lastChild = lastChild.children[lastChild.children.length - 1];
    }
    return lastChild.node.nextSibling;
  }
  #move(parent, { key, before }) {
    before = before | 0;
    const { children, parentNode } = parent;
    const beforeEl = children[before].node;
    let prev = children[before];
    for (let i = before + 1; i < children.length; ++i) {
      const next = children[i];
      children[i] = prev;
      prev = next;
      if (next.key === key) {
        children[before] = next;
        break;
      }
    }
    const { kind, node, children: prevChildren } = prev;
    moveBefore(parentNode, node, beforeEl);
    if (kind === fragment_kind) {
      this.#moveChildren(parentNode, prevChildren, beforeEl);
    }
  }
  #moveChildren(domParent, children, beforeEl) {
    for (let i = 0; i < children.length; ++i) {
      const { kind, node, children: nestedChildren } = children[i];
      moveBefore(domParent, node, beforeEl);
      if (kind === fragment_kind) {
        this.#moveChildren(domParent, nestedChildren, beforeEl);
      }
    }
  }
  #remove(parent, { index: index5 }) {
    this.#removeChildren(parent, index5, 1);
  }
  #removeChildren(parent, index5, count) {
    const { children, parentNode } = parent;
    const deleted = children.splice(index5, count);
    for (let i = 0; i < deleted.length; ++i) {
      const { kind, node, children: nestedChildren } = deleted[i];
      removeChild(parentNode, node);
      this.#removeDebouncers(deleted[i]);
      if (kind === fragment_kind) {
        deleted.push(...nestedChildren);
      }
    }
  }
  #removeDebouncers(node) {
    const { debouncers, children } = node;
    for (const { timeout } of debouncers.values()) {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    debouncers.clear();
    iterate(children, (child) => this.#removeDebouncers(child));
  }
  #update({ node, handlers, throttles, debouncers }, { added, removed }) {
    iterate(removed, ({ name: name2 }) => {
      if (handlers.delete(name2)) {
        removeEventListener(node, name2, handleEvent);
        this.#updateDebounceThrottle(throttles, name2, 0);
        this.#updateDebounceThrottle(debouncers, name2, 0);
      } else {
        removeAttribute(node, name2);
        SYNCED_ATTRIBUTES[name2]?.removed?.(node, name2);
      }
    });
    iterate(added, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #replaceText({ node }, { content }) {
    setData(node, content ?? "");
  }
  #replaceInnerHtml({ node }, { inner_html }) {
    setInnerHtml(node, inner_html ?? "");
  }
  // INSERT --------------------------------------------------------------------
  #insertChildren(domParent, beforeEl, metaParent, index5, children) {
    iterate(
      children,
      (child) => this.#insertChild(domParent, beforeEl, metaParent, index5++, child)
    );
  }
  #insertChild(domParent, beforeEl, metaParent, index5, vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = this.#createElement(metaParent, index5, vnode);
        this.#insertChildren(node, null, node[meta], 0, vnode.children);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case text_kind: {
        const node = this.#createTextNode(metaParent, index5, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case fragment_kind: {
        const head = this.#createTextNode(metaParent, index5, vnode);
        insertBefore(domParent, head, beforeEl);
        this.#insertChildren(
          domParent,
          beforeEl,
          head[meta],
          0,
          vnode.children
        );
        break;
      }
      case unsafe_inner_html_kind: {
        const node = this.#createElement(metaParent, index5, vnode);
        this.#replaceInnerHtml({ node }, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
    }
  }
  #createElement(parent, index5, { kind, key, tag, namespace, attributes }) {
    const node = createElementNS(namespace || NAMESPACE_HTML, tag);
    insertMetadataChild(kind, parent, node, index5, key);
    if (this.#exposeKeys && key) {
      setAttribute(node, "data-lustre-key", key);
    }
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
    return node;
  }
  #createTextNode(parent, index5, { kind, key, content }) {
    const node = createTextNode(content ?? "");
    insertMetadataChild(kind, parent, node, index5, key);
    return node;
  }
  #createAttribute(node, attribute3) {
    const { debouncers, handlers, throttles } = node[meta];
    const {
      kind,
      name: name2,
      value: value2,
      prevent_default: prevent,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute3;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value2 ?? "";
        if (name2 === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        }
        if (valueOrDefault !== getAttribute(node, name2)) {
          setAttribute(node, name2, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name2]?.added?.(node, valueOrDefault);
        break;
      }
      case property_kind:
        node[name2] = value2;
        break;
      case event_kind: {
        if (handlers.has(name2)) {
          removeEventListener(node, name2, handleEvent);
        }
        const passive = prevent.kind === never_kind;
        addEventListener(node, name2, handleEvent, { passive });
        this.#updateDebounceThrottle(throttles, name2, throttleDelay);
        this.#updateDebounceThrottle(debouncers, name2, debounceDelay);
        handlers.set(name2, (event4) => this.#handleEvent(attribute3, event4));
        break;
      }
    }
  }
  #updateDebounceThrottle(map7, name2, delay) {
    const debounceOrThrottle = map7.get(name2);
    if (delay > 0) {
      if (debounceOrThrottle) {
        debounceOrThrottle.delay = delay;
      } else {
        map7.set(name2, { delay });
      }
    } else if (debounceOrThrottle) {
      const { timeout } = debounceOrThrottle;
      if (timeout) {
        clearTimeout(timeout);
      }
      map7.delete(name2);
    }
  }
  #handleEvent(attribute3, event4) {
    const { currentTarget, type } = event4;
    const { debouncers, throttles } = currentTarget[meta];
    const path = getPath(currentTarget);
    const {
      prevent_default: prevent,
      stop_propagation: stop,
      include,
      immediate: immediate2
    } = attribute3;
    if (prevent.kind === always_kind) event4.preventDefault();
    if (stop.kind === always_kind) event4.stopPropagation();
    if (type === "submit") {
      event4.detail ??= {};
      event4.detail.formData = [...new FormData(event4.target).entries()];
    }
    const data = this.#useServerEvents ? createServerEvent(event4, include ?? []) : event4;
    const throttle = throttles.get(type);
    if (throttle) {
      const now = Date.now();
      const last = throttle.last || 0;
      if (now > last + throttle.delay) {
        throttle.last = now;
        throttle.lastEvent = event4;
        this.#dispatch(data, path, type, immediate2);
      }
    }
    const debounce = debouncers.get(type);
    if (debounce) {
      clearTimeout(debounce.timeout);
      debounce.timeout = setTimeout(() => {
        if (event4 === throttles.get(type)?.lastEvent) return;
        this.#dispatch(data, path, type, immediate2);
      }, debounce.delay);
    }
    if (!throttle && !debounce) {
      this.#dispatch(data, path, type, immediate2);
    }
  }
};
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0; i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4; list4.head; list4 = list4.tail) {
      callback(list4.head);
    }
  }
};
var handleEvent = (event4) => {
  const { currentTarget, type } = event4;
  const handler = currentTarget[meta].handlers.get(type);
  handler(event4);
};
var createServerEvent = (event4, include = []) => {
  const data = {};
  if (event4.type === "input" || event4.type === "change") {
    include.push("target.value");
  }
  if (event4.type === "submit") {
    include.push("detail.formData");
  }
  for (const property3 of include) {
    const path = property3.split(".");
    for (let i = 0, input2 = event4, output = data; i < path.length; i++) {
      if (i === path.length - 1) {
        output[path[i]] = input2[path[i]];
        break;
      }
      output = output[path[i]] ??= {};
      input2 = input2[path[i]];
    }
  }
  return data;
};
var syncedBooleanAttribute = /* @__NO_SIDE_EFFECTS__ */ (name2) => {
  return {
    added(node) {
      node[name2] = true;
    },
    removed(node) {
      node[name2] = false;
    }
  };
};
var syncedAttribute = /* @__NO_SIDE_EFFECTS__ */ (name2) => {
  return {
    added(node, value2) {
      node[name2] = value2;
    }
  };
};
var SYNCED_ATTRIBUTES = {
  checked: /* @__PURE__ */ syncedBooleanAttribute("checked"),
  selected: /* @__PURE__ */ syncedBooleanAttribute("selected"),
  value: /* @__PURE__ */ syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => {
        node.focus?.();
      });
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/element/keyed.mjs
function do_extract_keyed_children(loop$key_children_pairs, loop$keyed_children, loop$children) {
  while (true) {
    let key_children_pairs = loop$key_children_pairs;
    let keyed_children = loop$keyed_children;
    let children = loop$children;
    if (key_children_pairs instanceof Empty) {
      return [keyed_children, reverse(children)];
    } else {
      let rest = key_children_pairs.tail;
      let key = key_children_pairs.head[0];
      let element$1 = key_children_pairs.head[1];
      let keyed_element = to_keyed(key, element$1);
      let _block;
      if (key === "") {
        _block = keyed_children;
      } else {
        _block = insert2(keyed_children, key, keyed_element);
      }
      let keyed_children$1 = _block;
      let children$1 = prepend(keyed_element, children);
      loop$key_children_pairs = rest;
      loop$keyed_children = keyed_children$1;
      loop$children = children$1;
    }
  }
}
function extract_keyed_children(children) {
  return do_extract_keyed_children(
    children,
    empty2(),
    empty_list
  );
}
function element3(tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children$1,
    keyed_children,
    false,
    false
  );
}
function namespaced2(namespace, tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element(
    "",
    identity2,
    namespace,
    tag,
    attributes,
    children$1,
    keyed_children,
    false,
    false
  );
}
function fragment2(children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return fragment("", identity2, children$1, keyed_children);
}

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root3) => {
  const rootMeta = insertMetadataChild(element_kind, null, root3, 0, null);
  let virtualisableRootChildren = 0;
  for (let child = root3.firstChild; child; child = child.nextSibling) {
    if (canVirtualiseNode(child)) virtualisableRootChildren += 1;
  }
  if (virtualisableRootChildren === 0) {
    const placeholder = document().createTextNode("");
    insertMetadataChild(text_kind, rootMeta, placeholder, 0, null);
    root3.replaceChildren(placeholder);
    return none3();
  }
  if (virtualisableRootChildren === 1) {
    const children2 = virtualiseChildNodes(rootMeta, root3);
    return children2.head[1];
  }
  const fragmentHead = document().createTextNode("");
  const fragmentMeta = insertMetadataChild(fragment_kind, rootMeta, fragmentHead, 0, null);
  const children = virtualiseChildNodes(fragmentMeta, root3);
  root3.insertBefore(fragmentHead, root3.firstChild);
  return fragment2(children);
};
var canVirtualiseNode = (node) => {
  switch (node.nodeType) {
    case ELEMENT_NODE:
      return true;
    case TEXT_NODE:
      return !!node.data;
    default:
      return false;
  }
};
var virtualiseNode = (meta2, node, key, index5) => {
  if (!canVirtualiseNode(node)) {
    return null;
  }
  switch (node.nodeType) {
    case ELEMENT_NODE: {
      const childMeta = insertMetadataChild(element_kind, meta2, node, index5, key);
      const tag = node.localName;
      const namespace = node.namespaceURI;
      const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
      if (isHtmlElement && INPUT_ELEMENTS.includes(tag)) {
        virtualiseInputEvents(tag, node);
      }
      const attributes = virtualiseAttributes(node);
      const children = virtualiseChildNodes(childMeta, node);
      const vnode = isHtmlElement ? element3(tag, attributes, children) : namespaced2(namespace, tag, attributes, children);
      return vnode;
    }
    case TEXT_NODE:
      insertMetadataChild(text_kind, meta2, node, index5, null);
      return text2(node.data);
    default:
      return null;
  }
};
var INPUT_ELEMENTS = ["input", "select", "textarea"];
var virtualiseInputEvents = (tag, node) => {
  const value2 = node.value;
  const checked2 = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked2) return;
  if (tag === "input" && node.type === "radio" && !checked2) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value2) return;
  queueMicrotask(() => {
    node.value = value2;
    node.checked = checked2;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (document().activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var virtualiseChildNodes = (meta2, node) => {
  let children = null;
  let child = node.firstChild;
  let ptr = null;
  let index5 = 0;
  while (child) {
    const key = child.nodeType === ELEMENT_NODE ? child.getAttribute("data-lustre-key") : null;
    if (key != null) {
      child.removeAttribute("data-lustre-key");
    }
    const vnode = virtualiseNode(meta2, child, key, index5);
    const next = child.nextSibling;
    if (vnode) {
      const list_node = new NonEmpty([key ?? "", vnode], null);
      if (ptr) {
        ptr = ptr.tail = list_node;
      } else {
        ptr = children = list_node;
      }
      index5 += 1;
    } else {
      node.removeChild(child);
    }
    child = next;
  }
  if (!ptr) return empty_list;
  ptr.tail = empty_list;
  return children;
};
var virtualiseAttributes = (node) => {
  let index5 = node.attributes.length;
  let attributes = empty_list;
  while (index5-- > 0) {
    const attr = node.attributes[index5];
    if (attr.name === "xmlns") {
      continue;
    }
    attributes = new NonEmpty(virtualiseAttribute(attr), attributes);
  }
  return attributes;
};
var virtualiseAttribute = (attr) => {
  const name2 = attr.localName;
  const value2 = attr.value;
  return attribute2(name2, value2);
};

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!document();
var Runtime = class {
  constructor(root3, [model, effects], view10, update9) {
    this.root = root3;
    this.#model = model;
    this.#view = view10;
    this.#update = update9;
    this.root.addEventListener("context-request", (event4) => {
      if (!(event4.context && event4.callback)) return;
      if (!this.#contexts.has(event4.context)) return;
      event4.stopImmediatePropagation();
      const context = this.#contexts.get(event4.context);
      if (event4.subscribe) {
        const callbackRef = new WeakRef(event4.callback);
        const unsubscribe = () => {
          context.subscribers = context.subscribers.filter(
            (subscriber) => subscriber !== callbackRef
          );
        };
        context.subscribers.push([callbackRef, unsubscribe]);
        event4.callback(context.value, unsubscribe);
      } else {
        event4.callback(context.value);
      }
    });
    this.#reconciler = new Reconciler(this.root, (event4, path, name2) => {
      const [events, result] = handle(this.#events, path, name2, event4);
      this.#events = events;
      if (result.isOk()) {
        const handler = result[0];
        if (handler.stop_propagation) event4.stopPropagation();
        if (handler.prevent_default) event4.preventDefault();
        this.dispatch(handler.message, false);
      }
    });
    this.#vdom = virtualise(this.root);
    this.#events = new$3();
    this.#shouldFlush = true;
    this.#tick(effects);
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  dispatch(msg, immediate2 = false) {
    this.#shouldFlush ||= immediate2;
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects);
    }
  }
  emit(event4, data) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(
      new CustomEvent(event4, {
        detail: data,
        bubbles: true,
        composed: true
      })
    );
  }
  // Provide a context value for any child nodes that request it using the given
  // key. If the key already exists, any existing subscribers will be notified
  // of the change. Otherwise, we store the value and wait for any `context-request`
  // events to come in.
  provide(key, value2) {
    if (!this.#contexts.has(key)) {
      this.#contexts.set(key, { value: value2, subscribers: [] });
    } else {
      const context = this.#contexts.get(key);
      context.value = value2;
      for (let i = context.subscribers.length - 1; i >= 0; i--) {
        const [subscriberRef, unsubscribe] = context.subscribers[i];
        const subscriber = subscriberRef.deref();
        if (!subscriber) {
          context.subscribers.splice(i, 1);
          continue;
        }
        subscriber(value2, unsubscribe);
      }
    }
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #events;
  #reconciler;
  #contexts = /* @__PURE__ */ new Map();
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #shouldFlush = false;
  #actions = {
    dispatch: (msg, immediate2) => this.dispatch(msg, immediate2),
    emit: (event4, data) => this.emit(event4, data),
    select: () => {
    },
    root: () => this.root,
    provide: (key, value2) => this.provide(key, value2)
  };
  // A `#tick` is where we process effects and trigger any synchronous updates.
  // Once a tick has been processed a render will be scheduled if none is already.
  // p0
  #tick(effects) {
    this.#shouldQueue = true;
    while (true) {
      for (let list4 = effects.synchronous; list4.tail; list4 = list4.tail) {
        list4.head(this.#actions);
      }
      this.#beforePaint = listAppend(this.#beforePaint, effects.before_paint);
      this.#afterPaint = listAppend(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      [this.#model, effects] = this.#update(this.#model, this.#queue.shift());
    }
    this.#shouldQueue = false;
    if (this.#shouldFlush) {
      cancelAnimationFrame(this.#renderTimer);
      this.#render();
    } else if (!this.#renderTimer) {
      this.#renderTimer = requestAnimationFrame(() => {
        this.#render();
      });
    }
  }
  #render() {
    this.#shouldFlush = false;
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, events } = diff(this.#events, this.#vdom, next);
    this.#events = events;
    this.#vdom = next;
    this.#reconciler.push(patch);
    if (this.#beforePaint instanceof NonEmpty) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
    if (this.#afterPaint instanceof NonEmpty) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      requestAnimationFrame(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
function listAppend(a, b) {
  if (a instanceof Empty) {
    return b;
  } else if (b instanceof Empty) {
    return a;
  } else {
    return append(a, b);
  }
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var EffectEmitEvent = class extends CustomType {
  constructor(name2, data) {
    super();
    this.name = name2;
    this.data = data;
  }
};
var SystemRequestedShutdown = class extends CustomType {
};

// build/dev/javascript/lustre/lustre/component.mjs
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, delegates_focus, attributes, properties, contexts, is_form_associated, on_form_autofill, on_form_reset, on_form_restore) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.delegates_focus = delegates_focus;
    this.attributes = attributes;
    this.properties = properties;
    this.contexts = contexts;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
  }
};
function new$6(options) {
  let init6 = new Config2(
    true,
    true,
    false,
    empty_list,
    empty_list,
    empty_list,
    false,
    option_none,
    option_none,
    option_none
  );
  return fold(
    options,
    init6,
    (config, option2) => {
      return option2.apply(config);
    }
  );
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class {
  #runtime;
  constructor(root3, [init6, effects], update9, view10) {
    this.#runtime = new Runtime(root3, [init6, effects], view10, update9);
  }
  send(message) {
    switch (message.constructor) {
      case EffectDispatchedMessage: {
        this.dispatch(message.message, false);
        break;
      }
      case EffectEmitEvent: {
        this.emit(message.name, message.data);
        break;
      }
      case SystemRequestedShutdown:
        break;
    }
  }
  dispatch(msg, immediate2) {
    this.#runtime.dispatch(msg, immediate2);
  }
  emit(event4, data) {
    this.#runtime.emit(event4, data);
  }
};
var start = ({ init: init6, update: update9, view: view10 }, selector, flags) => {
  if (!is_browser()) return new Error(new NotABrowser());
  const root3 = selector instanceof HTMLElement ? selector : document().querySelector(selector);
  if (!root3) return new Error(new ElementNotFound(selector));
  return new Ok(new Spa(root3, init6(flags), update9, view10));
};

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init6, update9, view10, config) {
    super();
    this.init = init6;
    this.update = update9;
    this.view = view10;
    this.config = config;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init6, update9, view10) {
  return new App(init6, update9, view10, new$6(empty_list));
}
function start3(app, selector, start_args) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, start_args);
    }
  );
}

// build/dev/javascript/study_app/extra/effect_.mjs
function perform(msg) {
  return from(
    (dispatch) => {
      dispatch(msg);
      return void 0;
    }
  );
}

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value2) {
    return value2 instanceof Promise ? new _PromiseLayer(value2) : value2;
  }
  static unwrap(value2) {
    return value2 instanceof _PromiseLayer ? value2.promise : value2;
  }
};
function map_promise(promise, fn) {
  return promise.then(
    (value2) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value2)))
  );
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a) => {
      callback(a);
      return a;
    }
  );
}

// build/dev/javascript/study_app/extra/promise_.mjs
function to_effect(promise, to_success_msg, to_err_msg) {
  return from(
    (dispatch) => {
      let _pipe = promise;
      let _pipe$1 = map_promise(
        _pipe,
        (result) => {
          if (result instanceof Ok) {
            let a = result[0];
            return to_success_msg(a);
          } else {
            let err = result[0];
            return to_err_msg(err);
          }
        }
      );
      tap(_pipe$1, dispatch);
      return void 0;
    }
  );
}
function to_effect_simple(promise, to_msg) {
  return from(
    (dispatch) => {
      let _pipe = map_promise(promise, to_msg);
      tap(_pipe, dispatch);
      return void 0;
    }
  );
}

// build/dev/javascript/study_app/core/category.mjs
var Category = class extends CustomType {
  constructor(id, name2) {
    super();
    this.id = id;
    this.name = name2;
  }
};
function decoder() {
  return field(
    "id",
    int2,
    (id) => {
      return field(
        "name",
        string2,
        (name2) => {
          return success(new Category(id, name2));
        }
      );
    }
  );
}

// build/dev/javascript/study_app/core/answer.mjs
var Correct = class extends CustomType {
};
var Incorrect = class extends CustomType {
};
var NotAnswered = class extends CustomType {
};
function from_string(s) {
  if (s === "Correct") {
    return new Some(new Correct());
  } else if (s === "Incorrect") {
    return new Some(new Incorrect());
  } else if (s === "NotAnswered") {
    return new Some(new NotAnswered());
  } else {
    return new None();
  }
}
function decoder2() {
  return then$(
    string2,
    (s) => {
      let $ = from_string(s);
      if ($ instanceof Some) {
        let ans = $[0];
        return success(ans);
      } else {
        return failure(new NotAnswered(), "decode err :NotAnswered");
      }
    }
  );
}
function to_string4(answer) {
  if (answer instanceof Correct) {
    return "Correct";
  } else if (answer instanceof Incorrect) {
    return "Incorrect";
  } else {
    return "NotAnswered";
  }
}
function to_json4(answer) {
  return string3(to_string4(answer));
}
function view(answer) {
  let _block;
  if (answer instanceof Correct) {
    _block = "\u25CB";
  } else if (answer instanceof Incorrect) {
    _block = "\u2716";
  } else {
    _block = "-";
  }
  let _pipe = _block;
  return text3(_pipe);
}

// build/dev/javascript/lustre/lustre/event.mjs
function is_immediate_event(name2) {
  if (name2 === "input") {
    return true;
  } else if (name2 === "change") {
    return true;
  } else if (name2 === "focus") {
    return true;
  } else if (name2 === "focusin") {
    return true;
  } else if (name2 === "focusout") {
    return true;
  } else if (name2 === "blur") {
    return true;
  } else if (name2 === "select") {
    return true;
  } else {
    return false;
  }
}
function on(name2, handler) {
  return event(
    name2,
    map2(handler, (msg) => {
      return new Handler(false, false, msg);
    }),
    empty_list,
    never,
    never,
    is_immediate_event(name2),
    0,
    0
  );
}
function on_click(msg) {
  return on("click", success(msg));
}
function on_change(msg) {
  return on(
    "change",
    subfield(
      toList(["target", "value"]),
      string2,
      (value2) => {
        return success(msg(value2));
      }
    )
  );
}
function on_check(msg) {
  return on(
    "change",
    subfield(
      toList(["target", "checked"]),
      bool,
      (checked2) => {
        return success(msg(checked2));
      }
    )
  );
}

// build/dev/javascript/study_app/core/association_question.mjs
var SelectLeft = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SelectRight = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Focused = class extends CustomType {
};
var NotFocused = class extends CustomType {
};
var CorrectlyMatched = class extends CustomType {
};
var IncorrectlyMatched = class extends CustomType {
};
var NotYetMatched = class extends CustomType {
};
var Item = class extends CustomType {
  constructor(id, label2, focus, match) {
    super();
    this.id = id;
    this.label = label2;
    this.focus = focus;
    this.match = match;
  }
};
var Pair = class extends CustomType {
  constructor(id, left, right) {
    super();
    this.id = id;
    this.left = left;
    this.right = right;
  }
};
var Model = class extends CustomType {
  constructor(pairs, left, right, selected_left_id, selected_right_id, matched_pair_ids, answer) {
    super();
    this.pairs = pairs;
    this.left = left;
    this.right = right;
    this.selected_left_id = selected_left_id;
    this.selected_right_id = selected_right_id;
    this.matched_pair_ids = matched_pair_ids;
    this.answer = answer;
  }
};
function init(pairs) {
  let left = map(
    pairs,
    (p2) => {
      return new Item(p2.id, p2.left, new NotFocused(), new NotYetMatched());
    }
  );
  let _block;
  let _pipe = map(
    pairs,
    (p2) => {
      return new Item(p2.id, p2.right, new NotFocused(), new NotYetMatched());
    }
  );
  _block = shuffle(_pipe);
  let right = _block;
  return new Model(
    pairs,
    left,
    right,
    new None(),
    new None(),
    toList([]),
    new NotAnswered()
  );
}
function reset_item_states(items) {
  return map(
    items,
    (item) => {
      let _block;
      let $ = item.match;
      if ($ instanceof IncorrectlyMatched) {
        _block = new NotYetMatched();
      } else {
        _block = item.match;
      }
      let new_match_state = _block;
      let _record = item;
      return new Item(
        _record.id,
        _record.label,
        new NotFocused(),
        new_match_state
      );
    }
  );
}
function update_focus(items, target_id, focus_state) {
  return map(
    items,
    (item) => {
      let $ = item.id === target_id;
      if ($) {
        let _record = item;
        return new Item(_record.id, _record.label, focus_state, _record.match);
      } else {
        return item;
      }
    }
  );
}
function update_match(items, target_id, match_state) {
  return map(
    items,
    (item) => {
      let $ = item.id === target_id;
      if ($) {
        let _record = item;
        return new Item(_record.id, _record.label, _record.focus, match_state);
      } else {
        return item;
      }
    }
  );
}
function is_quiz_complete(model) {
  return length(model.matched_pair_ids) === length(model.pairs);
}
function check_answer(model) {
  let $ = is_quiz_complete(model);
  if ($) {
    return new Correct();
  } else {
    return new Incorrect();
  }
}
function handle_pair_selection(model, left_id, right_id) {
  let is_correct = left_id === right_id;
  let _block;
  if (is_correct) {
    _block = new CorrectlyMatched();
  } else {
    _block = new IncorrectlyMatched();
  }
  let new_match_state = _block;
  let new_left = update_match(model.left, left_id, new_match_state);
  let new_right = update_match(model.right, right_id, new_match_state);
  let new_left$1 = update_focus(new_left, left_id, new NotFocused());
  let new_right$1 = update_focus(new_right, right_id, new NotFocused());
  let _block$1;
  if (is_correct) {
    _block$1 = prepend(left_id, model.matched_pair_ids);
  } else {
    _block$1 = model.matched_pair_ids;
  }
  let new_matched_pair_ids = _block$1;
  let _block$2;
  let _record = model;
  _block$2 = new Model(
    _record.pairs,
    new_left$1,
    new_right$1,
    new None(),
    new None(),
    new_matched_pair_ids,
    _record.answer
  );
  let new_model = _block$2;
  let _record$1 = new_model;
  return new Model(
    _record$1.pairs,
    _record$1.left,
    _record$1.right,
    _record$1.selected_left_id,
    _record$1.selected_right_id,
    _record$1.matched_pair_ids,
    check_answer(new_model)
  );
}
function update2(model, msg) {
  if (msg instanceof SelectLeft) {
    let left_id = msg[0];
    let $ = model.selected_right_id;
    if ($ instanceof Some) {
      let right_id = $[0];
      return handle_pair_selection(model, left_id, right_id);
    } else {
      let reset_left = reset_item_states(model.left);
      let reset_right = reset_item_states(model.right);
      let new_left = update_focus(reset_left, left_id, new Focused());
      let _record = model;
      return new Model(
        _record.pairs,
        new_left,
        reset_right,
        new Some(left_id),
        new None(),
        _record.matched_pair_ids,
        _record.answer
      );
    }
  } else {
    let right_id = msg[0];
    let $ = model.selected_left_id;
    if ($ instanceof Some) {
      let left_id = $[0];
      return handle_pair_selection(model, left_id, right_id);
    } else {
      let reset_left = reset_item_states(model.left);
      let reset_right = reset_item_states(model.right);
      let new_right = update_focus(reset_right, right_id, new Focused());
      let _record = model;
      return new Model(
        _record.pairs,
        reset_left,
        new_right,
        new None(),
        new Some(right_id),
        _record.matched_pair_ids,
        _record.answer
      );
    }
  }
}
function item_styles(focus, match) {
  let _block;
  if (focus instanceof Focused) {
    _block = toList([["border-color", "blue"], ["border-width", "2px"]]);
  } else {
    _block = toList([]);
  }
  let focus_style = _block;
  let _block$1;
  if (match instanceof CorrectlyMatched) {
    _block$1 = toList([["background-color", "#ddffdd"]]);
  } else if (match instanceof IncorrectlyMatched) {
    _block$1 = toList([["background-color", "#ffdddd"]]);
  } else {
    _block$1 = toList([]);
  }
  let match_style = _block$1;
  return append(focus_style, match_style);
}
function view_column(title, items, on_select) {
  let column_style = toList([["flex", "1"], ["padding", "0 1em"]]);
  return div(
    toList([styles(column_style)]),
    toList([
      h3(toList([]), toList([text3(title)])),
      ul(
        toList([styles(toList([["padding-left", "0"]]))]),
        map(
          items,
          (item) => {
            let base_style2 = toList([
              ["border-radius", "8px"],
              ["padding", "10px"],
              ["margin-bottom", "5px"],
              ["border", "1px solid #ccc"],
              ["list-style-type", "none"]
            ]);
            let dynamic_styles = item_styles(item.focus, item.match);
            let all_styles = append(base_style2, dynamic_styles);
            return li(
              toList([
                styles(all_styles),
                (() => {
                  let $ = item.match;
                  if ($ instanceof CorrectlyMatched) {
                    return none();
                  } else {
                    return on_click(on_select(item.id));
                  }
                })()
              ]),
              toList([text3(item.label)])
            );
          }
        )
      )
    ])
  );
}
function view_progress(model) {
  return p(
    toList([]),
    toList([
      text3(
        "Answered: " + to_string(length(model.matched_pair_ids)) + "/" + to_string(
          length(model.pairs)
        )
      )
    ])
  );
}
function view_completion_message(model) {
  let $ = is_quiz_complete(model);
  if ($) {
    return p(toList([]), toList([text3("Quiz Complete!")]));
  } else {
    return text3("");
  }
}
function view2(model) {
  let container_style = toList([["display", "flex"]]);
  return div(
    toList([]),
    toList([
      div(
        toList([styles(container_style)]),
        toList([
          view_column(
            "left",
            model.left,
            (var0) => {
              return new SelectLeft(var0);
            }
          ),
          view_column(
            "right",
            model.right,
            (var0) => {
              return new SelectRight(var0);
            }
          )
        ])
      ),
      view_progress(model),
      view_completion_message(model)
    ])
  );
}
function decoder3() {
  let decode_pair = list2(
    field(
      "id",
      int2,
      (id) => {
        return field(
          "left",
          string2,
          (left) => {
            return field(
              "right",
              string2,
              (right) => {
                return success(new Pair(id, left, right));
              }
            );
          }
        );
      }
    )
  );
  return then$(
    decode_pair,
    (pairs) => {
      let _pipe = init(pairs);
      return success(_pipe);
    }
  );
}

// build/dev/javascript/study_app/core/multiple_choice_question.mjs
var Select = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var MultipleChoiceQuestion = class extends CustomType {
  constructor(texts, correct_answer_index) {
    super();
    this.texts = texts;
    this.correct_answer_index = correct_answer_index;
  }
};
var Model2 = class extends CustomType {
  constructor(question, selected_index, answer) {
    super();
    this.question = question;
    this.selected_index = selected_index;
    this.answer = answer;
  }
};
function update3(model, msg) {
  let index5 = msg[0];
  let $ = model.selected_index;
  if ($ instanceof Some) {
    let selected2 = $[0];
    if (selected2 === index5) {
      let _record = model;
      return new Model2(_record.question, new None(), new NotAnswered());
    } else {
      let _block;
      let $1 = index5 === model.question.correct_answer_index;
      if ($1) {
        _block = new Correct();
      } else {
        _block = new Incorrect();
      }
      let new_answer_state = _block;
      let _record = model;
      return new Model2(_record.question, new Some(index5), new_answer_state);
    }
  } else {
    let _block;
    let $1 = index5 === model.question.correct_answer_index;
    if ($1) {
      _block = new Correct();
    } else {
      _block = new Incorrect();
    }
    let new_answer_state = _block;
    let _record = model;
    return new Model2(_record.question, new Some(index5), new_answer_state);
  }
}
function view_answer_status(answer) {
  let _block;
  if (answer instanceof Correct) {
    _block = "\u6B63\u89E3\u3067\u3059\uFF01";
  } else if (answer instanceof Incorrect) {
    _block = "\u4E0D\u6B63\u89E3\u3067\u3059\u3002";
  } else {
    _block = "";
  }
  let text4 = _block;
  let _block$1;
  if (answer instanceof Correct) {
    _block$1 = "#28a745";
  } else if (answer instanceof Incorrect) {
    _block$1 = "#dc3545";
  } else {
    _block$1 = "#6c757d";
  }
  let text_color = _block$1;
  return div(
    toList([
      styles(
        toList([
          ["margin-top", "16px"],
          ["height", "24px"],
          ["font-weight", "bold"],
          ["text-align", "center"],
          ["color", text_color]
        ])
      )
    ]),
    toList([text2(text4)])
  );
}
function base_style() {
  return styles(
    toList([
      ["width", "100%"],
      ["padding", "12px"],
      ["margin", "4px 0"],
      ["border", "1px solid #ccc"],
      ["border-radius", "4px"],
      ["text-align", "left"],
      ["font-size", "16px"],
      ["cursor", "pointer"]
    ])
  );
}
function dynamic_style(index5, model) {
  let selected_index = model.selected_index;
  let answer = model.answer;
  let correct_index = model.question.correct_answer_index;
  if (answer instanceof Correct) {
    if (selected_index instanceof Some) {
      let s_index = selected_index[0];
      if (s_index === index5) {
        return styles(
          toList([["background-color", "#d4edda"], ["border-color", "#c3e6cb"]])
        );
      } else {
        return styles(toList([["background-color", "#f8f9fa"]]));
      }
    } else {
      return styles(toList([["background-color", "#f8f9fa"]]));
    }
  } else if (answer instanceof Incorrect) {
    if (selected_index instanceof Some) {
      let s_index = selected_index[0];
      if (s_index === index5) {
        return styles(
          toList([["background-color", "#f8d7da"], ["border-color", "#f5c6cb"]])
        );
      } else {
        if (index5 === correct_index) {
          return styles(
            toList([
              ["background-color", "#d4edda"],
              ["border-color", "#c3e6cb"]
            ])
          );
        } else {
          return styles(toList([["background-color", "#f8f9fa"]]));
        }
      }
    } else if (index5 === correct_index) {
      return styles(
        toList([["background-color", "#d4edda"], ["border-color", "#c3e6cb"]])
      );
    } else {
      return styles(toList([["background-color", "#f8f9fa"]]));
    }
  } else {
    return styles(toList([["background-color", "#f8f9fa"]]));
  }
}
function view_option(text4, index5, model) {
  return button(
    toList([
      on_click(new Select(index5)),
      base_style(),
      dynamic_style(index5, model)
    ]),
    toList([text2(text4)])
  );
}
function view3(model) {
  let options = index_map(
    model.question.texts,
    (text4, i) => {
      return view_option(text4, i, model);
    }
  );
  return div(
    toList([]),
    append(options, toList([view_answer_status(model.answer)]))
  );
}
function decoder4() {
  return field(
    "texts",
    list2(string2),
    (texts) => {
      return field(
        "correct_answer_index",
        int2,
        (correct_answer_index) => {
          return success(
            new Model2(
              new MultipleChoiceQuestion(texts, correct_answer_index),
              new None(),
              new NotAnswered()
            )
          );
        }
      );
    }
  );
}

// build/dev/javascript/study_app/extra/json_.mjs
function custom_type_docoder(tab_string, decoder7) {
  return field(
    "type",
    string2,
    (typ) => {
      return field(
        "data",
        decoder7,
        (a) => {
          let $ = typ === tab_string;
          if ($) {
            return success(a);
          } else {
            return failure(a, "type miss match:::");
          }
        }
      );
    }
  );
}

// build/dev/javascript/study_app/core/question.mjs
var Model3 = class extends CustomType {
  constructor(id, category, question_text, question_interaction) {
    super();
    this.id = id;
    this.category = category;
    this.question_text = question_text;
    this.question_interaction = question_interaction;
  }
};
var QusetionCategory = class extends CustomType {
  constructor(id, name2, sub_id, sub_name) {
    super();
    this.id = id;
    this.name = name2;
    this.sub_id = sub_id;
    this.sub_name = sub_name;
  }
};
var IdAndCategory = class extends CustomType {
  constructor(id, category) {
    super();
    this.id = id;
    this.category = category;
  }
};
var MultipleChoice = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Association = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var MultipleChoiceMsg = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var AssociationMsg = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function check_answer2(model) {
  let $ = model.question_interaction;
  if ($ instanceof MultipleChoice) {
    let mc_model = $[0];
    return mc_model.answer;
  } else {
    let as_model = $[0];
    return as_model.answer;
  }
}
function update4(model, msg) {
  if (msg instanceof MultipleChoiceMsg) {
    let mc_msg = msg[0];
    let $ = model.question_interaction;
    if ($ instanceof MultipleChoice) {
      let mc_model = $[0];
      let new_mc_model = update3(mc_model, mc_msg);
      let _record = model;
      return new Model3(
        _record.id,
        _record.category,
        _record.question_text,
        new MultipleChoice(new_mc_model)
      );
    } else {
      return model;
    }
  } else {
    let as_msg = msg[0];
    let $ = model.question_interaction;
    if ($ instanceof Association) {
      let as_model = $[0];
      let new_as_model = update2(as_model, as_msg);
      let _record = model;
      return new Model3(
        _record.id,
        _record.category,
        _record.question_text,
        new Association(new_as_model)
      );
    } else {
      return model;
    }
  }
}
function view4(model) {
  let $ = model.question_interaction;
  if ($ instanceof MultipleChoice) {
    let mc_model = $[0];
    return map4(
      view3(mc_model),
      (m) => {
        return new MultipleChoiceMsg(m);
      }
    );
  } else {
    let as_model = $[0];
    return map4(
      view2(as_model),
      (m) => {
        return new AssociationMsg(m);
      }
    );
  }
}
function interaction_decoder() {
  let decode_mc = () => {
    let decoder$1 = map2(
      decoder4(),
      (var0) => {
        return new MultipleChoice(var0);
      }
    );
    return custom_type_docoder("MultipleChoice", decoder$1);
  };
  let decode_as = () => {
    let decoder$1 = map2(
      decoder3(),
      (var0) => {
        return new Association(var0);
      }
    );
    return custom_type_docoder("Association", decoder$1);
  };
  return one_of(decode_as(), toList([decode_mc()]));
}
function qusetion_category_to_json(category) {
  return object2(
    toList([
      ["id", int3(category.id)],
      ["name", string3(category.name)],
      ["sub_id", int3(category.sub_id)],
      ["sub_name", string3(category.sub_name)]
    ])
  );
}
function qusetion_category_decoder() {
  return field(
    "id",
    int2,
    (id) => {
      return field(
        "name",
        string2,
        (name2) => {
          return field(
            "sub_id",
            int2,
            (sub_id) => {
              return field(
                "sub_name",
                string2,
                (sub_name) => {
                  return success(
                    new QusetionCategory(id, name2, sub_id, sub_name)
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function decoder5() {
  return field(
    "id",
    int2,
    (id) => {
      return field(
        "category",
        qusetion_category_decoder(),
        (category) => {
          return field(
            "question_text",
            string2,
            (question_text) => {
              return field(
                "question_interaction",
                interaction_decoder(),
                (question_interaction) => {
                  return success(
                    new Model3(id, category, question_text, question_interaction)
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/study_app/core/quiz_result.mjs
var Record = class extends CustomType {
  constructor(id, category, answer) {
    super();
    this.id = id;
    this.category = category;
    this.answer = answer;
  }
};
function decoder6() {
  return list2(
    field(
      "id",
      int2,
      (id) => {
        return field(
          "category",
          qusetion_category_decoder(),
          (category) => {
            return field(
              "answer",
              list2(decoder2()),
              (answers) => {
                return success(new Record(id, category, answers));
              }
            );
          }
        );
      }
    )
  );
}
function to_json7(qr) {
  return array2(
    qr,
    (record) => {
      return object2(
        toList([
          ["id", int3(record.id)],
          ["category", qusetion_category_to_json(record.category)],
          ["answer", array2(record.answer, to_json4)]
        ])
      );
    }
  );
}
function from_questions(questions2) {
  return map(
    questions2,
    (q) => {
      return new Record(q.id, q.category, toList([]));
    }
  );
}
function view_answers(answers) {
  return div(
    toList([
      styles(toList([["display", "flex"]])),
      styles(toList([["flex-direction", "row"]])),
      styles(toList([["gap", "0.5rem"]])),
      styles(toList([["justify-content", "center"]])),
      styles(toList([["align-items", "center"]]))
    ]),
    map(answers, view)
  );
}
function view5(quiz_result) {
  return table(
    toList([]),
    toList([
      thead(
        toList([]),
        toList([
          tr(
            toList([]),
            toList([
              th(toList([]), toList([text3("ID")])),
              th(toList([]), toList([text3("Category")])),
              th(toList([]), toList([text3("Result")]))
            ])
          )
        ])
      ),
      tbody(
        toList([]),
        map(
          quiz_result,
          (h) => {
            return tr(
              toList([]),
              toList([
                td(toList([]), toList([text3(to_string(h.id))])),
                td(toList([]), toList([text3(h.category.name)])),
                td(toList([]), toList([view_answers(h.answer)]))
              ])
            );
          }
        )
      )
    ])
  );
}

// build/dev/javascript/study_app/interface/data.mjs
var data_default = {
  "categories": [
    {
      id: 1,
      name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
      sub: [
        { id: 1, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F" },
        { id: 2, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u76EE\u7684\u3068\u8003\u3048\u65B9" },
        { id: 3, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u57FA\u672C" },
        { id: 4, name: "\u8105\u5A01\u306E\u7A2E\u985E" },
        { id: 5, name: "\u30DE\u30EB\u30A6\u30A7\u30A2\u30FB\u4E0D\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0" },
        { id: 6, name: "\u4E0D\u6B63\u3068\u653B\u6483\u306E\u30E1\u30AB\u30CB\u30BA\u30E0" }
      ]
    },
    {
      id: 2,
      name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
      sub: [
        { id: 1, name: "\u30D1\u30B9\u30EF\u30FC\u30C9\u306B\u95A2\u3059\u308B\u653B\u6483" },
        { id: 2, name: "Web\u30B5\u30A4\u30C8\u306B\u95A2\u3059\u308B\u653B\u6483" },
        { id: 3, name: "\u901A\u4FE1\u306B\u95A2\u3059\u308B\u653B\u6483" },
        { id: 4, name: "\u6A19\u7684\u578B\u653B\u6483\u30FB\u305D\u306E\u4ED6" },
        { id: 5, name: "\u6697\u53F7\u5316\u6280\u8853" },
        { id: 6, name: "\u8A8D\u8A3C\u6280\u8853" },
        { id: 7, name: "\u5229\u7528\u8005\u8A8D\u8A3C\u30FB\u751F\u4F53\u8A8D\u8A3C" },
        { id: 8, name: "\u516C\u958B\u9375\u57FA\u76E4" }
      ]
    },
    {
      id: 3,
      name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
      sub: [
        { id: 1, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406" },
        { id: 2, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u8AF8\u898F\u7A0B" },
        { id: 3, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0" },
        { id: 4, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D99\u7D9A" },
        { id: 5, name: "\u60C5\u5831\u8CC7\u7523\u306E\u8ABF\u67FB\u30FB\u5206\u985E" },
        { id: 6, name: "\u30EA\u30B9\u30AF\u306E\u7A2E\u985E" },
        { id: 7, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8" },
        { id: 8, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u5BFE\u5FDC" },
        { id: 9, name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D44\u7E54\u30FB\u6A5F\u95A2" },
        { id: 10, name: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u8A55\u4FA1" }
      ]
    },
    {
      id: 4,
      name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
      sub: [
        { id: 1, name: "\u4EBA\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56" },
        { id: 2, name: "\u30AF\u30E9\u30C3\u30AD\u30F3\u30B0\u30FB\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u5BFE\u7B56" },
        { id: 3, name: "\u30DE\u30EB\u30A6\u30A7\u30A2\u30FB\u4E0D\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0\u5BFE\u7B56" },
        { id: 4, name: "\u643A\u5E2F\u7AEF\u672B\u30FB\u7121\u7DDALAN\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56" },
        { id: 5, name: "\u30C7\u30B8\u30BF\u30EB\u30D5\u30A9\u30EC\u30F3\u30B8\u30C3\u30AF\u30B9\u30FB\u8A3C\u62E0\u4FDD\u5168\u5BFE\u7B56" },
        { id: 6, name: "\u305D\u306E\u4ED6\u306E\u6280\u8853\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56" },
        { id: 7, name: "\u7269\u7406\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56" },
        { id: 8, name: "\u30BB\u30AD\u30E5\u30A2\u30D7\u30ED\u30C8\u30B3\u30EB" },
        { id: 9, name: "\u8A8D\u8A3C\u6280\u8853" },
        { id: 10, name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3" },
        { id: 11, name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3" },
        { id: 12, name: "\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3" }
      ]
    },
    {
      id: 5,
      name: "\u6CD5\u52D9",
      sub: [
        { id: 1, name: "\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u57FA\u672C\u6CD5" },
        { id: 2, name: "\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u7981\u6B62\u6CD5" },
        { id: 3, name: "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u6CD5" },
        { id: 4, name: "\u5211\u6CD5" },
        { id: 5, name: "\u305D\u306E\u4ED6\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u95A2\u9023\u6CD5\u898F\u30FB\u57FA\u6E96" },
        { id: 6, name: "\u77E5\u7684\u8CA1\u7523\u6A29" },
        { id: 7, name: "\u52B4\u50CD\u95A2\u9023\u30FB\u53D6\u5F15\u95A2\u9023\u6CD5\u898F" },
        { id: 8, name: "\u305D\u306E\u4ED6\u306E\u6CD5\u5F8B\u30FB\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u30FB\u6280\u8853\u8005\u502B\u7406" },
        { id: 9, name: "\u6A19\u6E96\u5316\u95A2\u9023" }
      ]
    },
    {
      id: 6,
      name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
      sub: [
        { id: 1, name: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB" },
        { id: 2, name: "\u5185\u90E8\u7D71\u5236" },
        { id: 3, name: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8" },
        { id: 4, name: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306E\u8A08\u753B\u53CA\u3073\u904B\u7528" },
        { id: 5, name: "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u8A55\u4FA1\u53CA\u3073\u6539\u5584" },
        { id: 6, name: "\u30B5\u30FC\u30D3\u30B9\u306E\u904B\u7528" },
        { id: 7, name: "\u30D5\u30A1\u30B7\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8" },
        { id: 8, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8" },
        { id: 9, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u7D71\u5408" },
        { id: 10, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0" },
        { id: 11, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30B3\u30FC\u30D7" },
        { id: 12, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u8CC7\u6E90" },
        { id: 13, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u6642\u9593" },
        { id: 14, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B3\u30B9\u30C8" },
        { id: 15, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30B9\u30AF" },
        { id: 16, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u54C1\u8CEA" },
        { id: 17, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u8ABF\u9054" },
        { id: 18, name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3" }
      ]
    },
    {
      id: 7,
      name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
      sub: [
        { id: 1, name: "\u30B7\u30B9\u30C6\u30E0\u306E\u69CB\u6210" },
        { id: 2, name: "\u30B7\u30B9\u30C6\u30E0\u306E\u8A55\u4FA1\u6307\u6A19" },
        { id: 3, name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u65B9\u5F0F" },
        { id: 4, name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u8A2D\u8A08" },
        { id: 5, name: "\u30C7\u30FC\u30BF\u64CD\u4F5C" },
        { id: 6, name: "\u30C8\u30E9\u30F3\u30B6\u30AF\u30B7\u30E7\u30F3\u51E6\u7406" },
        { id: 7, name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u5FDC\u7528" },
        { id: 8, name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u65B9\u5F0F" },
        { id: 9, name: "\u30C7\u30FC\u30BF\u901A\u4FE1\u3068\u5236\u5FA1" },
        { id: 10, name: "\u901A\u4FE1\u30D7\u30ED\u30C8\u30B3\u30EB" },
        { id: 11, name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u7BA1\u7406" },
        { id: 12, name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u5FDC\u7528" }
      ]
    },
    {
      id: 8,
      name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
      sub: [
        { id: 1, name: "\u7D4C\u55B6\u30FB\u7D44\u7E54\u8AD6" },
        { id: 2, name: "\u696D\u52D9\u5206\u6790\u30FB\u30C7\u30FC\u30BF\u5229\u6D3B\u7528" },
        { id: 3, name: "\u4F1A\u8A08\u30FB\u8CA1\u52D9" },
        { id: 4, name: "\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u6226\u7565" },
        { id: 5, name: "\u696D\u52D9\u30D7\u30ED\u30BB\u30B9" },
        { id: 6, name: "\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u30D3\u30B8\u30CD\u30B9" },
        { id: 7, name: "\u30B7\u30B9\u30C6\u30E0\u6D3B\u7528\u4FC3\u9032\u30FB\u8A55\u4FA1" },
        { id: 8, name: "\u30B7\u30B9\u30C6\u30E0\u5316\u8A08\u753B" },
        { id: 9, name: "\u8981\u4EF6\u5B9A\u7FA9" },
        { id: 10, name: "\u8ABF\u9054\u8A08\u753B\u30FB\u5B9F\u65BD" }
      ]
    }
  ],
  "questions": [
    // sub_id 1: "情報セキュリティとは"
    {
      id: 1,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 1,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u304C\u5B88\u308B\u5BFE\u8C61\u3068\u3057\u3066\u6700\u3082\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u5BB6\u306E\u65BD\u9320", "\u9632\u72AF\u30AB\u30E1\u30E9\u306E\u8A2D\u7F6E", "\u60C5\u5831\uFF08\u30C7\u30FC\u30BF\u3001\u66F8\u985E\u306A\u3069\uFF09", "\u4F1A\u793E\u306E\u5EFA\u7269"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 2,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 1,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3092\u78BA\u4FDD\u3059\u308B\u4E0A\u3067\u3001\u6280\u8853\u7684\u306A\u5BFE\u7B56\u4EE5\u5916\u306B\u91CD\u8981\u3068\u3055\u308C\u3066\u3044\u308B\u8981\u7D20\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u6700\u65B0\u306E\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u5C0E\u5165", "\u9AD8\u6A5F\u80FD\u306A\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6A5F\u5668\u306E\u5C0E\u5165", "\u7D44\u7E54\u5168\u4F53\u306E\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8", "\u500B\u4EBA\u306EIT\u77E5\u8B58\u5411\u4E0A\u306E\u307F"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 3,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 1,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u72AF\u7F6A\u306B\u304A\u3044\u3066\u3001\u60C5\u5831\u6F0F\u3048\u3044\u306E\u4E3B\u306A\u539F\u56E0\u3068\u3057\u3066\u6319\u3052\u3089\u308C\u3066\u3044\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u5916\u90E8\u304B\u3089\u306E\u9AD8\u5EA6\u306A\u30B5\u30A4\u30D0\u30FC\u653B\u6483", "\u793E\u54E1\u306A\u3069\u306E\u5185\u90E8\u95A2\u4FC2\u8005\u306B\u3088\u308B\u4E0D\u6B63", "\u81EA\u7136\u707D\u5BB3\u306B\u3088\u308B\u30B7\u30B9\u30C6\u30E0\u505C\u6B62", "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u30D0\u30B0"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 2: "情報セキュリティの目的と考え方"
    {
      id: 4,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 2,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u76EE\u7684\u3068\u8003\u3048\u65B9"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u5B9A\u7FA9\u306B\u304A\u3051\u308B\u4E09\u3064\u306E\u8981\u7D20\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u6A5F\u5BC6\u6027", right: "\u8A8D\u53EF\u3055\u308C\u3066\u3044\u306A\u3044\u500B\u4EBA\u306B\u60C5\u5831\u3092\u4F7F\u7528\u3055\u305B\u305A\u3001\u307E\u305F\u958B\u793A\u3057\u306A\u3044\u7279\u6027" },
          { id: 2, left: "\u5B8C\u5168\u6027", right: "\u6B63\u78BA\u3055\u53CA\u3073\u5B8C\u5168\u3055\u306E\u7279\u6027" },
          { id: 3, left: "\u53EF\u7528\u6027", right: "\u8A8D\u53EF\u3055\u308C\u305F\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u304C\u8981\u6C42\u3057\u305F\u3068\u304D\u306B\u3001\u30A2\u30AF\u30BB\u30B9\u53CA\u3073\u4F7F\u7528\u304C\u53EF\u80FD\u3067\u3042\u308B\u7279\u6027" }
        ]
      }
    },
    {
      id: 5,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 2,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u76EE\u7684\u3068\u8003\u3048\u65B9"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\uFF08ISMS\uFF09\u306E\u63A1\u7528\u306F\u3001\u7D44\u7E54\u306B\u3068\u3063\u3066\u3069\u306E\u3088\u3046\u306A\u6C7A\u5B9A\u3068\u3055\u308C\u3066\u3044\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u6280\u8853\u7684\u6C7A\u5B9A", "\u6226\u8853\u7684\u6C7A\u5B9A", "\u6226\u7565\u7684\u6C7A\u5B9A", "\u4E00\u6642\u7684\u6C7A\u5B9A"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 3: "情報セキュリティの基本"
    {
      id: 6,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 3,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u57FA\u672C"
      },
      question_text: "\u4F01\u696D\u304C\u4FDD\u6709\u3059\u308B\u4FA1\u5024\u306E\u3042\u308B\u3082\u306E\u5168\u822C\u3092\u6307\u3057\u3001\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u306B\u3088\u3063\u3066\u5B88\u308B\u5BFE\u8C61\u3068\u306A\u308B\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u60C5\u5831\u8CC7\u6E90", "\u60C5\u5831\u8CC7\u7523", "\u60C5\u5831\u8CA1\u7523", "\u60C5\u5831\u30B7\u30B9\u30C6\u30E0"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 7,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 3,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u57FA\u672C"
      },
      question_text: "\u307E\u3060\u8D77\u3053\u3063\u3066\u306F\u3044\u306A\u3044\u3053\u3068\u3067\u3059\u304C\u3001\u3082\u3057\u305D\u308C\u304C\u767A\u751F\u3059\u308C\u3070\u60C5\u5831\u8CC7\u7523\u306B\u5F71\u97FF\u3092\u4E0E\u3048\u308B\u4E8B\u8C61\u3084\u72B6\u614B\u3092\u6307\u3059\u6982\u5FF5\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8", "\u8106\u5F31\u6027", "\u8105\u5A01", "\u30EA\u30B9\u30AF"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 8,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 3,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u57FA\u672C"
      },
      question_text: "\u8105\u5A01\u304C\u3064\u3051\u8FBC\u3080\u3053\u3068\u304C\u3067\u304D\u308B\u3001\u60C5\u5831\u8CC7\u7523\u304C\u3082\u3064\u5F31\u70B9\u3092\u6307\u3059\u7528\u8A9E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D0\u30B0", "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DB\u30FC\u30EB", "\u4EBA\u70BA\u7684\u8106\u5F31\u6027", "\u5168\u3066"],
          correct_answer_index: 3
        }
      }
    },
    // sub_id 4: "脅威の種類"
    {
      id: 9,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 4,
        sub_name: "\u8105\u5A01\u306E\u7A2E\u985E"
      },
      question_text: "\u76F4\u63A5\u7684\u306B\u60C5\u5831\u8CC7\u7523\u304C\u88AB\u5BB3\u3092\u53D7\u3051\u308B\u53EF\u80FD\u6027\u306E\u3042\u308B\u8105\u5A01\u306E\u7A2E\u985E\u3068\u3057\u3066\u6319\u3052\u3089\u308C\u3066\u3044\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9", "\u76D7\u8074", "\u707D\u5BB3", "\u306A\u308A\u3059\u307E\u3057"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 10,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 4,
        sub_name: "\u8105\u5A01\u306E\u7A2E\u985E"
      },
      question_text: "\u4EBA\u9593\u306E\u5FC3\u7406\u3084\u793E\u4F1A\u7684\u6027\u8CEA\u306B\u3064\u3051\u8FBC\u3093\u3067\u79D8\u5BC6\u60C5\u5831\u3092\u5165\u624B\u3059\u308B\u653B\u6483\u624B\u6CD5\u306E\u7DCF\u79F0\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D5\u30A3\u30C3\u30B7\u30F3\u30B0", "\u30BD\u30FC\u30B7\u30E3\u30EB\u30A8\u30F3\u30B8\u30CB\u30A2\u30EA\u30F3\u30B0", "\u30D3\u30B8\u30CD\u30B9\u30E1\u30FC\u30EB\u8A50\u6B3A\uFF08BEC\uFF09", "\u306A\u308A\u3059\u307E\u3057\u653B\u6483"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 5: "マルウェア・不正プログラム"
    {
      id: 11,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 5,
        sub_name: "\u30DE\u30EB\u30A6\u30A7\u30A2\u30FB\u4E0D\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0"
      },
      question_text: "\u60AA\u610F\u306E\u3042\u308B\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u7DCF\u79F0\u3068\u3057\u3066\u4F7F\u308F\u308C\u308B\u7528\u8A9E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30A6\u30A4\u30EB\u30B9", "\u30EF\u30FC\u30E0", "\u30C8\u30ED\u30A4\u306E\u6728\u99AC", "\u30DE\u30EB\u30A6\u30A7\u30A2"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 12,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 5,
        sub_name: "\u30DE\u30EB\u30A6\u30A7\u30A2\u30FB\u4E0D\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0"
      },
      question_text: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u653B\u6483\u3092\u6210\u529F\u3055\u305B\u305F\u5F8C\u306B\u3001\u305D\u306E\u75D5\u8DE1\u3092\u6D88\u3057\u3066\u898B\u3064\u304B\u308A\u306B\u304F\u304F\u3059\u308B\u305F\u3081\u306E\u30C4\u30FC\u30EB\u306E\u540D\u79F0\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D0\u30C3\u30AF\u30C9\u30A2", "\u30B9\u30D1\u30A4\u30A6\u30A7\u30A2", "\u30EB\u30FC\u30C8\u30AD\u30C3\u30C8", "\u30E9\u30F3\u30B5\u30E0\u30A6\u30A7\u30A2"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 13,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 5,
        sub_name: "\u30DE\u30EB\u30A6\u30A7\u30A2\u30FB\u4E0D\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0"
      },
      question_text: "\u30E1\u30FC\u30EB\u30A2\u30AB\u30A6\u30F3\u30C8\u3084\u30E1\u30FC\u30EB\u30C7\u30FC\u30BF\u306A\u3069\u306E\u60C5\u5831\u7A83\u53D6\u306B\u52A0\u3048\u3066\u3001\u4ED6\u306E\u30DE\u30EB\u30A6\u30A7\u30A2\u3078\u306E\u4E8C\u6B21\u611F\u67D3\u306E\u305F\u3081\u306B\u60AA\u7528\u3055\u308C\u308B\u30DE\u30EB\u30A6\u30A7\u30A2\u306E\u540D\u79F0\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30EF\u30FC\u30E0", "\u30C8\u30ED\u30A4\u306E\u6728\u99AC", "EMOTET", "\u30A2\u30C9\u30A6\u30A7\u30A2"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 6: "不正と攻撃のメカニズム"
    {
      id: 14,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 6,
        sub_name: "\u4E0D\u6B63\u3068\u653B\u6483\u306E\u30E1\u30AB\u30CB\u30BA\u30E0"
      },
      question_text: "\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u4E0A\u3067\u516C\u958B\u3055\u308C\u3066\u3044\u308B\u7C21\u5358\u306A\u30AF\u30E9\u30C3\u30AD\u30F3\u30B0\u30C4\u30FC\u30EB\u3092\u5229\u7528\u3057\u3066\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u3092\u8A66\u307F\u308B\u653B\u6483\u8005\u3092\u6307\u3059\u7528\u8A9E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30DC\u30C3\u30C8\u30CF\u30FC\u30C0\u30FC", "\u5185\u90E8\u95A2\u4FC2\u8005", "\u30B9\u30AF\u30EA\u30D7\u30C8\u30AD\u30C7\u30A3", "\u6109\u5FEB\u72AF"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 15,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 6,
        sub_name: "\u4E0D\u6B63\u3068\u653B\u6483\u306E\u30E1\u30AB\u30CB\u30BA\u30E0"
      },
      question_text: "\u30B5\u30A4\u30D0\u30FC\u653B\u6483\u306E\u6BB5\u968E\u30927\u3064\u306B\u533A\u5206\u3057\u305F\u30E2\u30C7\u30EB\u3067\u3001\u653B\u6483\u8005\u306E\u610F\u56F3\u3084\u884C\u52D5\u3092\u7406\u89E3\u3059\u308B\u3053\u3068\u3092\u76EE\u7684\u3068\u3057\u3066\u3044\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u30EC\u30B9\u30DD\u30F3\u30B9", "\u30B5\u30A4\u30D0\u30FC\u30AD\u30EB\u30C1\u30A7\u30FC\u30F3", "\u4E0D\u6B63\u306E\u30C8\u30E9\u30A4\u30A2\u30F3\u30B0\u30EB", "\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 16,
      category: {
        id: 1,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u306F",
        sub_id: 6,
        sub_name: "\u4E0D\u6B63\u3068\u653B\u6483\u306E\u30E1\u30AB\u30CB\u30BA\u30E0"
      },
      question_text: "\u30B5\u30A4\u30D0\u30FC\u30AD\u30EB\u30C1\u30A7\u30FC\u30F3\u306E\u4E3B\u8981\u306A\u6BB5\u968E\u3068\u3001\u305D\u306E\u6982\u8981\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u5075\u5BDF", right: "\u7D44\u7E54\u3084\u4EBA\u7269\u306B\u95A2\u3059\u308B\u60C5\u5831\u3092\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u306A\u3069\u304B\u3089\u53D6\u5F97\u3059\u308B" },
          { id: 2, left: "\u6B66\u5668\u5316", right: "\u30A8\u30AF\u30B9\u30D7\u30ED\u30A4\u30C8\u3084\u30DE\u30EB\u30A6\u30A7\u30A2\u3092\u4F5C\u6210\u3059\u308B" },
          { id: 3, left: "\u30C7\u30EA\u30D0\u30EA", right: "\u306A\u308A\u3059\u307E\u3057\u30E1\u30FC\u30EB\u3067\u30DE\u30EB\u30A6\u30A7\u30A2\u3092\u9001\u308A\u3064\u3051\u305F\u308A\u3001\u4E0D\u6B63\u30B5\u30A4\u30C8\u3078\u8A98\u5C0E\u3057\u305F\u308A\u3059\u308B" },
          { id: 4, left: "\u30A8\u30AF\u30B9\u30D7\u30ED\u30A4\u30C8", right: "\u30E6\u30FC\u30B6\u30FC\u306B\u30DE\u30EB\u30A6\u30A7\u30A2\u6DFB\u4ED8\u30D5\u30A1\u30A4\u30EB\u3092\u5B9F\u884C\u3055\u305B\u308B\u3001\u307E\u305F\u306F\u8106\u5F31\u6027\u3092\u5229\u7528\u3059\u308B" },
          { id: 5, left: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB", right: "\u653B\u6483\u5B9F\u884C\u306E\u7D50\u679C\u3001\u6A19\u7684\u306EPC\u304C\u30DE\u30EB\u30A6\u30A7\u30A2\u306B\u611F\u67D3\u3059\u308B" },
          { id: 6, left: "\u76EE\u7684\u306E\u5B9F\u884C", right: "\u63A2\u3057\u51FA\u3057\u305F\u5185\u90E8\u60C5\u5831\u3092\u5727\u7E2E\u30FB\u6697\u53F7\u5316\u3057\u3066\u6301\u3061\u51FA\u3059" }
        ]
      }
    },
    // --- カテゴリ2: 情報セキュリティ技術 (新規生成分) ---
    // sub_id 1: "パスワードに関する攻撃"
    {
      id: 17,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 1,
        sub_name: "\u30D1\u30B9\u30EF\u30FC\u30C9\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "\u540C\u3058\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u4F7F\u3063\u3066\u69D8\u3005\u306A\u5229\u7528\u8005ID\u306B\u5BFE\u3057\u3066\u30ED\u30B0\u30A4\u30F3\u3092\u8A66\u884C\u3059\u308B\u653B\u6483\u306E\u540D\u79F0\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D6\u30EB\u30FC\u30C8\u30D5\u30A9\u30FC\u30B9\u653B\u6483", "\u30EA\u30D0\u30FC\u30B9\u30D6\u30EB\u30FC\u30C8\u30D5\u30A9\u30FC\u30B9\u653B\u6483", "\u8F9E\u66F8\u653B\u6483", "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30B9\u30C8\u653B\u6483"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 18,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 1,
        sub_name: "\u30D1\u30B9\u30EF\u30FC\u30C9\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "\u8907\u6570\u306EWeb\u30B5\u30A4\u30C8\u3067\u4F7F\u3044\u56DE\u3055\u308C\u3066\u3044\u308B\u5229\u7528\u8005ID\u3068\u30D1\u30B9\u30EF\u30FC\u30C9\u306E\u30EA\u30B9\u30C8\u3092\u4E0D\u6B63\u306B\u5229\u7528\u3057\u3066\u30ED\u30B0\u30A4\u30F3\u3092\u8A66\u884C\u3059\u308B\u653B\u6483\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D6\u30EB\u30FC\u30C8\u30D5\u30A9\u30FC\u30B9\u653B\u6483", "\u30EA\u30D0\u30FC\u30B9\u30D6\u30EB\u30FC\u30C8\u30D5\u30A9\u30FC\u30B9\u653B\u6483", "\u8F9E\u66F8\u653B\u6483", "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30B9\u30C8\u653B\u6483"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 19,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 1,
        sub_name: "\u30D1\u30B9\u30EF\u30FC\u30C9\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u30CF\u30C3\u30B7\u30E5\u5024\u3067\u4FDD\u7BA1\u3055\u308C\u3066\u3044\u308B\u30B7\u30B9\u30C6\u30E0\u306B\u304A\u3044\u3066\u3001\u3042\u3089\u304B\u3058\u3081\u30D1\u30B9\u30EF\u30FC\u30C9\u3068\u30CF\u30C3\u30B7\u30E5\u5024\u306E\u7D44\u307F\u5408\u308F\u305B\u30EA\u30B9\u30C8\u3092\u7528\u610F\u3057\u3066\u304A\u304D\u3001\u305D\u308C\u3092\u7A81\u304D\u5408\u308F\u305B\u3066\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u63A8\u6E2C\u3059\u308B\u653B\u6483\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u8F9E\u66F8\u653B\u6483", "\u30D6\u30EB\u30FC\u30C8\u30D5\u30A9\u30FC\u30B9\u653B\u6483", "\u30EC\u30A4\u30F3\u30DC\u30FC\u653B\u6483", "\u30EA\u30D7\u30EC\u30A4\u653B\u6483"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 2: "Webサイトに関する攻撃"
    {
      id: 20,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 2,
        sub_name: "Web\u30B5\u30A4\u30C8\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "Web\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u306B\u304A\u3044\u3066\u3001\u4E0D\u6B63\u306ASQL\u6587\u3092\u6295\u5165\u3057\u3066\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3092\u4E0D\u6B63\u306B\u64CD\u4F5C\u3059\u308BSQL\u30A4\u30F3\u30B8\u30A7\u30AF\u30B7\u30E7\u30F3\u653B\u6483\u3078\u306E\u5BFE\u7B56\u3068\u3057\u3066\u6700\u3082\u6709\u52B9\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F [10, 11]",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u5165\u529B\u6587\u5B57\u5217\u9577\u306E\u30C1\u30A7\u30C3\u30AF\u3092\u53B3\u683C\u306B\u884C\u3046", "Web\u30B5\u30FC\u30D0\u3078\u306E\u30A2\u30AF\u30BB\u30B9\u5143IP\u30A2\u30C9\u30EC\u30B9\u3092\u5236\u9650\u3059\u308B", "\u30D7\u30EC\u30FC\u30B9\u30DB\u30EB\u30C0\u3092\u4F7F\u3063\u3066\u547D\u4EE4\u6587\u3092\u7D44\u307F\u7ACB\u3066\u308B", "\u4E0D\u6B63\u306A\u30B9\u30AF\u30EA\u30D7\u30C8\u306E\u5B9F\u884C\u3092\u59A8\u3052\u308B\u30A8\u30B9\u30B1\u30FC\u30D7\u51E6\u7406\u3092\u884C\u3046"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 21,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 2,
        sub_name: "Web\u30B5\u30A4\u30C8\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "\u60AA\u610F\u306E\u3042\u308B\u30B9\u30AF\u30EA\u30D7\u30C8\u3092Web\u30B5\u30A4\u30C8\u306B\u57CB\u3081\u8FBC\u307F\u3001\u305D\u306EWeb\u30B5\u30A4\u30C8\u306B\u30A2\u30AF\u30BB\u30B9\u3057\u305F\u30E6\u30FC\u30B6\u30FC\u306E\u30D6\u30E9\u30A6\u30B6\u4E0A\u3067\u30B9\u30AF\u30EA\u30D7\u30C8\u3092\u5B9F\u884C\u3055\u305B\u308B\u3053\u3068\u3067\u3001Cookie\u60C5\u5831\u306A\u3069\u3092\u76D7\u307F\u51FA\u3059\u653B\u6483\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["SQL\u30A4\u30F3\u30B8\u30A7\u30AF\u30B7\u30E7\u30F3", "\u30AF\u30ED\u30B9\u30B5\u30A4\u30C8\u30B9\u30AF\u30EA\u30D7\u30C6\u30A3\u30F3\u30B0\u653B\u6483", "\u30C7\u30A3\u30EC\u30AF\u30C8\u30EA\u30C8\u30E9\u30D0\u30FC\u30B5\u30EB\u653B\u6483", "\u30AF\u30EA\u30C3\u30AF\u30B8\u30E3\u30C3\u30AD\u30F3\u30B0"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 22,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 2,
        sub_name: "Web\u30B5\u30A4\u30C8\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "\u30ED\u30B0\u30A4\u30F3\u4E2D\u306E\u30E6\u30FC\u30B6\u30FC\u306E\u30D6\u30E9\u30A6\u30B6\u3092\u5229\u7528\u3057\u3066\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u610F\u56F3\u3057\u306A\u3044\u51E6\u7406\u3092Web\u30B5\u30FC\u30D0\u4E0A\u3067\u5B9F\u884C\u3055\u305B\u308B\u653B\u6483\u3067\u3001XSS\uFF08\u30AF\u30ED\u30B9\u30B5\u30A4\u30C8\u30B9\u30AF\u30EA\u30D7\u30C6\u30A3\u30F3\u30B0\uFF09\u3068\u306F\u7570\u306A\u308A\u3001\u4E3B\u306B\u30B5\u30FC\u30D0\u5074\u3067\u4E0D\u6B63\u306A\u66F8\u304D\u8FBC\u307F\u306A\u3069\u3092\u884C\u3046\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["SQL\u30A4\u30F3\u30B8\u30A7\u30AF\u30B7\u30E7\u30F3\u653B\u6483", "\u30AF\u30ED\u30B9\u30B5\u30A4\u30C8\u30EA\u30AF\u30A8\u30B9\u30C8\u30D5\u30A9\u30FC\u30B8\u30A7\u30EA\u653B\u6483\uFF08CSRF\uFF09", "\u30BB\u30C3\u30B7\u30E7\u30F3\u30CF\u30A4\u30B8\u30E3\u30C3\u30AF", "OS\u30B3\u30DE\u30F3\u30C9\u30A4\u30F3\u30B8\u30A7\u30AF\u30B7\u30E7\u30F3"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 3: "通信に関する攻撃"
    {
      id: 23,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 3,
        sub_name: "\u901A\u4FE1\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "DNS\u30B5\u30FC\u30D0\u306E\u30AD\u30E3\u30C3\u30B7\u30E5\u306B\u4E0D\u6B63\u306A\u60C5\u5831\u3092\u6CE8\u5165\u3057\u3001\u5229\u7528\u8005\u3092\u507D\u306EWeb\u30B5\u30A4\u30C8\u3078\u8A98\u5C0E\u3059\u308B\u653B\u6483\u306E\u540D\u79F0\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["DNS\u30EA\u30D5\u30EC\u30AF\u30B7\u30E7\u30F3\u653B\u6483", "DNS\u30A2\u30F3\u30D7\u653B\u6483", "DNS\u30AD\u30E3\u30C3\u30B7\u30E5\u30DD\u30A4\u30BA\u30CB\u30F3\u30B0\u653B\u6483", "\u30E9\u30F3\u30C0\u30E0\u30B5\u30D6\u30C9\u30E1\u30A4\u30F3\u653B\u6483"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 24,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 3,
        sub_name: "\u901A\u4FE1\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "\u653B\u6483\u8005\u304C\u3001\u95A2\u4FC2\u306E\u306A\u3044\u7B2C\u4E09\u8005\u306E\u30E1\u30FC\u30EB\u30B5\u30FC\u30D0\u3084DNS\u30B5\u30FC\u30D0\u306A\u3069\u3092\u4E0D\u6B63\u306B\u5229\u7528\u3057\u3001\u4ED6\u306E\u653B\u6483\u306E\u4E2D\u7D99\u70B9\u3068\u3057\u3066\u60AA\u7528\u3059\u308B\u653B\u6483\u306E\u7DCF\u79F0\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u4E2D\u9593\u8005\u653B\u6483", "\u8E0F\u307F\u53F0\u653B\u6483", "IP\u30B9\u30D7\u30FC\u30D5\u30A3\u30F3\u30B0", "\u30DD\u30FC\u30C8\u30B9\u30AD\u30E3\u30F3"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 25,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 3,
        sub_name: "\u901A\u4FE1\u306B\u95A2\u3059\u308B\u653B\u6483"
      },
      question_text: "\u30AF\u30E9\u30A6\u30C9\u30B5\u30FC\u30D3\u30B9\u306E\u5229\u7528\u8005\u3092\u6A19\u7684\u3068\u3057\u3001\u30B5\u30FC\u30D3\u30B9\u5229\u7528\u8CBB\u306E\u5897\u5927\u306A\u3069\u3092\u76EE\u7684\u3068\u3057\u3066\u3001\u904E\u5270\u306A\u30A2\u30AF\u30BB\u30B9\u3092\u767A\u751F\u3055\u305B\u3066\u7D4C\u6E08\u7684\u640D\u5931\u3092\u4E0E\u3048\u308B\u653B\u6483\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["DoS\u653B\u6483", "DDoS\u653B\u6483", "EDoS\u653B\u6483", "\u30B5\u30A4\u30D0\u30FC\u30C6\u30ED\u30EA\u30BA\u30E0"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 4: "標的型攻撃・その他"
    {
      id: 26,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 4,
        sub_name: "\u6A19\u7684\u578B\u653B\u6483\u30FB\u305D\u306E\u4ED6"
      },
      question_text: "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306B\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u4E0A\u306E\u8106\u5F31\u6027\u304C\u767A\u898B\u3055\u308C\u3066\u304B\u3089\u3001\u305D\u306E\u8106\u5F31\u6027\u306B\u5BFE\u51E6\u3059\u308B\u305F\u3081\u306E\u4FEE\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0\u3084\u60C5\u5831\u304C\u63D0\u4F9B\u3055\u308C\u308B\u307E\u3067\u306E\u671F\u9593\u306B\u3001\u305D\u306E\u8106\u5F31\u6027\u3092\u60AA\u7528\u3057\u3066\u884C\u308F\u308C\u308B\u653B\u6483\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u6C34\u98F2\u307F\u5834\u578B\u653B\u6483", "\u6A19\u7684\u578B\u653B\u6483", "\u30BC\u30ED\u30C7\u30A4\u653B\u6483", "\u30B5\u30A4\u30C9\u30C1\u30E3\u30CD\u30EB\u653B\u6483"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 27,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 4,
        sub_name: "\u6A19\u7684\u578B\u653B\u6483\u30FB\u305D\u306E\u4ED6"
      },
      question_text: "AI\uFF08\u4EBA\u5DE5\u77E5\u80FD\uFF09\u3092\u60AA\u7528\u3057\u305F\u653B\u6483\u624B\u6CD5\u3068\u3001\u305D\u306E\u5177\u4F53\u7684\u306A\u4F8B\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002 [17, 18]",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u30C7\u30A3\u30FC\u30D7\u30D5\u30A7\u30A4\u30AF", right: "AI\u3092\u4F7F\u3063\u3066\u672C\u7269\u305D\u3063\u304F\u308A\u306E\u507D\u306E\u753B\u50CF\u30FB\u52D5\u753B\u30FB\u97F3\u58F0\u3092\u751F\u6210\u3057\u3001\u8A50\u6B3A\u3084\u6050\u559D\u306B\u60AA\u7528\u3059\u308B" },
          { id: 2, left: "\u6575\u5BFE\u7684\u30B5\u30F3\u30D7\u30EB\u653B\u6483", right: "\u4EBA\u9593\u306B\u306F\u77E5\u899A\u3067\u304D\u306A\u3044\u30CE\u30A4\u30BA\u3084\u5FAE\u5C0F\u306A\u5909\u5316\u3092\u753B\u50CF\u306B\u542B\u3081\u308B\u3053\u3068\u3067\u3001AI\u306B\u8AA4\u3063\u305F\u5224\u65AD\u3092\u3055\u305B\u308B" },
          { id: 3, left: "\u30E2\u30C7\u30EB\u53CD\u8EE2\u653B\u6483", right: "AI\u306E\u5B66\u7FD2\u6E08\u307F\u30E2\u30C7\u30EB\u304B\u3089\u3001\u5B66\u7FD2\u306B\u7528\u3044\u3089\u308C\u305F\u5143\u306E\u753B\u50CF\u306A\u3069\u306E\u6A5F\u5BC6\u60C5\u5831\u3092\u53D6\u5F97\u3059\u308B" },
          { id: 4, left: "\u30D7\u30ED\u30F3\u30D7\u30C8\u30A4\u30F3\u30B8\u30A7\u30AF\u30B7\u30E7\u30F3", right: "AI\u30C1\u30E3\u30C3\u30C8\u30DC\u30C3\u30C8\u306A\u3069\u306B\u60AA\u610F\u306E\u3042\u308B\u6307\u793A\u3092\u5165\u529B\u3057\u3001\u610F\u56F3\u3057\u306A\u3044\u52D5\u4F5C\u3084\u6A5F\u5BC6\u60C5\u5831\u306E\u5F15\u304D\u51FA\u3057\u3092\u3055\u305B\u308B" }
        ]
      }
    },
    {
      id: 28,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 4,
        sub_name: "\u6A19\u7684\u578B\u653B\u6483\u30FB\u305D\u306E\u4ED6"
      },
      question_text: "\u653B\u6483\u8005\u304C\u653B\u6483\u306E\u6E96\u5099\u3068\u3057\u3066\u3001\u653B\u6483\u5BFE\u8C61\u306E\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u3001\u30B7\u30B9\u30C6\u30E0\u3001\u30B5\u30FC\u30D0\u3001PC\u306A\u3069\u306B\u95A2\u3059\u308B\u516C\u958B\u60C5\u5831\u3092\u53CE\u96C6\u3059\u308B\u884C\u70BA\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D0\u30C3\u30AF\u30C9\u30A2", "\u30D5\u30C3\u30C8\u30D7\u30EA\u30F3\u30C6\u30A3\u30F3\u30B0", "\u30EB\u30FC\u30C8\u30AD\u30C3\u30C8", "\u30AF\u30EA\u30D7\u30C8\u30B8\u30E3\u30C3\u30AD\u30F3\u30B0"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 5: "暗号化技術"
    {
      id: 29,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 5,
        sub_name: "\u6697\u53F7\u5316\u6280\u8853"
      },
      question_text: "\u6697\u53F7\u5316\u3068\u5FA9\u53F7\u306B\u540C\u3058\u9375\u3092\u4F7F\u7528\u3057\u3001\u9375\u306E\u7A2E\u985E\u304C\u4E00\u3064\u3057\u304B\u306A\u3044\u305F\u3081\u3001\u9375\u3092\u79D8\u5BC6\u306B\u3057\u3066\u304A\u304F\u5FC5\u8981\u304C\u3042\u308B\u6697\u53F7\u65B9\u5F0F\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u516C\u958B\u9375\u6697\u53F7\u65B9\u5F0F", "\u5171\u901A\u9375\u6697\u53F7\u65B9\u5F0F", "\u30CF\u30A4\u30D6\u30EA\u30C3\u30C9\u6697\u53F7\u65B9\u5F0F", "\u6955\u5186\u66F2\u7DDA\u6697\u53F7\u65B9\u5F0F"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 30,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 5,
        sub_name: "\u6697\u53F7\u5316\u6280\u8853"
      },
      question_text: "\u516C\u958B\u9375\u6697\u53F7\u65B9\u5F0F\u3068\u5171\u901A\u9375\u6697\u53F7\u65B9\u5F0F\u3092\u7D44\u307F\u5408\u308F\u305B\u308B\u3053\u3068\u3067\u3001\u305D\u308C\u305E\u308C\u306E\u9577\u6240\u3092\u6D3B\u304B\u3057\u3001\u30C7\u30FC\u30BF\u306E\u79D8\u533F\u6027\u3068\u52B9\u7387\u6027\u3092\u4E21\u7ACB\u3055\u305B\u308B\u6697\u53F7\u65B9\u5F0F\u306F\u4F55\u3067\u3059\u304B\uFF1F [20, 21]",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u5171\u901A\u9375\u6697\u53F7\u65B9\u5F0F", "\u516C\u958B\u9375\u6697\u53F7\u65B9\u5F0F", "\u30CF\u30A4\u30D6\u30EA\u30C3\u30C9\u6697\u53F7\u65B9\u5F0F", "\u30D6\u30ED\u30C3\u30AF\u6697\u53F7\u65B9\u5F0F"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 31,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 5,
        sub_name: "\u6697\u53F7\u5316\u6280\u8853"
      },
      question_text: "\u9001\u4FE1\u3055\u308C\u305F\u30C7\u30FC\u30BF\u306E\u5185\u5BB9\u304C\u6539\u3056\u3093\u3055\u308C\u3066\u3044\u306A\u3044\u304B\u3001\u307E\u305F\u6B63\u3057\u3044\u9001\u4FE1\u8005\u304B\u3089\u9001\u3089\u308C\u305F\u3082\u306E\u304B\u3092\u78BA\u8A8D\u3059\u308B\u305F\u3081\u306B\u3001\u5143\u306E\u30E1\u30C3\u30BB\u30FC\u30B8\u306B\u5171\u901A\u9375\u3092\u52A0\u3048\u3066\u751F\u6210\u3055\u308C\u308B\u30B3\u30FC\u30C9\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30CF\u30C3\u30B7\u30E5\u5024", "\u30C7\u30B8\u30BF\u30EB\u7F72\u540D", "\u30E1\u30C3\u30BB\u30FC\u30B8\u8A8D\u8A3C\u30B3\u30FC\u30C9\uFF08MAC\uFF09", "\u516C\u958B\u9375"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 6: "認証技術"
    {
      id: 32,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 6,
        sub_name: "\u8A8D\u8A3C\u6280\u8853"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306B\u304A\u3051\u308B\u8A8D\u8A3C\u306E3\u8981\u7D20\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u8A18\u61B6", right: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3084\u6697\u8A3C\u756A\u53F7\u306A\u3069\u3001\u77E5\u3063\u3066\u3044\u308B\u60C5\u5831\u306B\u3088\u308B\u8A8D\u8A3C" },
          { id: 2, left: "\u6240\u6301", right: "IC\u30AB\u30FC\u30C9\u3084\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u306A\u3069\u3001\u6301\u3063\u3066\u3044\u308B\u7269\u306B\u3088\u308B\u8A8D\u8A3C" },
          { id: 3, left: "\u751F\u4F53", right: "\u6307\u7D0B\u3084\u8679\u5F69\u306A\u3069\u3001\u8EAB\u4F53\u7684\u7279\u5FB4\u306B\u3088\u308B\u8A8D\u8A3C" }
        ]
      }
    },
    {
      id: 33,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 6,
        sub_name: "\u8A8D\u8A3C\u6280\u8853"
      },
      question_text: "\u96FB\u5B50\u30E1\u30FC\u30EB\u306B\u30C7\u30B8\u30BF\u30EB\u7F72\u540D\u3092\u4ED8\u4E0E\u3059\u308B\u3053\u3068\u306B\u3088\u3063\u3066\u3001\u4E3B\u306B\u3069\u306E\u3088\u3046\u306A\u52B9\u679C\u304C\u5F97\u3089\u308C\u307E\u3059\u304B\uFF1F [24, 25]",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u6A5F\u5BC6\u6027\u304C\u5411\u4E0A\u3059\u308B", "\u53EF\u7528\u6027\u304C\u5411\u4E0A\u3059\u308B", "\u5B8C\u5168\u6027\u304C\u5411\u4E0A\u3059\u308B", "\u51E6\u7406\u901F\u5EA6\u304C\u5411\u4E0A\u3059\u308B"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 34,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 6,
        sub_name: "\u8A8D\u8A3C\u6280\u8853"
      },
      question_text: "JIS Q 27000:2019\u3067\u5B9A\u7FA9\u3055\u308C\u3066\u3044\u308B\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u7279\u6027\u306B\u95A2\u3059\u308B\u8A18\u8FF0\u306E\u3046\u3061\u3001\u5426\u8A8D\u9632\u6B62\u306E\u7279\u6027\u306B\u95A2\u3059\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u8A8D\u53EF\u3055\u308C\u305F\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u304C\u8981\u6C42\u3057\u305F\u3068\u304D\u306B\u3001\u30A2\u30AF\u30BB\u30B9\u53CA\u3073\u4F7F\u7528\u304C\u53EF\u80FD\u3067\u3042\u308B\u7279\u6027", "\u8A8D\u53EF\u3055\u308C\u3066\u3044\u306A\u3044\u500B\u4EBA\u306B\u60C5\u5831\u3092\u4F7F\u7528\u3055\u305B\u305A\u3001\u307E\u305F\u958B\u793A\u3057\u306A\u3044\u7279\u6027", "\u6B63\u78BA\u3055\u53CA\u3073\u5B8C\u5168\u3055\u306E\u7279\u6027", "\u4E3B\u5F35\u3055\u308C\u305F\u4E8B\u8C61\u53C8\u306F\u51E6\u7F6E\u306E\u767A\u751F\u3001\u53CA\u3073\u305D\u308C\u3089\u3092\u5F15\u304D\u8D77\u3053\u3057\u305F\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u3092\u8A3C\u660E\u3059\u308B\u80FD\u529B"],
          correct_answer_index: 3
        }
      }
    },
    // sub_id 7: "利用者認証・生体認証"
    {
      id: 35,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 7,
        sub_name: "\u5229\u7528\u8005\u8A8D\u8A3C\u30FB\u751F\u4F53\u8A8D\u8A3C"
      },
      question_text: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u4F7F\u7528\u305B\u305A\u306B\u3001\u751F\u4F53\u8A8D\u8A3C\uFF08\u6307\u7D0B\u3001\u9854\u8A8D\u8A3C\u306A\u3069\uFF09\u3084\u516C\u958B\u9375\u6697\u53F7\u65B9\u5F0F\u306A\u3069\u3092\u5229\u7528\u3057\u3066\u672C\u4EBA\u78BA\u8A8D\u3092\u884C\u3046\u8A8D\u8A3C\u65B9\u5F0F\u306E\u7DCF\u79F0\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u591A\u8981\u7D20\u8A8D\u8A3C", "\u30EF\u30F3\u30BF\u30A4\u30E0\u30D1\u30B9\u30EF\u30FC\u30C9", "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EC\u30B9\u8A8D\u8A3C", "\u30EA\u30B9\u30AF\u30D9\u30FC\u30B9\u8A8D\u8A3C"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 36,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 7,
        sub_name: "\u5229\u7528\u8005\u8A8D\u8A3C\u30FB\u751F\u4F53\u8A8D\u8A3C"
      },
      question_text: "\u4E00\u5EA6\u306E\u8A8D\u8A3C\u3067\u8907\u6570\u306E\u30B5\u30FC\u30D0\u3084\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u306B\u30ED\u30B0\u30A4\u30F3\u3057\u3001\u305D\u308C\u3089\u3092\u5229\u7528\u3067\u304D\u308B\u4ED5\u7D44\u307F\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u591A\u8981\u7D20\u8A8D\u8A3C", "\u30B7\u30F3\u30B0\u30EB\u30B5\u30A4\u30F3\u30AA\u30F3\uFF08SSO\uFF09", "\u591A\u6BB5\u968E\u8A8D\u8A3C", "\u30BB\u30C3\u30B7\u30E7\u30F3\u30CF\u30A4\u30B8\u30E3\u30C3\u30AF"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 37,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 7,
        sub_name: "\u5229\u7528\u8005\u8A8D\u8A3C\u30FB\u751F\u4F53\u8A8D\u8A3C"
      },
      question_text: "\u5229\u7528\u8005\u306EIP\u30A2\u30C9\u30EC\u30B9\u3084Web\u30D6\u30E9\u30A6\u30B6\u306A\u3069\u306E\u74B0\u5883\u3092\u5206\u6790\u3057\u3001\u901A\u5E38\u3068\u306F\u7570\u306A\u308B\u30A2\u30AF\u30BB\u30B9\u30D1\u30BF\u30FC\u30F3\u304C\u691C\u51FA\u3055\u308C\u305F\u5834\u5408\u306B\u306E\u307F\u8FFD\u52A0\u306E\u8A8D\u8A3C\uFF08\u4F8B: \u30EF\u30F3\u30BF\u30A4\u30E0\u30D1\u30B9\u30EF\u30FC\u30C9\uFF09\u3092\u8981\u6C42\u3059\u308B\u8A8D\u8A3C\u65B9\u5F0F\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u751F\u4F53\u8A8D\u8A3C", "\u4E8C\u8981\u7D20\u8A8D\u8A3C", "\u30EA\u30B9\u30AF\u30D9\u30FC\u30B9\u8A8D\u8A3C", "\u30C1\u30E3\u30EC\u30F3\u30B8\u30EC\u30B9\u30DD\u30F3\u30B9\u65B9\u5F0F"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 38,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 7,
        sub_name: "\u5229\u7528\u8005\u8A8D\u8A3C\u30FB\u751F\u4F53\u8A8D\u8A3C"
      },
      question_text: "\u30D0\u30A4\u30AA\u30E1\u30C8\u30EA\u30AF\u30B9\u8A8D\u8A3C\u306B\u304A\u3051\u308B\u8A8D\u8A3C\u7CBE\u5EA6\u306B\u95A2\u3059\u308B\u6307\u6A19\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u672C\u4EBA\u62D2\u5426\u7387\uFF08FRR\uFF09", right: "\u8AA4\u3063\u3066\u672C\u4EBA\u3092\u62D2\u5426\u3059\u308B\u78BA\u7387" },
          { id: 2, left: "\u4ED6\u4EBA\u53D7\u5165\u7387\uFF08FAR\uFF09", right: "\u8AA4\u3063\u3066\u4ED6\u4EBA\u3092\u53D7\u3051\u5165\u308C\u308B\u78BA\u7387" },
          { id: 3, left: "\u672A\u5BFE\u5FDC\u7387", right: "\u8A8D\u8A3C\u306E\u88C5\u7F6E\u307E\u305F\u306F\u30A2\u30EB\u30B4\u30EA\u30BA\u30E0\u304C\u751F\u4F53\u60C5\u5831\u3092\u8A8D\u8B58\u3067\u304D\u306A\u3044\u5272\u5408" }
        ]
      }
    },
    // sub_id 8: "公開鍵基盤"
    {
      id: 39,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 8,
        sub_name: "\u516C\u958B\u9375\u57FA\u76E4"
      },
      question_text: "\u516C\u958B\u9375\u6697\u53F7\u65B9\u5F0F\u3092\u5229\u7528\u3057\u3001\u4FE1\u983C\u3067\u304D\u308B\u7B2C\u4E09\u8005\u6A5F\u95A2\u3067\u3042\u308B\u8A8D\u8A3C\u5C40\uFF08CA\uFF09\u304C\u30C7\u30B8\u30BF\u30EB\u8A3C\u660E\u66F8\u3092\u767A\u884C\u3059\u308B\u3053\u3068\u3067\u3001\u500B\u4EBA\u3084\u7D44\u7E54\u306E\u4FE1\u983C\u3092\u78BA\u4FDD\u3059\u308B\u793E\u4F1A\u57FA\u76E4\uFF08\u30A4\u30F3\u30D5\u30E9\uFF09\u306E\u7DCF\u79F0\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u5171\u901A\u9375\u57FA\u76E4\uFF08SKPI\uFF09", "\u79D8\u5BC6\u9375\u57FA\u76E4\uFF08PKSI\uFF09", "\u516C\u958B\u9375\u57FA\u76E4\uFF08PKI\uFF09", "\u5206\u6563\u578B\u53F0\u5E33\uFF08DLT\uFF09"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 40,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 8,
        sub_name: "\u516C\u958B\u9375\u57FA\u76E4"
      },
      question_text: "\u8A8D\u8A3C\u5C40\uFF08CA\uFF09\u304C\u767A\u884C\u3059\u308B\u30C7\u30B8\u30BF\u30EB\u8A3C\u660E\u66F8\u306B\u306F\u3001\u901A\u5E38\u3069\u306E\u3088\u3046\u306A\u60C5\u5831\u304C\u4ED8\u52A0\u3055\u308C\u3001CA\u306B\u3088\u3063\u3066\u30C7\u30B8\u30BF\u30EB\u7F72\u540D\u304C\u65BD\u3055\u308C\u307E\u3059\u304B\uFF1F [32, 33]",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u5171\u901A\u9375", "\u79D8\u5BC6\u9375", "\u516C\u958B\u9375", "\u30CF\u30C3\u30B7\u30E5\u5024"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 41,
      category: {
        id: 2,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853",
        sub_id: 8,
        sub_name: "\u516C\u958B\u9375\u57FA\u76E4"
      },
      question_text: "\u30C7\u30B8\u30BF\u30EB\u8A3C\u660E\u66F8\u304C\u6709\u52B9\u671F\u9650\u5185\u306B\u5931\u52B9\u3057\u3066\u3044\u308B\u304B\u3069\u3046\u304B\u3092\u3001\u30AA\u30F3\u30E9\u30A4\u30F3\u3067\u78BA\u8A8D\u3059\u308B\u305F\u3081\u306E\u30D7\u30ED\u30C8\u30B3\u30EB\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["CRL\uFF08Certificate Revocation List\uFF09", "OCSP\uFF08Online Certificate Status Protocol\uFF09", "LDAP\uFF08Lightweight Directory Access Protocol\uFF09", "SAML\uFF08Security Assertion Markup Language\uFF09"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 1: "情報セキュリティ管理"
    {
      id: 42,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 1,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406\u306B\u304A\u3044\u3066\u3001\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3092\u8105\u304B\u3059\u4E8B\u4EF6\u3084\u4E8B\u6545\u306E\u3053\u3068\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u8105\u5A01", "\u8106\u5F31\u6027", "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8", "\u30EA\u30B9\u30AF\u6E90"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 43,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 1,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406\u306B\u304A\u3051\u308B\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u30CF\u30F3\u30C9\u30EA\u30F3\u30B0\u306E\u6BB5\u968E\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u691C\u77E5/\u9023\u7D61\u53D7\u4ED8", right: "\u76E3\u8996\u30B7\u30B9\u30C6\u30E0\u3084\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u5831\u544A\u3092\u901A\u3058\u3066\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u3092\u8A8D\u8B58\u3059\u308B" },
          { id: 2, left: "\u30C8\u30EA\u30A2\u30FC\u30B8", right: "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u306E\u91CD\u8981\u5EA6\u3084\u7DCA\u6025\u5EA6\u3092\u8A55\u4FA1\u3057\u3001\u5BFE\u5FDC\u306E\u512A\u5148\u9806\u4F4D\u3092\u6C7A\u5B9A\u3059\u308B" },
          { id: 3, left: "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u30EC\u30B9\u30DD\u30F3\u30B9", right: "\u88AB\u5BB3\u62E1\u5927\u9632\u6B62\u3001\u5FA9\u65E7\u4F5C\u696D\u3001\u539F\u56E0\u7A76\u660E\u3092\u5B9F\u65BD\u3059\u308B" },
          { id: 4, left: "\u5831\u544A\uFF0F\u60C5\u5831\u516C\u958B", right: "\u72B6\u6CC1\u3084\u5BFE\u5FDC\u7D50\u679C\u3092\u95A2\u4FC2\u8005\u306B\u5831\u544A\u3057\u3001\u5FC5\u8981\u306B\u5FDC\u3058\u3066\u516C\u958B\u3059\u308B" }
        ]
      }
    },
    // sub_id 2: "情報セキュリティ諸規程"
    {
      id: 44,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 2,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u8AF8\u898F\u7A0B"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u65B9\u91DD\uFF08\u57FA\u672C\u65B9\u91DD\uFF09\u306B\u3064\u3044\u3066\u8FF0\u3079\u305F\u3082\u306E\u3068\u3057\u3066\u3001\u6700\u3082\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56\u306E\u5177\u4F53\u7684\u306A\u624B\u9806\u3092\u8A73\u7D30\u306B\u8A18\u8FF0\u3057\u305F\u6587\u66F8\u3067\u3042\u308B\u3002",
            "\u7D4C\u55B6\u9663\u306B\u3088\u3063\u3066\u627F\u8A8D\u3055\u308C\u3001\u7D44\u7E54\u306E\u57FA\u672C\u7684\u306A\u8003\u3048\u65B9\u3084\u65B9\u91DD\u3092\u793A\u3059\u3082\u306E\u3067\u3001\u5168\u5F93\u696D\u54E1\u53CA\u3073\u95A2\u4FC2\u8005\u306B\u516C\u8868\u3055\u308C\u308B\u3002",
            "\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8\u306E\u7D50\u679C\u306B\u57FA\u3065\u3044\u3066\u3001\u5177\u4F53\u7684\u306A\u9806\u5B88\u4E8B\u9805\u3084\u57FA\u6E96\u3092\u5B9A\u3081\u305F\u3082\u306E\u3067\u3042\u308B\u3002",
            "\u6A5F\u5BC6\u60C5\u5831\u306B\u95A2\u3059\u308B\u7F70\u5247\u898F\u5B9A\u306E\u307F\u3092\u8A18\u8F09\u3057\u3001\u5916\u90E8\u306B\u306F\u975E\u516C\u958B\u3068\u3059\u308B\u3082\u306E\u3067\u3042\u308B\u3002"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 45,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 2,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u8AF8\u898F\u7A0B"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u5BFE\u5FDC\u306B\u304A\u3044\u3066\u4F5C\u6210\u3055\u308C\u308B\u6587\u66F8\u3067\u3001\u5FC5\u8981\u306A\u7BA1\u7406\u7B56\u3068\u305D\u306E\u7406\u7531\u3001\u5B9F\u65BD\u72B6\u6CC1\u304C\u8A18\u8FF0\u3055\u308C\u308B\u3082\u306E\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u65B9\u91DD", "\u30EA\u30B9\u30AF\u5BFE\u5FDC\u8A08\u753B", "\u9069\u7528\u5BA3\u8A00\u66F8", "\u60C5\u5831\u8CC7\u7523\u53F0\u5E33"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 3: "情報セキュリティマネジメントシステム"
    {
      id: 46,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 3,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\uFF08ISMS\uFF09\u306E\u63A1\u7528\u306F\u3001\u7D44\u7E54\u306B\u3068\u3063\u3066\u3069\u306E\u3088\u3046\u306A\u6C7A\u5B9A\u3068\u3055\u308C\u3066\u3044\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u6280\u8853\u7684\u6C7A\u5B9A", "\u904B\u7528\u4E0A\u306E\u6C7A\u5B9A", "\u6226\u7565\u7684\u6C7A\u5B9A", "\u4E00\u6642\u7684\u306A\u6C7A\u5B9A"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 47,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 3,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0"
      },
      question_text: "ISMS\u306B\u95A2\u9023\u3059\u308BJIS\u898F\u683C\u3068\u3001\u305D\u306E\u5185\u5BB9\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "JIS Q 27001", right: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306E\u8981\u6C42\u4E8B\u9805" },
          { id: 2, left: "JIS Q 27002", right: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406\u7B56\u306E\u5B9F\u8DF5\u306E\u305F\u3081\u306E\u898F\u7BC4" }
        ]
      }
    },
    {
      id: 48,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 3,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0"
      },
      question_text: "ISMS\u306E\u6709\u52B9\u6027\u3092\u78BA\u4FDD\u3059\u308B\u305F\u3081\u306B\u3001\u7D44\u7E54\u306E\u7BA1\u7406\u4E0B\u3067\u50CD\u304F\u4EBA\u3005\u304C\u8A8D\u8B58\u3059\u3079\u304D\u4E8B\u9805\u3068\u3057\u3066\u9069\u5207\u3067\u306A\u3044\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u65B9\u91DD\u306E\u5185\u5BB9",
            "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u5411\u4E0A\u306B\u3088\u308B\u4FBF\u76CA",
            "ISMS\u8981\u6C42\u4E8B\u9805\u306B\u9069\u5408\u3057\u306A\u3044\u3053\u3068\u306E\u610F\u5473",
            "ISMS\u306E\u5185\u90E8\u76E3\u67FB\u306E\u5177\u4F53\u7684\u306A\u5B9F\u65BD\u65B9\u6CD5"
          ],
          correct_answer_index: 3
        }
      }
    },
    // sub_id 4: "情報セキュリティ継続"
    {
      id: 49,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 4,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D99\u7D9A"
      },
      question_text: "\u30B5\u30FC\u30D3\u30B9\u306E\u4E2D\u65AD\u3084\u707D\u5BB3\u767A\u751F\u6642\u306B\u3001\u30B7\u30B9\u30C6\u30E0\u3092\u8FC5\u901F\u304B\u3064\u52B9\u7387\u7684\u306B\u5FA9\u65E7\u3055\u305B\u308B\u8A08\u753B\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DD\u30EA\u30B7\u30FC", "\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8\u8A08\u753B", "\u7DCA\u6025\u6642\u5BFE\u5FDC\u8A08\u753B", "\u60C5\u5831\u8CC7\u7523\u7BA1\u7406\u53F0\u5E33"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 50,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 4,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D99\u7D9A"
      },
      question_text: "JIS Q 27002:2014\u3067\u5B9A\u3081\u3089\u308C\u3066\u3044\u308B\u3001\u30B5\u30FC\u30D0\u5BA4\u306E\u7A7A\u8ABF\u3001\u96FB\u6C17\u3001\u6D88\u706B\u88C5\u7F6E\u306A\u3069\u306E\u30E9\u30A4\u30D5\u30E9\u30A4\u30F3\u306B\u5BFE\u3059\u308B\u7BA1\u7406\u7B56\u306E\u3053\u3068\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u7269\u7406\u7684\u8CC7\u7523", "\u30B5\u30DD\u30FC\u30C8\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3", "\u74B0\u5883\u7BA1\u7406\u57FA\u6E96", "\u30A4\u30F3\u30D5\u30E9\u30B9\u30C8\u30E9\u30AF\u30C1\u30E3\u7BA1\u7406"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 5: "情報資産の調査・分類"
    {
      id: 51,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 5,
        sub_name: "\u60C5\u5831\u8CC7\u7523\u306E\u8ABF\u67FB\u30FB\u5206\u985E"
      },
      question_text: "\u4F01\u696D\u304C\u4FDD\u6709\u3059\u308B\u60C5\u5831\u8CC7\u7523\u306E\u3046\u3061\u3001\u300C\u7D44\u7E54\u306E\u30A4\u30E1\u30FC\u30B8\u300D\u3084\u300C\u8A55\u5224\u300D\u3068\u3044\u3063\u305F\u5F62\u306E\u306A\u3044\u8CC7\u7523\u306F\u3069\u308C\u306B\u5206\u985E\u3055\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u7269\u7406\u7684\u8CC7\u7523", "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u8CC7\u7523", "\u4EBA\u7684\u8CC7\u7523", "\u7121\u5F62\u8CC7\u7523"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 52,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 5,
        sub_name: "\u60C5\u5831\u8CC7\u7523\u306E\u8ABF\u67FB\u30FB\u5206\u985E"
      },
      question_text: "\u60C5\u5831\u8CC7\u7523\u3092\u6F0F\u308C\u306A\u304F\u8A18\u8F09\u3057\u3001\u5909\u5316\u306B\u5FDC\u3058\u3066\u9069\u5207\u306B\u66F4\u65B0\u3057\u3066\u3044\u304F\u76EE\u7684\u3067\u4F5C\u6210\u3055\u308C\u308B\u6587\u66F8\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DD\u30EA\u30B7\u30FC", "\u30EA\u30B9\u30AF\u767B\u9332\u7C3F", "\u60C5\u5831\u8CC7\u7523\u53F0\u5E33", "\u9069\u7528\u5BA3\u8A00\u66F8"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 6: "リスクの種類"
    {
      id: 53,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 6,
        sub_name: "\u30EA\u30B9\u30AF\u306E\u7A2E\u985E"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306B\u304A\u3044\u3066\u3001\u300C\u307E\u3060\u8D77\u3053\u3063\u3066\u306F\u3044\u306A\u3044\u304C\u3001\u3082\u3057\u305D\u308C\u304C\u767A\u751F\u3059\u308C\u3070\u60C5\u5831\u8CC7\u7523\u306B\u5F71\u97FF\u3092\u4E0E\u3048\u308B\u4E8B\u8C61\u3084\u72B6\u614B\u300D\u3092\u6307\u3059\u8A00\u8449\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8", "\u8105\u5A01", "\u8106\u5F31\u6027", "\u30EA\u30B9\u30AF"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 54,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 6,
        sub_name: "\u30EA\u30B9\u30AF\u306E\u7A2E\u985E"
      },
      question_text: "\u4FDD\u967A\u306B\u52A0\u5165\u3057\u3066\u3044\u308B\u3053\u3068\u306B\u3088\u3063\u3066\u3001\u30EA\u30B9\u30AF\u3092\u4F34\u3046\u884C\u52D5\u304C\u751F\u3058\u308B\u304A\u305D\u308C\u304C\u3042\u308B\u73FE\u8C61\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30B5\u30D7\u30E9\u30A4\u30C1\u30A7\u30FC\u30F3\u30EA\u30B9\u30AF", "\u30AA\u30DA\u30EC\u30FC\u30B7\u30E7\u30CA\u30EB\u30EA\u30B9\u30AF", "\u5730\u653F\u5B66\u7684\u30EA\u30B9\u30AF", "\u30E2\u30E9\u30EB\u30CF\u30B6\u30FC\u30C9"],
          correct_answer_index: 3
        }
      }
    },
    // sub_id 7: "情報セキュリティリスクアセスメント"
    {
      id: 55,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 7,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8\u3092\u69CB\u6210\u3059\u308B3\u3064\u306E\u30D7\u30ED\u30BB\u30B9\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u30EA\u30B9\u30AF\u7279\u5B9A", right: "\u30EA\u30B9\u30AF\u3092\u767A\u898B\u3057\u3001\u8A8D\u8B58\u3057\u3001\u8A18\u8FF0\u3059\u308B\u30D7\u30ED\u30BB\u30B9" },
          { id: 2, left: "\u30EA\u30B9\u30AF\u5206\u6790", right: "\u30EA\u30B9\u30AF\u306E\u7279\u8CEA\u3092\u7406\u89E3\u3057\u3001\u30EA\u30B9\u30AF\u30EC\u30D9\u30EB\u3092\u6C7A\u5B9A\u3059\u308B\u30D7\u30ED\u30BB\u30B9" },
          { id: 3, left: "\u30EA\u30B9\u30AF\u8A55\u4FA1", right: "\u30EA\u30B9\u30AF\u3068\u305D\u306E\u5927\u304D\u3055\u304C\u53D7\u5BB9\u53EF\u80FD\u304B\u5426\u304B\u3092\u6C7A\u5B9A\u3059\u308B\u305F\u3081\u306B\u3001\u30EA\u30B9\u30AF\u5206\u6790\u306E\u7D50\u679C\u3092\u30EA\u30B9\u30AF\u57FA\u6E96\u3068\u6BD4\u8F03\u3059\u308B\u30D7\u30ED\u30BB\u30B9" }
        ]
      }
    },
    {
      id: 56,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 7,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8"
      },
      question_text: "\u30EA\u30B9\u30AF\u5206\u6790\u306E\u624B\u6CD5\u306E\u4E00\u3064\u3067\u3001\u30EA\u30B9\u30AF\u3092\u91D1\u984D\u306A\u3069\u3067\u5B9A\u91CF\u7684\u306B\u8A55\u4FA1\u3059\u308B\u3053\u3068\u3092\u76EE\u7684\u3068\u3059\u308B\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D9\u30FC\u30B9\u30E9\u30A4\u30F3\u30A2\u30D7\u30ED\u30FC\u30C1", "\u975E\u5F62\u5F0F\u7684\u30A2\u30D7\u30ED\u30FC\u30C1", "\u5B9A\u6027\u7684\u30EA\u30B9\u30AF\u5206\u6790", "\u5B9A\u91CF\u7684\u30EA\u30B9\u30AF\u5206\u6790"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 57,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 7,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8"
      },
      question_text: "\u30EA\u30B9\u30AF\u306B\u95A2\u3059\u308B\u6B63\u78BA\u306A\u60C5\u5831\u3092\u4F01\u696D\u306E\u5229\u5BB3\u95A2\u4FC2\u8005\u9593\u3067\u5171\u6709\u3057\u3001\u76F8\u4E92\u306B\u610F\u601D\u758E\u901A\u3092\u56F3\u308B\u3053\u3068\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30EA\u30B9\u30AF\u5206\u6790", "\u30EA\u30B9\u30AF\u8A55\u4FA1", "\u30EA\u30B9\u30AF\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3", "\u30EA\u30B9\u30AF\u6240\u6709\u8005\u6C7A\u5B9A"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 8: "情報セキュリティリスク対応"
    {
      id: 58,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 8,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u5BFE\u5FDC"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u5BFE\u5FDC\u6226\u7565\u306E\u3046\u3061\u3001\u30EA\u30B9\u30AF\u3092\u751F\u3058\u3055\u305B\u308B\u6D3B\u52D5\u305D\u306E\u3082\u306E\u3092\u4E2D\u6B62\u3059\u308B\u3053\u3068\u3067\u8105\u5A01\u3092\u5B8C\u5168\u306B\u53D6\u308A\u9664\u304F\u3053\u3068\u3092\u6307\u3059\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30EA\u30B9\u30AF\u30C6\u30A4\u30AF", "\u30EA\u30B9\u30AF\u56DE\u907F", "\u30EA\u30B9\u30AF\u5171\u6709", "\u30EA\u30B9\u30AF\u4FDD\u6709"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 59,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 8,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u5BFE\u5FDC"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30EA\u30B9\u30AF\u3078\u306E\u5BFE\u5FDC\u7B56\u306E\u3046\u3061\u3001\u640D\u5BB3\u306B\u5099\u3048\u3066\u4FDD\u967A\u306B\u52A0\u5165\u3059\u308B\u306A\u3069\u3001\u91D1\u92AD\u7684\u306A\u5074\u9762\u304B\u3089\u30EA\u30B9\u30AF\u306B\u5BFE\u5FDC\u3059\u308B\u3053\u3068\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30EA\u30B9\u30AF\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB", "\u30EA\u30B9\u30AF\u4F4E\u6E1B", "\u30EA\u30B9\u30AF\u30D5\u30A1\u30A4\u30CA\u30F3\u30B7\u30F3\u30B0", "\u30EA\u30B9\u30AF\u56DE\u907F"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 9: "情報セキュリティ組織・機関"
    {
      id: 60,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 9,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D44\u7E54\u30FB\u6A5F\u95A2"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u767A\u751F\u6642\u306B\u3001\u305D\u306E\u5BFE\u5FDC\u3092\u5C02\u9580\u7684\u306B\u884C\u3046\u7D44\u7E54\u5185\u307E\u305F\u306F\u7D44\u7E54\u6A2A\u65AD\u7684\u306A\u30C1\u30FC\u30E0\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["CISO", "CSIRT", "SOC", "NISC"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 61,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 9,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D44\u7E54\u30FB\u6A5F\u95A2"
      },
      question_text: "\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u57FA\u672C\u6CD5\u306B\u57FA\u3065\u304D\u3001\u56FD\u306E\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6226\u7565\u672C\u90E8\u304C\u8A2D\u7F6E\u3055\u308C\u305F\u969B\u306B\u540C\u6642\u306B\u5185\u95A3\u5B98\u623F\u306B\u8A2D\u7F6E\u3055\u308C\u305F\u7D44\u7E54\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["IPA", "JPCERT/CC", "\u5185\u95A3\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30BB\u30F3\u30BF\u30FC\uFF08NISC\uFF09", "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u59D4\u54E1\u4F1A"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 62,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 9,
        sub_name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D44\u7E54\u30FB\u6A5F\u95A2"
      },
      question_text: "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u88FD\u54C1\u306B\u304A\u3051\u308B\u8106\u5F31\u6027\u306B\u95A2\u3059\u308B\u60C5\u5831\u3092\u96C6\u7D04\u3057\u3001\u516C\u958B\u3057\u3066\u3044\u308B\u65E5\u672C\u306E\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["CVE", "CVSS", "JVN", "CWE"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 10: "セキュリティ評価"
    {
      id: 63,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 10,
        sub_name: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u8A55\u4FA1"
      },
      question_text: "\u5171\u901A\u8106\u5F31\u6027\u8A55\u4FA1\u30B7\u30B9\u30C6\u30E0\uFF08CVSS\uFF09\u306E\u76EE\u7684\u3068\u3057\u3066\u3001\u6700\u3082\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306E\u9069\u5408\u6027\u3092\u8A55\u4FA1\u3059\u308B\u3002",
            "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u6B20\u9665\u3092\u7279\u5B9A\u3059\u308B\u305F\u3081\u306E\u8B58\u5225\u5B50\u3092\u4ED8\u4E0E\u3059\u308B\u3002",
            "\u8106\u5F31\u6027\u306E\u6DF1\u523B\u5EA6\u3092\u5171\u901A\u306E\u5C3A\u5EA6\u3067\u5B9A\u91CF\u7684\u306B\u8A55\u4FA1\u3059\u308B\u3002",
            "\u4F01\u696D\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u610F\u8B58\u5411\u4E0A\u3092\u6E2C\u308B\u6307\u6A19\u3092\u63D0\u4F9B\u3059\u308B\u3002"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 64,
      category: {
        id: 3,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7BA1\u7406",
        sub_id: 10,
        sub_name: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u8A55\u4FA1"
      },
      question_text: "\u5171\u901A\u8106\u5F31\u6027\u8B58\u5225\u5B50\uFF08CVE\uFF09\u306F\u3001\u4E3B\u306B\u4F55\u3092\u8B58\u5225\u3059\u308B\u305F\u3081\u306B\u7528\u3044\u3089\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u8106\u5F31\u6027\u306E\u30BF\u30A4\u30D7", "\u5177\u4F53\u7684\u306A\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u8106\u5F31\u6027", "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u8A55\u4FA1\u57FA\u6E96", "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u306E\u7A2E\u985E"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 1: "人的セキュリティ対策"
    {
      id: 65,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 1,
        sub_name: "\u4EBA\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u7D44\u7E54\u306B\u304A\u3051\u308B\u5185\u90E8\u4E0D\u6B63\u3092\u9632\u6B62\u3059\u308B\u305F\u3081\u306E\u300E\u7D44\u7E54\u306B\u304A\u3051\u308B\u5185\u90E8\u4E0D\u6B63\u9632\u6B62\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\uFF08\u7B2C5\u7248\uFF09\u300F\u3067\u6319\u3052\u3089\u308C\u3066\u3044\u308B\u57FA\u672C\u539F\u5247\u306E\u4E00\u3064\u3067\u3001\u300C\u3084\u308A\u306B\u304F\u304F\u3059\u308B\u300D\u306B\u8A72\u5F53\u3059\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u72AF\u7F6A\u306E\u898B\u8FD4\u308A\u3092\u6E1B\u3089\u3059",
            "\u6355\u307E\u308B\u30EA\u30B9\u30AF\u3092\u9AD8\u3081\u308B",
            "\u72AF\u7F6A\u3092\u96E3\u3057\u304F\u3059\u308B",
            "\u72AF\u884C\u306E\u8A98\u56E0\u3092\u6E1B\u3089\u3059"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 66,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 1,
        sub_name: "\u4EBA\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u89B3\u70B9\u304B\u3089\u3001\u9000\u8077\u3059\u308B\u5F93\u696D\u54E1\u306B\u5BFE\u3059\u308B\u9069\u5207\u306A\u63AA\u7F6E\u3068\u3057\u3066\u6700\u3082\u91CD\u8981\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u9000\u8077\u5F8C\u3082\u4F01\u696D\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u306E\u5229\u7528\u3092\u8A31\u53EF\u3059\u308B",
            "\u96C7\u7528\u7D42\u4E86\u6642\u306B\u60C5\u5831\u8CC7\u7523\u3092\u3059\u3079\u3066\u8FD4\u5374\u3055\u305B\u3001\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u306E\u5229\u7528\u8005ID\u3084\u6A29\u9650\u3092\u524A\u9664\u3059\u308B",
            "\u5728\u8077\u4E2D\u306B\u77E5\u308A\u5F97\u305F\u79D8\u5BC6\u60C5\u5831\u306E\u516C\u958B\u3092\u5236\u9650\u3059\u308B\u8A93\u7D04\u66F8\u3092\u63D0\u51FA\u3055\u305B\u306A\u3044",
            "\u500B\u4EBA\u7684\u306A\u60C5\u5831\u6A5F\u5668\u3084\u8A18\u61B6\u5A92\u4F53\u306E\u696D\u52D9\u5229\u7528\u3092\u63A8\u5968\u3059\u308B"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 67,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 1,
        sub_name: "\u4EBA\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u5185\u90E8\u4E0D\u6B63\u306E\u9632\u6B62\u306B\u304A\u3044\u3066\u3001\u5358\u72EC\u4F5C\u696D\u3067\u306E\u4E0D\u6B63\u767A\u751F\u30EA\u30B9\u30AF\u3092\u4F4E\u6E1B\u3059\u308B\u305F\u3081\u306B\u6709\u52B9\u306A\u5BFE\u7B56\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u5F93\u696D\u54E1\u306E\u30B9\u30C8\u30EC\u30B9\u8EFD\u6E1B\u306E\u305F\u3081\u306E\u30E1\u30F3\u30BF\u30EB\u30D8\u30EB\u30B9\u5BFE\u7B56",
            "\u30A2\u30AF\u30BB\u30B9\u5C65\u6B74\u3084\u64CD\u4F5C\u5C65\u6B74\u306E\u30ED\u30B0\u30FB\u8A3C\u8DE1\u3092\u6B8B\u3057\u3001\u5B9A\u671F\u7684\u306B\u78BA\u8A8D\u3059\u308B",
            "\u76F8\u4E92\u76E3\u8996\u304C\u3067\u304D\u306A\u3044\u74B0\u5883\u3067\u306E\u4F11\u65E5\u3084\u6DF1\u591C\u306E\u5358\u72EC\u4F5C\u696D\u3092\u5236\u9650\u3059\u308B",
            "\u79D8\u5BC6\u4FDD\u6301\u7FA9\u52D9\u3092\u8AB2\u3059\u8A93\u7D04\u66F8\u306E\u63D0\u51FA\u3092\u6C42\u3081\u308B"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 68,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 1,
        sub_name: "\u4EBA\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5553\u767A\u6D3B\u52D5\u306B\u304A\u3044\u3066\u3001\u6700\u3082\u91CD\u8981\u306A\u76EE\u6A19\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u6700\u65B0\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6280\u8853\u3092\u5C0E\u5165\u3059\u308B\u3053\u3068",
            "\u5F93\u696D\u54E1\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u610F\u8B58\u3092\u9AD8\u3081\u308B\u3053\u3068",
            "\u5916\u90E8\u59D4\u8A17\u5148\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56\u3092\u5F37\u5316\u3059\u308B\u3053\u3068",
            "\u793E\u5185\u898F\u5B9A\u3092\u53B3\u683C\u306B\u6587\u66F8\u5316\u3059\u308B\u3053\u3068"
          ],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 2: "クラッキング・不正アクセス対策"
    {
      id: 69,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 2,
        sub_name: "\u30AF\u30E9\u30C3\u30AD\u30F3\u30B0\u30FB\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u5BFE\u7B56"
      },
      question_text: "Web\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u306B\u7279\u5316\u3057\u3001SQL\u30A4\u30F3\u30B8\u30A7\u30AF\u30B7\u30E7\u30F3\u3084\u30AF\u30ED\u30B9\u30B5\u30A4\u30C8\u30B9\u30AF\u30EA\u30D7\u30C6\u30A3\u30F3\u30B0\u306A\u3069\u306E\u653B\u6483\u3092\u9632\u3050\u305F\u3081\u306E\u30D5\u30A1\u30A4\u30A2\u30A6\u30A9\u30FC\u30EB\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["IDS", "IPS", "WAF", "UTM"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 70,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 2,
        sub_name: "\u30AF\u30E9\u30C3\u30AD\u30F3\u30B0\u30FB\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u5BFE\u7B56"
      },
      question_text: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u3092\u901A\u904E\u3059\u308B\u901A\u4FE1\u3092\u76E3\u8996\u3057\u3001\u4E0D\u6B63\u306A\u4FB5\u5165\u3092\u691C\u77E5\u3059\u308B\u30B7\u30B9\u30C6\u30E0\u306FIDS\u3067\u3059\u304C\u3001\u305D\u308C\u306B\u52A0\u3048\u3066\u4E0D\u6B63\u306A\u901A\u4FE1\u3092\u9632\u5FA1\uFF08\u906E\u65AD\uFF09\u3059\u308B\u6A5F\u80FD\u3092\u6301\u3064\u30B7\u30B9\u30C6\u30E0\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["Firewall", "NIDS", "IPS", "SOC"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 71,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 2,
        sub_name: "\u30AF\u30E9\u30C3\u30AD\u30F3\u30B0\u30FB\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u5BFE\u7B56"
      },
      question_text: "\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u304B\u3089\u306E\u30A2\u30AF\u30BB\u30B9\u3092\u8A31\u53EF\u3059\u308BWeb\u30B5\u30FC\u30D0\u306A\u3069\u3092\u3001\u5185\u90E8\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u304B\u3089\u5206\u96E2\u3057\u3066\u8A2D\u7F6E\u3059\u308B\u533A\u57DF\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["DMZ", "VPN", "LAN", "WAN"],
          correct_answer_index: 0
        }
      }
    },
    // sub_id 3: "マルウェア・不正プログラム対策"
    {
      id: 72,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 3,
        sub_name: "\u30DE\u30EB\u30A6\u30A7\u30A2\u30FB\u4E0D\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0\u5BFE\u7B56"
      },
      question_text: "\u30DE\u30EB\u30A6\u30A7\u30A2\u5BFE\u7B56\u306B\u304A\u3044\u3066\u3001\u30A6\u30A4\u30EB\u30B9\u5B9A\u7FA9\u30D5\u30A1\u30A4\u30EB\u3068\u6BD4\u8F03\u3059\u308B\u3053\u3068\u3067\u65E2\u77E5\u306E\u30A6\u30A4\u30EB\u30B9\u3092\u691C\u51FA\u3059\u308B\u624B\u6CD5\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D3\u30D8\u30A4\u30D3\u30A2\u6CD5", "\u30B3\u30F3\u30DA\u30A2\u6CD5", "\u30D1\u30BF\u30FC\u30F3\u30DE\u30C3\u30C1\u30F3\u30B0", "\u30B5\u30F3\u30C9\u30DC\u30C3\u30AF\u30B9"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 73,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 3,
        sub_name: "\u30DE\u30EB\u30A6\u30A7\u30A2\u30FB\u4E0D\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0\u5BFE\u7B56"
      },
      question_text: "\u30DE\u30EB\u30A6\u30A7\u30A2\u611F\u67D3\u3092\u5B8C\u5168\u306B\u9632\u3050\u3053\u3068\u306F\u56F0\u96E3\u3067\u3042\u308B\u305F\u3081\u3001\u611F\u67D3\u5F8C\u306E\u88AB\u5BB3\u3092\u56DE\u907F\u307E\u305F\u306F\u4F4E\u6E1B\u3059\u308B\u305F\u3081\u306B\u8907\u6570\u306E\u5BFE\u7B56\u3092\u8B1B\u3058\u308B\u624B\u6CD5\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u5358\u4E00\u9632\u5FA1", "\u5165\u53E3\u5BFE\u7B56", "\u51FA\u53E3\u5BFE\u7B56", "\u591A\u5C64\u9632\u5FA1"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 74,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 3,
        sub_name: "\u30DE\u30EB\u30A6\u30A7\u30A2\u30FB\u4E0D\u6B63\u30D7\u30ED\u30B0\u30E9\u30E0\u5BFE\u7B56"
      },
      question_text: "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u3092\u69CB\u6210\u3059\u308B\u30B3\u30F3\u30DD\u30FC\u30CD\u30F3\u30C8\u3068\u305D\u306E\u4F9D\u5B58\u95A2\u4FC2\u306A\u3069\u3092\u30EA\u30B9\u30C8\u5316\u3057\u305F\u3082\u306E\u3067\u3001\u8106\u5F31\u6027\u304C\u898B\u3064\u304B\u3063\u305F\u969B\u306B\u66F4\u65B0\u304C\u5FC5\u8981\u306A\u90E8\u5206\u3092\u7279\u5B9A\u3057\u3084\u3059\u304F\u306A\u308B\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["CMDB", "SIEM", "SBOM", "SOC"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 4: "携帯端末・無線LANのセキュリティ対策"
    {
      id: 75,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 4,
        sub_name: "\u643A\u5E2F\u7AEF\u672B\u30FB\u7121\u7DDALAN\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u4F01\u696D\u5185\u3067\u5229\u7528\u3055\u308C\u308B\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u3084\u30BF\u30D6\u30EC\u30C3\u30C8\u306A\u3069\u306E\u30E2\u30D0\u30A4\u30EB\u30C7\u30D0\u30A4\u30B9\u3092\u7D71\u5408\u7684\u306B\u7BA1\u7406\u3059\u308B\u305F\u3081\u306E\u30B7\u30B9\u30C6\u30E0\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["VPN", "MDM", "BYOD", "NTP"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 76,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 4,
        sub_name: "\u643A\u5E2F\u7AEF\u672B\u30FB\u7121\u7DDALAN\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u7121\u7DDALAN\u306E\u6697\u53F7\u5316\u65B9\u5F0F\u306E\u6700\u65B0\u7248\u3067\u3001\u3088\u308A\u5F37\u56FA\u306A\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3092\u63D0\u4F9B\u3059\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["WEP", "WPA", "WPA2", "WPA3"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 77,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 4,
        sub_name: "\u643A\u5E2F\u7AEF\u672B\u30FB\u7121\u7DDALAN\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u7121\u7DDALAN\u30A2\u30AF\u30BB\u30B9\u30DD\u30A4\u30F3\u30C8\u306B\u304A\u3044\u3066\u3001\u63A5\u7D9A\u3092\u8A31\u53EF\u3059\u308B\u7AEF\u672B\u306EMAC\u30A2\u30C9\u30EC\u30B9\u3092\u4E8B\u524D\u306B\u767B\u9332\u3057\u3001\u767B\u9332\u3055\u308C\u3066\u3044\u306A\u3044\u7AEF\u672B\u304B\u3089\u306E\u63A5\u7D9A\u3092\u62D2\u5426\u3059\u308B\u4ED5\u7D44\u307F\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["SSID\u30B9\u30C6\u30EB\u30B9", "MAC\u30A2\u30C9\u30EC\u30B9\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0", "EAP", "WPA\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 5: "デジタルフォレンジックス・証拠保全対策"
    {
      id: 78,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 5,
        sub_name: "\u30C7\u30B8\u30BF\u30EB\u30D5\u30A9\u30EC\u30F3\u30B8\u30C3\u30AF\u30B9\u30FB\u8A3C\u62E0\u4FDD\u5168\u5BFE\u7B56"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u767A\u751F\u6642\u306B\u3001\u6CD5\u7684\u306B\u6709\u52B9\u306A\u8A3C\u62E0\u3092\u6B8B\u3059\u305F\u3081\u306B\u884C\u308F\u308C\u308B\u6280\u8853\u7684\u304B\u3064\u6CD5\u7684\u306A\u624B\u6CD5\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30DA\u30CD\u30C8\u30EC\u30FC\u30B7\u30E7\u30F3\u30C6\u30B9\u30C8", "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB", "\u30C7\u30B8\u30BF\u30EB\u30D5\u30A9\u30EC\u30F3\u30B8\u30C3\u30AF\u30B9", "\u8106\u5F31\u6027\u8A3A\u65AD"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 79,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 5,
        sub_name: "\u30C7\u30B8\u30BF\u30EB\u30D5\u30A9\u30EC\u30F3\u30B8\u30C3\u30AF\u30B9\u30FB\u8A3C\u62E0\u4FDD\u5168\u5BFE\u7B56"
      },
      question_text: "\u69D8\u3005\u306A\u6A5F\u5668\u304B\u3089\u96C6\u3081\u3089\u308C\u305F\u30ED\u30B0\u60C5\u5831\u3092\u7DCF\u5408\u7684\u306B\u5206\u6790\u3057\u3001\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u306E\u4E88\u5146\u3092\u767A\u898B\u3057\u3066\u901A\u77E5\u3059\u308B\u30B7\u30B9\u30C6\u30E0\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["CMDB", "SOC", "SIEM", "NIDS"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 6: "その他の技術的セキュリティ対策"
    {
      id: 80,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 6,
        sub_name: "\u305D\u306E\u4ED6\u306E\u6280\u8853\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "PC\u306E\u30CF\u30FC\u30C9\u30C7\u30A3\u30B9\u30AF\u30C9\u30E9\u30A4\u30D6\uFF08HDD\uFF09\u81EA\u4F53\u306B\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u8A2D\u5B9A\u3057\u305F\u308A\u3001HDD\u5168\u4F53\u3092\u6697\u53F7\u5316\u3057\u305F\u308A\u3059\u308B\u5BFE\u7B56\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D5\u30A1\u30A4\u30EB\u6697\u53F7\u5316", "\u30D5\u30A9\u30EB\u30C0\u6697\u53F7\u5316", "HDD\u79D8\u533F\u5316", "OS\u30D1\u30B9\u30EF\u30FC\u30C9\u8A2D\u5B9A"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 81,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 6,
        sub_name: "\u305D\u306E\u4ED6\u306E\u6280\u8853\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u3084\u88FD\u54C1\u306E\u4F01\u753B\u30FB\u8A2D\u8A08\u6BB5\u968E\u304B\u3089\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3092\u8003\u616E\u3057\u3001\u8106\u5F31\u6027\u3092\u4F5C\u308A\u8FBC\u307E\u306A\u3044\u3088\u3046\u306B\u3059\u308B\u8003\u3048\u65B9\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8", "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u76E3\u67FB", "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30D0\u30A4\u30C7\u30B6\u30A4\u30F3", "\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 82,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 6,
        sub_name: "\u305D\u306E\u4ED6\u306E\u6280\u8853\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u6A5F\u5BC6\u30C7\u30FC\u30BF\u3084\u500B\u4EBA\u60C5\u5831\u3092\u4FDD\u8B77\u3059\u308B\u305F\u3081\u3001\u5143\u306E\u30C7\u30FC\u30BF\u3092\u507D\u306E\u30C7\u30FC\u30BF\u3084\u6587\u5B57\u3067\u7F6E\u304D\u63DB\u3048\u308B\u6280\u8853\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30C7\u30FC\u30BF\u6697\u53F7\u5316", "\u30C7\u30FC\u30BF\u30DE\u30B9\u30AD\u30F3\u30B0", "k-\u533F\u540D\u5316", "\u30C7\u30FC\u30BF\u6B63\u898F\u5316"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 7: "物理的セキュリティ対策"
    {
      id: 83,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 7,
        sub_name: "\u7269\u7406\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "PC\u306E\u753B\u9762\u30ED\u30C3\u30AF\u3084\u3001\u91CD\u8981\u66F8\u985E\u3092\u673A\u4E0A\u306B\u653E\u7F6E\u3057\u306A\u3044\u306A\u3069\u306E\u7269\u7406\u7684\u5BFE\u7B56\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30BE\u30FC\u30CB\u30F3\u30B0", "\u30AF\u30EA\u30A2\u30C7\u30B9\u30AF\u30FB\u30AF\u30EA\u30A2\u30B9\u30AF\u30EA\u30FC\u30F3", "\u65BD\u9320\u7BA1\u7406", "\u5165\u9000\u5BA4\u7BA1\u7406"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 84,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 7,
        sub_name: "\u7269\u7406\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u7269\u7406\u7684\u5BFE\u7B56\u3068\u3057\u3066\u3001\u30AA\u30D5\u30A3\u30B9\u306A\u3069\u306E\u7A7A\u9593\u3092\u7269\u7406\u7684\u306B\u533A\u5207\u3063\u3066\u30BE\u30FC\u30F3\uFF08\u533A\u57DF\uFF09\u306B\u5206\u3051\u308B\u3053\u3068\u3092\u4F55\u3068\u3044\u3044\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30BE\u30FC\u30CB\u30F3\u30B0", "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u7BA1\u7406", "\u30A2\u30AF\u30BB\u30B9\u5236\u5FA1\u30EA\u30B9\u30C8", "DMZ"],
          correct_answer_index: 0
        }
      }
    },
    {
      id: 85,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 7,
        sub_name: "\u7269\u7406\u7684\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56"
      },
      question_text: "IC\u30AB\u30FC\u30C9\u306B\u3088\u308B\u5165\u9000\u5BA4\u7BA1\u7406\u306B\u304A\u3044\u3066\u3001\u76F4\u524D\u306B\u5165\u5BA4\u3057\u305F\u4EBA\u306E\u5F8C\u308D\u306B\u3064\u3044\u3066\u8A8D\u8A3C\u3092\u3059\u308A\u629C\u3051\u308B\u30D4\u30AE\u30FC\u30D0\u30C3\u30AF\uFF08\u5171\u9023\u308C\uFF09\u3092\u9632\u6B62\u3059\u308B\u305F\u3081\u3001\u5165\u5BA4\u6642\u306E\u8A8D\u8A3C\u306B\u7528\u3044\u3089\u308C\u306A\u304B\u3063\u305FID\u30AB\u30FC\u30C9\u3067\u306E\u9000\u5BA4\u3092\u8A31\u53EF\u3057\u306A\u3044\u3001\u307E\u305F\u306F\u9000\u5BA4\u6642\u306E\u8A8D\u8A3C\u306B\u7528\u3044\u3089\u308C\u306A\u304B\u3063\u305FID\u30AB\u30FC\u30C9\u3067\u306E\u518D\u5165\u5BA4\u3092\u8A31\u53EF\u3057\u306A\u3044\u65B9\u6CD5\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30A4\u30F3\u30BF\u30FC\u30ED\u30C3\u30AF", "\u30A2\u30F3\u30C1\u30D1\u30B9\u30D0\u30C3\u30AF", "\u751F\u4F53\u8A8D\u8A3C", "\u65BD\u9320\u7BA1\u7406"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 8: "セキュアプロトコル"
    {
      id: 86,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 8,
        sub_name: "\u30BB\u30AD\u30E5\u30A2\u30D7\u30ED\u30C8\u30B3\u30EB"
      },
      question_text: "Web\u30B5\u30A4\u30C8\u306E\u901A\u4FE1\u3092\u6697\u53F7\u5316\u3059\u308B\u305F\u3081\u306B\u3001HTTP\u3068\u7D44\u307F\u5408\u308F\u305B\u3066\u5229\u7528\u3055\u308C\u308B\u30D7\u30ED\u30C8\u30B3\u30EB\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["FTP", "SMTP", "SSL/TLS", "POP3"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 87,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 8,
        sub_name: "\u30BB\u30AD\u30E5\u30A2\u30D7\u30ED\u30C8\u30B3\u30EB"
      },
      question_text: "IPsec\u304C\u63D0\u4F9B\u3059\u308B\u4E3B\u8981\u306A\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u6A5F\u80FD\u3068\u3057\u3066\u3001\u30D1\u30B1\u30C3\u30C8\u306E\u6697\u53F7\u5316\u306B\u7528\u3044\u3089\u308C\u308B\u30D7\u30ED\u30C8\u30B3\u30EB\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["AH", "ESP", "IKE", "SSH"],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 9: "認証技術"
    {
      id: 88,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 9,
        sub_name: "\u8A8D\u8A3C\u6280\u8853"
      },
      question_text: "\u96FB\u5B50\u30E1\u30FC\u30EB\u306E\u9001\u4FE1\u5143\u30C9\u30E1\u30A4\u30F3\u3092\u8A8D\u8A3C\u3057\u3001\u9001\u4FE1\u5143\u30E1\u30FC\u30EB\u30B5\u30FC\u30D0\u306EIP\u30A2\u30C9\u30EC\u30B9\u3092\u78BA\u8A8D\u3059\u308B\u3053\u3068\u3067\u8A50\u79F0\u30E1\u30FC\u30EB\u5BFE\u7B56\u3092\u884C\u3046\u6280\u8853\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["DKIM", "DMARC", "S/MIME", "SPF"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 89,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 9,
        sub_name: "\u8A8D\u8A3C\u6280\u8853"
      },
      question_text: "\u96FB\u5B50\u30E1\u30FC\u30EB\u306E\u6697\u53F7\u5316\u3068\u30C7\u30B8\u30BF\u30EB\u7F72\u540D\u3092\u884C\u3046\u305F\u3081\u306E\u6A19\u6E96\u7684\u306A\u5F62\u5F0F\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["PGP", "GnuPG", "S/MIME", "OpenSSL"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 10: "ネットワークセキュリティ"
    {
      id: 90,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 10,
        sub_name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3"
      },
      question_text: "\u30B5\u30FC\u30D0\u306E\u4EE3\u7406\u3067\u30A2\u30AF\u30BB\u30B9\u3092\u53D7\u3051\u4ED8\u3051\u3001\u5404\u30B5\u30FC\u30D0\u306B\u51E6\u7406\u3092\u5206\u6563\u3055\u305B\u308B\u3053\u3068\u3067\u8CA0\u8377\u8EFD\u6E1B\u3084\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5F37\u5316\u3092\u56F3\u308B\u6280\u8853\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D5\u30A9\u30EF\u30FC\u30C9\u30D7\u30ED\u30AD\u30B7", "\u30EA\u30D0\u30FC\u30B9\u30D7\u30ED\u30AD\u30B7", "NAT", "VPN"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 91,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 10,
        sub_name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3"
      },
      question_text: "\u4F01\u696D\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u306B\u304A\u3044\u3066\u3001\u4E0D\u6B63\u306A\u30A2\u30AF\u30BB\u30B9\u3092\u691C\u77E5\u30FB\u9632\u5FA1\u3059\u308B\u305F\u3081\u306B\u3001\u5916\u90E8\u304B\u3089\u306E\u30A2\u30AF\u30BB\u30B9\u3092\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0\u3059\u308B\u6A5F\u5668\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30EB\u30FC\u30BF", "\u30D6\u30EA\u30C3\u30B8", "\u30D5\u30A1\u30A4\u30A2\u30A6\u30A9\u30FC\u30EB", "\u30CF\u30D6"],
          correct_answer_index: 2
        }
      }
    },
    // sub_id 11: "データベースセキュリティ"
    {
      id: 92,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 11,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3"
      },
      question_text: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u683C\u7D0D\u3055\u308C\u308B\u30C7\u30FC\u30BF\u81EA\u4F53\u3092\u6697\u53F7\u5316\u3059\u308B\u5BFE\u7B56\u306E\u4E3B\u306A\u76EE\u7684\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "SQL\u30A4\u30F3\u30B8\u30A7\u30AF\u30B7\u30E7\u30F3\u653B\u6483\u3092\u9632\u3050",
            "DBMS\u304C\u683C\u7D0D\u3055\u308C\u3066\u3044\u308B\u30B9\u30C8\u30EC\u30FC\u30B8\u304C\u76D7\u96E3\u3055\u308C\u305F\u5834\u5408\u306E\u30C7\u30FC\u30BF\u4FDD\u8B77",
            "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306E\u30A2\u30AF\u30BB\u30B9\u901F\u5EA6\u3092\u5411\u4E0A\u3055\u305B\u308B",
            "\u30C7\u30FC\u30BF\u5165\u529B\u6642\u306E\u8AA4\u308A\u3092\u691C\u51FA\u3059\u308B"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 93,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 11,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3"
      },
      question_text: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306E\u30C7\u30FC\u30BF\u6D88\u5931\u3092\u9632\u3050\u305F\u3081\u306B\u5B9A\u671F\u7684\u306B\u884C\u308F\u308C\u308B\u5BFE\u7B56\u3068\u3057\u3066\u3001\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u30E1\u30C7\u30A3\u30A2\u306E\u5B89\u5168\u306A\u4FDD\u7BA1\u304C\u91CD\u8981\u306A\u7406\u7531\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u51E6\u7406\u306E\u9AD8\u901F\u5316\u306E\u305F\u3081",
            "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u30E1\u30C7\u30A3\u30A2\u304B\u3089\u60C5\u5831\u304C\u6F0F\u3048\u3044\u3059\u308B\u53EF\u80FD\u6027\u3092\u6392\u9664\u3059\u308B\u305F\u3081",
            "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306E\u5FA9\u5143\u6642\u9593\u3092\u77ED\u7E2E\u3059\u308B\u305F\u3081",
            "\u30B9\u30C8\u30EC\u30FC\u30B8\u5BB9\u91CF\u3092\u7BC0\u7D04\u3059\u308B\u305F\u3081"
          ],
          correct_answer_index: 1
        }
      }
    },
    // sub_id 12: "アプリケーションセキュリティ"
    {
      id: 94,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 12,
        sub_name: "\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u958B\u767A\u6642\u306B\u8106\u5F31\u6027\u3092\u4F5C\u308A\u8FBC\u307E\u306A\u3044\u3088\u3046\u306B\u3001\u5165\u529B\u5024\u306E\u30C1\u30A7\u30C3\u30AF\u3084\u30A8\u30E9\u30FC\u8868\u793A\u306E\u5DE5\u592B\u306A\u3069\u3092\u884C\u3046\u30D7\u30ED\u30B0\u30E9\u30DF\u30F3\u30B0\u624B\u6CD5\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30A2\u30B8\u30E3\u30A4\u30EB\u30D7\u30ED\u30B0\u30E9\u30DF\u30F3\u30B0",
            "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u6307\u5411\u30D7\u30ED\u30B0\u30E9\u30DF\u30F3\u30B0",
            "\u30BB\u30AD\u30E5\u30A2\u30D7\u30ED\u30B0\u30E9\u30DF\u30F3\u30B0",
            "\u30A4\u30D9\u30F3\u30C8\u99C6\u52D5\u578B\u30D7\u30ED\u30B0\u30E9\u30DF\u30F3\u30B0"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 95,
      category: {
        id: 4,
        name: "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56",
        sub_id: 12,
        sub_name: "\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3"
      },
      question_text: "\u30D0\u30C3\u30D5\u30A1\u30AA\u30FC\u30D0\u30FC\u30D5\u30ED\u30FC\u5BFE\u7B56\u3068\u3057\u3066\u3001\u30D0\u30C3\u30D5\u30A1\u306E\u9577\u3055\u3092\u8D85\u3048\u308B\u30C7\u30FC\u30BF\u306E\u5165\u529B\u3092\u53D7\u3051\u4ED8\u3051\u306A\u3044\u3088\u3046\u306B\u3059\u308B\u5BFE\u7B56\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30AB\u30CA\u30EA\u30A2\u30B3\u30FC\u30C9\u306E\u633F\u5165",
            "\u5165\u529B\u6587\u5B57\u5217\u9577\u306E\u30C1\u30A7\u30C3\u30AF",
            "\u30B9\u30BF\u30C3\u30AF\u4FDD\u8B77\u6A5F\u80FD\u306E\u6709\u52B9\u5316",
            "\u30A2\u30C9\u30EC\u30B9\u7A7A\u9593\u914D\u7F6E\u306E\u30E9\u30F3\u30C0\u30E0\u5316\uFF08ASLR\uFF09"
          ],
          correct_answer_index: 1
        }
      }
    },
    // id: 5, name: "法務" (Law)
    // sub: 1, name: "サイバーセキュリティ基本法" (Cybersecurity Basic Act)
    {
      id: 96,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 1,
        sub_name: "\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u57FA\u672C\u6CD5"
      },
      question_text: "\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u57FA\u672C\u6CD5\u306E\u76EE\u7684\u3068\u3057\u3066\u6700\u3082\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u4F01\u696D\u306E\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u3092\u9632\u3050\u305F\u3081\u306E\u7F70\u5247\u3092\u5B9A\u3081\u308B\u3053\u3068",
            "\u56FD\u304C\u30B5\u30A4\u30D0\u30FC\u653B\u6483\u306B\u5BFE\u3057\u3066\u53F8\u4EE4\u5854\u3068\u306A\u308B\u305F\u3081\u306E\u65BD\u7B56\u3092\u63A8\u9032\u3059\u308B\u3053\u3068",
            "\u500B\u4EBA\u60C5\u5831\u306E\u9069\u5207\u306A\u53D6\u308A\u6271\u3044\u3092\u7FA9\u52D9\u4ED8\u3051\u308B\u3053\u3068",
            "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u8106\u5F31\u6027\u60C5\u5831\u306E\u6D41\u901A\u3092\u4FC3\u9032\u3059\u308B\u3053\u3068"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 97,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 1,
        sub_name: "\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u57FA\u672C\u6CD5"
      },
      question_text: "\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u57FA\u672C\u6CD5\u306B\u57FA\u3065\u3044\u3066\u3001\u56FD\u306E\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56\u306E\u53F8\u4EE4\u5854\u3068\u3057\u3066\u8A2D\u7F6E\u3055\u308C\u305F\u7D44\u7E54\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "IPA (\u60C5\u5831\u51E6\u7406\u63A8\u9032\u6A5F\u69CB)",
            "JPCERT/CC (JPCERT\u30B3\u30FC\u30C7\u30A3\u30CD\u30FC\u30B7\u30E7\u30F3\u30BB\u30F3\u30BF\u30FC)",
            "NISC (\u5185\u95A3\u30B5\u30A4\u30D0\u30FC\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30BB\u30F3\u30BF\u30FC)",
            "JIPDEC (\u65E5\u672C\u60C5\u5831\u7D4C\u6E08\u793E\u4F1A\u63A8\u9032\u5354\u4F1A)"
          ],
          correct_answer_index: 2
        }
      }
    },
    // sub: 2, name: "不正アクセス禁止法" (Unauthorized Access Prohibition Act)
    {
      id: 98,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 2,
        sub_name: "\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u7981\u6B62\u6CD5"
      },
      question_text: "\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u7981\u6B62\u6CD5\u304C\u898F\u5236\u3059\u308B\u884C\u70BA\u3068\u3057\u3066\u3001\u6700\u3082\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u4ED6\u4EBA\u306E\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u3092\u64CD\u4F5C\u4E0D\u80FD\u306B\u3059\u308B\u30DE\u30EB\u30A6\u30A7\u30A2\u306E\u4F5C\u6210",
            "\u6B63\u898F\u306E\u6A29\u9650\u306A\u304F\u3001\u30A2\u30AF\u30BB\u30B9\u5236\u5FA1\u6A5F\u80FD\u3092\u8D85\u3048\u3066\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u306B\u4FB5\u5165\u3059\u308B\u3053\u3068",
            "\u4F01\u696D\u306E\u6A5F\u5BC6\u60C5\u5831\u3092\u76D7\u3080\u305F\u3081\u306B\u3001\u540C\u696D\u4ED6\u793E\u306E\u793E\u54E1\u3092\u30B9\u30AB\u30A6\u30C8\u3059\u308B\u3053\u3068",
            "\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u4E0A\u3067\u516C\u958B\u3055\u308C\u3066\u3044\u308B\u8106\u5F31\u6027\u60C5\u5831\u3092\u95B2\u89A7\u3059\u308B\u3053\u3068"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 99,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 2,
        sub_name: "\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u7981\u6B62\u6CD5"
      },
      question_text: "\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u7981\u6B62\u6CD5\u306B\u304A\u3044\u3066\u3001\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u884C\u70BA\u3092\u300E\u52A9\u9577\u3059\u308B\u884C\u70BA\u300F\u3068\u3057\u3066\u898F\u5236\u3055\u308C\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u3092\u884C\u3046\u76EE\u7684\u3067\u3001\u4ED6\u4EBA\u306E\u5229\u7528\u8005ID\u3068\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u4E0D\u6B63\u306B\u5165\u624B\u3059\u308B\u3053\u3068",
            "\u696D\u52D9\u4E0A\u6B63\u5F53\u306A\u7406\u7531\u306A\u304F\u3001\u4ED6\u4EBA\u306E\u5229\u7528\u8005ID\u3068\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u6B63\u898F\u306E\u5229\u7528\u8005\u4EE5\u5916\u306B\u63D0\u4F9B\u3059\u308B\u3053\u3068",
            "\u30D5\u30A3\u30C3\u30B7\u30F3\u30B0\u30B5\u30A4\u30C8\u3092\u958B\u8A2D\u3057\u3001\u5229\u7528\u8005\u306B\u8B58\u5225\u7B26\u53F7\u306E\u5165\u529B\u3092\u4E0D\u6B63\u306B\u8981\u6C42\u3059\u308B\u3053\u3068",
            "\u4E0D\u6B63\u306B\u5165\u624B\u3057\u305F\u4ED6\u4EBA\u306E\u5229\u7528\u8005ID\u3068\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u3001\u81EA\u5DF1\u306EPC\u306B\u4FDD\u7BA1\u3059\u308B\u3053\u3068"
          ],
          correct_answer_index: 1
        }
      }
    },
    // sub: 3, name: "個人情報保護法" (Personal Information Protection Act)
    {
      id: 100,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 3,
        sub_name: "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u6CD5"
      },
      question_text: "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u6CD5\u306B\u304A\u3051\u308B\u300E\u500B\u4EBA\u60C5\u5831\u300F\u306E\u5B9A\u7FA9\u3068\u3057\u3066\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u4F01\u696D\u304C\u7BA1\u7406\u3057\u3066\u3044\u308B\u9867\u5BA2\u306B\u95A2\u3059\u308B\u60C5\u5831\u306B\u9650\u5B9A\u3055\u308C\u308B\u3002",
            "\u500B\u4EBA\u304C\u79D8\u5BC6\u306B\u3057\u3066\u3044\u308B\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u306B\u95A2\u3059\u308B\u60C5\u5831\u306B\u9650\u5B9A\u3055\u308C\u308B\u3002",
            "\u751F\u5B58\u3057\u3066\u3044\u308B\u500B\u4EBA\u306B\u95A2\u3059\u308B\u60C5\u5831\u3067\u3042\u3063\u3066\u3001\u7279\u5B9A\u306E\u500B\u4EBA\u3092\u8B58\u5225\u3067\u304D\u308B\u3082\u306E\u3002",
            "\u65E5\u672C\u56FD\u7C4D\u3092\u6709\u3059\u308B\u500B\u4EBA\u306B\u95A2\u3059\u308B\u60C5\u5831\u306B\u9650\u5B9A\u3055\u308C\u308B\u3002"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 101,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 3,
        sub_name: "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u6CD5"
      },
      question_text: "\u500B\u4EBA\u60C5\u5831\u53D6\u6271\u4E8B\u696D\u8005\u304C\u500B\u4EBA\u60C5\u5831\u3092\u7B2C\u4E09\u8005\u63D0\u4F9B\u3059\u308B\u969B\u306E\u539F\u5247\u7684\u306A\u65B9\u5F0F\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30AA\u30D7\u30C8\u30A4\u30F3\u65B9\u5F0F\uFF08\u672C\u4EBA\u306E\u540C\u610F\u304C\u5FC5\u8981\uFF09",
            "\u30AA\u30D7\u30C8\u30A2\u30A6\u30C8\u65B9\u5F0F\uFF08\u672C\u4EBA\u304C\u62D2\u5426\u3092\u901A\u77E5\u3057\u306A\u3044\u9650\u308A\u63D0\u4F9B\u53EF\u80FD\uFF09",
            "\u4EFB\u610F\u63D0\u4F9B\u65B9\u5F0F\uFF08\u4E8B\u696D\u8005\u306E\u5224\u65AD\u3067\u63D0\u4F9B\u53EF\u80FD\uFF09",
            "\u9650\u5B9A\u63D0\u4F9B\u65B9\u5F0F\uFF08\u7279\u5B9A\u306E\u6761\u4EF6\u3067\u63D0\u4F9B\u53EF\u80FD\uFF09"
          ],
          correct_answer_index: 0
        }
      }
    },
    {
      id: 102,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 3,
        sub_name: "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u6CD5"
      },
      question_text: "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u6CD5\u306B\u304A\u3051\u308B\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u5BFE\u7B56\u306E\u4E09\u3064\u306E\u67F1\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30D5\u30EC\u30FC\u30E0\u30EF\u30FC\u30AF", right: "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u5BFE\u7B56\u3092\u691C\u8A0E\u3059\u308B\u524D\u63D0\u3068\u306A\u308B\u6CD5\u5F8B\u3084\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u3001\u6307\u4EE4" },
          { id: 2, left: "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u5F71\u97FF\u8A55\u4FA1\uFF08PIA\uFF09", right: "\u7D44\u7E54\u3067\u306E\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u304C\u3069\u306E\u3088\u3046\u306B\u904B\u7528\u3055\u308C\u3066\u3044\u308B\u304B\u3001\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u8981\u4EF6\u3092\u6E80\u305F\u3057\u3066\u3044\u308B\u304B\u3092\u652F\u63F4\u3059\u308B\u30B7\u30B9\u30C6\u30E0" },
          { id: 3, left: "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30A2\u30FC\u30AD\u30C6\u30AF\u30C1\u30E3", right: "\u6280\u8853\u9762\u304B\u3089\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u5F37\u5316\u7B56" }
        ]
      }
    },
    // sub: 4, name: "刑法" (Penal Code)
    {
      id: 103,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 4,
        sub_name: "\u5211\u6CD5"
      },
      question_text: "\u5211\u6CD5\u306B\u304A\u3044\u3066\u3001\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u30B7\u30B9\u30C6\u30E0\u306B\u865A\u507D\u306E\u60C5\u5831\u3092\u4E0E\u3048\u3001\u4E0D\u6B63\u306A\u632F\u8FBC\u3084\u9001\u91D1\u3092\u3055\u305B\u308B\u884C\u70BA\u306B\u9069\u7528\u3055\u308C\u308B\u7F6A\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u96FB\u5B50\u8A08\u7B97\u6A5F\u640D\u58CA\u7B49\u696D\u52D9\u59A8\u5BB3\u7F6A",
            "\u4E0D\u6B63\u6307\u4EE4\u96FB\u78C1\u7684\u8A18\u9332\u306B\u95A2\u3059\u308B\u7F6A\uFF08\u30A6\u30A4\u30EB\u30B9\u4F5C\u6210\u7F6A\uFF09",
            "\u96FB\u5B50\u8A08\u7B97\u6A5F\u4F7F\u7528\u8A50\u6B3A\u7F6A",
            "\u96FB\u78C1\u7684\u8A18\u9332\u4E0D\u6B63\u4F5C\u51FA\u53CA\u3073\u4F9B\u7528\u7F6A"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 104,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 4,
        sub_name: "\u5211\u6CD5"
      },
      question_text: "2011\u5E74\u306B\u5211\u6CD5\u306B\u8FFD\u52A0\u3055\u308C\u305F\u300E\u4E0D\u6B63\u6307\u4EE4\u96FB\u78C1\u7684\u8A18\u9332\u306B\u95A2\u3059\u308B\u7F6A\uFF08\u30A6\u30A4\u30EB\u30B9\u4F5C\u6210\u7F6A\uFF09\u300F\u306E\u4E3B\u306A\u76EE\u7684\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u30A6\u30A4\u30EB\u30B9\u306B\u611F\u67D3\u3057\u305F\u969B\u306E\u88AB\u5BB3\u56DE\u5FA9\u3092\u4FC3\u9032\u3059\u308B\u3053\u3068",
            "\u30DE\u30EB\u30A6\u30A7\u30A2\u306A\u3069\u3001\u4E0D\u6B63\u306A\u6307\u793A\u3092\u4E0E\u3048\u308B\u96FB\u78C1\u7684\u8A18\u9332\u306E\u4F5C\u6210\u30FB\u63D0\u4F9B\u884C\u70BA\u3092\u51E6\u7F70\u3059\u308B\u3053\u3068",
            "\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u95A2\u9023\u8A50\u6B3A\u306E\u635C\u67FB\u3092\u5F37\u5316\u3059\u308B\u3053\u3068",
            "\u30B5\u30A4\u30D0\u30FC\u653B\u6483\u306B\u3088\u308B\u56FD\u5BB6\u306E\u6A5F\u5BC6\u60C5\u5831\u6F0F\u3048\u3044\u3092\u9632\u3050\u3053\u3068"
          ],
          correct_answer_index: 1
        }
      }
    },
    // sub: 5, name: "その他のセキュリティ関連法規・基準" (Other Security-Related Laws/Standards)
    {
      id: 105,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 5,
        sub_name: "\u305D\u306E\u4ED6\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u95A2\u9023\u6CD5\u898F\u30FB\u57FA\u6E96"
      },
      question_text: "\u5E83\u544A\u306A\u3069\u306E\u8FF7\u60D1\u30E1\u30FC\u30EB\u3092\u898F\u5236\u3057\u3001\u539F\u5247\u3068\u3057\u3066\u300E\u30AA\u30D7\u30C8\u30A4\u30F3\u65B9\u5F0F\u300F\u3092\u63A1\u7528\u3057\u3066\u3044\u308B\u6CD5\u5F8B\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u6CD5",
            "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5",
            "\u7279\u5B9A\u96FB\u5B50\u30E1\u30FC\u30EB\u6CD5",
            "\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u7981\u6B62\u6CD5"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 106,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 5,
        sub_name: "\u305D\u306E\u4ED6\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u95A2\u9023\u6CD5\u898F\u30FB\u57FA\u6E96"
      },
      question_text: "\u7D4C\u6E08\u7523\u696D\u7701\u306A\u3069\u304C\u516C\u958B\u3057\u3066\u3044\u308B\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306B\u95A2\u3059\u308B\u57FA\u6E96\u3068\u3057\u3066\u3001\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u30A6\u30A4\u30EB\u30B9\u306B\u5BFE\u3059\u308B\u4E88\u9632\u3001\u767A\u898B\u3001\u99C6\u9664\u3001\u5FA9\u65E7\u306E\u305F\u3081\u306E\u5BFE\u7B56\u3092\u307E\u3068\u3081\u305F\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u5BFE\u7B56\u57FA\u6E96",
            "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u7B49\u8106\u5F31\u6027\u95A2\u9023\u60C5\u5831\u53D6\u6271\u57FA\u6E96",
            "\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u30A6\u30A4\u30EB\u30B9\u5BFE\u7B56\u57FA\u6E96",
            "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u76E3\u67FB\u57FA\u6E96"
          ],
          correct_answer_index: 2
        }
      }
    },
    // sub: 6, name: "知的財産権" (Intellectual Property Rights)
    {
      id: 107,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 6,
        sub_name: "\u77E5\u7684\u8CA1\u7523\u6A29"
      },
      question_text: "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u30D7\u30ED\u30B0\u30E9\u30E0\u3084\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u304C\u4FDD\u8B77\u306E\u5BFE\u8C61\u3068\u306A\u308B\u304C\u3001\u30A2\u30EB\u30B4\u30EA\u30BA\u30E0\u3084\u30A2\u30A4\u30C7\u30A2\u305D\u306E\u3082\u306E\u306F\u5BFE\u8C61\u3068\u306A\u3089\u306A\u3044\u6A29\u5229\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u7279\u8A31\u6A29",
            "\u5B9F\u7528\u65B0\u6848\u6A29",
            "\u8457\u4F5C\u6A29",
            "\u5546\u6A19\u6A29"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 108,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 6,
        sub_name: "\u77E5\u7684\u8CA1\u7523\u6A29"
      },
      question_text: "\u4E0D\u6B63\u7AF6\u4E89\u9632\u6B62\u6CD5\u306B\u304A\u3044\u3066\u300E\u55B6\u696D\u79D8\u5BC6\u300F\u3068\u8A8D\u3081\u3089\u308C\u308B\u305F\u3081\u306E\u4E09\u3064\u306E\u8981\u4EF6\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u79D8\u5BC6\u7BA1\u7406\u6027", right: "\u79D8\u5BC6\u3068\u3057\u3066\u7BA1\u7406\u3055\u308C\u3066\u3044\u308B\u3053\u3068" },
          { id: 2, left: "\u6709\u7528\u6027", right: "\u6709\u7528\u3067\u3042\u308B\u3053\u3068" },
          { id: 3, left: "\u975E\u516C\u77E5\u6027", right: "\u516C\u7136\u3068\u77E5\u3089\u308C\u3066\u3044\u306A\u3044\u3053\u3068" }
        ]
      }
    },
    {
      id: 109,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 6,
        sub_name: "\u77E5\u7684\u8CA1\u7523\u6A29"
      },
      question_text: "\u65E5\u672C\u306B\u304A\u3051\u308B\u8457\u4F5C\u6A29\u306E\u4FDD\u8B77\u671F\u9593\u306F\u3001\u8457\u4F5C\u8005\u306E\u6B7B\u5F8C\uFF08\u307E\u305F\u306F\u516C\u8868\u5F8C\uFF09\u4F55\u5E74\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "30\u5E74",
            "50\u5E74",
            "70\u5E74",
            "100\u5E74"
          ],
          correct_answer_index: 2
        }
      }
    },
    // sub: 7, name: "労働関連・取引関連法規" (Labor/Transaction Related Laws)
    {
      id: 110,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 7,
        sub_name: "\u52B4\u50CD\u95A2\u9023\u30FB\u53D6\u5F15\u95A2\u9023\u6CD5\u898F"
      },
      question_text: "\u7279\u5B9A\u306E\u4ED5\u4E8B\u3092\u5B8C\u6210\u3055\u305B\u308B\u3053\u3068\u3092\u7D04\u675F\u3059\u308B\u5951\u7D04\u5F62\u614B\u3067\u3001\u4ED5\u4E8B\u306E\u5B8C\u6210\u306B\u5BFE\u3057\u3066\u8CAC\u4EFB\u3092\u8CA0\u3044\u3001\u52B4\u50CD\u8005\u3078\u306E\u6307\u63EE\u547D\u4EE4\u306F\u8ACB\u3051\u8CA0\u3063\u305F\u4F01\u696D\u304C\u884C\u3046\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u59D4\u4EFB\u5951\u7D04",
            "\u6E96\u59D4\u4EFB\u5951\u7D04",
            "\u8ACB\u8CA0\u5951\u7D04",
            "\u6D3E\u9063\u5951\u7D04"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 111,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 7,
        sub_name: "\u52B4\u50CD\u95A2\u9023\u30FB\u53D6\u5F15\u95A2\u9023\u6CD5\u898F"
      },
      question_text: "\u4E0B\u8ACB\u4E8B\u696D\u8005\u306E\u5229\u76CA\u3092\u4FDD\u8B77\u3057\u3001\u4E0B\u8ACB\u53D6\u5F15\u306E\u516C\u6B63\u5316\u3092\u56F3\u308B\u305F\u3081\u306E\u6CD5\u5F8B\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u52B4\u50CD\u57FA\u6E96\u6CD5",
            "\u52B4\u50CD\u8005\u6D3E\u9063\u6CD5",
            "\u4E0B\u8ACB\u6CD5",
            "\u6C11\u6CD5"
          ],
          correct_answer_index: 2
        }
      }
    },
    // sub: 8, name: "その他の法律・ガイドライン・技術者倫理" (Other Laws/Guidelines/Engineer Ethics)
    {
      id: 112,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 8,
        sub_name: "\u305D\u306E\u4ED6\u306E\u6CD5\u5F8B\u30FB\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u30FB\u6280\u8853\u8005\u502B\u7406"
      },
      question_text: "IT\u3092\u5229\u7528\u3059\u308B\u969B\u306E\u884C\u52D5\u898F\u7BC4\u3084\u3001\u60C5\u5831\u793E\u4F1A\u306B\u304A\u3051\u308B\u500B\u4EBA\u3084\u7D44\u7E54\u306E\u3042\u308B\u3079\u304D\u59FF\u3092\u793A\u3059\u6982\u5FF5\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DD\u30EA\u30B7\u30FC",
            "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC",
            "\u30B3\u30F3\u30D7\u30E9\u30A4\u30A2\u30F3\u30B9",
            "\u60C5\u5831\u502B\u7406"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 113,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 8,
        sub_name: "\u305D\u306E\u4ED6\u306E\u6CD5\u5F8B\u30FB\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u30FB\u6280\u8853\u8005\u502B\u7406"
      },
      question_text: "\u56FD\u7A0E\u95A2\u4FC2\u306E\u5E33\u7C3F\u66F8\u985E\u3092\u96FB\u5B50\u30C7\u30FC\u30BF\u3067\u4FDD\u5B58\u3059\u308B\u3053\u3068\u3092\u8A8D\u3081\u308B\u6CD5\u5F8B\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "e-\u6587\u66F8\u6CD5",
            "\u96FB\u5B50\u5E33\u7C3F\u4FDD\u5B58\u6CD5",
            "\u7279\u5B9A\u96FB\u5B50\u30E1\u30FC\u30EB\u6CD5",
            "\u5546\u696D\u5E33\u7C3F\u898F\u5247"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 114,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 8,
        sub_name: "\u305D\u306E\u4ED6\u306E\u6CD5\u5F8B\u30FB\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u30FB\u6280\u8853\u8005\u502B\u7406"
      },
      question_text: "\u96FB\u5B50\u7F72\u540D\u6CD5\u306B\u304A\u3044\u3066\u3001\u96FB\u5B50\u7F72\u540D\u306B\u8A8D\u3081\u3089\u308C\u3066\u3044\u308B\u52B9\u529B\u3068\u3057\u3066\u6700\u3082\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u96FB\u78C1\u7684\u8A18\u9332\u4EE5\u5916\u306E\u66F8\u9762\u3067\u306E\u7F72\u540D\u3068\u540C\u7B49\u306E\u52B9\u529B",
            "\u6C11\u4E8B\u8A34\u8A1F\u6CD5\u306B\u304A\u3051\u308B\u62BC\u5370\u3068\u540C\u69D8\u306E\u52B9\u529B",
            "\u96FB\u5B50\u5951\u7D04\u306B\u304A\u3051\u308B\u5408\u610F\u5F62\u6210\u306E\u6CD5\u7684\u5F37\u5236\u529B",
            "\u516C\u7684\u306A\u8A8D\u8A3C\u5C40\u306B\u3088\u308B\u767A\u884C\u304C\u5FC5\u9808\u3067\u3042\u308B\u3068\u3044\u3046\u52B9\u529B"
          ],
          correct_answer_index: 1
        }
      }
    },
    // sub: 9, name: "標準化関連" (Standardization Related)
    {
      id: 115,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 9,
        sub_name: "\u6A19\u6E96\u5316\u95A2\u9023"
      },
      question_text: "\u6A19\u6E96\u5316\u56E3\u4F53\u306B\u3088\u3063\u3066\u6B63\u5F0F\u306B\u5B9A\u3081\u3089\u308C\u305F\u6A19\u6E96\u898F\u683C\u3068\u3001\u516C\u5F0F\u306B\u306F\u6A19\u6E96\u5316\u3055\u308C\u3066\u3044\u306A\u3044\u304C\u4E8B\u5B9F\u4E0A\u5E83\u304F\u4F7F\u308F\u308C\u3066\u3044\u308B\u6A19\u6E96\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u30C7\u30B8\u30E5\u30EC\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9", right: "\u6A19\u6E96\u5316\u56E3\u4F53\u306B\u3088\u3063\u3066\u5B9A\u3081\u3089\u308C\u305F\u516C\u5F0F\u6A19\u6E96\u898F\u683C" },
          { id: 2, left: "\u30C7\u30D5\u30A1\u30AF\u30C8\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9", right: "\u516C\u7684\u306B\u6A19\u6E96\u5316\u3055\u308C\u3066\u3044\u306A\u3044\u304C\u4E8B\u5B9F\u4E0A\u306E\u898F\u683C\u30FB\u57FA\u6E96" }
        ]
      }
    },
    {
      id: 116,
      category: {
        id: 5,
        name: "\u6CD5\u52D9",
        sub_id: 9,
        sub_name: "\u6A19\u6E96\u5316\u95A2\u9023"
      },
      question_text: "\u65E5\u672C\u306E\u7523\u696D\u6A19\u6E96\u3092\u5B9A\u3081\u308B\u56FD\u306E\u6A19\u6E96\u5316\u56E3\u4F53\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "ISO (\u56FD\u969B\u6A19\u6E96\u5316\u6A5F\u69CB)",
            "JIS (\u65E5\u672C\u7523\u696D\u898F\u683C)",
            "ANSI (\u7C73\u56FD\u56FD\u5BB6\u898F\u683C\u5354\u4F1A)",
            "IEC (\u56FD\u969B\u96FB\u6C17\u6A19\u6E96\u4F1A\u8B70)"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 117,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 1,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB\u306E\u4E3B\u306A\u76EE\u7684\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u4F01\u696D\u306E\u4F1A\u8A08\u5E33\u7C3F\u304C\u6CD5\u4EE4\u306B\u6E96\u62E0\u3057\u3066\u3044\u308B\u304B\u3092\u78BA\u8A8D\u3059\u308B\u3053\u3068",
            "\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u304C\u9069\u6B63\u306B\u904B\u7528\u30FB\u6D3B\u7528\u3055\u308C\u3066\u3044\u308B\u304B\u3092\u8A55\u4FA1\u3059\u308B\u3053\u3068",
            "\u5F93\u696D\u54E1\u306E\u52B4\u50CD\u6642\u9593\u304C\u9069\u5207\u306B\u7BA1\u7406\u3055\u308C\u3066\u3044\u308B\u304B\u3092\u691C\u8A3C\u3059\u308B\u3053\u3068",
            "\u88FD\u54C1\u306E\u54C1\u8CEA\u304C\u9867\u5BA2\u306E\u8981\u6C42\u3092\u6E80\u305F\u3057\u3066\u3044\u308B\u304B\u3092\u78BA\u8A8D\u3059\u308B\u3053\u3068"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 118,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 1,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB\u306E\u6280\u6CD5\u3068\u305D\u306E\u8AAC\u660E\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          {
            id: 1,
            left: "ITF\uFF08Integrated Test Facility\uFF09\u6CD5",
            right: "\u7A3C\u50CD\u4E2D\u306E\u30B7\u30B9\u30C6\u30E0\u306B\u30C6\u30B9\u30C8\u7528\u306E\u67B6\u7A7A\u53E3\u5EA7\u3092\u8A2D\u7F6E\u3057\u3001\u30B7\u30B9\u30C6\u30E0\u306E\u52D5\u4F5C\u3092\u691C\u8A3C\u3059\u308B\u3002"
          },
          {
            id: 2,
            left: "\u30C7\u30B8\u30BF\u30EB\u30D5\u30A9\u30EC\u30F3\u30B8\u30C3\u30AF\u30B9",
            right: "\u8A3C\u62E0\u3092\u53CE\u96C6\u3057\u4FDD\u5168\u3059\u308B\u6280\u6CD5\u3067\u3001\u64CD\u4F5C\u8A18\u9332\u306A\u3069\u306E\u30ED\u30B0\u3092\u6539\u3056\u3093\u3055\u308C\u306A\u3044\u3088\u3046\u306B\u4FDD\u8B77\u3059\u308B\u3002"
          },
          {
            id: 3,
            left: "\u30DA\u30CD\u30C8\u30EC\u30FC\u30B7\u30E7\u30F3\u30C6\u30B9\u30C8\u6CD5",
            right: "\u5BFE\u8C61\u306E\u30B7\u30B9\u30C6\u30E0\u306B\u5C02\u9580\u5BB6\u306B\u3088\u3063\u3066\u653B\u6483\u3092\u884C\u3044\u3001\u8106\u5F31\u6027\u304C\u306A\u3044\u304B\u3092\u78BA\u8A8D\u3059\u308B\u3002"
          }
        ]
      }
    },
    {
      id: 119,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 1,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB\u57FA\u6E96\u306F\u3001\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB\u4EBA\u306E\u305F\u3081\u306E\u4F55\u3068\u3057\u3066\u69CB\u6210\u3055\u308C\u3066\u3044\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u6CD5\u5F8B",
            "\u884C\u52D5\u898F\u7BC4",
            "\u904B\u7528\u30DE\u30CB\u30E5\u30A2\u30EB",
            "\u6280\u8853\u6A19\u6E96"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 120,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 1,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB\u306B\u304A\u3044\u3066\u3001\u4FE1\u983C\u6027\u3001\u5B89\u5168\u6027\u3001\u52B9\u7387\u6027\u3001\u6B63\u78BA\u6027\u3001\u7DB2\u7F85\u6027\u3092\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u3059\u308B\u305F\u3081\u306B\u3001\u76E3\u67FB\u8A3C\u8DE1\u306F\u3069\u306E\u3088\u3046\u306A\u7279\u6027\u3092\u6301\u3064\u3079\u304D\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u4E3B\u89B3\u7684\u3067\u3042\u308B\u3053\u3068",
            "\u90E8\u5206\u7684\u3067\u3042\u308B\u3053\u3068",
            "\u5BA2\u89B3\u7684\u3067\u3001\u88CF\u4ED8\u3051\u304C\u3042\u308B\u3053\u3068",
            "\u63A8\u6E2C\u306B\u57FA\u3065\u3044\u3066\u3044\u308B\u3053\u3068"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 121,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 1,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB\u4EBA\u304C\u76E3\u67FB\u5831\u544A\u66F8\u306E\u539F\u6848\u306B\u3064\u3044\u3066\u88AB\u76E3\u67FB\u90E8\u9580\u3068\u610F\u898B\u4EA4\u63DB\u3092\u884C\u3046\u6700\u3082\u9069\u5207\u306A\u76EE\u7684\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u76E3\u67FB\u4F9D\u983C\u8005\u306B\u76E3\u67FB\u5831\u544A\u66F8\u3092\u63D0\u51FA\u3059\u308B\u524D\u306B\u3001\u88AB\u76E3\u67FB\u90E8\u9580\u306B\u76E3\u67FB\u5831\u544A\u3092\u884C\u3046\u305F\u3081",
            "\u76E3\u67FB\u5831\u544A\u66F8\u306B\u8A18\u8F09\u3059\u308B\u6539\u5584\u52E7\u544A\u306B\u3064\u3044\u3066\u3001\u88AB\u76E3\u67FB\u90E8\u9580\u306E\u8CAC\u4EFB\u8005\u306E\u627F\u8A8D\u3092\u5F97\u308B\u305F\u3081",
            "\u76E3\u67FB\u5831\u544A\u66F8\u306B\u8A18\u8F09\u3059\u308B\u6307\u6458\u4E8B\u9805\u53CA\u3073\u6539\u5584\u52E7\u544A\u306B\u3064\u3044\u3066\u3001\u4E8B\u5B9F\u8AA4\u8A8D\u304C\u306A\u3044\u3053\u3068\u3092\u78BA\u8A8D\u3059\u308B\u305F\u3081",
            "\u76E3\u67FB\u5831\u544A\u66F8\u306E\u8A18\u8F09\u5185\u5BB9\u306B\u95A2\u3057\u3066\u8ABF\u67FB\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u308B\u4E8B\u9805\u3092\u88AB\u76E3\u67FB\u90E8\u9580\u306B\u53E3\u982D\u3067\u6307\u793A\u3059\u308B\u305F\u3081"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 122,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 2,
        sub_name: "\u5185\u90E8\u7D71\u5236"
      },
      question_text: "\u300C\u5185\u90E8\u7D71\u5236\u300D\u3068\u306F\u3001\u4F01\u696D\u306A\u3069\u304C\u81EA\u3089\u69CB\u7BC9\u3057\u904B\u7528\u3059\u308B\u5065\u5168\u304B\u3064\u52B9\u7387\u7684\u306A\u7D44\u7E54\u904B\u55B6\u306E\u305F\u3081\u306E\u4F53\u5236\u3092\u6307\u3057\u307E\u3059\u3002\u3053\u306E\u5185\u90E8\u7D71\u5236\u306B\u304A\u3044\u3066\u3001\u7D4C\u55B6\u8005\u304C\u6700\u7D42\u7684\u306A\u8CAC\u4EFB\u3092\u8CA0\u3046\u306E\u306F\u306A\u305C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u682A\u4E3B\u304C\u65E5\u3005\u306E\u904B\u7528\u306B\u8CAC\u4EFB\u3092\u6301\u3064\u304B\u3089",
            "\u76E3\u67FB\u5F79\u304C\u7D4C\u55B6\u306E\u9069\u6B63\u6027\u3092\u8A55\u4FA1\u3059\u308B\u304B\u3089",
            "\u696D\u52D9\u62C5\u5F53\u8005\u304C\u5177\u4F53\u7684\u306A\u696D\u52D9\u3092\u9042\u884C\u3059\u308B\u8CAC\u4EFB\u3092\u6301\u3064\u304B\u3089",
            "\u7D4C\u55B6\u8005\u304C\u4F01\u696D\u306E\u696D\u52D9\u65B9\u91DD\u3092\u5B9A\u3081\u3001\u5185\u90E8\u7D71\u5236\u30B7\u30B9\u30C6\u30E0\u3092\u69CB\u7BC9\u3059\u308B\u7ACB\u5834\u306B\u3042\u308B\u304B\u3089"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 123,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 2,
        sub_name: "\u5185\u90E8\u7D71\u5236"
      },
      question_text: "\u5185\u90E8\u7D71\u5236\u306E\u57FA\u672C\u7684\u8981\u7D20\u306E\u4E00\u3064\u3067\u3042\u308B\u300C\u7D71\u5236\u6D3B\u52D5\u300D\u306B\u8A72\u5F53\u3059\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u7D4C\u55B6\u76EE\u7684\u3092\u9054\u6210\u3059\u308B\u305F\u3081\u306E\u7D4C\u55B6\u65B9\u91DD\u53CA\u3073\u7D4C\u55B6\u6226\u7565\u306E\u7B56\u5B9A",
            "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u306B\u95A2\u3059\u308B\u8105\u5A01\u3068\u8106\u5F31\u6027\u306E\u5206\u6790",
            "\u53D7\u6CE8\u304B\u3089\u51FA\u8377\u306B\u81F3\u308B\u696D\u52D9\u30D7\u30ED\u30BB\u30B9\u306B\u7D44\u307F\u8FBC\u307E\u308C\u305F\u51E6\u7406\u7D50\u679C\u306E\u691C\u8A3C",
            "\u5B9A\u671F\u7684\u306B\u8A08\u753B\u3057\u3066\u5B9F\u65BD\u3059\u308B\u5185\u90E8\u696D\u52D9\u76E3\u67FB"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 124,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 3,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8"
      },
      question_text: "ITIL\xAE\u3067\u306F\u3001\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u3092\u3069\u306E\u3088\u3046\u306B\u5B9A\u7FA9\u3057\u3066\u3044\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B7\u30B9\u30C6\u30E0\u3092\u5C0E\u5165\u30FB\u69CB\u7BC9\u3059\u308B\u305F\u3081\u306E\u6280\u8853\u7684\u306A\u5C02\u9580\u80FD\u529B\u306E\u96C6\u307E\u308A",
            "\u9867\u5BA2\u306B\u5BFE\u3057\u3001\u30B5\u30FC\u30D3\u30B9\u306E\u5F62\u3067\u4FA1\u5024\u3092\u63D0\u4F9B\u3059\u308B\u7D44\u7E54\u306E\u5C02\u9580\u80FD\u529B\u306E\u96C6\u307E\u308A",
            "IT\u8CC7\u7523\u3092\u52B9\u7387\u7684\u306B\u7BA1\u7406\u3059\u308B\u305F\u3081\u306E\u6280\u8853\u7684\u30FB\u7D44\u7E54\u7684\u306A\u624B\u6CD5\u306E\u7DCF\u79F0",
            "\u30B5\u30FC\u30D3\u30B9\u969C\u5BB3\u3092\u8FC5\u901F\u306B\u5FA9\u65E7\u3059\u308B\u305F\u3081\u306E\u624B\u9806\u306E\u4F53\u7CFB"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 125,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 3,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8"
      },
      question_text: "\u30B5\u30FC\u30D3\u30B9\u63D0\u4F9B\u8005\u3068\u59D4\u8A17\u8005\u3068\u306E\u9593\u3067\u3001\u63D0\u4F9B\u3059\u308B\u30B5\u30FC\u30D3\u30B9\u306E\u5185\u5BB9\u3068\u7BC4\u56F2\u3001\u54C1\u8CEA\u306B\u5BFE\u3059\u308B\u8981\u6C42\u4E8B\u9805\u3092\u660E\u78BA\u306B\u3057\u3001\u9054\u6210\u3067\u304D\u306A\u304B\u3063\u305F\u5834\u5408\u306E\u30EB\u30FC\u30EB\u3082\u542B\u3081\u3066\u5408\u610F\u3057\u3066\u304A\u304F\u3053\u3068\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "OLA (Operational Level Agreement)",
            "SLA (Service Level Agreement)",
            "KPI (Key Performance Indicator)",
            "BCP (Business Continuity Plan)"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 126,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 3,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8"
      },
      question_text: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306B\u304A\u3044\u3066\u3001\u30B5\u30FC\u30D3\u30B9\u3084\u88FD\u54C1\u3092\u69CB\u6210\u3059\u308B\u3059\u3079\u3066\u306E\u69CB\u6210\u54C1\u76EE\uFF08CI\uFF09\u3092\u8B58\u5225\u3057\u3001\u7DAD\u6301\u7BA1\u7406\u3059\u308B\u6D3B\u52D5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u8CC7\u7523\u7BA1\u7406",
            "\u30B5\u30FC\u30D3\u30B9\u30AB\u30BF\u30ED\u30B0\u7BA1\u7406",
            "\u69CB\u6210\u7BA1\u7406",
            "\u9700\u8981\u7BA1\u7406"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 127,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 4,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306E\u8A08\u753B\u53CA\u3073\u904B\u7528"
      },
      question_text: "IT\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u306B\u304A\u3051\u308B\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u7BA1\u7406\u306E\u6700\u3082\u9069\u5207\u306A\u76EE\u7684\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u306E\u539F\u56E0\u3092\u5206\u6790\u3057\u3001\u6839\u672C\u7684\u306A\u539F\u56E0\u3092\u89E3\u6C7A\u3059\u308B\u3053\u3068\u306B\u3088\u3063\u3066\u3001\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u306E\u518D\u767A\u3092\u9632\u6B62\u3059\u308B\u3002",
            "\u30B5\u30FC\u30D3\u30B9\u306B\u5BFE\u3059\u308B\u5168\u3066\u306E\u5909\u66F4\u3092\u4E00\u5143\u7684\u306B\u7BA1\u7406\u3059\u308B\u3053\u3068\u306B\u3088\u3063\u3066\u3001\u5909\u66F4\u306B\u4F34\u3046\u969C\u5BB3\u767A\u751F\u306A\u3069\u306E\u30EA\u30B9\u30AF\u3092\u4F4E\u6E1B\u3059\u308B\u3002",
            "\u30B5\u30FC\u30D3\u30B9\u3092\u69CB\u6210\u3059\u308B\u5168\u3066\u306E\u6A5F\u5668\u3084\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306B\u95A2\u3059\u308B\u60C5\u5831\u3092\u6700\u65B0\u3001\u6B63\u78BA\u306B\u7DAD\u6301\u7BA1\u7406\u3059\u308B\u3002",
            "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u306B\u3088\u3063\u3066\u4E2D\u65AD\u3057\u3066\u3044\u308B\u30B5\u30FC\u30D3\u30B9\u3092\u53EF\u80FD\u306A\u9650\u308A\u8FC5\u901F\u306B\u56DE\u5FA9\u3059\u308B\u3002"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 128,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 4,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306E\u8A08\u753B\u53CA\u3073\u904B\u7528"
      },
      question_text: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306B\u304A\u3051\u308B\u554F\u984C\u7BA1\u7406\u306E\u6D3B\u52D5\u3068\u3057\u3066\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u540C\u3058\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u304C\u767A\u751F\u3057\u306A\u3044\u3088\u3046\u306B\u3001\u554F\u984C\u306F\u6839\u672C\u539F\u56E0\u3092\u7279\u5B9A\u3057\u3066\u5FC5\u305A\u6052\u4E45\u7684\u306B\u89E3\u6C7A\u3059\u308B\u3002",
            "\u540C\u3058\u554F\u984C\u304C\u91CD\u8907\u3057\u3066\u7BA1\u7406\u3055\u308C\u306A\u3044\u3088\u3046\u306B\u3001\u65E2\u77E5\u306E\u8AA4\u308A\u306F\u8A18\u9332\u3057\u306A\u3044\u3002",
            "\u554F\u984C\u7BA1\u7406\u306E\u8CA0\u8377\u3092\u4F4E\u6E1B\u3059\u308B\u305F\u3081\u306B\u3001\u89E3\u6C7A\u3057\u305F\u554F\u984C\u306F\u76F4\u3061\u306B\u554F\u984C\u7BA1\u7406\u306E\u5BFE\u8C61\u304B\u3089\u9664\u5916\u3059\u308B\u3002",
            "\u554F\u984C\u3092\u7279\u5B9A\u3059\u308B\u305F\u3081\u306B\u3001\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u306E\u30C7\u30FC\u30BF\u53CA\u3073\u50BE\u5411\u3092\u5206\u6790\u3059\u308B\u3002"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 129,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 4,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306E\u8A08\u753B\u53CA\u3073\u904B\u7528"
      },
      question_text: "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u7BA1\u7406\u3068\u554F\u984C\u7BA1\u7406\u306E\u4E3B\u306A\u9055\u3044\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u7BA1\u7406\u306F\u6839\u672C\u539F\u56E0\u306E\u7279\u5B9A\u306B\u7126\u70B9\u3092\u5F53\u3066\u3001\u554F\u984C\u7BA1\u7406\u306F\u30B5\u30FC\u30D3\u30B9\u306E\u8FC5\u901F\u306A\u5FA9\u65E7\u306B\u7126\u70B9\u3092\u5F53\u3066\u308B\u3002",
            "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u7BA1\u7406\u306F\u8A08\u753B\u5916\u306E\u4E2D\u65AD\u3078\u306E\u5BFE\u51E6\u3001\u554F\u984C\u7BA1\u7406\u306F\u6839\u672C\u539F\u56E0\u306E\u7A76\u660E\u306B\u7126\u70B9\u3092\u5F53\u3066\u308B\u3002",
            "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u7BA1\u7406\u306F\u4E88\u9632\u7B56\u306E\u5B9F\u65BD\u3001\u554F\u984C\u7BA1\u7406\u306F\u4E8B\u5F8C\u5BFE\u5FDC\u306B\u7126\u70B9\u3092\u5F53\u3066\u308B\u3002",
            "\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u7BA1\u7406\u306F\u500B\u5225\u306E\u969C\u5BB3\u3092\u6271\u3044\u3001\u554F\u984C\u7BA1\u7406\u306F\u5168\u3066\u306EIT\u30B5\u30FC\u30D3\u30B9\u3092\u7DB2\u7F85\u3059\u308B\u3002"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 130,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 5,
        sub_name: "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u8A55\u4FA1\u53CA\u3073\u6539\u5584"
      },
      question_text: "JIS Q 27000:2019\u306B\u304A\u3044\u3066\u3001\u4E0D\u9069\u5408\u306E\u539F\u56E0\u3092\u9664\u53BB\u3057\u3001\u518D\u767A\u3092\u9632\u6B62\u3059\u308B\u305F\u3081\u306E\u3082\u306E\u3068\u3057\u3066\u5B9A\u7FA9\u3055\u308C\u3066\u3044\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u7D99\u7D9A\u7684\u6539\u5584",
            "\u4FEE\u6B63",
            "\u662F\u6B63\u51E6\u7F6E",
            "\u30EA\u30B9\u30AF\u30A2\u30BB\u30B9\u30E1\u30F3\u30C8"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 131,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 5,
        sub_name: "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u8A55\u4FA1\u53CA\u3073\u6539\u5584"
      },
      question_text: "ITIL\xAE\u306E\u7D99\u7D9A\u7684\u30B5\u30FC\u30D3\u30B9\u6539\u5584\u306B\u304A\u3051\u308B\u300C7\u30B9\u30C6\u30C3\u30D7\u306E\u6539\u5584\u30D7\u30ED\u30BB\u30B9\u300D\u306E\u6700\u7D42\u30B9\u30C6\u30C3\u30D7\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30C7\u30FC\u30BF\u3092\u53CE\u96C6\u3059\u308B",
            "\u60C5\u5831\u3092\u63D0\u793A\u3057\u3066\u5229\u7528\u3059\u308B",
            "\u6539\u5584\u306E\u6226\u7565\u3092\u8B58\u5225\u3059\u308B",
            "\u6539\u5584\u3092\u5B9F\u65BD\u3059\u308B"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 132,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 5,
        sub_name: "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u8A55\u4FA1\u53CA\u3073\u6539\u5584"
      },
      question_text: "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u8A55\u4FA1\u306B\u304A\u3044\u3066\u3001ITIL\xAE\u3067\u5B9A\u7FA9\u3055\u308C\u3066\u3044\u308B\u30B5\u30FC\u30D3\u30B9\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u30B7\u30B9\u30C6\u30E0\u306E\u9069\u5207\u6027\u3001\u59A5\u5F53\u6027\u53CA\u3073\u6709\u52B9\u6027\u3092\u7D99\u7D9A\u7684\u306B\u6539\u5584\u3059\u308B\u305F\u3081\u306E\u8A55\u4FA1\u57FA\u6E96\u3068\u3057\u3066\u7528\u3044\u3089\u308C\u308B\u6307\u6A19\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "SLA",
            "RTO",
            "KPI",
            "WBS"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 133,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 6,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u306E\u904B\u7528"
      },
      question_text: "\u30C7\u30A3\u30B6\u30B9\u30BF\u30EA\u30AB\u30D0\u30EA\u3092\u8A08\u753B\u3059\u308B\u969B\u306E\u691C\u8A0E\u9805\u76EE\u306E\u4E00\u3064\u3067\u3042\u308BRPO\uFF08Recovery Point Objective\uFF09\u306F\u3001\u4F55\u3092\u610F\u5473\u3057\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u696D\u52D9\u306E\u7D99\u7D9A\u6027\u3092\u7DAD\u6301\u3059\u308B\u305F\u3081\u306B\u5FC5\u8981\u306A\u4EBA\u54E1\u8A08\u753B\u3068\u8981\u6C42\u3055\u308C\u308B\u4EA4\u4EE3\u8981\u54E1\u306E\u30B9\u30AD\u30EB\u3092\u793A\u3059\u6307\u6A19",
            "\u707D\u5BB3\u767A\u751F\u6642\u304B\u3089\u3069\u306E\u304F\u3089\u3044\u306E\u6642\u9593\u4EE5\u5185\u306B\u30B7\u30B9\u30C6\u30E0\u3092\u518D\u7A3C\u50CD\u3057\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u304B\u3092\u793A\u3059\u6307\u6A19",
            "\u707D\u5BB3\u767A\u751F\u6642\u306B\u696D\u52D9\u3092\u4EE3\u66FF\u3059\u308B\u9060\u9694\u5730\u306E\u30B7\u30B9\u30C6\u30E0\u74B0\u5883\u3068\u3001\u901A\u5E38\u7A3C\u50CD\u3057\u3066\u3044\u308B\u30B7\u30B9\u30C6\u30E0\u74B0\u5883\u3068\u306E\u8A2D\u5099\u6295\u8CC7\u306E\u6BD4\u7387\u3092\u793A\u3059\u6307\u6A19",
            "\u707D\u5BB3\u767A\u751F\u524D\u306E\u3069\u306E\u6642\u70B9\u306E\u72B6\u614B\u307E\u3067\u30C7\u30FC\u30BF\u3092\u5FA9\u65E7\u3057\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u304B\u3092\u793A\u3059\u6307\u6A19"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 134,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 6,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u306E\u904B\u7528"
      },
      question_text: "\u4E8B\u696D\u7D99\u7D9A\u8A08\u753B\uFF08BCP\uFF09\u306E\u76E3\u67FB\u7D50\u679C\u3068\u3057\u3066\u3001\u9069\u5207\u306A\u72B6\u6CC1\u3068\u5224\u65AD\u3055\u308C\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u5F93\u696D\u54E1\u306E\u7DCA\u6025\u9023\u7D61\u5148\u30EA\u30B9\u30C8\u3092\u4F5C\u6210\u3057\u3001\u6700\u65B0\u7248\u306B\u66F4\u65B0\u3057\u3066\u3044\u308B\u3002",
            "\u91CD\u8981\u66F8\u985E\u306F\u8907\u88FD\u305B\u305A\u306B1\u304B\u6240\u3067\u96C6\u4E2D\u4FDD\u7BA1\u3057\u3066\u3044\u308B\u3002",
            "\u5168\u3066\u306E\u696D\u52D9\u306B\u3064\u3044\u3066\u3001\u512A\u5148\u9806\u4F4D\u306A\u3057\u306B\u540C\u4E00\u6C34\u6E96\u306EBCP\u3092\u7B56\u5B9A\u3057\u3066\u3044\u308B\u3002",
            "\u5E73\u6642\u306B\u306FBCP\u3092\u5F93\u696D\u54E1\u306B\u975E\u516C\u958B\u3068\u3057\u3066\u3044\u308B\u3002"
          ],
          correct_answer_index: 0
        }
      }
    },
    {
      id: 135,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 6,
        sub_name: "\u30B5\u30FC\u30D3\u30B9\u306E\u904B\u7528"
      },
      question_text: "\u30B5\u30FC\u30D3\u30B9\u30C7\u30B9\u30AF\u304C\u62C5\u3046\u4E3B\u8981\u306A\u5F79\u5272\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u6280\u8853\u7684\u306A\u554F\u984C\u89E3\u6C7A\u306E\u5C02\u9580\u5BB6\u30C1\u30FC\u30E0\u3068\u3057\u3066\u3001\u5168\u3066\u306E\u30A4\u30F3\u30B7\u30C7\u30F3\u30C8\u3092\u76F4\u63A5\u89E3\u6C7A\u3059\u308B\u3002",
            "\u7D44\u7E54\u5185\u306E\u5168\u3066\u306EIT\u8CC7\u7523\u306E\u8CFC\u5165\u3068\u7BA1\u7406\u3092\u62C5\u5F53\u3059\u308B\u3002",
            "\u5358\u4E00\u7A93\u53E3\uFF08SPOC\uFF09\u3068\u3057\u3066\u3001\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u554F\u3044\u5408\u308F\u305B\u3092\u53D7\u3051\u4ED8\u3051\u3001\u4ED6\u306E\u90E8\u7F72\u306B\u30A8\u30B9\u30AB\u30EC\u30FC\u30B7\u30E7\u30F3\u3059\u308B\u3002",
            "\u30B5\u30FC\u30D3\u30B9\u30EC\u30D9\u30EB\u5408\u610F\uFF08SLA\uFF09\u306E\u7B56\u5B9A\u3068\u76E3\u8996\u3092\u884C\u3046\u3002"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 136,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 7,
        sub_name: "\u30D5\u30A1\u30B7\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8"
      },
      question_text: "\u30D5\u30A1\u30B7\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u306E\u4E3B\u306A\u7126\u70B9\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u958B\u767A\u3068\u4FDD\u5B88",
            "IT\u30B5\u30FC\u30D3\u30B9\u306E\u54C1\u8CEA\u7BA1\u7406",
            "\u8A2D\u5099\u306E\u7BA1\u7406\u3068\u6700\u9069\u5316",
            "\u5F93\u696D\u54E1\u306E\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u8A55\u4FA1"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 137,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 7,
        sub_name: "\u30D5\u30A1\u30B7\u30EA\u30C6\u30A3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8"
      },
      question_text: "\u505C\u96FB\u6642\u306B\u6570\u5206\u9593\u96FB\u529B\u3092\u63D0\u4F9B\u3057\u3001\u305D\u306E\u5F8C\u306B\u81EA\u5BB6\u767A\u96FB\u88C5\u7F6E\u304C\u5FC5\u8981\u3068\u306A\u308B\u8A2D\u5099\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "PDU (Power Distribution Unit)",
            "UPS (Uninterruptible Power Supply)",
            "HVAC (Heating, Ventilation, and Air Conditioning)",
            "RAID (Redundant Array of Independent Disks)"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 138,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 8,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8"
      },
      question_text: "\u7D44\u7E54\u304C\u5B9F\u65BD\u3059\u308B\u4F5C\u696D\u3092\u300C\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u300D\u3068\u300C\u5B9A\u5E38\u696D\u52D9\u300D\u306E\u4E8C\u3064\u306B\u985E\u5225\u3059\u308B\u3068\u304D\u3001\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306B\u8A72\u5F53\u3059\u308B\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u4F01\u696D\u306E\u7D4C\u7406\u90E8\u9580\u304C\u884C\u3063\u3066\u3044\u308B\u3001\u6708\u6B21\u30FB\u534A\u671F\u30FB\u5E74\u6B21\u306E\u6C7A\u7B97\u51E6\u7406",
            "\u91D1\u878D\u6A5F\u95A2\u306E\u5404\u652F\u5E97\u304C\u884C\u3063\u3066\u3044\u308B\u3001\u500B\u4EBA\u9867\u5BA2\u5411\u3051\u306E\u4F4F\u5B85\u30ED\u30FC\u30F3\u306E\u8CB8\u4ED8\u3051",
            "\u7CBE\u5BC6\u6A5F\u5668\u306E\u88FD\u9020\u8CA9\u58F2\u4F01\u696D\u304C\u884C\u3063\u3066\u3044\u308B\u3001\u88FD\u54C1\u306E\u53D6\u6271\u65B9\u6CD5\u306B\u95A2\u3059\u308B\u554F\u5408\u305B\u3078\u306E\u5BFE\u5FDC",
            "\u5730\u65B9\u81EA\u6CBB\u4F53\u304C\u884C\u3063\u3066\u3044\u308B\u3001\u8001\u673D\u5316\u3057\u305F\u5E81\u820E\u306E\u5EFA\u66FF\u3048"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 139,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 8,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30E9\u30A4\u30D5\u30B5\u30A4\u30AF\u30EB\u306B\u304A\u3044\u3066\u3001\u30B3\u30B9\u30C8\u3068\u8981\u54E1\u6570\u304C\u6700\u3082\u591A\u304F\u306A\u308B\u6642\u671F\u306F\u3044\u3064\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u958B\u59CB\u6642",
            "\u7D44\u7E54\u7DE8\u6210\u3068\u6E96\u5099\u6BB5\u968E",
            "\u4F5C\u696D\u5B9F\u65BD\u6642",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u7D42\u7D50\u6642"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 140,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 8,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u306E\u5F71\u97FF\u529B\u3001\u30EA\u30B9\u30AF\u3001\u4E0D\u78BA\u5B9F\u6027\u304C\u6700\u5927\u306B\u306A\u308B\u306E\u306F\u3044\u3064\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u958B\u59CB\u6642",
            "\u4F5C\u696D\u5B9F\u65BD\u6642",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u7D42\u7D50\u6642",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u5909\u66F4\u30B3\u30B9\u30C8\u304C\u6700\u5927\u306B\u306A\u308B\u6642"
          ],
          correct_answer_index: 0
        }
      }
    },
    {
      id: 141,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 9,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u7D71\u5408"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u304C\u6B63\u5F0F\u306B\u8A8D\u53EF\u3055\u308C\u308B\u305F\u3081\u306B\u767A\u884C\u3055\u308C\u308B\u6587\u66F8\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u8A08\u753B\u66F8",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u61B2\u7AE0",
            "\u30B9\u30B3\u30FC\u30D7\u8A18\u8FF0\u66F8",
            "WBS"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 142,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 10,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306B\u304A\u3051\u308B\u300C\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u300D\u3068\u306F\u3001\u3069\u306E\u3088\u3046\u306A\u500B\u4EBA\u3084\u7D44\u7E54\u3092\u6307\u3057\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u8CBB\u7528\u3092\u8CA0\u62C5\u3059\u308B\u30B9\u30DD\u30F3\u30B5\u30FC\u306E\u307F",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u5B9F\u884C\u3084\u5B8C\u4E86\u306B\u3088\u3063\u3066\u5229\u76CA\u306B\u30D7\u30E9\u30B9\u307E\u305F\u306F\u30DE\u30A4\u30CA\u30B9\u306E\u5F71\u97FF\u3092\u53D7\u3051\u308B\u500B\u4EBA\u3084\u7D44\u7E54",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30C1\u30FC\u30E0\u306E\u30E1\u30F3\u30D0\u30FC\u306E\u307F",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306B\u7A4D\u6975\u7684\u306B\u95A2\u4E0E\u3057\u3066\u3044\u308B\u5916\u90E8\u30B3\u30F3\u30B5\u30EB\u30BF\u30F3\u30C8\u306E\u307F"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 143,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 10,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u7BA1\u7406\u306B\u304A\u3044\u3066\u3001\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u306E\u5229\u5BB3\u3084\u74B0\u5883\u306B\u95A2\u3059\u308B\u60C5\u5831\u3092\u6587\u66F8\u5316\u3057\u3001\u9069\u5207\u306B\u7BA1\u7406\u3059\u308B\u305F\u3081\u306B\u4F5C\u6210\u3055\u308C\u308B\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u8A08\u753B\u66F8",
            "\u30EA\u30B9\u30AF\u767B\u9332\u7C3F",
            "\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u767B\u9332\u7C3F",
            "\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u8A08\u753B\u66F8"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 144,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 10,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u306B\u95A2\u3059\u308B\u8A18\u8FF0\u3068\u3057\u3066\u9069\u5207\u306A\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u306B\u306F\u3001\u9867\u5BA2\u3084\u30E1\u30F3\u30D0\u3001\u95A2\u4FC2\u7D44\u7E54\u306A\u3069\u3001\u69D8\u3005\u306A\u4EBA\u304C\u3044\u3066\u3001\u5229\u5BB3\u95A2\u4FC2\u304C\u5BFE\u7ACB\u3059\u308B\u3053\u3068\u304C\u3042\u308B\u3002",
            "\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u306E\u5F71\u97FF\u529B\u306F\u3001\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u7D42\u4E86\u306B\u8FD1\u3065\u304F\u306B\u3064\u308C\u3066\u6700\u5927\u306B\u306A\u308B\u3002",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC\u306F\u3001\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u3092\u9867\u5BA2\u306B\u9650\u5B9A\u3057\u3066\u7BA1\u7406\u3059\u3079\u304D\u3067\u3042\u308B\u3002",
            "\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u3068\u306E\u95A2\u4FC2\u306F\u3001\u4E00\u5EA6\u8A2D\u5B9A\u3059\u308C\u3070\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u5B8C\u4E86\u307E\u3067\u5909\u66F4\u3059\u3079\u304D\u3067\u306F\u306A\u3044\u3002"
          ],
          correct_answer_index: 0
        }
      }
    },
    {
      id: 145,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 11,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30B3\u30FC\u30D7"
      },
      question_text: "WBS\uFF08Work Breakdown Structure\uFF09\u306E\u6700\u4E0B\u4F4D\u306E\u8981\u7D20\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u6210\u679C\u7269",
            "\u30D5\u30A7\u30FC\u30BA",
            "\u30EF\u30FC\u30AF\u30D1\u30C3\u30B1\u30FC\u30B8",
            "\u30A2\u30AF\u30C6\u30A3\u30D3\u30C6\u30A3"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 146,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 11,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30B3\u30FC\u30D7"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u7BA1\u7406\u306B\u304A\u3044\u3066WBS\uFF08Work Breakdown Structure\uFF09\u3092\u4F7F\u7528\u3059\u308B\u4E3B\u306A\u76EE\u7684\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u8CBB\u7528\u3068\u671F\u9593\u3092\u6700\u9069\u5316\u3059\u308B\u305F\u3081",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30AF\u30EA\u30C6\u30A3\u30AB\u30EB\u30D1\u30B9\u3092\u7279\u5B9A\u3059\u308B\u305F\u3081",
            "\u4F5C\u696D\u306E\u9032\u6357\u72B6\u6CC1\u3092\u8996\u899A\u7684\u306B\u8868\u73FE\u3059\u308B\u305F\u3081",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B9\u30B3\u30FC\u30D7\u5168\u4F53\u3092\u7CFB\u7D71\u7ACB\u3066\u3066\u307E\u3068\u3081\u3066\u5B9A\u7FA9\u3057\u3001\u4F5C\u696D\u3092\u7BA1\u7406\u53EF\u80FD\u306A\u5927\u304D\u3055\u306B\u7D30\u5206\u5316\u3059\u308B\u305F\u3081"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 147,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 12,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u8CC7\u6E90"
      },
      question_text: "\u65E5\u5E38\u696D\u52D9\u3067\u306E\u500B\u5225\u6307\u5C0E\u306B\u3088\u308B\u6559\u80B2\u3092\u6307\u3059\u7528\u8A9E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "OJT (On-the-Job Training)",
            "Off-JT (Off-the-Job Training)",
            "e\u30E9\u30FC\u30CB\u30F3\u30B0",
            "\u96C6\u5408\u7814\u4FEE"
          ],
          correct_answer_index: 0
        }
      }
    },
    {
      id: 148,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 12,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u8CC7\u6E90"
      },
      question_text: "\u4E00\u5B9A\u6642\u9593\u306B\u6570\u591A\u304F\u306E\u6848\u4EF6\u3092\u51E6\u7406\u3059\u308B\u3001\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u80FD\u529B\u3092\u8A55\u4FA1\u3059\u308B\u305F\u3081\u306E\u8A13\u7DF4\u65B9\u6CD5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B0\u30EB\u30FC\u30D7\u30C7\u30A3\u30B9\u30AB\u30C3\u30B7\u30E7\u30F3",
            "\u30ED\u30FC\u30EB\u30D7\u30EC\u30A4\u30F3\u30B0",
            "\u30A4\u30F3\u30D0\u30B9\u30B1\u30C3\u30C8",
            "\u30D7\u30EC\u30BC\u30F3\u30C6\u30FC\u30B7\u30E7\u30F3"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 149,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 13,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u6642\u9593"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u65E5\u7A0B\u8A08\u753B\u306B\u304A\u3044\u3066\u3001\u65E5\u7A0B\u306B\u4F59\u88D5\u306E\u306A\u3044\u7D4C\u8DEF\u3092\u6307\u3059\u7528\u8A9E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D5\u30ED\u30FC\u30C6\u30A3\u30F3\u30B0\u30D1\u30B9",
            "\u30AF\u30EA\u30C6\u30A3\u30AB\u30EB\u30D1\u30B9",
            "\u30B7\u30E7\u30FC\u30C8\u30D1\u30B9",
            "\u30D0\u30C3\u30AF\u30EF\u30FC\u30C9\u30D1\u30B9"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 150,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 13,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u6642\u9593"
      },
      question_text: "\u5DE5\u7A0B\u7BA1\u7406\u56F3\u8868\u306B\u95A2\u3059\u308B\u8A18\u8FF0\u306E\u3046\u3061\u3001\u30AC\u30F3\u30C8\u30C1\u30E3\u30FC\u30C8\u306E\u7279\u5FB4\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u5DE5\u7A0B\u7BA1\u7406\u4E0A\u306E\u91CD\u8981\u30DD\u30A4\u30F3\u30C8\u3092\u671F\u65E5\u3068\u3057\u3066\u793A\u3057\u3066\u304A\u304D\u3001\u610F\u601D\u6C7A\u5B9A\u3057\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u671F\u65E5\u304C\u7BA1\u7406\u3067\u304D\u308B\u3002",
            "\u500B\u3005\u306E\u4F5C\u696D\u306E\u9806\u5E8F\u95A2\u4FC2\u3001\u6240\u8981\u65E5\u6570\u3001\u4F59\u88D5\u65E5\u6570\u306A\u3069\u304C\u628A\u63E1\u3067\u304D\u308B\u3002",
            "\u4F5C\u696D\u958B\u59CB\u3068\u4F5C\u696D\u7D42\u4E86\u306E\u4E88\u5B9A\u3068\u5B9F\u7E3E\u3084\u3001\u4ED5\u639B\u304B\u308A\u4E2D\u306E\u4F5C\u696D\u306A\u3069\u304C\u628A\u63E1\u3067\u304D\u308B\u3002",
            "\u4F5C\u696D\u306E\u51FA\u6765\u9AD8\u306E\u6642\u9593\u7684\u306A\u63A8\u79FB\u3092\u8868\u73FE\u3059\u308B\u306E\u306B\u9069\u3057\u3066\u304A\u308A\u3001\u8CBB\u7528\u7BA1\u7406\u3068\u9032\u6357\u7BA1\u7406\u304C\u540C\u6642\u306B\u884C\u3048\u308B\u3002"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 151,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 14,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B3\u30B9\u30C8"
      },
      question_text: "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u958B\u767A\u306E\u30B3\u30B9\u30C8\u898B\u7A4D\u624B\u6CD5\u306E\u4E00\u3064\u3067\u3001\u5E33\u7968\u3084\u753B\u9762\u306A\u3069\u306E\u6A5F\u80FD\u3092\u57FA\u306B\u898B\u7A4D\u3082\u308B\u65B9\u6CD5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "LOC (Lines Of Code) \u6CD5",
            "\u30D5\u30A1\u30F3\u30AF\u30B7\u30E7\u30F3\u30DD\u30A4\u30F3\u30C8\u6CD5 (FP\u6CD5)",
            "PERT\u6CD5",
            "\u4E09\u70B9\u898B\u7A4D\u3082\u308A"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 152,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 14,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B3\u30B9\u30C8"
      },
      question_text: "\u9032\u6357\u3068\u30B3\u30B9\u30C8\u306E\u4E21\u65B9\u3092\u5B9A\u91CF\u7684\u306B\u8A55\u4FA1\u3059\u308B\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u306E\u624B\u6CD5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "ROI (Return On Investment)",
            "EVM (Earned Value Management)",
            "TCO (Total Cost of Ownership)",
            "BSC (Balanced Scorecard)"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 153,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 15,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30B9\u30AF"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30B9\u30AF\u5BFE\u5FDC\u6226\u7565\u306E\u3046\u3061\u3001\u8105\u5A01\u306B\u3088\u308B\u30DE\u30A4\u30CA\u30B9\u306E\u5F71\u97FF\u3084\u8CAC\u4EFB\u306E\u4E00\u90E8\u307E\u305F\u306F\u5168\u90E8\u3092\u7B2C\u4E09\u8005\u306B\u79FB\u8EE2\u3059\u308B\u6226\u7565\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u56DE\u907F",
            "\u8EE2\u5AC1",
            "\u8EFD\u6E1B",
            "\u53D7\u5BB9"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 154,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 15,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30B9\u30AF"
      },
      question_text: "PMBOK\xAE\u30AC\u30A4\u30C9\u7B2C6\u7248\u306B\u3088\u308C\u3070\u3001\u30D7\u30E9\u30B9\u306E\u5F71\u97FF\u3092\u53CA\u307C\u3059\u30EA\u30B9\u30AF\uFF08\u597D\u6A5F\uFF09\u306B\u5BFE\u3059\u308B\u300C\u5F37\u5316\u300D\u306E\u6226\u7565\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u3044\u304B\u306A\u308B\u7A4D\u6975\u7684\u884C\u52D5\u3082\u53D6\u3089\u306A\u3044\u304C\u3001\u597D\u6A5F\u304C\u5B9F\u73FE\u3057\u305F\u3068\u304D\u306B\u305D\u306E\u30D9\u30CD\u30D5\u30A3\u30C3\u30C8\u3092\u4EAB\u53D7\u3059\u308B\u3002",
            "\u597D\u6A5F\u304C\u78BA\u5B9F\u306B\u8D77\u3053\u308A\u3001\u767A\u751F\u78BA\u7387\u304C100\uFF05\u306B\u307E\u3067\u9AD8\u307E\u308B\u3068\u4FDD\u8A3C\u3059\u308B\u3053\u3068\u306B\u3088\u3063\u3066\u3001\u7279\u5225\u306E\u597D\u6A5F\u306B\u95A2\u9023\u3059\u308B\u30D9\u30CD\u30D5\u30A3\u30C3\u30C8\u3092\u6349\u3048\u3088\u3046\u3068\u3059\u308B\u3002",
            "\u597D\u6A5F\u306E\u30AA\u30FC\u30CA\u30FC\u30B7\u30C3\u30D7\u3092\u7B2C\u4E09\u8005\u306B\u79FB\u8EE2\u3057\u3066\u3001\u597D\u6A5F\u304C\u767A\u751F\u3057\u305F\u5834\u5408\u306B\u305D\u308C\u304C\u30D9\u30CD\u30D5\u30A3\u30C3\u30C8\u306E\u4E00\u90E8\u3092\u5171\u6709\u3067\u304D\u308B\u3088\u3046\u306B\u3059\u308B\u3002",
            "\u597D\u6A5F\u306E\u767A\u751F\u78BA\u7387\u3084\u5F71\u97FF\u5EA6\u3001\u53C8\u306F\u305D\u306E\u4E21\u8005\u3092\u5897\u5927\u3055\u305B\u308B\u3002"
          ],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 155,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 15,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30B9\u30AF"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30B9\u30AF\u5BFE\u5FDC\u6226\u7565\u3068\u3001\u305D\u306E\u8AAC\u660E\u3092\u5BFE\u5FDC\u4ED8\u3051\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u56DE\u907F", right: "\u8105\u5A01\u3092\u5B8C\u5168\u306B\u53D6\u308A\u9664\u304F\u305F\u3081\u306B\u3001\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u8A08\u753B\u3092\u5909\u66F4\u3059\u308B\u3002" },
          { id: 2, left: "\u8EE2\u5AC1", right: "\u8105\u5A01\u306B\u3088\u308B\u30DE\u30A4\u30CA\u30B9\u306E\u5F71\u97FF\u3084\u8CAC\u4EFB\u306E\u4E00\u90E8\u307E\u305F\u306F\u5168\u90E8\u3092\u7B2C\u4E09\u8005\u306B\u79FB\u8EE2\u3059\u308B\uFF08\u4F8B\uFF1A\u4FDD\u967A\uFF09\u3002" },
          { id: 3, left: "\u8EFD\u6E1B", right: "\u30EA\u30B9\u30AF\u4E8B\u8C61\u306E\u767A\u751F\u78BA\u7387\u3084\u5F71\u97FF\u5EA6\u3092\u6E1B\u5C11\u3055\u305B\u308B\u3002" },
          { id: 4, left: "\u53D7\u5BB9", right: "\u8105\u5A01\u306B\u5BFE\u3057\u3066\u7279\u5225\u306A\u5BFE\u5FDC\u3092\u3057\u306A\u3044\u304C\u3001\u72B6\u6CC1\u306B\u5FDC\u3058\u3066\u4E88\u5099\u3092\u8A2D\u3051\u308B\u306A\u3069\u306E\u5BFE\u7B56\u3092\u3068\u308B\u3002" }
        ]
      }
    },
    {
      id: 156,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 16,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u54C1\u8CEA"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u54C1\u8CEA\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u306B\u304A\u3051\u308B\u300C\u54C1\u8CEA\u4FDD\u8A3C\u300D\u306E\u76EE\u7684\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u54C1\u8CEA\u8981\u6C42\u4E8B\u9805\u3084\u54C1\u8CEA\u6A19\u6E96\u3092\u5B9A\u3081\u3001\u6587\u66F8\u5316\u3059\u308B\u3053\u3068\u3002",
            "\u9069\u5207\u306A\u54C1\u8CEA\u6A19\u6E96\u3068\u904B\u7528\u57FA\u6E96\u306E\u9069\u7528\u3092\u78BA\u5B9F\u306B\u884C\u3046\u305F\u3081\u306B\u3001\u54C1\u8CEA\u306E\u8981\u6C42\u4E8B\u9805\u3068\u54C1\u8CEA\u7BA1\u7406\u6E2C\u5B9A\u306E\u7D50\u679C\u3092\u76E3\u67FB\u3059\u308B\u3053\u3068\u3002",
            "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u3092\u67FB\u5B9A\u3057\u3001\u5FC5\u8981\u306A\u5909\u66F4\u3092\u63D0\u6848\u3059\u308B\u305F\u3081\u306B\u54C1\u8CEA\u3092\u76E3\u8996\u3059\u308B\u30B7\u30B9\u30C6\u30E0\u306A\u3069\u306E\u5B9F\u884C\u7D50\u679C\u3092\u76E3\u8996\u3057\u3001\u8A18\u9332\u3059\u308B\u3053\u3068\u3002",
            "\u969C\u5BB3\u5831\u544A\u66F8\u3092\u4F5C\u6210\u3057\u3001\u969C\u5BB3\u304C\u8D77\u3053\u3063\u305F\u4E8B\u5B9F\u3068\u305D\u306E\u5185\u5BB9\u3092\u7BA1\u7406\u3059\u308B\u3053\u3068\u3002"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 157,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 16,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u54C1\u8CEA"
      },
      question_text: "\u30D7\u30ED\u30BB\u30B9\u304C\u5B89\u5B9A\u3057\u3066\u3044\u308B\u304B\u3069\u3046\u304B\u3001\u307E\u305F\u306F\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u304C\u4E88\u6E2C\u3069\u304A\u308A\u3067\u3042\u308B\u304B\u3069\u3046\u304B\u3092\u5224\u65AD\u3059\u308B\u305F\u3081\u306B\u3001\u8A31\u5BB9\u3055\u308C\u308B\u4E0A\u65B9\u7BA1\u7406\u9650\u754C\u3068\u4E0B\u65B9\u7BA1\u7406\u9650\u754C\u3092\u8A2D\u5B9A\u3057\u3066\u4F7F\u7528\u3059\u308B\u56F3\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D1\u30EC\u30FC\u30C8\u56F3",
            "\u30D2\u30B9\u30C8\u30B0\u30E9\u30E0",
            "\u7BA1\u7406\u56F3",
            "\u7279\u6027\u8981\u56E0\u56F3"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 158,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 17,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u8ABF\u9054"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u8ABF\u9054\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u306E\u4E3B\u306A\u76EE\u7684\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30C1\u30FC\u30E0\u306E\u30E1\u30F3\u30D0\u30FC\u3092\u5897\u54E1\u3059\u308B\u3053\u3068",
            "\u5FC5\u8981\u306A\u8CC7\u6E90\u3084\u30B5\u30FC\u30D3\u30B9\u3092\u5916\u90E8\u304B\u3089\u8CFC\u5165\u3001\u53D6\u5F97\u3059\u308B\u305F\u3081\u306B\u5FC5\u8981\u306A\u5951\u7D04\u3084\u305D\u306E\u7BA1\u7406\u3092\u9069\u5207\u306B\u884C\u3046\u3053\u3068",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u4E88\u7B97\u3092\u7B56\u5B9A\u3057\u3001\u30B3\u30B9\u30C8\u3092\u53B3\u5BC6\u306B\u7BA1\u7406\u3059\u308B\u3053\u3068",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30B9\u30AF\u3092\u7279\u5B9A\u3057\u3001\u30EA\u30B9\u30AF\u5BFE\u5FDC\u8A08\u753B\u3092\u7B56\u5B9A\u3059\u308B\u3053\u3068"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 159,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 17,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u8ABF\u9054"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u8ABF\u9054\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u306E\u30D7\u30ED\u30BB\u30B9\u306B\u304A\u3044\u3066\u3001\u7D0D\u5165\u5019\u88DC\u304B\u3089\u56DE\u7B54\u3092\u5F97\u3066\u3001\u7D0D\u5165\u8005\uFF08\u30B5\u30D7\u30E9\u30A4\u30E4\uFF09\u3092\u9078\u5B9A\u3057\u3001\u5951\u7D04\u3092\u7DE0\u7D50\u3059\u308B\u6BB5\u968E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u8ABF\u9054\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u8A08\u753B",
            "\u8ABF\u9054\u5B9F\u884C",
            "\u8ABF\u9054\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB",
            "\u8ABF\u9054\u7D42\u7D50"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 160,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 18,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u306B\u304A\u3044\u3066\u3001\u76F8\u624B\u306E\u884C\u52D5\u306B\u5FDC\u3058\u3066\u60C5\u5831\u3092\u63D0\u4F9B\u3059\u308B\u60C5\u5831\u914D\u5E03\u306E\u65B9\u6CD5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30C3\u30B7\u30E5\u578B",
            "\u30D7\u30EB\u578B",
            "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u578B",
            "\u30D6\u30ED\u30FC\u30C9\u30AD\u30E3\u30B9\u30C8\u578B"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 161,
      category: {
        id: 6,
        name: "\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
        sub_id: 18,
        sub_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3"
      },
      question_text: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u306E\u4E3B\u306A\u76EE\u7684\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u6280\u8853\u7684\u306A\u554F\u984C\u3092\u89E3\u6C7A\u3059\u308B\u3053\u3068",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30BD\u30FC\u30B9\u3092\u6700\u9069\u306B\u914D\u5206\u3059\u308B\u3053\u3068",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u60C5\u5831\u306E\u751F\u6210\u3001\u53CE\u96C6\u3001\u914D\u5E03\u3001\u4FDD\u7BA1\u3001\u691C\u7D22\u3001\u6700\u7D42\u7684\u306A\u5EC3\u68C4\u3092\u9069\u5B9C\u3001\u9069\u5207\u304B\u3064\u78BA\u5B9F\u306B\u884C\u3046\u3053\u3068",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u54C1\u8CEA\u57FA\u6E96\u3092\u7B56\u5B9A\u3057\u3001\u7DAD\u6301\u3059\u308B\u3053\u3068"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 162,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 1,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u306E\u69CB\u6210"
      },
      question_text: "2\u3064\u306E\u30B7\u30B9\u30C6\u30E0\u3092\u4E26\u5217\u306B\u7A3C\u50CD\u3055\u305B\u3001\u540C\u3058\u51E6\u7406\u3092\u5B9F\u884C\u3057\u3066\u7D50\u679C\u3092\u6BD4\u8F03\u3059\u308B\u3053\u3068\u3067\u9AD8\u3044\u4FE1\u983C\u6027\u3092\u5F97\u308B\u65B9\u5F0F\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30C7\u30E5\u30D7\u30EC\u30C3\u30AF\u30B9\u30B7\u30B9\u30C6\u30E0", "\u30C7\u30E5\u30A2\u30EB\u30B7\u30B9\u30C6\u30E0", "\u30B3\u30FC\u30EB\u30C9\u30B9\u30BF\u30F3\u30D0\u30A4", "\u30ED\u30FC\u30C9\u30B7\u30A7\u30A2\u30B7\u30B9\u30C6\u30E0"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 163,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 1,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u306E\u69CB\u6210"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u306B\u969C\u5BB3\u304C\u767A\u751F\u3057\u305F\u3068\u304D\u3001\u5B89\u5168\u5074\u306B\u5236\u5FA1\u3059\u308B\u65B9\u6CD5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30D5\u30A7\u30FC\u30EB\u30BD\u30D5\u30C8", "\u30D5\u30A9\u30FC\u30EB\u30C8\u30A2\u30DC\u30A4\u30C0\u30F3\u30B9", "\u30D5\u30A7\u30FC\u30EB\u30BB\u30FC\u30D5", "\u30D5\u30A9\u30FC\u30EB\u30C8\u30DE\u30B9\u30AD\u30F3\u30B0"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 164,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 2,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u306E\u8A55\u4FA1\u6307\u6A19"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u306E\u51E6\u7406\u6027\u80FD\u3092\u6E2C\u5B9A\u3059\u308B\u6307\u6A19\u3068\u3057\u3066\u6700\u3082\u9069\u5207\u306A\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30EC\u30B9\u30DD\u30F3\u30B9\u30BF\u30A4\u30E0", "\u7A3C\u50CD\u7387", "\u30B9\u30EB\u30FC\u30D7\u30C3\u30C8", "MTBF"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 165,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 2,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u306E\u8A55\u4FA1\u6307\u6A19"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u306E\u53EF\u7528\u6027\u306E\u6307\u6A19\u3067\u3042\u308B\u7A3C\u50CD\u7387\u3092\u5411\u4E0A\u3055\u305B\u308B\u305F\u3081\u306E\u8981\u7D20\u3068\u3057\u3066\u3001\u300C\u5E73\u5747\u6545\u969C\u9593\u9694\u300D\uFF08MTBF\uFF09\u3068\u300C\u5E73\u5747\u5FA9\u65E7\u6642\u9593\u300D\uFF08MTTR\uFF09\u306E\u95A2\u4FC2\u3067\u6B63\u3057\u3044\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      "question_interaction": {
        "type": "MultipleChoice",
        "data": {
          "texts": ["MTTR\u3092\u9577\u304F\u3057\u3001MTBF\u3092\u77ED\u304F\u3059\u308B", "MTBF\u3092\u77ED\u304F\u3057\u3001MTTR\u3092\u9577\u304F\u3059\u308B", "MTBF\u3092\u9577\u304F\u3057\u3001MTTR\u3092\u77ED\u304F\u3059\u308B", "MTBF\u3068MTTR\u306F\u53EF\u7528\u6027\u3068\u306F\u95A2\u4FC2\u306A\u3044"],
          "correct_answer_index": 2
        }
      }
    },
    {
      id: 166,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 3,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u65B9\u5F0F"
      },
      question_text: "\u73FE\u5728\u306E\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306E\u4E3B\u6D41\u3067\u3042\u308A\u3001\u30C6\u30FC\u30D6\u30EB\u3068\u30C6\u30FC\u30D6\u30EB\u9593\u306E\u95A2\u9023\u3067\u30C7\u30FC\u30BF\u3092\u8868\u73FE\u3059\u308B\u65B9\u5F0F\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u968E\u5C64\u578B\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9", "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u578B\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9", "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u6307\u5411\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9", "\u95A2\u4FC2\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 167,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 3,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u65B9\u5F0F"
      },
      question_text: "DBMS\uFF08\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u7BA1\u7406\u30B7\u30B9\u30C6\u30E0\uFF09\u304C\u30C7\u30FC\u30BF\u3092\u5B89\u5168\u306B\u4FDD\u7BA1\u3059\u308B\u305F\u3081\u306B\u5099\u3048\u3066\u3044\u308B\u6A5F\u80FD\u306E\u3046\u3061\u3001\u30C7\u30FC\u30BF\u304C\u5931\u308F\u308C\u306A\u3044\u3088\u3046\u306B\u3059\u308B\u6A5F\u80FD\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30C7\u30FC\u30BF\u6A5F\u5BC6\u4FDD\u8B77\u6A5F\u80FD", "\u4FDD\u5168\u6A5F\u80FD", "\u30A2\u30AF\u30BB\u30B9\u5236\u9650\u6A5F\u80FD", "\u30E1\u30BF\u30C7\u30FC\u30BF\u7BA1\u7406"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 168,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 4,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u8A2D\u8A08"
      },
      question_text: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u8A2D\u8A08\u306B\u304A\u3044\u3066\u3001\u30C7\u30FC\u30BF\u306E\u91CD\u8907\u3092\u6392\u9664\u3057\u3001\u30C7\u30FC\u30BF\u306E\u6574\u5408\u6027\u3092\u4FDD\u3064\u3053\u3068\u3092\u76EE\u7684\u3068\u3057\u3066\u30C6\u30FC\u30D6\u30EB\u3092\u5206\u5272\u3059\u308B\u624B\u6CD5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["E-R\u56F3\u4F5C\u6210", "\u30C7\u30FC\u30BF\u5206\u6790", "\u6B63\u898F\u5316", "\u30C8\u30E9\u30F3\u30B6\u30AF\u30B7\u30E7\u30F3\u7BA1\u7406"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 169,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 4,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u8A2D\u8A08"
      },
      question_text: "E-R\u56F3\u306B\u304A\u3051\u308B\u300C\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u300D\u3068\u300C\u30EA\u30EC\u30FC\u30B7\u30E7\u30F3\u30B7\u30C3\u30D7\u300D\u306E\u8AAC\u660E\u3068\u3057\u3066\u3001\u9069\u5207\u306A\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u3073\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3", right: "\u7BA1\u7406\u5BFE\u8C61\u306E\u5B9F\u4F53\uFF08\u4F8B: \u9867\u5BA2\u3001\u5546\u54C1\uFF09" },
          { id: 2, left: "\u30EA\u30EC\u30FC\u30B7\u30E7\u30F3\u30B7\u30C3\u30D7", right: "\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u9593\u306E\u95A2\u9023\uFF08\u4F8B: \u6CE8\u6587\u3068\u9867\u5BA2\u306E\u95A2\u4FC2\uFF09" }
        ]
      }
    },
    {
      id: 170,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 5,
        sub_name: "\u30C7\u30FC\u30BF\u64CD\u4F5C"
      },
      question_text: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306E\u69CB\u9020\u3092\u5B9A\u7FA9\u3057\u305F\u308A\u3001\u65B0\u305F\u306A\u30C6\u30FC\u30D6\u30EB\u3084\u30D3\u30E5\u30FC\u3092\u4F5C\u6210\u3057\u305F\u308A\u3059\u308BSQL\u306E\u547D\u4EE4\u7FA4\u306F\u4F55\u306B\u5206\u985E\u3055\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30C7\u30FC\u30BF\u64CD\u4F5C\u8A00\u8A9E\uFF08SQL-DML\uFF09", "\u30C7\u30FC\u30BF\u5236\u5FA1\u8A00\u8A9E\uFF08SQL-DCL\uFF09", "\u30C7\u30FC\u30BF\u5B9A\u7FA9\u8A00\u8A9E\uFF08SQL-DDL\uFF09", "\u30C8\u30E9\u30F3\u30B6\u30AF\u30B7\u30E7\u30F3\u5236\u5FA1\u8A00\u8A9E"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 171,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 5,
        sub_name: "\u30C7\u30FC\u30BF\u64CD\u4F5C"
      },
      question_text: "\u30E6\u30FC\u30B6\u30FC\u306B\u7279\u5B9A\u306E\u8868\u3084\u30D3\u30E5\u30FC\u3078\u306E\u30A2\u30AF\u30BB\u30B9\u6A29\u9650\u3092\u8A2D\u5B9A\u3059\u308B\u305F\u3081\u306B\u4F7F\u7528\u3055\u308C\u308BSQL\u306E\u547D\u4EE4\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["SELECT", "INSERT", "CREATE", "GRANT"],
          correct_answer_index: 3
        }
      }
    },
    {
      id: 172,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 6,
        sub_name: "\u30C8\u30E9\u30F3\u30B6\u30AF\u30B7\u30E7\u30F3\u51E6\u7406"
      },
      question_text: "\u8907\u6570\u306E\u30C8\u30E9\u30F3\u30B6\u30AF\u30B7\u30E7\u30F3\u304C\u540C\u6642\u306B\u30C7\u30FC\u30BF\u306B\u30A2\u30AF\u30BB\u30B9\u3059\u308B\u969B\u306B\u3001\u30C7\u30FC\u30BF\u306E\u6574\u5408\u6027\u3092\u4FDD\u3064\u305F\u3081\u306B\u7528\u3044\u3089\u308C\u308B\u5236\u5FA1\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF", "\u30ED\u30FC\u30EB\u30D5\u30A9\u30EF\u30FC\u30C9", "\u6392\u4ED6\u5236\u5FA1", "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 173,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 6,
        sub_name: "\u30C8\u30E9\u30F3\u30B6\u30AF\u30B7\u30E7\u30F3\u51E6\u7406"
      },
      question_text: "\u30C8\u30E9\u30F3\u30B6\u30AF\u30B7\u30E7\u30F3\u969C\u5BB3\u304C\u767A\u751F\u3057\u305F\u5834\u5408\u306B\u3001\u66F4\u65B0\u524D\u30ED\u30B0\u3092\u4F7F\u7528\u3057\u3066\u30B7\u30B9\u30C6\u30E0\u3092\u969C\u5BB3\u767A\u751F\u524D\u306E\u72B6\u614B\u306B\u623B\u3059\u51E6\u7406\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30ED\u30FC\u30EB\u30D5\u30A9\u30EF\u30FC\u30C9", "\u30B3\u30DF\u30C3\u30C8", "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF", "\u30C1\u30A7\u30C3\u30AF\u30DD\u30A4\u30F3\u30C8"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 174,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 7,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u5FDC\u7528"
      },
      question_text: "\u30C7\u30FC\u30BF\u30A6\u30A7\u30A2\u30CF\u30A6\u30B9\u306E\u57FA\u672C\u64CD\u4F5C\u306E\u3046\u3061\u3001\u30C7\u30FC\u30BF\u306E\u5206\u6790\u8EF8\u3092\u5909\u66F4\u3057\u3001\u8996\u70B9\u3092\u5909\u3048\u308B\u64CD\u4F5C\u306F\u4F55\u3068\u547C\u3070\u308C\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30B9\u30E9\u30A4\u30B7\u30F3\u30B0", "\u30C9\u30EA\u30EA\u30F3\u30B0", "\u30C0\u30A4\u30B7\u30F3\u30B0", "\u30ED\u30FC\u30EB\u30A2\u30C3\u30D7"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 175,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 7,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u5FDC\u7528"
      },
      question_text: "\u30C7\u30FC\u30BF\u30A6\u30A7\u30A2\u30CF\u30A6\u30B9\u306A\u3069\u306B\u683C\u7D0D\u3055\u308C\u305F\u30C7\u30FC\u30BF\u306B\u5BFE\u3057\u3001\u7D71\u8A08\u5B66\u3001\u30D1\u30BF\u30FC\u30F3\u8A8D\u8B58\u3001\u4EBA\u5DE5\u77E5\u80FD\u306A\u3069\u306E\u30C7\u30FC\u30BF\u89E3\u6790\u624B\u6CD5\u3092\u9069\u7528\u3057\u3066\u65B0\u3057\u3044\u77E5\u898B\u3092\u53D6\u308A\u51FA\u3059\u6280\u8853\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30C7\u30FC\u30BF\u30A6\u30A7\u30A2\u30CF\u30A6\u30B9", "\u30C7\u30FC\u30BF\u30DE\u30A4\u30CB\u30F3\u30B0", "NoSQL", "\u30D3\u30C3\u30B0\u30C7\u30FC\u30BF"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 176,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 7,
        sub_name: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u5FDC\u7528"
      },
      question_text: "Volume\uFF08\u91CF\uFF09\u3001Variety\uFF08\u591A\u69D8\u6027\uFF09\u3001Velocity\uFF08\u901F\u5EA6\uFF09\u306E3\u3064\u306EV\u304C\u7279\u5FB4\u3068\u3055\u308C\u308B\u3001\u901A\u5E38\u306EDBMS\u3067\u6271\u3046\u3053\u3068\u304C\u56F0\u96E3\u306A\u5927\u304D\u3055\u306E\u30C7\u30FC\u30BF\u306E\u96C6\u307E\u308A\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30C7\u30FC\u30BF\u30A6\u30A7\u30A2\u30CF\u30A6\u30B9", "\u30EA\u30EC\u30FC\u30B7\u30E7\u30CA\u30EB\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9", "\u30D3\u30C3\u30B0\u30C7\u30FC\u30BF", "NoSQL"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 177,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 8,
        sub_name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u65B9\u5F0F"
      },
      question_text: "\u7279\u5B9A\u306E\u65BD\u8A2D\u5185\u306B\u81EA\u5206\u3067\u8A2D\u7F6E\u3057\u3001\u72ED\u3044\u7BC4\u56F2\u306E\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u3092\u63A5\u7D9A\u3059\u308B\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["WAN", "LAN", "VPN", "FTTH"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 178,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 8,
        sub_name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u65B9\u5F0F"
      },
      question_text: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u306B\u304A\u3044\u3066\u3001IT\u30B5\u30FC\u30D3\u30B9\u3092\u5229\u7528\u3059\u308B\u5074\u306E\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u3084\u30C7\u30D0\u30A4\u30B9\u3092\u6307\u3059\u8A00\u8449\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["\u30B5\u30FC\u30D0\u30FC", "\u30EB\u30FC\u30BF", "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8", "\u30D6\u30EA\u30C3\u30B8"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 179,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 9,
        sub_name: "\u30C7\u30FC\u30BF\u901A\u4FE1\u3068\u5236\u5FA1"
      },
      question_text: "OSI\u57FA\u672C\u53C2\u7167\u30E2\u30C7\u30EB\u306E7\u3064\u306E\u968E\u5C64\u306B\u3064\u3044\u3066\u3001\u305D\u308C\u305E\u308C\u306E\u6A5F\u80FD\u306E\u8AAC\u660E\u3068\u3057\u3066\u9069\u5207\u306A\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u3073\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u5C64", right: "\u901A\u4FE1\u306B\u4F7F\u3046\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u305D\u306E\u3082\u306E" },
          { id: 2, left: "\u30D7\u30EC\u30BC\u30F3\u30C6\u30FC\u30B7\u30E7\u30F3\u5C64", right: "\u30C7\u30FC\u30BF\u306E\u8868\u73FE\u65B9\u6CD5\u3092\u5909\u63DB" },
          { id: 3, left: "\u30BB\u30B7\u30E7\u30F3\u5C64", right: "\u901A\u4FE1\u3059\u308B\u30D7\u30ED\u30B0\u30E9\u30E0\u9593\u3067\u4F1A\u8A71\u3092\u7BA1\u7406" },
          { id: 4, left: "\u30C8\u30E9\u30F3\u30B9\u30DD\u30FC\u30C8\u5C64", right: "\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u5185\u3067\u3069\u306E\u901A\u4FE1\u30D7\u30ED\u30B0\u30E9\u30E0\u3068\u901A\u4FE1\u3059\u308B\u304B\u3092\u7BA1\u7406\u3057\u3001\u4FE1\u983C\u6027\u3092\u78BA\u4FDD" },
          { id: 5, left: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u5C64", right: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u4E0A\u3067\u30C7\u30FC\u30BF\u304C\u59CB\u70B9\u304B\u3089\u7D42\u70B9\u307E\u3067\u914D\u9001\u3055\u308C\u308B\u3088\u3046\u306B\u7BA1\u7406" },
          { id: 6, left: "\u30C7\u30FC\u30BF\u30EA\u30F3\u30AF\u5C64", right: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u4E0A\u3067\u30C7\u30FC\u30BF\u304C\u96A3\u306E\u901A\u4FE1\u6A5F\u5668\u307E\u3067\u914D\u9001\u3055\u308C\u308B\u3088\u3046\u306B\u7BA1\u7406" },
          { id: 7, left: "\u7269\u7406\u5C64", "right": "\u7269\u7406\u7684\u306A\u63A5\u7D9A\u3092\u7BA1\u7406\u3057\u3001\u96FB\u6C17\u4FE1\u53F7\u3092\u5909\u63DB" }
        ]
      }
    },
    {
      id: 180,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 9,
        sub_name: "\u30C7\u30FC\u30BF\u901A\u4FE1\u3068\u5236\u5FA1"
      },
      "question_text": "OSI\u57FA\u672C\u53C2\u7167\u30E2\u30C7\u30EB\u306E\u7B2C3\u5C64\uFF08\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u5C64\uFF09\u306B\u4F4D\u7F6E\u3057\u3001\u7570\u306A\u308B\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u9593\u306E\u30C7\u30FC\u30BF\u8EE2\u9001\u7D4C\u8DEF\u3092\u6C7A\u5B9A\u3059\u308B\u88C5\u7F6E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      "question_interaction": {
        "type": "MultipleChoice",
        "data": {
          "texts": ["\u30EA\u30D4\u30FC\u30BF", "\u30D6\u30EA\u30C3\u30B8", "\u30EB\u30FC\u30BF", "\u30CF\u30D6"],
          "correct_answer_index": 2
        }
      }
    },
    {
      id: 181,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 10,
        sub_name: "\u901A\u4FE1\u30D7\u30ED\u30C8\u30B3\u30EB"
      },
      question_text: "Web\u30B5\u30A4\u30C8\u306E\u95B2\u89A7\u306B\u4F7F\u7528\u3055\u308C\u308BHTTP\u30D7\u30ED\u30C8\u30B3\u30EB\u304C\u901A\u5E38\u4F7F\u7528\u3059\u308BTCP\u30DD\u30FC\u30C8\u756A\u53F7\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["21", "25", "80", "443"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 182,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 10,
        sub_name: "\u901A\u4FE1\u30D7\u30ED\u30C8\u30B3\u30EB"
      },
      question_text: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u4E0A\u306E\u6A5F\u5668\u3092\u6B63\u3057\u3044\u6642\u523B\u306B\u540C\u671F\u3055\u305B\u308B\u305F\u3081\u306E\u30D7\u30ED\u30C8\u30B3\u30EB\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["DNS", "DHCP", "NTP", "SMTP"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 183,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 10,
        sub_name: "\u901A\u4FE1\u30D7\u30ED\u30C8\u30B3\u30EB"
      },
      question_text: "\u7121\u7DDALAN\u3067\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u3092\u8B58\u5225\u3059\u308BID\u3067\u3042\u308A\u3001\u8907\u6570\u306E\u30A2\u30AF\u30BB\u30B9\u30DD\u30A4\u30F3\u30C8\u306B\u540C\u3058\u8A2D\u5B9A\u3092\u3059\u308B\u3053\u3068\u3067\u30ED\u30FC\u30DF\u30F3\u30B0\u3092\u53EF\u80FD\u306B\u3059\u308B\u6A5F\u80FD\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["MAC\u30A2\u30C9\u30EC\u30B9", "SSID", "WPA3", "ESSID\u30B9\u30C6\u30EB\u30B9"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 184,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 12,
        sub_name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u5FDC\u7528"
      },
      question_text: "\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u3084IP-VPN\u7DB2\u306A\u3069\u306E\u5171\u6709\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u3092\u5229\u7528\u3057\u3066\u3001\u4EEE\u60F3\u7684\u306A\u5C02\u7528\u7DDA\u3092\u69CB\u7BC9\u3059\u308B\u6280\u8853\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["LAN", "WAN", "VPN", "FTTH"],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 185,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 12,
        sub_name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u5FDC\u7528"
      },
      question_text: "\u9AD8\u901F\u306E\u5149\u30D5\u30A1\u30A4\u30D0\u3092\u5EFA\u7269\u5185\u306B\u76F4\u63A5\u5F15\u304D\u8FBC\u307F\u3001\u56DE\u7DDA\u306E\u7D42\u7AEF\u306BONU\u3092\u7528\u3044\u3066\u5149\u3068\u96FB\u6C17\u4FE1\u53F7\u3092\u5909\u63DB\u3059\u308B\u30B5\u30FC\u30D3\u30B9\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["ADSL", "FTTH", "ISDN", "\u30C0\u30A4\u30E4\u30EB\u30A2\u30C3\u30D7"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 186,
      category: {
        id: 7,
        name: "\u30C6\u30AF\u30CE\u30ED\u30B8",
        sub_id: 12,
        sub_name: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u5FDC\u7528"
      },
      question_text: "\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u306A\u3069\u3092\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u306E\u4E2D\u7D99\u6A5F\u5668\u306E\u3088\u3046\u306B\u7528\u3044\u3066\u3001\u4ED6\u306E\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u306A\u3069\u3092\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u306B\u63A5\u7D9A\u3055\u305B\u308B\u6A5F\u80FD\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: ["VoLTE", "\u30C6\u30B6\u30EA\u30F3\u30B0", "5G", "\u30ED\u30FC\u30DF\u30F3\u30B0"],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 187,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 1,
        sub_name: "\u7D4C\u55B6\u30FB\u7D44\u7E54\u8AD6"
      },
      question_text: "\u4F01\u696D\u7D4C\u55B6\u306B\u304A\u3044\u3066\u3001\u7D4C\u55B6\u306E\u900F\u660E\u6027\u3092\u9AD8\u3081\u3001\u5229\u5BB3\u95A2\u4FC2\u8005\u304B\u3089\u306E\u4FE1\u983C\u3092\u78BA\u4FDD\u3059\u308B\u305F\u3081\u306E\u4ED5\u7D44\u307F\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B5\u30D7\u30E9\u30A4\u30C1\u30A7\u30FC\u30F3\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\uFF08SCM\uFF09",
            "\u9867\u5BA2\u95A2\u4FC2\u7BA1\u7406\uFF08CRM\uFF09",
            "\u30B3\u30FC\u30DD\u30EC\u30FC\u30C8\u30AC\u30D0\u30CA\u30F3\u30B9",
            "\u4E8B\u696D\u7D99\u7D9A\u8A08\u753B\uFF08BCP\uFF09"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 188,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 1,
        sub_name: "\u7D4C\u55B6\u30FB\u7D44\u7E54\u8AD6"
      },
      question_text: "\u4F01\u696D\u304C\u7D4C\u55B6\u6D3B\u52D5\u3092\u884C\u3046\u4E0A\u3067\u91CD\u8981\u3068\u306A\u308B\u7D4C\u55B6\u8CC7\u6E90\u300C\u30D2\u30C8\u30FB\u30E2\u30CE\u30FB\u30AB\u30CD\u30FB\u60C5\u5831\u300D\u306E\u3046\u3061\u3001\u60C5\u5831\u306B\u8A72\u5F53\u3059\u308B\u5177\u4F53\u7684\u306A\u4F8B\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u5F93\u696D\u54E1\u306E\u30B9\u30AD\u30EB\u3068\u7D4C\u9A13",
            "\u81EA\u793E\u5DE5\u5834\u3068\u8A2D\u5099",
            "\u9867\u5BA2\u30C7\u30FC\u30BF\u3068\u7279\u8A31\u60C5\u5831",
            "\u73FE\u91D1\u3068\u9810\u91D1"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 189,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 2,
        sub_name: "\u696D\u52D9\u5206\u6790\u30FB\u30C7\u30FC\u30BF\u5229\u6D3B\u7528"
      },
      question_text: "\u54C1\u8CEA\u7BA1\u7406\u624B\u6CD5\u306E\u300CQC\u4E03\u3064\u9053\u5177\u300D\u306E\u3046\u3061\u3001\u9805\u76EE\u5225\u306B\u5C64\u5225\u3057\u3066\u51FA\u73FE\u983B\u5EA6\u306E\u9AD8\u3044\u9806\u306B\u4E26\u3079\u3001\u7D2F\u7A4D\u548C\u3092\u6298\u308C\u7DDA\u30B0\u30E9\u30D5\u3067\u8868\u3059\u56F3\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D2\u30B9\u30C8\u30B0\u30E9\u30E0",
            "\u30D1\u30EC\u30FC\u30C8\u56F3",
            "\u7BA1\u7406\u56F3",
            "\u7279\u6027\u8981\u56E0\u56F3"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 190,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 2,
        sub_name: "\u696D\u52D9\u5206\u6790\u30FB\u30C7\u30FC\u30BF\u5229\u6D3B\u7528"
      },
      question_text: "\u591A\u304F\u306E\u6563\u4E71\u3057\u305F\u60C5\u5831\u304B\u3089\u3001\u8A00\u8449\u306E\u610F\u5473\u5408\u3044\u3092\u6574\u7406\u3057\u3066\u554F\u984C\u3092\u78BA\u5B9A\u3059\u308B\u300C\u65B0QC\u4E03\u3064\u9053\u5177\u300D\u306E\u624B\u6CD5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u89AA\u548C\u56F3\u6CD5",
            "\u9023\u95A2\u56F3\u6CD5",
            "\u7CFB\u7D71\u56F3\u6CD5",
            "\u30DE\u30C8\u30EA\u30C3\u30AF\u30B9\u56F3\u6CD5"
          ],
          correct_answer_index: 0
        }
      }
    },
    {
      id: 191,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 3,
        sub_name: "\u4F1A\u8A08\u30FB\u8CA1\u52D9"
      },
      question_text: "\u4F01\u696D\u306E\u8CA1\u653F\u72B6\u614B\u3092\u4E00\u5B9A\u6642\u70B9\uFF08\u671F\u672B\u306A\u3069\uFF09\u3067\u793A\u3059\u8CA1\u52D9\u8AF8\u8868\u3067\u3001\u300C\u8CC7\u7523\u300D\u300C\u8CA0\u50B5\u300D\u300C\u7D14\u8CC7\u7523\u300D\u3067\u69CB\u6210\u3055\u308C\u308B\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u640D\u76CA\u8A08\u7B97\u66F8",
            "\u30AD\u30E3\u30C3\u30B7\u30E5\u30D5\u30ED\u30FC\u8A08\u7B97\u66F8",
            "\u8CB8\u501F\u5BFE\u7167\u8868",
            "\u88FD\u9020\u539F\u4FA1\u660E\u7D30\u66F8"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 192,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 3,
        sub_name: "\u4F1A\u8A08\u30FB\u8CA1\u52D9"
      },
      question_text: "\u8A2D\u5099\u306A\u3069\u306E\u56FA\u5B9A\u8CC7\u7523\u306E\u53D6\u5F97\u8CBB\u7528\u3092\u3001\u5229\u7528\u3059\u308B\u671F\u9593\u306B\u308F\u305F\u3063\u3066\u8CBB\u7528\u3068\u3057\u3066\u914D\u5206\u3059\u308B\u4F1A\u8A08\u51E6\u7406\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u68DA\u5378\u8CC7\u7523\u8A55\u4FA1",
            "\u6E1B\u4FA1\u511F\u5374",
            "\u5F15\u5F53\u91D1\u8A2D\u5B9A",
            "\u53CE\u76CA\u8A8D\u8B58"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 193,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 4,
        sub_name: "\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u6226\u7565"
      },
      question_text: "\u539F\u6750\u6599\u306E\u8ABF\u9054\u304B\u3089\u6700\u7D42\u6D88\u8CBB\u8005\u3078\u306E\u8CA9\u58F2\u306B\u81F3\u308B\u307E\u3067\u306E\u4E00\u9023\u306E\u30D7\u30ED\u30BB\u30B9\u3092\u3001\u4F01\u696D\u306E\u67A0\u3092\u8D85\u3048\u3066\u7D71\u5408\u7684\u306B\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u3059\u308B\u30B7\u30B9\u30C6\u30E0\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "CRM\uFF08Customer Relationship Management\uFF09",
            "ERP\uFF08Enterprise Resource Planning\uFF09",
            "SCM\uFF08Supply Chain Management\uFF09",
            "KMS\uFF08Knowledge Management System\uFF09"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 194,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 4,
        sub_name: "\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u6226\u7565"
      },
      question_text: "\u4F01\u696D\u306E\u7D4C\u55B6\u6226\u7565\u3092IT\u3067\u5B9F\u73FE\u3059\u308B\u305F\u3081\u306B\u3001\u5168\u4F53\u30B7\u30B9\u30C6\u30E0\u5316\u8A08\u753B\u3084\u60C5\u5831\u5316\u6295\u8CC7\u8A08\u753B\u3092\u7B56\u5B9A\u3059\u308B\u6D3B\u52D5\u306F\u3001\u4E3B\u306B\u8AB0\u304C\u4E2D\u5FC3\u3068\u306A\u3063\u3066\u884C\u3044\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B7\u30B9\u30C6\u30E0\u76E3\u67FB\u4EBA",
            "CIO\uFF08Chief Information Officer\uFF09",
            "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30DE\u30CD\u30FC\u30B8\u30E3",
            "IT\u30B3\u30F3\u30B5\u30EB\u30BF\u30F3\u30C8"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 195,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 5,
        sub_name: "\u696D\u52D9\u30D7\u30ED\u30BB\u30B9"
      },
      question_text: "\u696D\u52D9\u30D7\u30ED\u30BB\u30B9\u306E\u53EF\u8996\u5316\u306B\u7528\u3044\u3089\u308C\u308B\u624B\u6CD5\u3068\u3001\u305D\u306E\u4E3B\u306A\u76EE\u7684\u306E\u7D44\u307F\u5408\u308F\u305B\u3068\u3057\u3066\u3001\u9069\u5207\u306A\u3082\u306E\u3092\u9078\u3073\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "DFD\uFF08Data Flow Diagram\uFF09", right: "\u30C7\u30FC\u30BF\u306E\u6D41\u308C\u3092\u8A18\u8FF0\u3059\u308B" },
          { id: 2, left: "E-R\u56F3\uFF08Entity-Relationship Diagram\uFF09", right: "\u30C7\u30FC\u30BF\u9593\u306E\u95A2\u9023\u3092\u8868\u73FE\u3059\u308B" }
        ]
      }
    },
    {
      id: 196,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 6,
        sub_name: "\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u30D3\u30B8\u30CD\u30B9"
      },
      question_text: "\u30AF\u30E9\u30A6\u30C9\u30B3\u30F3\u30D4\u30E5\u30FC\u30C6\u30A3\u30F3\u30B0\u306E\u30B5\u30FC\u30D3\u30B9\u5F62\u614B\u3067\u3001\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u3092\u958B\u767A\u30FB\u5B9F\u884C\u3059\u308B\u305F\u3081\u306E\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3092\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u7D4C\u7531\u3067\u63D0\u4F9B\u3059\u308B\u30E2\u30C7\u30EB\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "IaaS\uFF08Infrastructure as a Service\uFF09",
            "SaaS\uFF08Software as a Service\uFF09",
            "PaaS\uFF08Platform as a Service\uFF09",
            "DaaS\uFF08Desktop as a Service\uFF09"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 197,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 6,
        sub_name: "\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u30D3\u30B8\u30CD\u30B9"
      },
      question_text: "\u9867\u5BA2\u306E\u7D4C\u55B6\u8AB2\u984C\u3092IT\u3068\u4ED8\u52A0\u30B5\u30FC\u30D3\u30B9\u3092\u901A\u3057\u3066\u89E3\u6C7A\u3059\u308B\u30D3\u30B8\u30CD\u30B9\u30E2\u30C7\u30EB\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30D7\u30ED\u30C0\u30AF\u30C8\u30A2\u30A6\u30C8\u30D3\u30B8\u30CD\u30B9",
            "\u30E9\u30A4\u30BB\u30F3\u30B9\u30D3\u30B8\u30CD\u30B9",
            "\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u30D3\u30B8\u30CD\u30B9",
            "\u30B3\u30F3\u30B5\u30EB\u30C6\u30A3\u30F3\u30B0\u30B5\u30FC\u30D3\u30B9"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 198,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 7,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u6D3B\u7528\u4FC3\u9032\u30FB\u8A55\u4FA1"
      },
      question_text: "IT\u30B7\u30B9\u30C6\u30E0\u306E\u5C0E\u5165\u52B9\u679C\u3092\u8A55\u4FA1\u3059\u308B\u6307\u6A19\u306E\u4E00\u3064\u3067\u3001\u6295\u8CC7\u984D\u306B\u5BFE\u3057\u3066\u3069\u308C\u3060\u3051\u306E\u5229\u76CA\u304C\u5F97\u3089\u308C\u305F\u304B\u3092\u793A\u3059\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "TCO\uFF08Total Cost of Ownership\uFF09",
            "ROI\uFF08Return On Investment\uFF09",
            "KPI\uFF08Key Performance Indicator\uFF09",
            "CSF\uFF08Critical Success Factor\uFF09"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 199,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 7,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u6D3B\u7528\u4FC3\u9032\u30FB\u8A55\u4FA1"
      },
      question_text: "\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u306E\u5229\u7528\u3092\u4FC3\u9032\u3057\u3001\u305D\u306E\u52B9\u679C\u3092\u6E2C\u5B9A\u30FB\u8A55\u4FA1\u3059\u308B\u6D3B\u52D5\u306B\u95A2\u9023\u3059\u308B\u7528\u8A9E\u3068\u8AAC\u660E\u306E\u7D44\u307F\u5408\u308F\u305B\u3068\u3057\u3066\u3001\u9069\u5207\u306A\u3082\u306E\u3092\u9078\u3073\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "DX\uFF08\u30C7\u30B8\u30BF\u30EB\u30C8\u30E9\u30F3\u30B9\u30D5\u30A9\u30FC\u30E1\u30FC\u30B7\u30E7\u30F3\uFF09", right: "\u30C7\u30B8\u30BF\u30EB\u6280\u8853\u3092\u6D3B\u7528\u3057\u3066\u30D3\u30B8\u30CD\u30B9\u30E2\u30C7\u30EB\u3092\u5909\u9769\u3059\u308B" },
          { id: 2, left: "\u30C7\u30FC\u30BF\u30B5\u30A4\u30A8\u30F3\u30B9", right: "\u30C7\u30FC\u30BF\u304B\u3089\u65B0\u305F\u306A\u77E5\u898B\u3092\u5F97\u3066\u8AB2\u984C\u89E3\u6C7A\u3092\u652F\u63F4\u3059\u308B" }
        ]
      }
    },
    {
      id: 200,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 8,
        sub_name: "\u30B7\u30B9\u30C6\u30E0\u5316\u8A08\u753B"
      },
      question_text: "\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u306E\u5C0E\u5165\u306B\u304A\u3044\u3066\u3001\u591A\u65B9\u9762\u304B\u3089\u5206\u6790\u3057\u3066\u8981\u6C42\u4E8B\u9805\u3092\u96C6\u3081\u308B\u521D\u671F\u6BB5\u968E\u306E\u30D7\u30ED\u30BB\u30B9\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u30B7\u30B9\u30C6\u30E0\u5316\u8A08\u753B",
            "\u8981\u4EF6\u5B9A\u7FA9",
            "\u30B7\u30B9\u30C6\u30E0\u5316\u69CB\u60F3",
            "\u958B\u767A\u30D7\u30ED\u30BB\u30B9"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 201,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 9,
        sub_name: "\u8981\u4EF6\u5B9A\u7FA9"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u306B\u6C42\u3081\u3089\u308C\u308B\u300C\u3007\u3007\u3092\u691C\u7D22\u3067\u304D\u308B\u300D\u300C\u3007\u3007\u3092\u767B\u9332\u3067\u304D\u308B\u300D\u3068\u3044\u3063\u305F\u3001\u5177\u4F53\u7684\u306A\u6A5F\u80FD\u306B\u95A2\u3059\u308B\u8981\u6C42\u3092\u4F55\u3068\u547C\u3073\u307E\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u975E\u6A5F\u80FD\u8981\u4EF6",
            "\u6A5F\u80FD\u8981\u4EF6",
            "\u696D\u52D9\u8981\u4EF6",
            "\u79FB\u884C\u8981\u4EF6"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 202,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 9,
        sub_name: "\u8981\u4EF6\u5B9A\u7FA9"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u958B\u767A\u30D7\u30ED\u30BB\u30B9\u306E\u3046\u3061\u3001\u5229\u5BB3\u95A2\u4FC2\u8005\u306E\u8981\u6C42\u3092\u307E\u3068\u3081\u3001\u30B7\u30B9\u30C6\u30E0\u3084\u696D\u52D9\u5168\u4F53\u306E\u67A0\u7D44\u307F\u3068\u6A5F\u80FD\u3092\u660E\u78BA\u306B\u3059\u308B\u6D3B\u52D5\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "\u8981\u6C42\u5206\u6790",
            "\u8981\u4EF6\u5B9A\u7FA9",
            "\u30B7\u30B9\u30C6\u30E0\u8A2D\u8A08",
            "\u53D7\u5165\u30C6\u30B9\u30C8"
          ],
          correct_answer_index: 1
        }
      }
    },
    {
      id: 203,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 10,
        sub_name: "\u8ABF\u9054\u8A08\u753B\u30FB\u5B9F\u65BD"
      },
      question_text: "\u30B7\u30B9\u30C6\u30E0\u8ABF\u9054\u306B\u304A\u3044\u3066\u3001\u767A\u6CE8\u8005\u304C\u30D9\u30F3\u30C0\u4F01\u696D\u306B\u5BFE\u3057\u3001\u30B7\u30B9\u30C6\u30E0\u5316\u306E\u76EE\u7684\u3084\u696D\u52D9\u5185\u5BB9\u3092\u793A\u3057\u3001\u81EA\u793E\u306E\u8981\u4EF6\u5B9A\u7FA9\u66F8\u4F5C\u6210\u306E\u305F\u3081\u306B\u60C5\u5831\u63D0\u4F9B\u3092\u4F9D\u983C\u3059\u308B\u6587\u66F8\u306F\u4F55\u3067\u3059\u304B\uFF1F",
      question_interaction: {
        type: "MultipleChoice",
        data: {
          texts: [
            "RFP\uFF08Request For Proposal\uFF09",
            "SLA\uFF08Service Level Agreement\uFF09",
            "RFI\uFF08Request For Information\uFF09",
            "NDA\uFF08Non-Disclosure Agreement\uFF09"
          ],
          correct_answer_index: 2
        }
      }
    },
    {
      id: 204,
      category: {
        id: 8,
        name: "\u30B9\u30C8\u30E9\u30C6\u30B8",
        sub_id: 10,
        sub_name: "\u8ABF\u9054\u8A08\u753B\u30FB\u5B9F\u65BD"
      },
      question_text: "\u8ABF\u9054\u5951\u7D04\u306E\u7A2E\u985E\u3068\u305D\u306E\u7279\u5FB4\u306E\u7D44\u307F\u5408\u308F\u305B\u3068\u3057\u3066\u3001\u9069\u5207\u306A\u3082\u306E\u3092\u9078\u3073\u306A\u3055\u3044\u3002",
      question_interaction: {
        type: "Association",
        data: [
          { id: 1, left: "\u8ACB\u8CA0\u5951\u7D04", right: "\u5951\u7D04\u3057\u305F\u4ED5\u4E8B\u3092\u5B8C\u6210\u3055\u305B\u308B\u8CAC\u4EFB\u3092\u8CA0\u3046" },
          { id: 2, left: "\u6E96\u59D4\u4EFB\u5951\u7D04", right: "\u5584\u7BA1\u6CE8\u610F\u7FA9\u52D9\u3092\u8CA0\u3046\u304C\u3001\u5B8C\u6210\u8CAC\u4EFB\u306F\u8CA0\u308F\u306A\u3044" }
        ]
      }
    }
  ]
};

// build/dev/javascript/study_app/interface/extra_data.mjs
var rootWord = {
  id: 1,
  name: "\u8A9E\u6839",
  sub_id: 1,
  sub_name: ""
};
var prefix = {
  id: 2,
  name: "\u63A5\u982D\u8A9E",
  sub_id: 1,
  sub_name: ""
};
var categories = [
  { id: 1, name: "\u8A9E\u6839", sub: [{ id: 1, name: "" }] },
  { id: 2, name: "\u63A5\u982D\u8A9E", sub: [{ id: 1, name: "" }] }
];
var questions = [
  {
    id: 1,
    category: rootWord,
    question_text: "\u8A9E\u6839\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 1, left: "-aud- / -audi-", right: "\u805E\u304F" },
        { id: 2, left: "-auto-", right: "\u81EA\u5DF1" },
        { id: 3, left: "-bene-", right: "\u826F\u3044\u3001\u3046\u307E\u304F" },
        { id: 4, left: "-bio-", right: "\u751F\u547D" }
      ]
    }
  },
  {
    id: 2,
    category: rootWord,
    question_text: "\u8A9E\u6839\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 5, left: "-chron-", right: "\u6642\u9593" },
        { id: 6, left: "-dict-", right: "\u8A00\u3046\u3001\u8A71\u3059" },
        { id: 7, left: "-duc- / -duct-", right: "\u5C0E\u304F" },
        { id: 8, left: "-gen-", right: "\u751F\u3080\u3001\u751F\u7523\u3059\u308B\u3001\u7A2E\u985E" }
      ]
    }
  },
  {
    id: 3,
    category: rootWord,
    question_text: "\u8A9E\u6839\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 9, left: "-geo-", right: "\u5730\u7403" },
        { id: 10, left: "-graph- / -gram-", right: "\u66F8\u304F\u3001\u63CF\u304F\u3001\u8A18\u9332\u3059\u308B" },
        { id: 11, left: "-hydr-", right: "\u6C34" },
        { id: 12, left: "-log- / -logy-", right: "\u8A00\u8449\u3001\u7814\u7A76" }
      ]
    }
  },
  {
    id: 4,
    category: rootWord,
    question_text: "\u8A9E\u6839\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 13, left: "-man- / -manu-", right: "\u624B" },
        { id: 14, left: "-meter- / -metr-", right: "\u6E2C\u308B" },
        { id: 15, left: "-ped- / -pod-", right: "\u8DB3" },
        { id: 16, left: "-phon-", right: "\u97F3" }
      ]
    }
  },
  {
    id: 5,
    category: rootWord,
    question_text: "\u8A9E\u6839\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 17, left: "-photo-", right: "\u5149" },
        { id: 18, left: "-port-", right: "\u904B\u3076" },
        { id: 19, left: "-rupt-", right: "\u58CA\u3059" },
        { id: 20, left: "-scrib- / -script-", right: "\u66F8\u304F" }
      ]
    }
  },
  {
    id: 6,
    category: rootWord,
    question_text: "\u8A9E\u6839\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 21, left: "-spec- / -spect-", right: "\u898B\u308B" },
        { id: 22, left: "-struct-", right: "\u5EFA\u3066\u308B" },
        { id: 23, left: "-tele-", right: "\u9060\u3044" },
        { id: 24, left: "-terr-", right: "\u5730\u3001\u571F\u5730" }
      ]
    }
  },
  {
    id: 7,
    category: rootWord,
    question_text: "\u8A9E\u6839\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 25, left: "-therm-", right: "\u71B1" },
        { id: 26, left: "-tract-", right: "\u5F15\u304F" },
        { id: 27, left: "-ven- / -vent-", right: "\u6765\u308B" },
        { id: 28, left: "-vert- / -vers-", right: "\u56DE\u3059" }
      ]
    }
  },
  {
    id: 8,
    category: rootWord,
    question_text: "\u8A9E\u6839\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 29, left: "-vid- / -vis-", right: "\u898B\u308B" },
        { id: 30, left: "-voc- / -vok-", right: "\u58F0\u3001\u547C\u3076" }
      ]
    }
  },
  {
    id: 9,
    category: prefix,
    question_text: "\u63A5\u982D\u8A9E\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 31, left: "a-/an-", right: "\u301C\u3067\u306A\u3044\u3001\u301C\u304C\u306A\u3044" },
        { id: 32, left: "anti-", right: "\u53CD\u5BFE\u3001\u9006" },
        { id: 33, left: "auto-", right: "\u81EA\u5DF1\u3001\u81EA\u52D5" },
        { id: 34, left: "bi-", right: "2\u3064\u306E" }
      ]
    }
  },
  {
    id: 10,
    category: prefix,
    question_text: "\u63A5\u982D\u8A9E\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 35, left: "co-/con-/com-", right: "\u5171\u306B\u3001\u4E00\u7DD2\u306B" },
        { id: 36, left: "de-", right: "\u4E0B\u3078\u3001\u96E2\u308C\u3066\u3001\u53CD\u5BFE" },
        { id: 37, left: "dis-", right: "\u301C\u3067\u306A\u3044\u3001\u301C\u306E\u53CD\u5BFE" },
        { id: 38, left: "ex-", right: "\u5916\u3078\u3001\u5143\u306E" }
      ]
    }
  },
  {
    id: 11,
    category: prefix,
    question_text: "\u63A5\u982D\u8A9E\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 39, left: "fore-", right: "\u524D\u306B" },
        { id: 40, left: "il-/im-/in-/ir-", right: "\u301C\u3067\u306A\u3044" },
        { id: 41, left: "inter-", right: "\u9593\u306B\u3001\u301C\u306E\u9593\u3067" },
        { id: 42, left: "mal-", right: "\u60AA\u3044\u3001\u4E0D\u6B63\u306A" }
      ]
    }
  },
  {
    id: 12,
    category: prefix,
    question_text: "\u63A5\u982D\u8A9E\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 43, left: "micro-", right: "\u5C0F\u3055\u3044" },
        { id: 44, left: "mid-", right: "\u4E2D\u9593\u306E" },
        { id: 45, left: "mono-", right: "1\u3064\u306E" },
        { id: 46, left: "multi-", right: "\u591A\u304F\u306E" }
      ]
    }
  },
  {
    id: 13,
    category: prefix,
    question_text: "\u63A5\u982D\u8A9E\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 47, left: "non-", right: "\u301C\u3067\u306A\u3044" },
        { id: 48, left: "over-", right: "\u301C\u3057\u3059\u304E\u308B\u3001\u4E0A\u306B" },
        { id: 49, left: "post-", right: "\u5F8C\u306B" },
        { id: 50, left: "pre-", right: "\u524D\u306B" }
      ]
    }
  },
  {
    id: 14,
    category: prefix,
    question_text: "\u63A5\u982D\u8A9E\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 51, left: "re-", right: "\u518D\u3073\u3001\u5F8C\u308D\u3078" },
        { id: 52, left: "sub-", right: "\u4E0B\u306B" },
        { id: 53, left: "super-", right: "\u4E0A\u306B\u3001\u8D85\u3048\u3066" },
        { id: 54, left: "trans-", right: "\u6A2A\u5207\u3063\u3066\u3001\u901A\u3057\u3066" }
      ]
    }
  },
  {
    id: 15,
    category: prefix,
    question_text: "\u63A5\u982D\u8A9E\u3068\u3001\u610F\u5473/\u7528\u4F8B\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    question_interaction: {
      type: "Association",
      data: [
        { id: 55, left: "tri-", right: "3\u3064\u306E" },
        { id: 56, left: "un-", right: "\u301C\u3067\u306A\u3044\u3001\u301C\u306E\u53CD\u5BFE" },
        { id: 57, left: "uni-", right: "1\u3064\u306E" },
        { id: 58, left: "under-", right: "\u301C\u304C\u8DB3\u308A\u306A\u3044\u3001\u4E0B\u306B" }
      ]
    }
  }
];
var extra_data_default = {
  categories,
  questions
};

// build/dev/javascript/study_app/interface/indexedDB_ffi.mjs
var DATADEFAULT = "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3";
var DATAEXTRA = "\u82F1\u8A9E\u8A9E\u6839";
var dataSet = [DATADEFAULT, DATAEXTRA];
var CATEGORY_STORE = "categories";
var QUESTION_STORE = "questions";
var HISTORY_STORE = "history";
function getDataSetName() {
  return dataSet;
}
var STORE_CONFIGS = [
  {
    storeName: CATEGORY_STORE,
    keyPath: { keyPath: "id" }
  },
  {
    storeName: QUESTION_STORE,
    keyPath: { keyPath: "id" }
  },
  {
    storeName: HISTORY_STORE,
    keyPath: { keyPath: "id" }
  }
];
function setup(dbName, version, dataSetName) {
  console.log("setup db:", dbName, version, dataSetName);
  return new Promise((resolve2, reject) => {
    let data;
    let name2;
    switch (dataSetName) {
      case DATAEXTRA:
        data = extra_data_default;
        name2 = dbName + "_" + DATAEXTRA;
        break;
      default:
        data = data_default;
        name2 = dbName + "_" + DATADEFAULT;
        break;
    }
    const request = indexedDB.open(name2, version);
    request.onerror = (event4) => {
      console.error("Database error:", event4.target.error);
      reject(event4.target.error);
    };
    request.onsuccess = (event4) => {
      console.log("Database opened successfully");
      resolve2(event4.target.result);
    };
    request.onupgradeneeded = (event4) => {
      console.log("Database upgrade needed");
      const db = event4.target.result;
      STORE_CONFIGS.forEach((config) => {
        if (!db.objectStoreNames.contains(config.storeName)) {
          db.createObjectStore(config.storeName, config.keyPath);
        }
      });
      const transaction = event4.target.transaction;
      transaction.onerror = (e) => {
        console.log("setup Error", event4.target.error);
        reject(db);
      };
      transaction.oncomplete = (_) => {
        console.log("Quiz history saved successfully");
        resolve2(db);
      };
      if (data.categories) {
        const categoryStore = transaction.objectStore(CATEGORY_STORE);
        data.categories.forEach((category) => {
          categoryStore.add(category);
        });
      }
      if (data.questions) {
        const questionStore = transaction.objectStore(QUESTION_STORE);
        data.questions.forEach((question) => {
          questionStore.add(question);
        });
        const historyStore = transaction.objectStore(HISTORY_STORE);
        data.questions.forEach((q) => {
          historyStore.add({
            id: q.id,
            category: q.category,
            answer: ["NotAnswered"]
          });
        });
      }
      console.log("Database setup and data seeding complete.");
    };
  });
}
function getCategories(db) {
  return new Promise((resolve2, reject) => {
    const transaction = db.transaction([CATEGORY_STORE], "readonly");
    const store = transaction.objectStore(CATEGORY_STORE);
    const request = store.getAll();
    request.onerror = (event4) => {
      reject(event4.target.error);
    };
    request.onsuccess = (event4) => {
      resolve2(event4.target.result);
    };
  });
}
function getQuestionIdAndCategoryList(db) {
  return new Promise((resolve2, reject) => {
    const transaction = db.transaction([QUESTION_STORE], "readonly");
    const store = transaction.objectStore(QUESTION_STORE);
    const request = store.getAll();
    request.onerror = (event4) => {
      reject(event4.target.error);
    };
    request.onsuccess = (event4) => {
      const questions2 = event4.target.result;
      const idAndCategoryList = questions2.map((q) => ({
        id: q.id,
        category: q.category
        // categoryオブジェクト全体を渡す
      }));
      resolve2(idAndCategoryList);
    };
  });
}
function getQuestionByIds(db, ids) {
  return new Promise((resolve2, reject) => {
    const transaction = db.transaction([QUESTION_STORE], "readonly");
    const store = transaction.objectStore(QUESTION_STORE);
    if (!Array.isArray(ids)) {
      ids = [...ids];
    }
    const results = [];
    let completedRequests = 0;
    ids.forEach((id) => {
      const request = store.get(id);
      request.onerror = (event4) => {
        reject(event4.target.error);
      };
      request.onsuccess = (event4) => {
        results.push(event4.target.result);
        completedRequests++;
        if (completedRequests === ids.length) {
          resolve2(results);
        }
      };
    });
  });
}
function saveQuizHistory(db, results) {
  return new Promise((resolve2, reject) => {
    const transaction = db.transaction([HISTORY_STORE], "readwrite");
    transaction.onerror = (event4) => {
      console.log("Error saving quiz history:", event4.target.error);
      reject(new Error(null));
    };
    transaction.oncomplete = (event4) => {
      console.log("Quiz history saved successfully");
      resolve2(new Ok(null));
    };
    const store = transaction.objectStore(HISTORY_STORE);
    results.forEach((q) => {
      store.put({
        id: q.id,
        category: q.category,
        answer: q.answer
      });
    });
  });
}
function getQuizHistory(db) {
  return new Promise((resolve2, reject) => {
    const transaction = db.transaction([HISTORY_STORE], "readonly");
    const store = transaction.objectStore(HISTORY_STORE);
    const request = store.getAll();
    request.onerror = (event4) => {
      reject(event4.target.error);
    };
    request.onsuccess = (event4) => {
      resolve2(event4.target.result);
    };
  });
}

// build/dev/javascript/study_app/interface/indexed_db.mjs
var DB = class extends CustomType {
  constructor(db, data_set_list, data_set, name2, version) {
    super();
    this.db = db;
    this.data_set_list = data_set_list;
    this.data_set = data_set;
    this.name = name2;
    this.version = version;
  }
};
function get_data_set_name() {
  let _pipe = getDataSetName();
  let _pipe$1 = run(_pipe, list2(string2));
  return unwrap(_pipe$1, toList([]));
}
function setup2(data_set_list, data_set, name2, version) {
  let _pipe = setup(name2, version, data_set);
  return map_promise(
    _pipe,
    (db) => {
      return new DB(db, data_set_list, data_set, name2, version);
    }
  );
}
function switch$(db, data_set) {
  return setup2(db.data_set_list, data_set, db.name, db.version);
}
function get_categories(db) {
  let _pipe = getCategories(db.db);
  return map_promise(
    _pipe,
    (dynamic2) => {
      return run(dynamic2, list2(decoder()));
    }
  );
}
function get_question_by_ids(db, id) {
  let _pipe = getQuestionByIds(db.db, id);
  return map_promise(
    _pipe,
    (dynamic2) => {
      return run(dynamic2, list2(decoder5()));
    }
  );
}
function get_question_id_and_category_list(db) {
  let decoder7 = field(
    "id",
    int2,
    (id) => {
      return field(
        "category",
        qusetion_category_decoder(),
        (category) => {
          return success(new IdAndCategory(id, category));
        }
      );
    }
  );
  let _pipe = getQuestionIdAndCategoryList(db.db);
  return map_promise(
    _pipe,
    (dynamic2) => {
      return run(dynamic2, list2(decoder7));
    }
  );
}
function save_quiz_history(db, results) {
  let _pipe = results;
  let _pipe$1 = to_json7(_pipe);
  let _pipe$2 = ((_capture) => {
    return saveQuizHistory(db.db, _capture);
  })(
    _pipe$1
  );
  return map_promise(_pipe$2, (_) => {
    return new Ok(void 0);
  });
}
function get_quiz_historys(db) {
  let _pipe = getQuizHistory(db.db);
  return map_promise(
    _pipe,
    (dynamic2) => {
      return run(dynamic2, decoder6());
    }
  );
}

// build/dev/javascript/study_app/extra/list_.mjs
function get_at(list4, at) {
  let _pipe = drop(list4, at);
  return ((xs) => {
    if (xs instanceof Empty) {
      return new None();
    } else {
      let x = xs.head;
      return new Some(x);
    }
  })(_pipe);
}
function update_at(list4, at, fun) {
  return index_map(
    list4,
    (x, index5) => {
      let $ = index5 === at;
      if ($) {
        return fun(x);
      } else {
        return x;
      }
    }
  );
}
function update_if(list4, prefix2, fun) {
  return map(
    list4,
    (x) => {
      let $ = prefix2(x);
      if ($) {
        return fun(x);
      } else {
        return x;
      }
    }
  );
}

// build/dev/javascript/study_app/pages/quiz_home.mjs
var Model4 = class extends CustomType {
  constructor(db, categories2, question_id_categories, shuffle_or_not, selected_category, selected_count, selected_question_ids, loading, error, quiz_result, show_history) {
    super();
    this.db = db;
    this.categories = categories2;
    this.question_id_categories = question_id_categories;
    this.shuffle_or_not = shuffle_or_not;
    this.selected_category = selected_category;
    this.selected_count = selected_count;
    this.selected_question_ids = selected_question_ids;
    this.loading = loading;
    this.error = error;
    this.quiz_result = quiz_result;
    this.show_history = show_history;
  }
};
var SelectedCategory = class extends CustomType {
  constructor(is_selected, category) {
    super();
    this.is_selected = is_selected;
    this.category = category;
  }
};
var Limit = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Full = class extends CustomType {
};
var SelectDb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DbChanged = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SelectCategory = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var SelectCount = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SwitchShuffle = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SWitchAllCategory = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ViewHistory = class extends CustomType {
};
var GetCategories = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var GetQuestionIdAndCategoryList = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var GetQuizHistory = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var StartQuiz = class extends CustomType {
};
var OutCome = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ErrScreen = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function get_initial_data_effects(db) {
  let _block;
  let _pipe = get_categories(db);
  _block = to_effect(
    _pipe,
    (var0) => {
      return new GetCategories(var0);
    },
    (var0) => {
      return new ErrScreen(var0);
    }
  );
  let get_categories2 = _block;
  let _block$1;
  let _pipe$1 = get_question_id_and_category_list(db);
  _block$1 = to_effect(
    _pipe$1,
    (var0) => {
      return new GetQuestionIdAndCategoryList(var0);
    },
    (var0) => {
      return new ErrScreen(var0);
    }
  );
  let get_question_id_and_category_list2 = _block$1;
  let _block$2;
  let _pipe$2 = get_quiz_historys(db);
  _block$2 = to_effect(
    _pipe$2,
    (var0) => {
      return new GetQuizHistory(var0);
    },
    (var0) => {
      return new ErrScreen(var0);
    }
  );
  let get_history = _block$2;
  return batch(
    toList([get_categories2, get_question_id_and_category_list2, get_history])
  );
}
function init2(db) {
  return [
    new Model4(
      db,
      toList([]),
      toList([]),
      false,
      toList([]),
      new Full(),
      toList([]),
      false,
      new None(),
      toList([]),
      false
    ),
    get_initial_data_effects(db)
  ];
}
function shuffle2(xs, is_shuffle) {
  if (is_shuffle) {
    return shuffle(xs);
  } else {
    return xs;
  }
}
function filtering_question_id(id_categorie_list, selected_category_ids, selected_count, do_shuffle) {
  let _block;
  let _pipe = selected_category_ids;
  let _pipe$1 = filter(_pipe, (c) => {
    return c.is_selected;
  });
  _block = map(_pipe$1, (c) => {
    return c.category.id;
  });
  let filtered_category_ids = _block;
  let _block$1;
  let _pipe$2 = id_categorie_list;
  let _pipe$3 = filter(
    _pipe$2,
    (q) => {
      return contains(filtered_category_ids, q.category.id);
    }
  );
  _block$1 = map(_pipe$3, (c) => {
    return c.id;
  });
  let filtered_questions = _block$1;
  let _block$2;
  if (selected_count instanceof Limit) {
    let count = selected_count[0];
    _block$2 = count;
  } else {
    _block$2 = length(filtered_questions);
  }
  let limit_count = _block$2;
  let _pipe$4 = shuffle2(filtered_questions, do_shuffle);
  return take(_pipe$4, limit_count);
}
function update5(model, msg) {
  if (msg instanceof SelectDb) {
    let data_set_name = msg[0];
    let _block;
    let _record = model.db;
    _block = new DB(
      _record.db,
      _record.data_set_list,
      data_set_name,
      _record.name,
      _record.version
    );
    let new_db = _block;
    let _block$1;
    let _pipe = switch$(new_db, data_set_name);
    _block$1 = to_effect_simple(
      _pipe,
      (var0) => {
        return new DbChanged(var0);
      }
    );
    let setup_db_effect = _block$1;
    return [
      (() => {
        let _record$1 = model;
        return new Model4(
          new_db,
          _record$1.categories,
          _record$1.question_id_categories,
          _record$1.shuffle_or_not,
          _record$1.selected_category,
          _record$1.selected_count,
          _record$1.selected_question_ids,
          true,
          _record$1.error,
          _record$1.quiz_result,
          _record$1.show_history
        );
      })(),
      setup_db_effect
    ];
  } else if (msg instanceof DbChanged) {
    let new_db = msg[0];
    return [
      (() => {
        let _record = model;
        return new Model4(
          new_db,
          _record.categories,
          _record.question_id_categories,
          _record.shuffle_or_not,
          _record.selected_category,
          _record.selected_count,
          _record.selected_question_ids,
          false,
          _record.error,
          _record.quiz_result,
          _record.show_history
        );
      })(),
      get_initial_data_effects(new_db)
    ];
  } else if (msg instanceof SelectCategory) {
    let id = msg[0];
    let is_selected = msg[1];
    let new_select_category = update_if(
      model.selected_category,
      (c) => {
        return c.category.id === id;
      },
      (c) => {
        return new SelectedCategory(is_selected, c.category);
      }
    );
    let new_question_ids = filtering_question_id(
      model.question_id_categories,
      new_select_category,
      model.selected_count,
      model.shuffle_or_not
    );
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          _record.categories,
          _record.question_id_categories,
          _record.shuffle_or_not,
          new_select_category,
          _record.selected_count,
          new_question_ids,
          _record.loading,
          _record.error,
          _record.quiz_result,
          _record.show_history
        );
      })(),
      none2()
    ];
  } else if (msg instanceof SelectCount) {
    let quest_count = msg[0];
    let new_question_ids = filtering_question_id(
      model.question_id_categories,
      model.selected_category,
      quest_count,
      model.shuffle_or_not
    );
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          _record.categories,
          _record.question_id_categories,
          _record.shuffle_or_not,
          _record.selected_category,
          quest_count,
          new_question_ids,
          _record.loading,
          _record.error,
          _record.quiz_result,
          _record.show_history
        );
      })(),
      none2()
    ];
  } else if (msg instanceof SwitchShuffle) {
    let is_shuffle = msg[0];
    let new_question_ids = shuffle2(model.selected_question_ids, is_shuffle);
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          _record.categories,
          _record.question_id_categories,
          is_shuffle,
          _record.selected_category,
          _record.selected_count,
          new_question_ids,
          _record.loading,
          _record.error,
          _record.quiz_result,
          _record.show_history
        );
      })(),
      none2()
    ];
  } else if (msg instanceof SWitchAllCategory) {
    let is_selected = msg[0];
    echo("SWitchAllCategory", "src/pages/quiz_home.gleam", 194);
    let new_select_category = map(
      model.selected_category,
      (c) => {
        return new SelectedCategory(is_selected, c.category);
      }
    );
    let new_question_ids = filtering_question_id(
      model.question_id_categories,
      new_select_category,
      model.selected_count,
      model.shuffle_or_not
    );
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          _record.categories,
          _record.question_id_categories,
          _record.shuffle_or_not,
          new_select_category,
          _record.selected_count,
          new_question_ids,
          _record.loading,
          _record.error,
          _record.quiz_result,
          _record.show_history
        );
      })(),
      none2()
    ];
  } else if (msg instanceof ViewHistory) {
    echo("View History", "src/pages/quiz_home.gleam", 216);
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          _record.categories,
          _record.question_id_categories,
          _record.shuffle_or_not,
          _record.selected_category,
          _record.selected_count,
          _record.selected_question_ids,
          _record.loading,
          _record.error,
          _record.quiz_result,
          negate(model.show_history)
        );
      })(),
      none2()
    ];
  } else if (msg instanceof GetCategories) {
    let categories2 = msg[0];
    echo("GetCategories", "src/pages/quiz_home.gleam", 223);
    let new_selected_category = map(
      categories2,
      (_capture) => {
        return new SelectedCategory(true, _capture);
      }
    );
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          categories2,
          _record.question_id_categories,
          _record.shuffle_or_not,
          new_selected_category,
          _record.selected_count,
          _record.selected_question_ids,
          _record.loading,
          _record.error,
          _record.quiz_result,
          _record.show_history
        );
      })(),
      none2()
    ];
  } else if (msg instanceof GetQuestionIdAndCategoryList) {
    let id_and_category_list = msg[0];
    echo("GetQuestionIdAndCategoryList", "src/pages/quiz_home.gleam", 238);
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          _record.categories,
          id_and_category_list,
          _record.shuffle_or_not,
          _record.selected_category,
          _record.selected_count,
          map(id_and_category_list, (x) => {
            return x.id;
          }),
          _record.loading,
          _record.error,
          _record.quiz_result,
          _record.show_history
        );
      })(),
      none2()
    ];
  } else if (msg instanceof GetQuizHistory) {
    let quiz_result = msg[0];
    echo("GetQuizHistory", "src/pages/quiz_home.gleam", 250);
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          _record.categories,
          _record.question_id_categories,
          _record.shuffle_or_not,
          _record.selected_category,
          _record.selected_count,
          _record.selected_question_ids,
          false,
          _record.error,
          quiz_result,
          _record.show_history
        );
      })(),
      none2()
    ];
  } else if (msg instanceof StartQuiz) {
    echo("Start Quiz", "src/pages/quiz_home.gleam", 259);
    let _block;
    let _pipe = get_question_by_ids(model.db, model.selected_question_ids);
    _block = to_effect(
      _pipe,
      (var0) => {
        return new OutCome(var0);
      },
      (var0) => {
        return new ErrScreen(var0);
      }
    );
    let eff = _block;
    return [model, eff];
  } else if (msg instanceof OutCome) {
    let questions2 = msg[0];
    console_log(
      "Fetched " + to_string(length(questions2)) + " questions."
    );
    return [model, none2()];
  } else {
    let json_err = msg[0];
    echo("err screen", "src/pages/quiz_home.gleam", 255);
    return [
      (() => {
        let _record = model;
        return new Model4(
          _record.db,
          _record.categories,
          _record.question_id_categories,
          _record.shuffle_or_not,
          _record.selected_category,
          _record.selected_count,
          _record.selected_question_ids,
          _record.loading,
          new Some(json_err),
          _record.quiz_result,
          _record.show_history
        );
      })(),
      none2()
    ];
  }
}
function view_error(error) {
  if (error instanceof Some) {
    return p(toList([class$("Loading error")]), toList([]));
  } else {
    return text3("");
  }
}
function section_container_style() {
  return styles(
    toList([
      ["display", "inline-flex"],
      ["flex-direction", "column"],
      ["padding", "0.5rem"],
      ["border-radius", "0.5rem"],
      ["background-color", "#f0f0f0"]
    ])
  );
}
function section_container_row_style() {
  return styles(
    toList([
      ["display", "inline-flex"],
      ["padding", "0.5rem"],
      ["border-radius", "0.5rem"],
      ["background-color", "#f0f0f0"]
    ])
  );
}
function view_checkbox_label(checked2, label2, handler) {
  return label(
    toList([styles(toList([["cursor", "pointer"]]))]),
    toList([
      input(
        toList([
          type_("checkbox"),
          checked(checked2),
          on_check((checked3) => {
            return handler(checked3);
          })
        ])
      ),
      span(
        toList([styles(toList([["margin-left", "0.5rem"]]))]),
        toList([text3(label2)])
      )
    ])
  );
}
function view_shuffle(shuffle3) {
  return div(
    toList([section_container_style()]),
    toList([
      view_checkbox_label(
        shuffle3,
        "\u30B7\u30E3\u30C3\u30D5\u30EB\u3059\u308B",
        (var0) => {
          return new SwitchShuffle(var0);
        }
      )
    ])
  );
}
function view_radio_with_label(checked2, label2, handler) {
  return label(
    toList([styles(toList([["cursor", "pointer"]]))]),
    toList([
      input(
        toList([
          on_check(handler),
          type_("radio"),
          name("count"),
          value(label2),
          checked(checked2)
        ])
      ),
      span(
        toList([styles(toList([["margin-left", "0.5rem"]]))]),
        toList([text3(label2)])
      )
    ])
  );
}
function view_category_selection(selected_categories, checked2) {
  return div(
    toList([section_container_style()]),
    toList([
      view_checkbox_label(
        checked2,
        "switch all select",
        (var0) => {
          return new SWitchAllCategory(var0);
        }
      ),
      hr(
        toList([
          styles(
            toList([["border", "1px solid #ccc"], ["margin", "0.5rem 0"]])
          )
        ])
      ),
      div(
        toList([
          styles(
            toList([
              ["display", "flex"],
              ["flex-direction", "column"],
              ["margin-left", "1rem"]
            ])
          )
        ]),
        map(
          selected_categories,
          (c) => {
            return view_checkbox_label(
              c.is_selected,
              c.category.name,
              (_capture) => {
                return new SelectCategory(c.category.id, _capture);
              }
            );
          }
        )
      )
    ])
  );
}
function view_count_selection(quest_count) {
  let counts = toList([
    new Full(),
    new Limit(1),
    new Limit(5),
    new Limit(10),
    new Limit(30),
    new Limit(50)
  ]);
  let to_s = (count) => {
    if (count instanceof Limit) {
      let i = count[0];
      return to_string(i) + "\u554F";
    } else {
      return "all";
    }
  };
  return div(
    toList([section_container_row_style()]),
    map(
      counts,
      (count) => {
        let is_selected = isEqual(quest_count, count);
        return view_radio_with_label(
          is_selected,
          to_s(count),
          (_) => {
            return new SelectCount(count);
          }
        );
      }
    )
  );
}
function view_actions(is_start_quiz_enabled) {
  let button_style = (is_primary) => {
    return toList([
      styles(
        toList([
          ["padding", "0.5rem 1rem"],
          ["border", "none"],
          ["border-radius", "0.5rem"],
          [
            "color",
            (() => {
              if (is_primary) {
                return "#393944ff";
              } else {
                return "#6c757d";
              }
            })()
          ],
          ["box-shadow", "0 2px 4px rgba(0, 0, 0, 0.1"],
          ["transition", "background-color 0.2s ease"]
        ])
      )
    ]);
  };
  return div(
    toList([styles(toList([["display", "flex"], ["gap", "1rem"]]))]),
    toList([
      button(
        (() => {
          let _pipe = toList([
            on_click(new StartQuiz()),
            disabled(negate(is_start_quiz_enabled))
          ]);
          return append(_pipe, button_style(is_start_quiz_enabled));
        })(),
        toList([text3("\u30AF\u30A4\u30BA\u958B\u59CB")])
      ),
      button(
        (() => {
          let _pipe = toList([on_click(new ViewHistory())]);
          return append(_pipe, button_style(true));
        })(),
        toList([text3("\u5B66\u7FD2\u5C65\u6B74")])
      )
    ])
  );
}
function view_loading(loading) {
  if (loading) {
    return p(toList([]), toList([text3("Loading...")]));
  } else {
    return text3("");
  }
}
function view_db_selection(data_set_list, selected_db) {
  return div(
    toList([section_container_row_style()]),
    toList([
      select(
        toList([on_change((var0) => {
          return new SelectDb(var0);
        })]),
        map(
          data_set_list,
          (data_set_name) => {
            return option(
              toList([
                value(data_set_name),
                selected(data_set_name === selected_db)
              ]),
              data_set_name
            );
          }
        )
      )
    ])
  );
}
function view6(model) {
  let is_start_quiz_enabled = length(model.selected_question_ids) > 0;
  let _block;
  let _pipe = map(
    model.selected_category,
    (c) => {
      return c.is_selected;
    }
  );
  _block = any(_pipe, identity2);
  let checked2 = _block;
  let qty = length(model.selected_question_ids);
  return div(
    toList([]),
    toList([
      h1(
        toList([styles(toList([["text-align", "center"]]))]),
        toList([text3("Quiz App")])
      ),
      view_error(model.error),
      div(
        toList([
          styles(toList([["display", "flex"], ["align-items", "center"]]))
        ]),
        toList([
          h2(
            toList([
              styles(
                toList([["margin-right", "1rem"], ["font-size", "1.17em"]])
              )
            ]),
            toList([text3("\u554F\u984C\u96C6\u9078\u629E")])
          ),
          view_db_selection(model.db.data_set_list, model.db.data_set)
        ])
      ),
      h2(
        toList([styles(toList([["margin-top", "1rem"]]))]),
        toList([text3("\u30AB\u30C6\u30B4\u30EA")])
      ),
      view_category_selection(model.selected_category, checked2),
      h2(
        toList([styles(toList([["margin-top", "1rem"]]))]),
        toList([text3("\u30AA\u30D7\u30B7\u30E7\u30F3")])
      ),
      view_shuffle(model.shuffle_or_not),
      h2(
        toList([styles(toList([["margin-top", "1rem"]]))]),
        toList([text3("\u51FA\u984C\u6570\u9078\u629E")])
      ),
      view_count_selection(model.selected_count),
      div(
        toList([styles(toList([["margin-top", "1rem"]]))]),
        toList([text3("\u9078\u629E\u4E2D\u306E\u554F\u984C\u6570: " + to_string(qty))])
      ),
      view_actions(is_start_quiz_enabled),
      view_loading(model.loading),
      (() => {
        let $ = model.show_history;
        if ($) {
          return view5(model.quiz_result);
        } else {
          return text3("");
        }
      })()
    ])
  );
}
function echo(value2, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const string_value = echo$inspect(value2);
  if (globalThis.process?.stderr?.write) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    process.stderr.write(string5);
  } else if (globalThis.Deno) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    globalThis.Deno.stderr.writeSync(new TextEncoder().encode(string5));
  } else {
    const string5 = `${file_line}
${string_value}`;
    globalThis.console.log(string5);
  }
  return value2;
}
function echo$inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char == "\n") new_str += "\\n";
    else if (char == "\r") new_str += "\\r";
    else if (char == "	") new_str += "\\t";
    else if (char == "\f") new_str += "\\f";
    else if (char == "\\") new_str += "\\\\";
    else if (char == '"') new_str += '\\"';
    else if (char < " " || char > "~" && char < "\xA0") {
      new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
    } else {
      new_str += char;
    }
  }
  new_str += '"';
  return new_str;
}
function echo$inspectDict(map7) {
  let body = "dict.from_list([";
  let first = true;
  let key_value_pairs = [];
  map7.forEach((value2, key) => {
    key_value_pairs.push([key, value2]);
  });
  key_value_pairs.sort();
  key_value_pairs.forEach(([key, value2]) => {
    if (!first) body = body + ", ";
    body = body + "#(" + echo$inspect(key) + ", " + echo$inspect(value2) + ")";
    first = false;
  });
  return body + "])";
}
function echo$inspectCustomType(record) {
  const props = globalThis.Object.keys(record).map((label2) => {
    const value2 = echo$inspect(record[label2]);
    return isNaN(parseInt(label2)) ? `${label2}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function echo$inspectObject(v) {
  const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${echo$inspect(k)}: ${echo$inspect(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name2 === "Object" ? "" : name2 + " ";
  return `//js(${head}{${body}})`;
}
function echo$inspect(v) {
  const t = typeof v;
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null) return "//js(null)";
  if (v === void 0) return "Nil";
  if (t === "string") return echo$inspectString(v);
  if (t === "bigint" || t === "number") return v.toString();
  if (globalThis.Array.isArray(v))
    return `#(${v.map(echo$inspect).join(", ")})`;
  if (v instanceof List)
    return `[${v.toArray().map(echo$inspect).join(", ")}]`;
  if (v instanceof UtfCodepoint)
    return `//utfcodepoint(${String.fromCodePoint(v.value)})`;
  if (v instanceof BitArray) return echo$inspectBitArray(v);
  if (v instanceof CustomType) return echo$inspectCustomType(v);
  if (echo$isDict(v)) return echo$inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(echo$inspect).join(", ")}))`;
  if (v instanceof RegExp) return `//js(${v})`;
  if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return echo$inspectObject(v);
}
function echo$inspectBitArray(bitArray) {
  let endOfAlignedBytes = bitArray.bitOffset + 8 * Math.trunc(bitArray.bitSize / 8);
  let alignedBytes = bitArraySlice(
    bitArray,
    bitArray.bitOffset,
    endOfAlignedBytes
  );
  let remainingUnalignedBits = bitArray.bitSize % 8;
  if (remainingUnalignedBits > 0) {
    let remainingBits = bitArraySliceToInt(
      bitArray,
      endOfAlignedBytes,
      bitArray.bitSize,
      false,
      false
    );
    let alignedBytesArray = Array.from(alignedBytes.rawBuffer);
    let suffix = `${remainingBits}:size(${remainingUnalignedBits})`;
    if (alignedBytesArray.length === 0) {
      return `<<${suffix}>>`;
    } else {
      return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}, ${suffix}>>`;
    }
  } else {
    return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}>>`;
  }
}
function echo$isDict(value2) {
  try {
    return value2 instanceof Dict;
  } catch {
    return false;
  }
}

// build/dev/javascript/study_app/pages/quiz_screen.mjs
var Model5 = class extends CustomType {
  constructor(db, questions2, questions_count, current_question_index, quiz_result, quiz_finished, score) {
    super();
    this.db = db;
    this.questions = questions2;
    this.questions_count = questions_count;
    this.current_question_index = current_question_index;
    this.quiz_result = quiz_result;
    this.quiz_finished = quiz_finished;
    this.score = score;
  }
};
var QuestionMsg = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var NextQuestion = class extends CustomType {
};
var OutCome2 = class extends CustomType {
};
var GoToResultScreen = class extends CustomType {
};
function init3(db, questions2) {
  let _pipe = map(questions2, (q) => {
    return q.id;
  });
  echo2(_pipe, "src/pages/quiz_screen.gleam", 64);
  let $ = is_empty2(questions2);
  if ($) {
    return new Error(void 0);
  } else {
    return new Ok(
      new Model5(
        db,
        questions2,
        length(questions2),
        0,
        from_questions(questions2),
        false,
        0
      )
    );
  }
}
function update_quiz_result(model) {
  let current_question = get_at(
    model.questions,
    model.current_question_index
  );
  if (current_question instanceof Some) {
    let q = current_question[0];
    let new_answer = check_answer2(q);
    echo2(new_answer, "src/pages/quiz_screen.gleam", 156);
    return update_if(
      model.quiz_result,
      (r) => {
        return r.id === q.id;
      },
      (r) => {
        let _record = r;
        return new Record(_record.id, _record.category, toList([new_answer]));
      }
    );
  } else {
    return model.quiz_result;
  }
}
function get_score(quiz_result) {
  let _pipe = quiz_result;
  let _pipe$1 = filter(
    _pipe,
    (r) => {
      let $ = r.answer;
      if ($ instanceof Empty) {
        return false;
      } else {
        let $1 = $.head;
        if ($1 instanceof Correct) {
          return true;
        } else {
          return false;
        }
      }
    }
  );
  return length(_pipe$1);
}
function update6(model, msg) {
  if (msg instanceof QuestionMsg) {
    let q_msg = msg[0];
    let new_questions = update_at(
      model.questions,
      model.current_question_index,
      (_capture) => {
        return update4(_capture, q_msg);
      }
    );
    return [
      (() => {
        let _record = model;
        return new Model5(
          _record.db,
          new_questions,
          _record.questions_count,
          _record.current_question_index,
          _record.quiz_result,
          _record.quiz_finished,
          _record.score
        );
      })(),
      none2()
    ];
  } else if (msg instanceof NextQuestion) {
    let new_quiz_result = update_quiz_result(model);
    let new_score = get_score(new_quiz_result);
    let next_index = model.current_question_index + 1;
    let is_finished = next_index >= length(model.questions);
    if (is_finished) {
      return [
        (() => {
          let _record = model;
          return new Model5(
            _record.db,
            _record.questions,
            _record.questions_count,
            _record.current_question_index,
            new_quiz_result,
            true,
            new_score
          );
        })(),
        perform(new GoToResultScreen())
      ];
    } else {
      return [
        (() => {
          let _record = model;
          return new Model5(
            _record.db,
            _record.questions,
            _record.questions_count,
            next_index,
            new_quiz_result,
            _record.quiz_finished,
            new_score
          );
        })(),
        none2()
      ];
    }
  } else if (msg instanceof OutCome2) {
    return [model, none2()];
  } else {
    return [model, perform(new OutCome2())];
  }
}
function view_progress2(current_index, total_questions) {
  let progress = "Question " + to_string(current_index + 1) + " / " + to_string(
    total_questions
  );
  return h2(toList([]), toList([text3(progress)]));
}
function view_question_header(current_question) {
  return h3(
    toList([]),
    toList([
      div(
        toList([]),
        toList([text3("id:" + to_string(current_question.id))])
      ),
      div(
        toList([]),
        toList([text3("category:" + current_question.category.name)])
      ),
      div(
        toList([]),
        toList([
          text3("sub_category:" + current_question.category.sub_name)
        ])
      )
    ])
  );
}
function view_question_body(current_question) {
  return div(
    toList([]),
    toList([
      p(toList([]), toList([text3(current_question.question_text)])),
      div(
        toList([]),
        toList([
          (() => {
            let _pipe = current_question;
            let _pipe$1 = view4(_pipe);
            return map4(
              _pipe$1,
              (var0) => {
                return new QuestionMsg(var0);
              }
            );
          })()
        ])
      )
    ])
  );
}
function view_navigation_buttons(current_question) {
  return div(
    toList([]),
    toList([
      div(
        toList([]),
        toList([
          button(
            toList([on_click(new NextQuestion())]),
            toList([text3("Next")])
          )
        ])
      ),
      div(
        toList([]),
        toList([
          button(
            toList([
              styles(toList([["margin-top", "1rem"]])),
              on_click(new GoToResultScreen())
            ]),
            toList([text3("GoResult")])
          )
        ])
      )
    ])
  );
}
function view_question(model) {
  let $ = get_at(model.questions, model.current_question_index);
  if ($ instanceof Some) {
    let current_question = $[0];
    return div(
      toList([]),
      toList([
        view_progress2(
          model.current_question_index,
          length(model.questions)
        ),
        view_question_header(current_question),
        view_question_body(current_question),
        view_navigation_buttons(current_question)
      ])
    );
  } else {
    return text3("Error: Question not found.");
  }
}
function view_quiz_finished(model) {
  let score = get_score(model.quiz_result);
  let total_questions = length(model.questions);
  return div(
    toList([]),
    toList([
      h2(toList([]), toList([text3("Quiz Finished!")])),
      p(
        toList([]),
        toList([
          text3(
            "Your score: " + to_string(score) + "/" + to_string(
              total_questions
            )
          )
        ])
      ),
      button(
        toList([on_click(new GoToResultScreen())]),
        toList([text3("View Results")])
      )
    ])
  );
}
function view7(model) {
  let $ = model.quiz_finished;
  if ($) {
    return view_quiz_finished(model);
  } else {
    return view_question(model);
  }
}
function echo2(value2, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const string_value = echo$inspect2(value2);
  if (globalThis.process?.stderr?.write) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    process.stderr.write(string5);
  } else if (globalThis.Deno) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    globalThis.Deno.stderr.writeSync(new TextEncoder().encode(string5));
  } else {
    const string5 = `${file_line}
${string_value}`;
    globalThis.console.log(string5);
  }
  return value2;
}
function echo$inspectString2(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char == "\n") new_str += "\\n";
    else if (char == "\r") new_str += "\\r";
    else if (char == "	") new_str += "\\t";
    else if (char == "\f") new_str += "\\f";
    else if (char == "\\") new_str += "\\\\";
    else if (char == '"') new_str += '\\"';
    else if (char < " " || char > "~" && char < "\xA0") {
      new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
    } else {
      new_str += char;
    }
  }
  new_str += '"';
  return new_str;
}
function echo$inspectDict2(map7) {
  let body = "dict.from_list([";
  let first = true;
  let key_value_pairs = [];
  map7.forEach((value2, key) => {
    key_value_pairs.push([key, value2]);
  });
  key_value_pairs.sort();
  key_value_pairs.forEach(([key, value2]) => {
    if (!first) body = body + ", ";
    body = body + "#(" + echo$inspect2(key) + ", " + echo$inspect2(value2) + ")";
    first = false;
  });
  return body + "])";
}
function echo$inspectCustomType2(record) {
  const props = globalThis.Object.keys(record).map((label2) => {
    const value2 = echo$inspect2(record[label2]);
    return isNaN(parseInt(label2)) ? `${label2}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function echo$inspectObject2(v) {
  const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${echo$inspect2(k)}: ${echo$inspect2(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name2 === "Object" ? "" : name2 + " ";
  return `//js(${head}{${body}})`;
}
function echo$inspect2(v) {
  const t = typeof v;
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null) return "//js(null)";
  if (v === void 0) return "Nil";
  if (t === "string") return echo$inspectString2(v);
  if (t === "bigint" || t === "number") return v.toString();
  if (globalThis.Array.isArray(v))
    return `#(${v.map(echo$inspect2).join(", ")})`;
  if (v instanceof List)
    return `[${v.toArray().map(echo$inspect2).join(", ")}]`;
  if (v instanceof UtfCodepoint)
    return `//utfcodepoint(${String.fromCodePoint(v.value)})`;
  if (v instanceof BitArray) return echo$inspectBitArray2(v);
  if (v instanceof CustomType) return echo$inspectCustomType2(v);
  if (echo$isDict2(v)) return echo$inspectDict2(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(echo$inspect2).join(", ")}))`;
  if (v instanceof RegExp) return `//js(${v})`;
  if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return echo$inspectObject2(v);
}
function echo$inspectBitArray2(bitArray) {
  let endOfAlignedBytes = bitArray.bitOffset + 8 * Math.trunc(bitArray.bitSize / 8);
  let alignedBytes = bitArraySlice(
    bitArray,
    bitArray.bitOffset,
    endOfAlignedBytes
  );
  let remainingUnalignedBits = bitArray.bitSize % 8;
  if (remainingUnalignedBits > 0) {
    let remainingBits = bitArraySliceToInt(
      bitArray,
      endOfAlignedBytes,
      bitArray.bitSize,
      false,
      false
    );
    let alignedBytesArray = Array.from(alignedBytes.rawBuffer);
    let suffix = `${remainingBits}:size(${remainingUnalignedBits})`;
    if (alignedBytesArray.length === 0) {
      return `<<${suffix}>>`;
    } else {
      return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}, ${suffix}>>`;
    }
  } else {
    return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}>>`;
  }
}
function echo$isDict2(value2) {
  try {
    return value2 instanceof Dict;
  } catch {
    return false;
  }
}

// build/dev/javascript/study_app/pages/result_screen.mjs
var Model6 = class extends CustomType {
  constructor(db, score, total_questions, quiz_result) {
    super();
    this.db = db;
    this.score = score;
    this.total_questions = total_questions;
    this.quiz_result = quiz_result;
  }
};
var Err = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var GoToHome = class extends CustomType {
};
var OutCome3 = class extends CustomType {
};
function init4(db, score, total_questions, quiz_result) {
  echo3(quiz_result, "src/pages/result_screen.gleam", 31);
  return [new Model6(db, score, total_questions, quiz_result), none2()];
}
function update7(model, msg) {
  if (msg instanceof Err) {
    let json_err = msg[0];
    echo3("err screen", "src/pages/result_screen.gleam", 48);
    echo3(json_err, "src/pages/result_screen.gleam", 49);
    return [model, none2()];
  } else if (msg instanceof GoToHome) {
    echo3("GoToHome", "src/pages/result_screen.gleam", 57);
    let _block;
    let _pipe = model.quiz_result;
    let _pipe$1 = ((_capture) => {
      return save_quiz_history(model.db, _capture);
    })(_pipe);
    _block = to_effect_simple(
      _pipe$1,
      (_) => {
        return new OutCome3();
      }
    );
    let eff = _block;
    return [model, eff];
  } else {
    echo3("result -> home", "src/pages/result_screen.gleam", 77);
    return [model, none2()];
  }
}
function view8(model) {
  return div(
    toList([]),
    toList([
      h2(toList([]), toList([text3("Quiz Results")])),
      p(
        toList([]),
        toList([
          text3(
            "Your score: " + to_string(model.score) + "/" + to_string(
              model.total_questions
            )
          )
        ])
      ),
      button(
        toList([on_click(new GoToHome())]),
        toList([text3("Go to Home")])
      ),
      h3(toList([]), toList([text3("Detailed Results:")])),
      view5(model.quiz_result),
      button(
        toList([on_click(new GoToHome())]),
        toList([text3("Go to Home")])
      )
    ])
  );
}
function echo3(value2, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const string_value = echo$inspect3(value2);
  if (globalThis.process?.stderr?.write) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    process.stderr.write(string5);
  } else if (globalThis.Deno) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    globalThis.Deno.stderr.writeSync(new TextEncoder().encode(string5));
  } else {
    const string5 = `${file_line}
${string_value}`;
    globalThis.console.log(string5);
  }
  return value2;
}
function echo$inspectString3(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char == "\n") new_str += "\\n";
    else if (char == "\r") new_str += "\\r";
    else if (char == "	") new_str += "\\t";
    else if (char == "\f") new_str += "\\f";
    else if (char == "\\") new_str += "\\\\";
    else if (char == '"') new_str += '\\"';
    else if (char < " " || char > "~" && char < "\xA0") {
      new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
    } else {
      new_str += char;
    }
  }
  new_str += '"';
  return new_str;
}
function echo$inspectDict3(map7) {
  let body = "dict.from_list([";
  let first = true;
  let key_value_pairs = [];
  map7.forEach((value2, key) => {
    key_value_pairs.push([key, value2]);
  });
  key_value_pairs.sort();
  key_value_pairs.forEach(([key, value2]) => {
    if (!first) body = body + ", ";
    body = body + "#(" + echo$inspect3(key) + ", " + echo$inspect3(value2) + ")";
    first = false;
  });
  return body + "])";
}
function echo$inspectCustomType3(record) {
  const props = globalThis.Object.keys(record).map((label2) => {
    const value2 = echo$inspect3(record[label2]);
    return isNaN(parseInt(label2)) ? `${label2}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function echo$inspectObject3(v) {
  const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${echo$inspect3(k)}: ${echo$inspect3(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name2 === "Object" ? "" : name2 + " ";
  return `//js(${head}{${body}})`;
}
function echo$inspect3(v) {
  const t = typeof v;
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null) return "//js(null)";
  if (v === void 0) return "Nil";
  if (t === "string") return echo$inspectString3(v);
  if (t === "bigint" || t === "number") return v.toString();
  if (globalThis.Array.isArray(v))
    return `#(${v.map(echo$inspect3).join(", ")})`;
  if (v instanceof List)
    return `[${v.toArray().map(echo$inspect3).join(", ")}]`;
  if (v instanceof UtfCodepoint)
    return `//utfcodepoint(${String.fromCodePoint(v.value)})`;
  if (v instanceof BitArray) return echo$inspectBitArray3(v);
  if (v instanceof CustomType) return echo$inspectCustomType3(v);
  if (echo$isDict3(v)) return echo$inspectDict3(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(echo$inspect3).join(", ")}))`;
  if (v instanceof RegExp) return `//js(${v})`;
  if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return echo$inspectObject3(v);
}
function echo$inspectBitArray3(bitArray) {
  let endOfAlignedBytes = bitArray.bitOffset + 8 * Math.trunc(bitArray.bitSize / 8);
  let alignedBytes = bitArraySlice(
    bitArray,
    bitArray.bitOffset,
    endOfAlignedBytes
  );
  let remainingUnalignedBits = bitArray.bitSize % 8;
  if (remainingUnalignedBits > 0) {
    let remainingBits = bitArraySliceToInt(
      bitArray,
      endOfAlignedBytes,
      bitArray.bitSize,
      false,
      false
    );
    let alignedBytesArray = Array.from(alignedBytes.rawBuffer);
    let suffix = `${remainingBits}:size(${remainingUnalignedBits})`;
    if (alignedBytesArray.length === 0) {
      return `<<${suffix}>>`;
    } else {
      return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}, ${suffix}>>`;
    }
  } else {
    return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}>>`;
  }
}
function echo$isDict3(value2) {
  try {
    return value2 instanceof Dict;
  } catch {
    return false;
  }
}

// build/dev/javascript/study_app/study_app.mjs
var FILEPATH = "src/study_app.gleam";
var Loading = class extends CustomType {
};
var Home = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var QuizScreen = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var QuizResult = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ErrScreen2 = class extends CustomType {
};
var HomeMsg = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var QuizMsg = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var QuizResultMsg = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DataInitialized = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Miss = class extends CustomType {
};
function update8(model, msg) {
  if (model instanceof Loading) {
    if (msg instanceof DataInitialized) {
      let db = msg[0];
      echo4("DataInitialized", "src/study_app.gleam", 62);
      let $ = init2(db);
      let home_model = $[0];
      let home_effect = $[1];
      return [
        new Home(home_model),
        map3(home_effect, (var0) => {
          return new HomeMsg(var0);
        })
      ];
    } else if (msg instanceof Miss) {
      echo4("setup err", "src/study_app.gleam", 67);
      return [new ErrScreen2(), none2()];
    } else {
      return [model, none2()];
    }
  } else if (model instanceof Home) {
    let home_model = model[0];
    if (msg instanceof HomeMsg) {
      let home_msg = msg[0];
      let $ = update5(home_model, home_msg);
      let new_home = $[0];
      let home_effect = $[1];
      if (home_msg instanceof OutCome) {
        let questions2 = home_msg[0];
        echo4("Home -> QuizScreen", "src/study_app.gleam", 81);
        let screen_ini = init3(new_home.db, questions2);
        if (screen_ini instanceof Ok) {
          let quiz_model = screen_ini[0];
          return [new QuizScreen(quiz_model), none2()];
        } else {
          return [new ErrScreen2(), none2()];
        }
      } else {
        return [
          new Home(new_home),
          map3(home_effect, (var0) => {
            return new HomeMsg(var0);
          })
        ];
      }
    } else {
      return [model, none2()];
    }
  } else if (model instanceof QuizScreen) {
    let quiz_model = model[0];
    if (msg instanceof QuizMsg) {
      let quiz_msg = msg[0];
      let $ = update6(quiz_model, quiz_msg);
      let new_quiz_model = $[0];
      let quiz_eff = $[1];
      if (quiz_msg instanceof OutCome2) {
        let $1 = init4(
          new_quiz_model.db,
          new_quiz_model.score,
          new_quiz_model.questions_count,
          new_quiz_model.quiz_result
        );
        let result_model = $1[0];
        let result_effect = $1[1];
        return [
          new QuizResult(result_model),
          map3(
            result_effect,
            (var0) => {
              return new QuizResultMsg(var0);
            }
          )
        ];
      } else {
        return [
          new QuizScreen(new_quiz_model),
          map3(quiz_eff, (var0) => {
            return new QuizMsg(var0);
          })
        ];
      }
    } else {
      return [model, none2()];
    }
  } else if (model instanceof QuizResult) {
    let quiz_model = model[0];
    if (msg instanceof QuizResultMsg) {
      let result_msg = msg[0];
      let $ = update7(quiz_model, result_msg);
      let new_model = $[0];
      let eff = $[1];
      if (result_msg instanceof OutCome3) {
        let $1 = init2(quiz_model.db);
        let new_modek = $1[0];
        let new_eff = $1[1];
        return [
          new Home(new_modek),
          map3(new_eff, (var0) => {
            return new HomeMsg(var0);
          })
        ];
      } else {
        return [
          new QuizResult(new_model),
          map3(eff, (var0) => {
            return new QuizResultMsg(var0);
          })
        ];
      }
    } else {
      return [model, none2()];
    }
  } else {
    return [model, none2()];
  }
}
function view9(model) {
  if (model instanceof Loading) {
    return text3("Loading...");
  } else if (model instanceof Home) {
    let home_model = model[0];
    let _pipe = view6(home_model);
    return map4(_pipe, (var0) => {
      return new HomeMsg(var0);
    });
  } else if (model instanceof QuizScreen) {
    let quiz_model = model[0];
    let _pipe = view7(quiz_model);
    return map4(_pipe, (var0) => {
      return new QuizMsg(var0);
    });
  } else if (model instanceof QuizResult) {
    let result_model = model[0];
    let _pipe = view8(result_model);
    return map4(_pipe, (var0) => {
      return new QuizResultMsg(var0);
    });
  } else {
    return text3("\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F");
  }
}
var db_version = 1;
function setup_db() {
  let data_sets = get_data_set_name();
  let db_name$1 = "db" + to_string(db_version);
  echo4("lustre setup_db", "src/study_app.gleam", 40);
  echo4(data_sets, "src/study_app.gleam", 41);
  if (data_sets instanceof Empty) {
    return perform(new Miss());
  } else {
    let $ = data_sets.tail;
    if ($ instanceof Empty) {
      return perform(new Miss());
    } else {
      let first = data_sets.head;
      let second = $.head;
      let _pipe = setup2(data_sets, second, db_name$1, 1);
      return to_effect_simple(
        _pipe,
        (var0) => {
          return new DataInitialized(var0);
        }
      );
    }
  }
}
function init5(_) {
  return [new Loading(), setup_db()];
}
function main() {
  let app = application(init5, update8, view9);
  let $ = start3(app, "#app", void 0);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "study_app",
      163,
      "main",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 4547,
        end: 4596,
        pattern_start: 4558,
        pattern_end: 4563
      }
    );
  }
  return void 0;
}
function echo4(value2, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const string_value = echo$inspect4(value2);
  if (globalThis.process?.stderr?.write) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    process.stderr.write(string5);
  } else if (globalThis.Deno) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    globalThis.Deno.stderr.writeSync(new TextEncoder().encode(string5));
  } else {
    const string5 = `${file_line}
${string_value}`;
    globalThis.console.log(string5);
  }
  return value2;
}
function echo$inspectString4(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char == "\n") new_str += "\\n";
    else if (char == "\r") new_str += "\\r";
    else if (char == "	") new_str += "\\t";
    else if (char == "\f") new_str += "\\f";
    else if (char == "\\") new_str += "\\\\";
    else if (char == '"') new_str += '\\"';
    else if (char < " " || char > "~" && char < "\xA0") {
      new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
    } else {
      new_str += char;
    }
  }
  new_str += '"';
  return new_str;
}
function echo$inspectDict4(map7) {
  let body = "dict.from_list([";
  let first = true;
  let key_value_pairs = [];
  map7.forEach((value2, key) => {
    key_value_pairs.push([key, value2]);
  });
  key_value_pairs.sort();
  key_value_pairs.forEach(([key, value2]) => {
    if (!first) body = body + ", ";
    body = body + "#(" + echo$inspect4(key) + ", " + echo$inspect4(value2) + ")";
    first = false;
  });
  return body + "])";
}
function echo$inspectCustomType4(record) {
  const props = globalThis.Object.keys(record).map((label2) => {
    const value2 = echo$inspect4(record[label2]);
    return isNaN(parseInt(label2)) ? `${label2}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function echo$inspectObject4(v) {
  const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${echo$inspect4(k)}: ${echo$inspect4(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name2 === "Object" ? "" : name2 + " ";
  return `//js(${head}{${body}})`;
}
function echo$inspect4(v) {
  const t = typeof v;
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null) return "//js(null)";
  if (v === void 0) return "Nil";
  if (t === "string") return echo$inspectString4(v);
  if (t === "bigint" || t === "number") return v.toString();
  if (globalThis.Array.isArray(v))
    return `#(${v.map(echo$inspect4).join(", ")})`;
  if (v instanceof List)
    return `[${v.toArray().map(echo$inspect4).join(", ")}]`;
  if (v instanceof UtfCodepoint)
    return `//utfcodepoint(${String.fromCodePoint(v.value)})`;
  if (v instanceof BitArray) return echo$inspectBitArray4(v);
  if (v instanceof CustomType) return echo$inspectCustomType4(v);
  if (echo$isDict4(v)) return echo$inspectDict4(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(echo$inspect4).join(", ")}))`;
  if (v instanceof RegExp) return `//js(${v})`;
  if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return echo$inspectObject4(v);
}
function echo$inspectBitArray4(bitArray) {
  let endOfAlignedBytes = bitArray.bitOffset + 8 * Math.trunc(bitArray.bitSize / 8);
  let alignedBytes = bitArraySlice(
    bitArray,
    bitArray.bitOffset,
    endOfAlignedBytes
  );
  let remainingUnalignedBits = bitArray.bitSize % 8;
  if (remainingUnalignedBits > 0) {
    let remainingBits = bitArraySliceToInt(
      bitArray,
      endOfAlignedBytes,
      bitArray.bitSize,
      false,
      false
    );
    let alignedBytesArray = Array.from(alignedBytes.rawBuffer);
    let suffix = `${remainingBits}:size(${remainingUnalignedBits})`;
    if (alignedBytesArray.length === 0) {
      return `<<${suffix}>>`;
    } else {
      return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}, ${suffix}>>`;
    }
  } else {
    return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}>>`;
  }
}
function echo$isDict4(value2) {
  try {
    return value2 instanceof Dict;
  } catch {
    return false;
  }
}

// build/.lustre/entry.mjs
main();
