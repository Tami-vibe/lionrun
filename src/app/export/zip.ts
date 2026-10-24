// ZIP (stored entries, no external dependency). All file names are fixed by this exporter.
export function zipFiles(files: {
    name: string;
    data: Uint8Array;
}[]): Blob {
    const chunks: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    const encoder = new TextEncoder();
    let offset = 0;
    const u16 = (v: DataView, o: number, n: number) => v.setUint16(o, n, true);
    const u32 = (v: DataView, o: number, n: number) => v.setUint32(o, n >>> 0, true);
    const crc = (bytes: Uint8Array) => { let c = 0xffffffff; for (const b of bytes) {
        c ^= b;
        for (let k = 0; k < 8; k++)
            c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
    } return (c ^ 0xffffffff) >>> 0; };
    for (const f of files) {
        const name = encoder.encode(f.name), c = crc(f.data), n = f.data.length;
        const local = new Uint8Array(30 + name.length);
        const v = new DataView(local.buffer);
        u32(v, 0, 0x04034b50);
        u16(v, 4, 20);
        u16(v, 6, 0x800);
        u32(v, 14, c);
        u32(v, 18, n);
        u32(v, 22, n);
        u16(v, 26, name.length);
        local.set(name, 30);
        chunks.push(local, f.data);
        const dir = new Uint8Array(46 + name.length);
        const d = new DataView(dir.buffer);
        u32(d, 0, 0x02014b50);
        u16(d, 4, 20);
        u16(d, 6, 20);
        u16(d, 8, 0x800);
        u32(d, 16, c);
        u32(d, 20, n);
        u32(d, 24, n);
        u16(d, 28, name.length);
        u32(d, 42, offset);
        dir.set(name, 46);
        central.push(dir);
        offset += local.length + n;
    }
    const centralSize = central.reduce((n, b) => n + b.length, 0);
    const end = new Uint8Array(22);
    const e = new DataView(end.buffer);
    u32(e, 0, 0x06054b50);
    u16(e, 8, files.length);
    u16(e, 10, files.length);
    u32(e, 12, centralSize);
    u32(e, 16, offset);
    return new Blob([...chunks, ...central, end] as BlobPart[], { type: 'application/zip' });
}
